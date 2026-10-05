"""Smart Ease cloud API for Render.

This service stores uploaded photo originals plus small WebP derivatives and
persists project JSON on Render's mounted data disk. It never accepts client
filesystem paths: browser-selected files must be uploaded explicitly.
"""

from __future__ import annotations

import io
import json
import os
import re
import secrets
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated

from fastapi import Depends, FastAPI, File, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.concurrency import run_in_threadpool
from PIL import Image, ImageOps, UnidentifiedImageError


APP_DIR = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get("DATA_DIR", APP_DIR / "data")).resolve()
PHOTO_DIR = DATA_DIR / "photos"
DB_PATH = DATA_DIR / "smartease.sqlite3"
MAX_PHOTO_BYTES = int(os.environ.get("MAX_PHOTO_BYTES", str(80 * 1024 * 1024)))
MAX_BATCH_BYTES = int(os.environ.get("MAX_BATCH_BYTES", str(400 * 1024 * 1024)))
MAX_BATCH_FILES = int(os.environ.get("MAX_BATCH_FILES", "32"))
MAX_PROJECT_BYTES = int(os.environ.get("MAX_PROJECT_BYTES", str(20 * 1024 * 1024)))
WORKSPACE_QUOTA_BYTES = int(os.environ.get("WORKSPACE_QUOTA_BYTES", str(4 * 1024 * 1024 * 1024)))
GLOBAL_STORAGE_QUOTA_BYTES = int(os.environ.get("GLOBAL_STORAGE_QUOTA_BYTES", str(4_500_000_000)))

DATA_DIR.mkdir(parents=True, exist_ok=True)
PHOTO_DIR.mkdir(parents=True, exist_ok=True)
Image.MAX_IMAGE_PIXELS = 100_000_000


