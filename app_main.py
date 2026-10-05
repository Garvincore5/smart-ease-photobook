"""
Smart Ease Photobook Studio - Desktop Application
Single-file native Windows executable wrapper
"""

import os
import sys
import time
import socket
import threading
import webbrowser
import subprocess
import json
import urllib.parse
import mimetypes
import hashlib
import re
try:
    from PIL import Image as PILImage
except Exception:
    PILImage = None
import io
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

THUMB_CACHE = {} # Cache for fast (filepath, mtime, size) -> JPEG thumbnail bytes
main_window = None
force_close = False
app_shutting_down = threading.Event()

def kill_app_and_children():
    """Instantly kills this process and all descendant Edge WebView2 and background processes."""
    global force_close, app_shutting_down
    if force_close and app_shutting_down.is_set():
        return
    force_close = True
    app_shutting_down.set()
    try:
        current_pid = os.getpid()
        subprocess.Popen(
            f"taskkill /F /T /PID {current_pid}",
            shell=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    except Exception:
        pass
    finally:
        os._exit(0)

def compute_file_sha256(filepath):
    """Computes the full SHA-256 hexadecimal digest of a file on disk."""
    if not filepath or not os.path.isfile(filepath):
        return None
    try:
        hasher = hashlib.sha256()
        with open(filepath, 'rb') as f:
            while chunk := f.read(65536):
                hasher.update(chunk)
        return hasher.hexdigest()
    except Exception:
        return None

def extract_photo_metadata(filepath, compute_hash=True):
    """
    Extracts SHA-256 hash, size, dimensions, mtime, and EXIF metadata from an image file
    for advanced photo differentiation and byte-level comparison.
    """
    meta = {
        "fileHash": None,
        "fileSize": 0,
        "width": None,
        "height": None,
        "aspect": None,
        "lastModified": None,
        "dateTaken": None,
        "cameraModel": None,
        "cameraMake": None
    }
    if not filepath or not os.path.isfile(filepath):
        return meta

    try:
        meta["fileSize"] = os.path.getsize(filepath)
        meta["lastModified"] = int(os.path.getmtime(filepath))
    except Exception:
        pass

    if compute_hash:
        meta["fileHash"] = compute_file_sha256(filepath)

    if PILImage:
        try:
            with PILImage.open(filepath) as img:
                w, h = img.size
                meta["width"], meta["height"] = w, h
                if w and h:
                    meta["aspect"] = round(w / h, 4)
                exif_data = img._getexif() if hasattr(img, '_getexif') else None
                if exif_data:
                    # 0x010F: Make, 0x0110: Model, 0x9003: DateTimeOriginal, 0x0132: DateTime
                    make = exif_data.get(0x010F)
                    model = exif_data.get(0x0110)
                    dt = exif_data.get(0x9003) or exif_data.get(0x0132) or exif_data.get(0x9004)
                    if make:
                        meta["cameraMake"] = str(make).strip()
                    if model:
                        meta["cameraModel"] = str(model).strip()
                    if dt:
                        meta["dateTaken"] = str(dt).strip()
        except Exception:
            pass
    return meta

def get_base_path():
    """Get the root directory of the application assets, whether running from source or PyInstaller bundle."""
    if hasattr(sys, '_MEIPASS'):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))

def get_companion_paths_filepath(project_file_path):
    """
    Returns the absolute path to the companion .paths.json file near the given project JSON file.
    E.g.: 'Diana_kuhinjira.smartease.json' -> 'Diana_kuhinjira.paths.json'
    """
    abs_p = os.path.abspath(project_file_path)
    p_dir = os.path.dirname(abs_p)
    b_name = os.path.basename(abs_p)
    b_low = b_name.lower()
    if b_low.endswith('.smartease.json'):
        stem = b_name[:-15]
    elif b_low.endswith('.json'):
        stem = b_name[:-5]
    else:
        stem = b_name
    stem = stem.rstrip('.')
    return os.path.join(p_dir, f"{stem}.paths.json")

def find_exact_companion_paths_file(project_file_path):
    """Return only this project's adjacent companion paths file, if present."""
    target = (project_file_path or '').strip().replace('/', '\\')
    if not target:
        return None
    path = get_companion_paths_filepath(target)
    return os.path.abspath(path) if os.path.isfile(path) else None
