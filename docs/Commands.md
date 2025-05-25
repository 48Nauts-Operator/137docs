# Command-Line Reference & Quick Recipes

Cheat-sheet covering the most common commands for **137Docs IMAGE-First**.  All commands are executed from the project root unless otherwise noted.

---
## 0.  Notation & Conventions

* `$` – run on **host** shell (macOS/Linux/WSL/PowerShell).
* `compose` – always means **Docker Compose V2** (`docker compose`, not the legacy `docker-compose`).
* Angle-brackets `<…>` denote values you must replace.
* The stack uses an **untracked** `.env` file for machine-specific variables (see `docs/Instructions.md`).

---
## 1. Docker Basics

| Purpose | Command |
|---------|---------|
| Start all services (detached) | `docker compose up -d` |
| Rebuild backend only | `docker compose up -d --build backend` |
| Stop everything | `docker compose down` |
| View backend logs live | `docker compose logs -f backend` |
| Enter running backend container | `docker compose exec backend /bin/sh` |
| Enter Postgres container with psql | `docker compose exec db psql -U postgres 137docs` |
| List containers & ports | `docker compose ps` |
| Prune dangling images (safe) | `docker image prune -f` |

> **Never** run `docker system prune -af` unless you know exactly what you're removing.

---
## 2. Database (Postgres)

### Drop & Recreate All Tables (DEV RESET)
```bash
docker compose exec db psql -U postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```
Restart backend afterwards to let Alembic recreate the schema:
```bash
docker compose up -d backend
```

### Backup Current DB
```bash
docker compose exec db pg_dump -U postgres 137docs > backups/backup_$(date +%F).sql
```

### Restore Backup
```bash
docker compose exec -T db psql -U postgres 137docs < backups/backup_<DATE>.sql
```

---
## 3. Vector Store (Qdrant)

### List Collections
```bash
docker compose exec qdrant wget -qO- http://localhost:6333/collections
```
 
### Delete a Collection (e.g., `doc_vectors`)
```bash
# Option A – via host curl (requires port mapping `6333:6333` in compose)
curl -X DELETE http://localhost:6333/collections/doc_vectors

# Option B – temporary curl inside the container
docker compose exec qdrant sh -c "apk add --no-cache curl && curl -X DELETE http://localhost:6333/collections/doc_vectors"
```

### Full Reset (wipe storage)
```bash
docker compose down        # stop stack
docker volume rm $(docker volume ls -q | grep qdrant_data)
docker compose up -d qdrant backend
```

---
## 4. Backend Local Development (outside Docker)
```bash
cd src/backend
uvicorn app.main:app --reload --port 8000
```
API docs: http://localhost:8000/docs

Stop the dockerised backend first to free port 8000.

---
## 5. Front-end Local Development (outside Docker)
```bash
cd src/frontend
npm install   # first time only
npm run dev   # Vite dev-server on http://localhost:3001
```
Environment overrides can go in `src/frontend/.env.local` (Vite format).

---
## 6. FolderWatcher & Storage Helpers

### Validate folder permissions
```bash
curl -X POST -F inbox_path=/hostfs/Inbox -F storage_root=/hostfs/Archive \
     http://localhost:8808/api/settings/validate-folders
```

### Migrate storage root
```bash
curl -X POST -F new_root=/hostfs/NewStorageRoot \
     http://localhost:8808/api/settings/migrate-storage
```

Poll migration status:
```bash
curl http://localhost:8808/api/settings/migration-status
```

---
## 7. Seed Admin Credentials
Default users are created when the DB is empty:

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin` |
| Viewer | `viewer` | `viewer` |

---
## 8. Quick Reset Recipe (Everything Fresh)
```bash
# stop & remove containers
docker compose down

# remove Postgres + Qdrant volumes (names from compose)
docker volume rm $(docker volume ls -q | grep postgres_data)
docker volume rm $(docker volume ls -q | grep qdrant_data)

docker compose up -d --build  # recreate
```

## Clean All
```bash
docker compose down
docker volume rm $(docker volume ls -q | grep -E 'docai-image_')
docker compose up -d --build
```

Your PDFs in `/hostfs/Inbox` remain untouched; they'll be re-ingested automatically.

---
Happy hacking!  If you add new utilities, update this file so everyone stays on the same page.
