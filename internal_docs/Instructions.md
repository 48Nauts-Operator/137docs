# Onboarding & Setup Guide

Welcome to **137Docs IMAGE-First** – a local-only document management system (FastAPI + React).  Follow the steps below to get the stack running on a fresh machine.

---
## 1. Prerequisites

| Tool | Tested Version | Notes |
|------|----------------|-------|
| Docker | ≥ 24.x | Desktop on macOS / Windows or `docker` + `docker-compose` CLI on Linux |
| Git | ≥ 2.40 | for cloning the repo |
| (optional) Node + npm | Node 20, npm 10 | only needed if you want to run the frontend outside Docker |

> **No global Python, Postgres, Qdrant or Ollama installs are required.**  All backend services run in containers.

---
## 2. Clone the Repository
```bash
git clone https://github.com/your-org/137docs-image.git
cd 137docs-image
```

---
## 3. Create `.env`
Everything that is machine-specific (mount paths, API keys, etc.) lives in an **untracked** `.env` file.
```ini
# where your local files live – this directory will be mounted read/write
HOSTFS_MOUNT=/Users/<you>/Documents

# default sub-folders inside the mount used by the app
WATCH_FOLDER=/hostfs/Inbox
ARCHIVE_FOLDER=/hostfs/Archive

# Ollama / LLM demo setup (adjust or remove if you point to another host)
OLLAMA_BASE_URL=http://host.docker.internal:11434

# model & embedding defaults
LLM_MODEL=llama3
COLPALI_MODEL=vidore/colpali-v1.1
```
**Tips**
• Use an absolute path for `HOSTFS_MOUNT`.
• Ensure the `Inbox` sub-folder exists (`mkdir -p ~/Documents/Inbox`).  The app will create `Archive` automatically on first run.

### macOS: Grant Docker access to your mount path

If you are on **macOS** and the directory you set in `HOSTFS_MOUNT` lives outside your user home (e.g. on an external drive under `/Volumes`), Docker Desktop must be explicitly allowed to share it.

1. Open **Docker Desktop → Settings → Resources → File Sharing**.
2. Click **"+"** and add the parent folder you chose for `HOSTFS_MOUNT` (e.g. `/Volumes/Documents`).
3. Press **Apply & Restart** so the change takes effect.

⚠️ **Avoid symlinks in `HOSTFS_MOUNT`**  
Docker Desktop treats a macOS symlink (`ln -s …`) as a *file* inside the Linux VM.  
When Compose later tries to mount that path the VM refuses with `mkdir … file exists`.  
Always point `HOSTFS_MOUNT` at the *real directory* you want to share.  
If the directory lives on an external drive under `/Volumes`, add that exact parent folder to **File Sharing** as described above.

⚠️  You do *not* need to add sub-folders individually—adding the top-level directory is enough.  Avoid granting "Full Disk Access"; only share what the container really needs.

---
## 4. First Run
Rebuild the stack so the backend picks up the new env variables and mount:
```bash
docker compose up -d --build
```
Containers started:
| Service | Host Port | Purpose |
|---------|-----------|---------|
| backend | 8808 | FastAPI API (http://localhost:8808/api) |
| frontend | 3303 | React UI (http://localhost:3303) |
| db | n/a (network-internal) | Postgres with pgvector |
| qdrant | n/a | Vector DB |

Login with seeded credentials:
* **admin / admin** (full access)
* **viewer / viewer** (read-only)

---
## 5. Configure Folders
1. Log in as **admin** and open **Settings → Documents**.
2. Verify that *Inbox Folder* shows `/hostfs/Inbox`.
3. The *Inbox Preview* table should list files inside that directory (create a dummy PDF if empty).

> Drag or copy any PDF / image into the *Inbox* – it will appear in *Documents* within ~5 seconds once processed.

---
## 6. Development Workflow (optional)
### Front-end live reload outside Docker
```bash
cd src/frontend
npm install
npm run dev          # http://localhost:3001
```
> Adjust `.env.local` in `src/frontend` if you want the UI to call a non-default API URL.

### Backend live reload
```bash
cd src/backend
uvicorn app.main:app --reload --port 8000
```
(remember to shut down the dockerised backend first to free the port).

---
## 7. Common Tasks
| Task | Command |
|------|---------|
| View logs | `docker compose logs -f backend` |
| Enter backend container | `docker compose exec backend /bin/sh` |
| Rebuild only frontend | `docker compose up -d --build frontend` |
| Apply DB migrations | happens automatically on backend start |

---
## 8. Troubleshooting
1. **404 from file-browser** – check that the path in *Inbox Folder* exists **inside** the container.  Enter the backend shell and run `ls /hostfs`.
2. **Permission denied** – ensure your `HOSTFS_MOUNT` directory is readable/writable by Docker.  On macOS give Files & Folders permission to Docker Desktop.
3. **No vectors in Qdrant** – verify `qdrant` service is up (`docker compose ps`).

---
Happy documenting!  Questions → ping the #137docs channel. 