def find_companion_paths_file(project_file_path_or_dir=None, candidate_folders=None, active_drives=None):
    """
    Searches for an existing companion *.paths.json file associated with a project file or directory.
    Comprehensive multi-location search:
    1. Direct file/directory check
    2. Candidate folders (e.g. photosFolder, sourceFolders)
    3. Parent directory of workspace and its sibling folders (e.g. 'E:\\code\\simon\\photobook\\*')
    4. User media folders (Documents, Desktop, Pictures, Downloads)
    5. Connected external drives and USBs
    """
    target = (project_file_path_or_dir or '').strip().replace('/', '\\')
    b_name = os.path.basename(target) if target else ''
    b_low = b_name.lower()
    if b_low.endswith('.smartease.json'):
        stem = b_name[:-15]
    elif b_low.endswith('.json'):
        stem = b_name[:-5]
    else:
        stem = b_name
    stem = stem.rstrip('.')
    target_stems = {stem.lower()} if stem else set()

    dirs_to_check = []

    # 1. Direct path if valid
    if target:
        if os.path.isabs(target):
            p_dir = os.path.dirname(target) if ('.' in b_name or os.path.isfile(target)) else target
            if os.path.isdir(p_dir) and p_dir not in dirs_to_check:
                dirs_to_check.append(p_dir)
        else:
            rel_cand = os.path.abspath(target)
            p_dir = os.path.dirname(rel_cand) if ('.' in b_name or os.path.isfile(rel_cand)) else rel_cand
            if os.path.isdir(p_dir) and p_dir not in dirs_to_check:
                dirs_to_check.append(p_dir)

    # 2. Candidate folders passed in
    if candidate_folders:
        for cf in candidate_folders:
            clean_cf = (cf or '').strip().replace('/', '\\')
            if clean_cf and os.path.isabs(clean_cf) and os.path.isdir(clean_cf):
                if clean_cf not in dirs_to_check:
                    dirs_to_check.append(clean_cf)

    # 3. Workspace parent directory and sibling folders (e.g. E:\\code\\simon\\photobook\\*)
    cwd = os.getcwd()
    if cwd not in dirs_to_check:
        dirs_to_check.append(cwd)
    parent_dir = os.path.dirname(cwd)
    if parent_dir and os.path.isdir(parent_dir):
        if parent_dir not in dirs_to_check:
            dirs_to_check.append(parent_dir)
        try:
            for entry in os.scandir(parent_dir):
                if entry.is_dir() and not entry.name.startswith('.') and entry.path not in dirs_to_check:
                    dirs_to_check.append(entry.path)
        except Exception:
            pass

    # 4. Common user directories
    user_home = os.path.expanduser('~')
    common_user = [
        os.path.join(user_home, 'Documents'),
        os.path.join(user_home, 'Desktop'),
        os.path.join(user_home, 'Pictures'),
        os.path.join(user_home, 'Downloads'),
    ]
    for ud in common_user:
        if os.path.isdir(ud) and ud not in dirs_to_check:
            dirs_to_check.append(ud)

    # 5. Connected drives
    drives = active_drives or []
    if not drives:
        for l in ['E', 'D', 'C', 'F', 'G']:
            d = f"{l}:\\"
            if os.path.exists(d):
                drives.append(d)

    # Relative folder name matching (e.g. 'Diana Edited' on drives)
    folder_names = []
    if candidate_folders:
        for cf in candidate_folders:
            cf_clean = (cf or '').strip().replace('/', '\\')
            if cf_clean and not os.path.isabs(cf_clean):
                folder_names.append(os.path.basename(cf_clean))
    if target and not os.path.isabs(target) and not ('.' in b_name):
        folder_names.append(b_name)

    for d in drives:
        for fn in folder_names:
            cand = os.path.join(d, fn)
            if os.path.isdir(cand) and cand not in dirs_to_check:
                dirs_to_check.append(cand)
        if not d.upper().startswith('C:'):
            try:
                for entry in os.scandir(d):
                    if entry.is_dir() and not entry.name.startswith('$') and not entry.name.startswith('.'):
                        if entry.path not in dirs_to_check:
                            dirs_to_check.append(entry.path)
            except Exception:
                pass

    # Search Priority 1: Exact stem match [stem].paths.json
    if stem:
        for d in dirs_to_check:
            cands = [
                os.path.join(d, f"{stem}.paths.json"),
                os.path.join(d, f"{b_name}.paths.json"),
                os.path.join(d, f"{stem}.smartease.paths.json")
            ]
            for c in cands:
                if os.path.isfile(c):
                    return os.path.abspath(c)

    # Search Priority 2: Any *.paths.json whose filename contains target stem
    if target_stems:
        for d in dirs_to_check:
            try:
                for entry in os.scandir(d):
                    if entry.is_file() and entry.name.lower().endswith('.paths.json'):
                        ent_low = entry.name.lower()
                        if any(s in ent_low for s in target_stems):
                            return os.path.abspath(entry.path)
            except Exception:
                pass

    # Search Priority 3: Any *.paths.json found in candidate directory
    for d in dirs_to_check:
        try:
            for entry in os.scandir(d):
                if entry.is_file() and entry.name.lower().endswith('.paths.json'):
                    return os.path.abspath(entry.path)
        except Exception:
            pass

    return None