def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db() -> None:
    with db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS photos (
                id TEXT PRIMARY KEY,
                workspace_id TEXT NOT NULL,
                access_key TEXT NOT NULL,
                name TEXT NOT NULL,
                original_path TEXT NOT NULL,
                preview_path TEXT NOT NULL,
                thumb_path TEXT NOT NULL,
                original_bytes INTEGER NOT NULL,
                stored_bytes INTEGER NOT NULL,
                width INTEGER NOT NULL,
                height INTEGER NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS photos_workspace_idx
                ON photos(workspace_id, created_at);
            CREATE TABLE IF NOT EXISTS projects (
                workspace_id TEXT NOT NULL,
                id TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                PRIMARY KEY (workspace_id, id)
            );
            CREATE INDEX IF NOT EXISTS projects_workspace_idx
                ON projects(workspace_id, updated_at DESC);
            """
        )


init_db()

app = FastAPI(
    title="Smart Ease API",
    version="1.0.0",
    description="Render API for photo derivatives and persistent photobook projects.",
)

origins = [
    origin.strip().rstrip("/")
    for origin in os.environ.get(
        "WEB_ORIGINS",
        "https://smart-ease.web.app,https://smart-ease.firebaseapp.com,http://127.0.0.1:60199,http://localhost:60199",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-Workspace-ID"],
    expose_headers=["ETag", "Content-Length"],
    max_age=600,
)


def workspace_id(x_workspace_id: Annotated[str | None, Header()] = None) -> str:
    if not x_workspace_id or not re.fullmatch(r"[A-Za-z0-9_-]{20,100}", x_workspace_id):
        raise HTTPException(status_code=401, detail="A valid X-Workspace-ID is required.")
    return x_workspace_id


Workspace = Annotated[str, Depends(workspace_id)]


def safe_project_id(value: str) -> str:
    if not re.fullmatch(r"[A-Za-z0-9_-]{1,100}", value or ""):
        raise HTTPException(status_code=400, detail="Invalid project ID.")
    return value


def safe_display_name(value: str) -> str:
    value = Path(value or "Photo").name
    value = re.sub(r"[\x00-\x1f\\/:*?\"<>|]", "_", value).strip(" .")
    return value[:180] or "Photo"


def stored_bytes_for_workspace(owner: str) -> int:
    with db() as conn:
        row = conn.execute(
            "SELECT COALESCE(SUM(stored_bytes), 0) AS total FROM photos WHERE workspace_id = ?",
            (owner,),
        ).fetchone()
    return int(row["total"])


def stored_bytes_total() -> int:
    with db() as conn:
        row = conn.execute("SELECT COALESCE(SUM(stored_bytes), 0) AS total FROM photos").fetchone()
    return int(row["total"])


async def read_upload(upload: UploadFile, remaining_batch_bytes: int) -> bytes:
    limit = min(MAX_PHOTO_BYTES, remaining_batch_bytes)
    if limit <= 0:
        raise HTTPException(status_code=413, detail="This upload exceeds the workspace or batch limit.")
    data = await upload.read(limit + 1)
    if not data:
        raise HTTPException(status_code=400, detail=f"{upload.filename or 'Photo'} is empty.")
    if len(data) > limit:
        raise HTTPException(status_code=413, detail=f"{upload.filename or 'Photo'} exceeds the upload limit.")
    return data


def make_derivative(data: bytes, max_size: tuple[int, int], quality: int) -> tuple[bytes, tuple[int, int]]:
    try:
        with Image.open(io.BytesIO(data)) as opened:
            opened.load()
            image = ImageOps.exif_transpose(opened)
            dimensions = image.size
            image.thumbnail(max_size, Image.Resampling.LANCZOS)
            if image.mode not in ("RGB", "RGBA"):
                image = image.convert("RGBA" if "transparency" in image.info else "RGB")
            output = io.BytesIO()
            image.save(output, format="WEBP", quality=quality, method=4)
            return output.getvalue(), dimensions
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise HTTPException(status_code=415, detail="The uploaded file is not a supported, safe image.") from exc


def atomic_write(path: Path, data: bytes) -> None:
    temp_path = path.with_suffix(path.suffix + ".tmp")
    temp_path.write_bytes(data)
    temp_path.replace(path)


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "Smart Ease API", "health": "/healthz", "docs": "/docs"}


@app.get("/healthz")
@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "smart-ease-api"}


@app.post("/api/photos/batch")
async def upload_photos(files: Annotated[list[UploadFile], File()], owner: Workspace) -> dict:
    if not files:
        raise HTTPException(status_code=400, detail="Choose at least one image.")
    if len(files) > MAX_BATCH_FILES:
        raise HTTPException(status_code=413, detail=f"Upload at most {MAX_BATCH_FILES} photos at once.")

    used = stored_bytes_for_workspace(owner)
    if used >= WORKSPACE_QUOTA_BYTES:
        raise HTTPException(status_code=413, detail="This workspace has reached its storage limit.")

    remaining = min(MAX_BATCH_BYTES, WORKSPACE_QUOTA_BYTES - used)
    total_used = stored_bytes_total()
    if total_used >= GLOBAL_STORAGE_QUOTA_BYTES:
        raise HTTPException(status_code=507, detail="The service has reached its storage limit.")
    results: list[dict] = []
    batch_bytes = 0

    for upload in files:
        data = await read_upload(upload, remaining - batch_bytes)
        batch_bytes += len(data)
        preview, dimensions = await run_in_threadpool(make_derivative, data, (2400, 2400), 84)
        thumb, _ = await run_in_threadpool(make_derivative, data, (360, 360), 78)
        stored_bytes = len(data) + len(preview) + len(thumb)
        if used + sum(item["storedBytes"] for item in results) + stored_bytes > WORKSPACE_QUOTA_BYTES:
            raise HTTPException(status_code=413, detail="This workspace has reached its storage limit.")
        if total_used + sum(item["storedBytes"] for item in results) + stored_bytes > GLOBAL_STORAGE_QUOTA_BYTES:
            raise HTTPException(status_code=507, detail="The service has reached its storage limit.")

        photo_id = uuid.uuid4().hex
        asset_key = secrets.token_urlsafe(32)
        photo_dir = PHOTO_DIR / photo_id
        photo_dir.mkdir(parents=True, exist_ok=False)
        original_path = photo_dir / "original"
        preview_path = photo_dir / "preview.webp"
        thumb_path = photo_dir / "thumb.webp"
        try:
            await run_in_threadpool(atomic_write, original_path, data)
            await run_in_threadpool(atomic_write, preview_path, preview)
            await run_in_threadpool(atomic_write, thumb_path, thumb)
            created_at = datetime.now(timezone.utc).isoformat()
            with db() as conn:
                conn.execute(
                    """INSERT INTO photos
                       (id, workspace_id, access_key, name, original_path, preview_path, thumb_path,
                        original_bytes, stored_bytes, width, height, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        photo_id,
                        owner,
                        asset_key,
                        safe_display_name(upload.filename or "Photo"),
                        str(original_path),
                        str(preview_path),
                        str(thumb_path),
                        len(data),
                        stored_bytes,
                        dimensions[0],
                        dimensions[1],
                        created_at,
                    ),
                )
        except Exception:
            for path in (original_path, preview_path, thumb_path):
                path.unlink(missing_ok=True)
            photo_dir.rmdir()
            raise

        results.append(
            {
                "id": photo_id,
                "name": safe_display_name(upload.filename or "Photo"),
                "width": dimensions[0],
                "height": dimensions[1],
                "bytes": len(data),
                "storedBytes": stored_bytes,
                "originalUrl": f"/api/photos/{photo_id}/original?key={asset_key}",
                "previewUrl": f"/api/photos/{photo_id}/preview?key={asset_key}",
                "thumbUrl": f"/api/photos/{photo_id}/thumb?key={asset_key}",
            }
        )

    return {"photos": results, "uploadedBytes": batch_bytes}


