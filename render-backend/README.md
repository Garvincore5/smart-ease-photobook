# Smart Ease Render backend

This API is configured for Render's free web service. It accepts browser-uploaded photo originals, creates smaller WebP previews and thumbnails, and can save project JSON while the service is running. The service writes to `/tmp`; Render Free has an ephemeral filesystem, so uploads and saved projects can disappear after a restart, redeploy, or spin-down. This is a free prototype API, not durable cloud storage.

The app is not wired to upload photos or project JSON to this API by default. The existing editor should keep canvas interactions and photo previews in the browser for responsiveness. Only connect an explicit upload flow if you want selected photos/project data sent to the Render service. Render Free services may spin down while idle, so the first request can also be slow.

## Deploy

1. Put the repository containing `render.yaml` on a Git provider that Render can access.
2. In Render, choose **New → Blueprint** and connect that repository.
3. Review the `smart-ease-backend` web service. Confirm the plan is **Free** and create it; this configuration has no persistent disk.
4. When the service is live, open `/healthz` on its `onrender.com` URL. A healthy response is `{"status":"ok","service":"smart-ease-api"}`.
5. Keep the API URL for experiments. Do not treat its project/photo endpoints as backup storage: all data written by this free service is temporary and can be deleted when Render restarts or spins down the instance.

No paid Render plan or disk is included. Render Free has temporary storage only; persistent disks require a paid plan. Firebase Cloud Storage also requires Firebase's pay-as-you-go Blaze plan, so this setup does not use it. If you need durable cloud photo storage later, choose a storage provider and review its current free quota before enabling uploads.

## API

- `GET /healthz` — Render health check.
- `POST /api/photos/batch` — multipart form with repeated `files` fields. Requires `X-Workspace-ID`. Temporarily stores originals and returns original, 2400 px preview, and 360 px thumbnail URLs.
- `GET /api/photos/{id}/{original|preview|thumb}` — returns an asset belonging to the supplied workspace.
- `GET /api/projects` — lists projects held temporarily by this running instance.
- `GET /api/projects/{id}` — loads a temporarily saved project.
- `PUT /api/projects/{id}` — saves or updates project JSON temporarily.

`X-Workspace-ID` is a workspace namespace, not authentication. Do not put confidential projects on a public deployment. CORS defaults to the Smart Ease Firebase Hosting domains; set `WEB_ORIGINS` to a comma-separated list if the frontend uses another domain. The API does not accept Windows filesystem paths because a Render service cannot access files on a user's PC; browser-selected photos would have to be explicitly uploaded.