def save_companion_paths_file(project_file_path, project_data_or_json):
    """
    Saves/updates a companion .paths.json file right next to the project JSON file.
    This file records the absolute, relative, and folder paths of every photo
    in the project so that the app can quickly check it for relinking.
    """
    try:
        paths_file_path = get_companion_paths_filepath(project_file_path)
        proj_dir = os.path.dirname(paths_file_path)
        base_name = os.path.basename(os.path.abspath(project_file_path))

        if isinstance(project_data_or_json, str):
            try:
                data = json.loads(project_data_or_json)
            except Exception:
                data = {}
        elif isinstance(project_data_or_json, dict):
            data = project_data_or_json
        else:
            data = {}

        photos = data.get('photos', [])
        source_folders = set()
        drives = set()

        primary_photos_folder = (data.get('photosFolder') or data.get('sourceFolderPath') or '').strip().replace('/', '\\')
        if primary_photos_folder and os.path.isabs(primary_photos_folder):
            source_folders.add(os.path.abspath(primary_photos_folder))
            d, _ = os.path.splitdrive(primary_photos_folder)
            if d:
                drives.add(d.upper())

        photos_records = []
        for p in photos:
            fp = (p.get('filePath') or '').replace('/', '\\').strip()
            if not fp:
                src = p.get('src') or p.get('originalSrc') or ''
                if 'path=' in src:
                    try:
                        fp = urllib.parse.unquote(src.split('path=')[1]).replace('/', '\\').strip()
                    except Exception:
                        pass
            fn = p.get('fileName') or p.get('name') or ''
            pid = p.get('id')
            pname = p.get('name') or ''

            rel_path = ""
            if fp and os.path.isabs(fp):
                try:
                    rel_path = os.path.relpath(fp, proj_dir)
                except Exception:
                    rel_path = fn
                p_dir = os.path.dirname(fp)
                if p_dir:
                    source_folders.add(os.path.abspath(p_dir))
                    d, _ = os.path.splitdrive(fp)
                    if d:
                        drives.add(d.upper())
            else:
                rel_path = fn

            file_exists = os.path.isfile(fp) if fp else False
            meta = extract_photo_metadata(fp, compute_hash=True) if file_exists else {}
            file_hash = p.get('fileHash') or meta.get('fileHash')
            file_size = p.get('fileSize') or meta.get('fileSize') or 0
            width = p.get('width') or meta.get('width')
            height = p.get('height') or meta.get('height')
            aspect = p.get('aspect') or meta.get('aspect')
            last_modified = p.get('lastModified') or meta.get('lastModified')
            date_taken = p.get('dateTaken') or meta.get('dateTaken')
            camera_model = p.get('cameraModel') or meta.get('cameraModel')
            camera_make = p.get('cameraMake') or meta.get('cameraMake')

            photos_records.append({
                "id": pid,
                "name": pname,
                "fileName": fn,
                "filePath": fp,
                "relativeFilePath": rel_path,
                "folder": os.path.dirname(fp) if (fp and os.path.isabs(fp)) else primary_photos_folder,
                "exists": file_exists,
                "fileHash": file_hash,
                "fileSize": file_size,
                "width": width,
                "height": height,
                "aspect": aspect,
                "lastModified": last_modified,
                "dateTaken": date_taken,
                "cameraModel": camera_model,
                "cameraMake": camera_make
            })

        paths_payload = {
            "version": "1.0",
            "type": "smartease_paths",
            "projectName": data.get('title') or os.path.splitext(base_name)[0],
            "projectFile": os.path.abspath(project_file_path),
            "projectFileName": base_name,
            "lastSaved": datetime.now().isoformat(),
            "photosFolder": primary_photos_folder,
            "sourceFolders": sorted(list(source_folders)),
            "drives": sorted(list(drives)),
            "photosCount": len(photos_records),
            "photos": photos_records
        }

        os.makedirs(proj_dir, exist_ok=True)
        with open(paths_file_path, 'w', encoding='utf-8') as pf:
            json.dump(paths_payload, pf, indent=2, ensure_ascii=False)

        print(f"[Paths Registry] Companion paths JSON saved: {paths_file_path}")
        return paths_file_path
    except Exception as ex:
        print("[Paths Registry] Error saving companion paths file:", ex)
        return None

class CustomHTTPHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        base_path = get_base_path()
        public_path = os.path.join(base_path, 'public')
        static_path = public_path if os.path.isdir(public_path) else base_path
        super().__init__(*args, directory=static_path, **kwargs)

    def log_message(self, format, *args):
        # Suppress noisy console logs in windowed desktop mode
        pass

    def end_headers(self):
        # Enable CORS and caching headers for high performance
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def send_json_response(self, data, status_code=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # 1. Stream local image file by full Windows path (with ultra-fast thumbnail generation & caching)
        if path == '/api/local_image':
            path_param = query.get('path', [''])[0]
            if not path_param:
                self.send_error(400, "Missing path parameter")
                return
            file_path = urllib.parse.unquote(path_param).replace('/', '\\')
            if not os.path.isfile(file_path):
                self.send_error(404, f"File not found: {file_path}")
                return

            is_thumb = (query.get('thumb', ['0'])[0] in ['1', 'true', 'yes']) or ('w' in query)
            if is_thumb and PILImage:
                try:
                    target_w = int(query.get('w', ['360'])[0])
                    mtime = os.path.getmtime(file_path)
                    cache_key = (file_path, mtime, target_w)
                    thumb_data = THUMB_CACHE.get(cache_key)
                    if not thumb_data:
                        with PILImage.open(file_path) as img:
                            try:
                                img.draft('RGB', (target_w * 2, target_w * 2))
                            except Exception:
                                pass
                            try:
                                from PIL import ImageOps
                                img = ImageOps.exif_transpose(img)
                            except Exception:
                                pass
                            resample = getattr(PILImage, 'Resampling', PILImage).BILINEAR if hasattr(PILImage, 'Resampling') else getattr(PILImage, 'BILINEAR', 2)
                            img.thumbnail((target_w, target_w), resample)
                            if img.mode not in ('RGB', 'L'):
                                img = img.convert('RGB')
                            buf = io.BytesIO()
                            img.save(buf, format='JPEG', quality=80)
                            thumb_data = buf.getvalue()
                            if len(THUMB_CACHE) > 1000:
                                THUMB_CACHE.clear()
                            THUMB_CACHE[cache_key] = thumb_data

                    self.send_response(200)
                    self.send_header('Content-Type', 'image/jpeg')
                    self.send_header('Content-Length', str(len(thumb_data)))
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Cache-Control', 'public, max-age=604800')
                    super().end_headers()
                    self.wfile.write(thumb_data)
                    return
                except Exception:
                    pass

            content_type = mimetypes.guess_type(file_path)[0] or 'application/octet-stream'
            try:
                file_size = os.path.getsize(file_path)
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Length', str(file_size))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Cache-Control', 'public, max-age=86400')
                super().end_headers()
                with open(file_path, 'rb') as f:
                    while True:
                        chunk = f.read(65536)
                        if not chunk:
                            break
                        self.wfile.write(chunk)
            except Exception as e:
                pass
            return

        # 2. Check if path exists
        if path == '/api/check_path':
            path_param = query.get('path', [''])[0]
            file_path = urllib.parse.unquote(path_param).replace('/', '\\')
            exists = os.path.exists(file_path)
            self.send_json_response({
                "exists": exists,
                "isDir": os.path.isdir(file_path) if exists else False,
                "isFile": os.path.isfile(file_path) if exists else False,
                "path": file_path
            })
            return

        # 3. Native Windows Folder Picker Dialog
        if path == '/api/pick_folder':
            folder = None
            if main_window:
                try:
                    import webview
                    dialog_type = getattr(webview, 'FileDialog', None)
                    folder_type = getattr(dialog_type, 'FOLDER', getattr(webview, 'FOLDER_DIALOG', 20))
                    res = main_window.create_file_dialog(folder_type)
                    if res and len(res) > 0:
                        folder = res[0]
                except Exception:
                    pass
            if not folder:
                try:
                    import subprocess
                    ps_cmd = '[System.Reflection.Assembly]::LoadWithPartialName("System.windows.forms") | Out-Null; $f = New-Object System.Windows.Forms.FolderBrowserDialog; $f.Description = "Select Photo Folder"; if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $f.SelectedPath }'
                    p_res = subprocess.run(['powershell', '-NoProfile', '-NonInteractive', '-Command', ps_cmd], capture_output=True, text=True, timeout=30)
                    if p_res.returncode == 0 and p_res.stdout.strip():
                        folder = p_res.stdout.strip()
                except Exception as e:
                    print("pick_folder fallback error:", e)
            self.send_json_response({"folder": folder})
            return

        # 4. Fast Logical Drive List
        if path == '/api/list_drives':
            active_drives = []
            try:
                import ctypes
                import string
                bitmask = ctypes.windll.kernel32.GetLogicalDrives()
                for letter in string.ascii_uppercase:
                    if bitmask & 1:
                        active_drives.append(f"{letter}:\\")
                    bitmask >>= 1
            except Exception:
                for l in ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']:
                    d = f"{l}:\\"
                    if os.path.exists(d):
                        active_drives.append(d)
            self.send_json_response({"drives": active_drives})
            return

        # Default static asset handler
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(length) if length > 0 else b'{}'

        # 1. Clean App Exit Trigger
        if path == '/api/exit_app':
            self.send_json_response({"success": True})
            threading.Thread(target=kill_app_and_children, daemon=True).start()
            return

        # 2. Ultra-Fast Automatic Relink with Multi-Drive Detection & SHA-256 Byte Verification
        if path == '/api/find_photos':
            try:
                data = json.loads(post_data.decode('utf-8'))
                project_path = (data.get('projectPath') or '').strip().replace('/', '\\')
                folder = (data.get('folder') or '').replace('/', '\\')
                photos = data.get('photos', [])

                # 1. Detect all currently active connected drives in milliseconds
                active_drives = []
                try:
                    import ctypes
                    import string
                    bitmask = ctypes.windll.kernel32.GetLogicalDrives()
                    for letter in string.ascii_uppercase:
                        if bitmask & 1:
                            active_drives.append(f"{letter}:\\")
                        bitmask >>= 1
                except Exception:
                    for l in ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']:
                        d = f"{l}:\\"
                        if os.path.exists(d):
                            active_drives.append(d)

                # Sort drives so non-system drives (D:, E:, USB drives) are searched first before C:
                active_drives.sort(key=lambda d: 1 if d.upper().startswith('C:') else 0)

                def _get_match_payload(file_path):
                    abs_p = os.path.abspath(file_path)
                    meta = extract_photo_metadata(abs_p, compute_hash=True)
                    payload = {
                        "path": abs_p,
                        "fileHash": meta.get("fileHash"),
                        "fileSize": meta.get("fileSize", 0),
                        "width": meta.get("width"),
                        "height": meta.get("height"),
                        "aspect": meta.get("aspect"),
                        "lastModified": meta.get("lastModified"),
                        "dateTaken": meta.get("dateTaken"),
                        "cameraModel": meta.get("cameraModel"),
                        "cameraMake": meta.get("cameraMake")
                    }
                    return payload

                matches = {}
                claimed_paths = set()  # Strict 1-to-1 mapping: guarantees no two photos claim same file

                def try_match_candidate(photo_spec, cand_path):
                    """
                    Differentiates photos using their underlying bytes, SHA-256 hashes, file size,
                    and exact filenames to prevent any photo mismatch.
                    """
                    if not cand_path or not os.path.isfile(cand_path):
                        return False
                    cand_abs = os.path.abspath(cand_path)
                    cand_lower = cand_abs.lower()
                    if cand_lower in claimed_paths:
                        return False

                    p_hash = (photo_spec.get('fileHash') or '').strip().lower()
                    p_size = photo_spec.get('fileSize')
                    p_fn = (photo_spec.get('fileName') or photo_spec.get('name') or '').strip()
                    cand_fn = os.path.basename(cand_abs)

                    # Strategy A: SHA-256 byte-level hash verification (primary ground truth)
                    if p_hash:
                        # Quick size check before computing full SHA-256
                        if p_size and p_size > 0:
                            try:
                                if os.path.getsize(cand_abs) != p_size:
                                    return False
                            except Exception:
                                return False
                        cand_hash = compute_file_sha256(cand_abs)
                        if cand_hash and cand_hash.lower() == p_hash:
                            payload = _get_match_payload(cand_abs)
                            matches[photo_spec['id']] = payload
                            claimed_paths.add(cand_lower)
                            return True
                        # Different hash means different underlying bytes -> reject to prevent mismatch!
                        return False

                    # Strategy B: Strict 1-to-1 exact filename matching (for photos without recorded hash)
                    p_base, p_ext = os.path.splitext(p_fn)
                    cand_base, cand_ext = os.path.splitext(cand_fn)

                    exact_name_match = (p_fn.lower() == cand_fn.lower())
                    compat_exts = {'.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.bmp', '.avif', '.gif'}
                    stem_compat = (
                        p_base.lower() == cand_base.lower() and
                        p_ext.lower() in compat_exts and
                        cand_ext.lower() in compat_exts
                    )

                    if not (exact_name_match or stem_compat):
                        return False

                    # Verify file size if recorded
                    if p_size and p_size > 0:
                        try:
                            if os.path.getsize(cand_abs) != p_size:
                                return False
                        except Exception:
                            return False

                    payload = _get_match_payload(cand_abs)
                    matches[photo_spec['id']] = payload
                    claimed_paths.add(cand_lower)
                    return True

                unmatched_photos = []

                # 2. Instant Direct & Cross-Drive Check (0.001s per photo)
                for p in photos:
                    if app_shutting_down.is_set():
                        return
                    p_id = p.get('id')
                    p_path = (p.get('filePath') or '').replace('/', '\\')

                    matched = False
                    # A. Direct original path exists
                    if p_path and os.path.isfile(p_path):
                        if try_match_candidate(p, p_path):
                            matched = True

                    # B. Check if same relative path exists on any other connected drive / USB
                    if not matched and p_path and len(p_path) >= 3 and p_path[1] == ':':
                        rel_path = p_path[3:].lstrip('\\')
                        for d in active_drives:
                            cand = os.path.join(d, rel_path)
                            if os.path.isfile(cand):
                                if try_match_candidate(p, cand):
                                    matched = True
                                    break
                    if not matched:
                        unmatched_photos.append(p)

                # 3. High-Priority Companion Paths Registry Check (.paths.json near project file)
                companion_paths_file = None
                paths_source_folders = []
                input_folders = list(data.get('folders') or [])
                if folder and folder not in input_folders:
                    input_folders.insert(0, folder)

                companion_paths_file = find_companion_paths_file(
                    project_file_path_or_dir=project_path,
                    candidate_folders=input_folders,
                    active_drives=active_drives
                )

                if companion_paths_file and os.path.isfile(companion_paths_file):
                    try:
                        with open(companion_paths_file, 'r', encoding='utf-8') as pf:
                            paths_data = json.load(pf)
                        paths_photos = paths_data.get('photos', [])
                        paths_by_id = {p.get('id'): p for p in paths_photos if p.get('id')}
                        paths_by_name = {p.get('fileName', '').lower(): p for p in paths_photos if p.get('fileName')}
                        paths_proj_dir = os.path.dirname(os.path.abspath(companion_paths_file))
                        if paths_proj_dir not in paths_source_folders:
                            paths_source_folders.append(paths_proj_dir)

                        pf_folder = (paths_data.get('photosFolder') or '').strip().replace('/', '\\')
                        if pf_folder and os.path.isdir(pf_folder) and pf_folder not in paths_source_folders:
                            paths_source_folders.append(pf_folder)
                        for sf in paths_data.get('sourceFolders', []):
                            clean_sf = sf.strip().replace('/', '\\')
                            if clean_sf and os.path.isdir(clean_sf) and clean_sf not in paths_source_folders:
                                paths_source_folders.append(clean_sf)

                        for p in list(unmatched_photos):
                            if app_shutting_down.is_set():
                                return
                            pid = p.get('id')
                            fn = (p.get('fileName') or p.get('name') or '').strip()
                            rec = paths_by_id.get(pid) or paths_by_name.get(fn.lower())

                            # Populate hash & size from companion paths if not yet in photo spec
                            if rec:
                                if not p.get('fileHash') and rec.get('fileHash'):
                                    p['fileHash'] = rec['fileHash']
                                if not p.get('fileSize') and rec.get('fileSize'):
                                    p['fileSize'] = rec['fileSize']

                                # 1) Direct recorded filePath
                                rfp = (rec.get('filePath') or '').replace('/', '\\')
                                if rfp and os.path.isfile(rfp) and try_match_candidate(p, rfp):
                                    unmatched_photos.remove(p)
                                    continue

                                # 2) Relative path from project directory
                                rel = rec.get('relativeFilePath') or fn
                                cand_rel = os.path.abspath(os.path.join(paths_proj_dir, rel))
                                if os.path.isfile(cand_rel) and try_match_candidate(p, cand_rel):
                                    unmatched_photos.remove(p)
                                    continue

                                # 3) Direct in project directory
                                cand_direct = os.path.abspath(os.path.join(paths_proj_dir, fn))
                                if os.path.isfile(cand_direct) and try_match_candidate(p, cand_direct):
                                    unmatched_photos.remove(p)
                                    continue

                                # 4) Common subfolders in project directory
                                found_sub = False
                                for sub in ['Photos', 'Images', 'Edited', 'photos', 'images', 'edited', 'raw', 'RAW', 'export', 'Export']:
                                    cand_sub = os.path.abspath(os.path.join(paths_proj_dir, sub, fn))
                                    if os.path.isfile(cand_sub) and try_match_candidate(p, cand_sub):
                                        unmatched_photos.remove(p)
                                        found_sub = True
                                        break
                                if found_sub:
                                    continue

                                # 5) Cross-drive check using recorded path
                                if rfp and len(rfp) >= 3 and rfp[1] == ':':
                                    sub_rel = rfp[3:].lstrip('\\')
                                    found_drive = False
                                    for d in active_drives:
                                        cand_drive = os.path.join(d, sub_rel)
                                        if os.path.isfile(cand_drive) and try_match_candidate(p, cand_drive):
                                            unmatched_photos.remove(p)
                                            found_drive = True
                                            break
                                    if found_drive:
                                        continue
                    except Exception as ex:
                        print("Companion paths checking error:", ex)

                # 4. Strict guard: If companion paths file is missing, DO NOT auto-relink across drives or candidate folders!
                is_user_browse = bool(data.get('isUserSelectedFolder'))
                if not companion_paths_file and not is_user_browse:
                    self.send_json_response({
                        "success": True,
                        "folder": None,
                        "matches": matches,
                        "pathsFile": None,
                        "activeDrives": active_drives,
                        "missingCompanionPaths": True
                    })
                    return

                # 5. Check candidate source folders strictly (only if companion paths exists or user explicitly browsed)
                if unmatched_photos and not app_shutting_down.is_set():
                    candidate_folders = []
                    for f in (paths_source_folders + input_folders):
                        clean_f = f.replace('/', '\\').rstrip('\\')
                        if clean_f and os.path.isdir(clean_f) and clean_f not in candidate_folders:
                            candidate_folders.append(clean_f)

                    # Also check folder basenames on connected non-system drives (e.g. D:\Diana Edited)
                    folder_basenames = {os.path.basename(cf) for cf in candidate_folders if os.path.basename(cf)}
                    for d in active_drives:
                        if not d.upper().startswith('C:'):
                            for bname in folder_basenames:
                                cand_drive_dir = os.path.join(d, bname)
                                if os.path.isdir(cand_drive_dir) and cand_drive_dir not in candidate_folders:
                                    candidate_folders.append(cand_drive_dir)

                    valid_exts = {'.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.bmp', '.avif', '.gif'}
                    skip_names = {'windows', 'program files', 'program files (x86)', 'appdata', 'node_modules', '$recycle.bin', 'system volume information', 'recovery'}

                    for search_dir in candidate_folders:
                        if not unmatched_photos or app_shutting_down.is_set():
                            break
                        try:
                            # 1. Fast shallow scan of search_dir first
                            for entry in os.scandir(search_dir):
                                if app_shutting_down.is_set() or not unmatched_photos:
                                    break
                                if entry.is_file():
                                    ext = os.path.splitext(entry.name)[1].lower()
                                    if ext in valid_exts:
                                        for p in list(unmatched_photos):
                                            if try_match_candidate(p, entry.path):
                                                unmatched_photos.remove(p)
                                                break

                            # 2. If still unmatched, scan up to 2 subfolder levels within this specific shoot folder
                            if unmatched_photos and not app_shutting_down.is_set():
                                for root_d, subdirs, files in os.walk(search_dir):
                                    if app_shutting_down.is_set() or not unmatched_photos:
                                        break
                                    rel = os.path.relpath(root_d, search_dir)
                                    depth = len(rel.split(os.sep)) if rel != '.' else 0
                                    if depth > 2:
                                        subdirs.clear()
                                        continue
                                    subdirs[:] = [d for d in subdirs if not d.startswith('$') and not d.startswith('.') and d.lower() not in skip_names]
                                    for fn in files:
                                        if not unmatched_photos or app_shutting_down.is_set():
                                            break
                                        ext = os.path.splitext(fn)[1].lower()
                                        if ext in valid_exts:
                                            cand_file = os.path.join(root_d, fn)
                                            for p in list(unmatched_photos):
                                                if try_match_candidate(p, cand_file):
                                                    unmatched_photos.remove(p)
                                                    break
                        except Exception as e:
                            print("Candidate folder scan error:", e)

                discovered_folder = ""
                for m in matches.values():
                    if m and m.get("path"):
                        discovered_folder = os.path.dirname(m["path"])
                        break

                self.send_json_response({
                    "success": True,
                    "matches": matches,
                    "folder": discovered_folder,
                    "pathsFile": companion_paths_file,
                    "activeDrives": active_drives
                })
            except Exception as e:
                self.send_json_response({"success": False, "error": str(e), "matches": {}})
            return

        # Native Window Title Update API
        if path == '/api/set_window_title':
            try:
                data = json.loads(post_data.decode('utf-8')) if post_data else {}
                title = data.get('title', '')
                if main_window and title:
                    try:
                        main_window.set_title(title)
                    except Exception:
                        pass
                self.send_json_response({"success": True})
            except Exception as e:
                self.send_json_response({"success": False, "error": str(e)})
            return

        # 3. Open Export Folder in Windows Explorer
        if path == '/api/open_folder':
            try:
                data = json.loads(post_data.decode('utf-8')) if post_data else {}
                target = (data.get('folder') or data.get('path') or '').strip().replace('/', '\\')
                if not target or not os.path.exists(target):
                    target = os.path.join(os.path.expanduser('~'), 'Downloads')
                if os.path.isfile(target):
                    target = os.path.dirname(target)
                if os.path.isdir(target):
                    os.startfile(target)
                    self.send_json_response({"success": True, "opened": target})
                else:
                    self.send_json_response({"success": False, "reason": "not_a_directory", "path": target})
            except Exception as e:
                self.send_json_response({"success": False, "error": str(e)})
            return

        # 4. Limitless Native In-Place Save
        if path == '/api/save_project':
            try:
                data = json.loads(post_data.decode('utf-8'))
                file_path = (data.get('filePath') or '').strip().replace('/', '\\')
                content = data.get('content', '')
                if not file_path:
                    self.send_json_response({"success": False, "error": "Missing filePath"})
                    return
                # Resolve relative path: check Documents folder first (for existing projects), else Documents root
                if not os.path.isabs(file_path):
                    docs_dir = os.path.join(os.path.expanduser('~'), 'Documents')
                    candidate = os.path.join(docs_dir, file_path)
                    if os.path.isfile(candidate):
                        # Update the existing file in Documents
                        file_path = candidate
                    else:
                        # Save new file directly in Documents
                        file_path = candidate
                os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                paths_file = save_companion_paths_file(file_path, content)
                self.send_json_response({"success": True, "filePath": os.path.abspath(file_path), "pathsFile": paths_file})
            except Exception as e:
                self.send_json_response({"success": False, "error": str(e)})
            return

        # 5. Native Save File Dialog for First Save or Save As
        if path == '/api/save_project_dialog':
            try:
                data = json.loads(post_data.decode('utf-8')) if post_data else {}
                content = data.get('content', '')
                suggested_name = data.get('suggestedName', 'Photobook_Project.smartease.json')
                save_path = None
                if main_window:
                    try:
                        import webview
                        dialog_type = getattr(webview, 'FileDialog', None)
                        save_type = getattr(dialog_type, 'SAVE', getattr(webview, 'SAVE_DIALOG', 30))
                        file_types = ('Smart Ease Photobook (*.smartease.json;*.json)', 'All files (*.*)')
                        res = main_window.create_file_dialog(save_type, save_filename=suggested_name, file_types=file_types)
                        if res:
                            save_path = res if isinstance(res, str) else res[0]
                    except Exception as e:
                        print("save_dialog error:", e)
                if save_path and content:
                    if not save_path.lower().endswith('.json'):
                        save_path += '.smartease.json'
                    with open(save_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    paths_file = save_companion_paths_file(save_path, content)
                    self.send_json_response({"success": True, "filePath": os.path.abspath(save_path), "pathsFile": paths_file})
                else:
                    self.send_json_response({"success": False, "filePath": save_path})
            except Exception as e:
                self.send_json_response({"success": False, "error": str(e)})
            return

        # 6. Native Select & Import Folder Dialog
        if path in ['/api/select_folder', '/api/import_folder']:
            try:
                data = json.loads(post_data.decode('utf-8')) if post_data else {}
                target_folder = (data.get('folder') or '').strip().replace('/', '\\')
                scan_photos = data.get('scanPhotos', True)

                selected_folder = target_folder if (target_folder and os.path.isdir(target_folder)) else None

                if not selected_folder:
                    if main_window:
                        try:
                            import webview
                            dialog_type = getattr(webview, 'FileDialog', None)
                            folder_type = getattr(dialog_type, 'FOLDER', getattr(webview, 'FOLDER_DIALOG', 20))
                            res = main_window.create_file_dialog(folder_type)
                            if res:
                                selected_folder = res if isinstance(res, str) else res[0]
                        except Exception as e:
                            print("select_folder error:", e)
                    if not selected_folder:
                        try:
                            import subprocess
                            ps_cmd = '[System.Reflection.Assembly]::LoadWithPartialName("System.windows.forms") | Out-Null; $f = New-Object System.Windows.Forms.FolderBrowserDialog; $f.Description = "Select Photo Folder"; if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $f.SelectedPath }'
                            p_res = subprocess.run(['powershell', '-NoProfile', '-NonInteractive', '-Command', ps_cmd], capture_output=True, text=True, timeout=30)
                            if p_res.returncode == 0 and p_res.stdout.strip():
                                selected_folder = p_res.stdout.strip()
                        except Exception as e:
                            print("select_folder fallback error:", e)

                if selected_folder and os.path.isdir(selected_folder):
                    abs_folder = os.path.abspath(selected_folder)
                    photos_found = []
                    if scan_photos:
                        valid_exts = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tif', '.tiff', '.avif', '.gif'}
                        try:
                            entries = []
                            for entry in os.scandir(abs_folder):
                                if entry.is_file():
                                    ext = os.path.splitext(entry.name)[1].lower()
                                    if ext in valid_exts:
                                        entries.append(entry.name)

                            def _nat_key(s):
                                return [int(c) if c.isdigit() else c.lower() for c in re.split(r'(\d+)', s)]

                            entries.sort(key=_nat_key)

                            for fn in entries:
                                fp = os.path.abspath(os.path.join(abs_folder, fn))
                                base_name = os.path.splitext(fn)[0]
                                meta = extract_photo_metadata(fp, compute_hash=True)
                                photos_found.append({
                                    "name": base_name,
                                    "fileName": fn,
                                    "filePath": fp,
                                    "fileHash": meta.get("fileHash"),
                                    "fileSize": meta.get("fileSize", 0),
                                    "width": meta.get("width"),
                                    "height": meta.get("height"),
                                    "aspect": meta.get("aspect"),
                                    "lastModified": meta.get("lastModified"),
                                    "dateTaken": meta.get("dateTaken"),
                                    "cameraModel": meta.get("cameraModel"),
                                    "cameraMake": meta.get("cameraMake")
                                })
                        except Exception as ex:
                            print("Scan folder error:", ex)
                    self.send_json_response({"success": True, "folder": abs_folder, "photos": photos_found})
                else:
                    self.send_json_response({"success": False, "cancelled": True, "folder": None, "photos": []})
            except Exception as e:
                self.send_json_response({"success": False, "error": str(e), "photos": []})
            return

        # 7. Native Open Project File Dialog
        if path == '/api/open_project_dialog':
            try:
                open_path = None
                content = None
                docs_dir = os.path.join(os.path.expanduser('~'), 'Documents')
                if main_window:
                    try:
                        import webview
                        dialog_type = getattr(webview, 'FileDialog', None)
                        open_type = getattr(dialog_type, 'OPEN', getattr(webview, 'OPEN_DIALOG', 10))
                        file_types = ('Smart Ease Photobook (*.smartease.json;*.json)', 'All files (*.*)')
                        res = main_window.create_file_dialog(open_type, allow_multiple=False, file_types=file_types, directory=docs_dir)
                        if res:
                            open_path = res if isinstance(res, str) else res[0]
                    except Exception as e:
                        print("open_dialog error:", e)
                if not open_path:
                    try:
                        import subprocess
                        ps_cmd = '[System.Reflection.Assembly]::LoadWithPartialName("System.windows.forms") | Out-Null; $f = New-Object System.Windows.Forms.OpenFileDialog; $f.Filter = "Smart Ease Photobook (*.json;*.smartease.json)|*.json;*.smartease.json|All files (*.*)|*.*"; $f.InitialDirectory = [Environment]::GetFolderPath(\"MyDocuments\"); if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $f.FileName }'
                        p_res = subprocess.run(['powershell', '-NoProfile', '-NonInteractive', '-Command', ps_cmd], capture_output=True, text=True, timeout=30)
                        if p_res.returncode == 0 and p_res.stdout.strip():
                            open_path = p_res.stdout.strip()
                    except Exception as e:
                        print("open_dialog fallback error:", e)
                if open_path and os.path.isfile(open_path):
                    with open(open_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    paths_file = find_exact_companion_paths_file(open_path)
                    self.send_json_response({
                        "success": True,
                        "filePath": os.path.abspath(open_path),
                        "content": content,
                        "pathsFile": paths_file
                    })
                else:
                    self.send_json_response({"success": False})
            except Exception as e:
                self.send_json_response({"success": False, "error": str(e)})
            return

        if path == '/api/verify_photo_paths':
            try:
                data = json.loads(post_data.decode('utf-8')) if post_data else {}
                missing_ids = []
                resolved_paths = {}
                project_path = (data.get('projectPath') or '').strip().replace('/', '\\')
                project_dir = os.path.dirname(os.path.abspath(project_path)) if project_path else ''
                for photo in data.get('photos', []):
                    file_path = (photo.get('filePath') or '').strip().replace('/', '\\')
                    candidates = [file_path] if file_path else []
                    if file_path and not os.path.isabs(file_path) and project_dir:
                        candidates.insert(0, os.path.join(project_dir, file_path))
                    resolved = next((os.path.abspath(candidate) for candidate in candidates if os.path.isfile(candidate)), None)
                    photo_id = photo.get('id')
                    if resolved:
                        resolved_paths[photo_id] = resolved
                    else:
                        missing_ids.append(photo_id)
                self.send_json_response({"success": True, "missingPhotoIds": missing_ids, "resolvedPaths": resolved_paths})
            except Exception as e:
                self.send_json_response({"success": False, "error": str(e), "missingPhotoIds": [], "resolvedPaths": {}})
            return

        # 8. Companion Paths Registry API
        if path == '/api/get_project_paths':
            try:
                data = json.loads(post_data.decode('utf-8')) if post_data else {}
                target_p = data.get('filePath') or data.get('projectPath') or data.get('folder') or ''
                pf = find_exact_companion_paths_file(target_p)
                if pf and os.path.isfile(pf):
                    with open(pf, 'r', encoding='utf-8') as f:
                        paths_data = json.load(f)
                    self.send_json_response({"success": True, "pathsFile": pf, "data": paths_data})
                else:
                    self.send_json_response({"success": False, "pathsFile": None})
            except Exception as e:
                self.send_json_response({"success": False, "error": str(e)})
            return

        self.send_error(404, "Endpoint not found")

def find_preferred_or_free_port(preferred=8765):
    """Binds to preferred port (8765) if available, or finds next free ephemeral port."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('127.0.0.1', preferred))
            return preferred
        except Exception:
            pass
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

def start_server(port):
    server = ThreadingHTTPServer(('127.0.0.1', port), CustomHTTPHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    return server

def on_window_closing():
    kill_app_and_children()
    return True

def on_window_closed():
    kill_app_and_children()

def launch_native_app(url, title="Smart Ease Photobook Studio"):
    global main_window
    # Try pywebview first for 100% native Edge WebView2 window
    try:
        import webview
        main_window = webview.create_window(
            title=title,
            url=url,
            width=1440,
            height=900,
            min_size=(1024, 680),
            background_color='#0b0f19',
            confirm_close=False
        )
        main_window.events.closing += on_window_closing
        main_window.events.closed += on_window_closed
        webview.start(debug=False)
        kill_app_and_children()
        return True
    except Exception as e:
        print("pywebview not available or failed:", e)

    # Fallback to Google Chrome or MS Edge in App Mode (looks like a standalone desktop window!)
    browser_paths = [
        os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%LocalAppData%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%LocalAppData%\Microsoft\Edge\Application\msedge.exe")
    ]
    
    for bp in browser_paths:
        if os.path.exists(bp):
            try:
                subprocess.Popen([bp, f"--app={url}", "--start-maximized", f"--app-id=smartease_photobook"])
                return True
            except Exception:
                pass

    # Fallback: Default web browser
    webbrowser.open(url)
    return True

def main():
    base_dir = get_base_path()
    os.chdir(base_dir)
    
    port = find_preferred_or_free_port(8765)
    server = start_server(port)
    
    try:
        with open('server_port.json', 'w', encoding='utf-8') as f:
            json.dump({"port": port, "url": f"http://127.0.0.1:{port}"}, f)
    except Exception:
        pass

    app_url = f"http://127.0.0.1:{port}/index.html"
    
    try:
        launch_native_app(app_url, "Smart Ease Photobook Studio")
    finally:
        kill_app_and_children()

if __name__ == '__main__':
    main()