def find_photo(photo_id: str, owner: str | None, asset_key: str | None) -> sqlite3.Row:
    if not re.fullmatch(r"[a-f0-9]{32}", photo_id or ""):
        raise HTTPException(status_code=404, detail="Photo not found.")
    with db() as conn:
        photo = conn.execute(
            "SELECT * FROM photos WHERE id = ?", (photo_id,)
        ).fetchone()
    owns_photo = photo and owner and photo["workspace_id"] == owner
    has_asset_key = photo and asset_key and secrets.compare_digest(photo["access_key"], asset_key)
    if not photo or not (owns_photo or has_asset_key):
        raise HTTPException(status_code=404, detail="Photo not found.")
    return photo


@app.get("/api/photos/{photo_id}/{variant}")
def get_photo(
    photo_id: str,
    variant: str,
    x_workspace_id: Annotated[str | None, Header()] = None,
    key: str | None = None,
) -> FileResponse:
    owner = x_workspace_id if x_workspace_id and re.fullmatch(r"[A-Za-z0-9_-]{20,100}", x_workspace_id) else None
    photo = find_photo(photo_id, owner, key)
    paths = {
        "original": (photo["original_path"], "application/octet-stream"),
        "preview": (photo["preview_path"], "image/webp"),
        "thumb": (photo["thumb_path"], "image/webp"),
    }
    if variant not in paths:
        raise HTTPException(status_code=404, detail="Photo variant not found.")
    path, media_type = paths[variant]
    if not Path(path).is_file():
        raise HTTPException(status_code=404, detail="Photo asset is missing from storage.")
    return FileResponse(
        path,
        media_type=media_type,
        headers={"Cache-Control": "private, max-age=604800, immutable"},
    )


@app.get("/api/projects")
def list_projects(owner: Workspace) -> dict:
    with db() as conn:
        rows = conn.execute(
            "SELECT id, title, updated_at, content FROM projects WHERE workspace_id = ? ORDER BY updated_at DESC",
            (owner,),
        ).fetchall()
    result = []
    for row in rows:
        try:
            content = json.loads(row["content"])
            photos = content.get("photos", []) if isinstance(content, dict) else []
        except (TypeError, json.JSONDecodeError):
            photos = []
        result.append(
            {
                "id": row["id"],
                "title": row["title"],
                "updatedAt": row["updated_at"],
                "photoCount": len(photos),
            }
        )
    return {"projects": result}


@app.get("/api/projects/{project_id}")
def get_project(project_id: str, owner: Workspace) -> dict:
    project_id = safe_project_id(project_id)
    with db() as conn:
        row = conn.execute(
            "SELECT content, updated_at FROM projects WHERE workspace_id = ? AND id = ?",
            (owner, project_id),
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Project not found.")
    return {"id": project_id, "updatedAt": row["updated_at"], "project": json.loads(row["content"])}


@app.put("/api/projects/{project_id}")
async def save_project(project_id: str, request: Request, owner: Workspace) -> dict:
    project_id = safe_project_id(project_id)
    body = await request.body()
    if len(body) > MAX_PROJECT_BYTES:
        raise HTTPException(status_code=413, detail="Project file is larger than the allowed limit.")
    try:
        content = json.loads(body)
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=400, detail="Project body must be valid JSON.") from exc
    if not isinstance(content, dict):
        raise HTTPException(status_code=400, detail="Project body must be a JSON object.")

    nested_project = content.get("project")
    nested_title = nested_project.get("title") if isinstance(nested_project, dict) else None
    title = str(content.get("title") or nested_title or "Smart Ease Album")[:180]
    serialized = json.dumps(content, ensure_ascii=False, separators=(",", ":"))
    updated_at = datetime.now(timezone.utc).isoformat()
    with db() as conn:
        conn.execute(
            """INSERT INTO projects (workspace_id, id, title, content, updated_at)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(workspace_id, id) DO UPDATE SET
                   title=excluded.title, content=excluded.content, updated_at=excluded.updated_at""",
            (owner, project_id, title, serialized, updated_at),
        )
    return {"success": True, "id": project_id, "title": title, "updatedAt": updated_at}


