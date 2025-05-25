# Local Document Management System - Implementation Guide

## Overview

This document provides an implementation guide for the Local Document Management System (DMS) MVP. The system is designed to monitor an inbox folder for new documents, perform OCR, extract metadata, classify documents, and provide a dashboard for document management.

## System Components

The system consists of three main components:

1. **Backend (FastAPI)**: Handles document processing, OCR, metadata extraction, and API endpoints
2. **Frontend (React + Tailwind)**: Provides the user interface for document management
3. **LLM Service (Ollama)**: Provides LLM capabilities for smart tagging and document analysis

## Implementation Progress

### Completed Components

1. **Document Ingestion**
   - Folder monitoring system using watchdog
   - File type detection and validation
   - Archive folder structure
   - File movement logic after processing

2. **OCR & Metadata Extraction**
   - OCR functionality using Tesseract
   - Metadata extraction (title, sender, dates, amounts)
   - Document type classification
   - SQLite database storage

3. **Tagging & Categorization**
   - Basic keyword and rule-based classification
   - LLM integration for smart tagging
   - Tag management system

4. **API Access**
   - REST API with FastAPI
   - Document upload endpoints
   - Metadata retrieval endpoints

5. **LLM Integration**
   - Ollama integration with gwen2.5
   - Configuration system for LLM flexibility
   - Document summarization
   - Q&A functionality
   - Task generation system

### Pending Components

1. **Dashboard UI**
   - React + Tailwind frontend project
   - Document list/grid views
   - Metadata-rich preview panel

2. **Containerization & Deployment**
   - Docker configuration (created but not tested)
   - Deployment documentation

## File Structure

```
/
├── architecture.md        # System architecture documentation
├── todo.md                # Project todo list with progress
├── docker-compose.yml     # Docker Compose configuration
├── src/
│   ├── backend/           # Backend code
│   │   ├── app/           # Application code
│   │   │   ├── __init__.py
│   │   │   ├── api.py     # API routes
│   │   │   ├── config.py  # Configuration management
│   │   │   ├── database.py # Database connection
│   │   │   ├── llm.py     # LLM integration
│   │   │   ├── main.py    # Main application
│   │   │   ├── models.py  # Database models
│   │   │   ├── ocr.py     # OCR processing
│   │   │   ├── repository.py # Data repository
│   │   │   └── watcher.py # Folder monitoring
│   │   ├── Dockerfile     # Backend Dockerfile
│   │   └── requirements.txt # Python dependencies
│   └── frontend/          # Frontend code (placeholder)
│       └── Dockerfile     # Frontend Dockerfile
```

## Setup Instructions

### Prerequisites

- Docker and Docker Compose
- macOS environment
- Ollama installed locally (for development without Docker)

### Configuration

1. Create a `.env` file in the root directory with the following variables:
   ```
   INBOX_FOLDER=~/Documents/Inbox
   ARCHIVE_FOLDER=~/Documents/Archive
   LLM_MODEL=gwen2.5
   ```

2. Create the inbox and archive folders:
   ```bash
   mkdir -p ~/Documents/Inbox ~/Documents/Archive
   ```

### Persisting the host mount path (`HOSTFS_MOUNT`)

> These options ensure Docker Compose always picks up your **real** file-system
> path after a reboot.  Pick the one that best fits your workflow—only **one**
> is needed.

| Option | How to do it | Pros | Cons |
|--------|--------------|------|------|
| A. Project-local `.env` (recommended) | Create `./.env` beside `docker-compose.yml`<br>`HOSTFS_MOUNT=/Users/<you>/docker-shares/DocAI/host` | • Works for all shells, CI runners & GUI wrappers<br>• Self-contained per repo<br>• Automatically read by `docker compose` | • Each developer needs their own copy<br>• Easy to forget in a new clone |
| B. Shell start-up export | Append to `~/.zshrc` (or `~/.bash_profile`) ↩︎<br>`export HOSTFS_MOUNT="$HOME/docker-shares/DocAI/host"` | • One-liner, affects every project that references the var | • Only interactive shells inherit it; Docker Desktop spawned from Finder won't<br>• Can collide with other projects that need a different path |
| C. `launchctl` (macOS system env) | `sudo launchctl setenv HOSTFS_MOUNT /Users/<you>/docker-shares/DocAI/host` | • Survives reboots and is visible to GUI apps (Docker Desktop, VS Code) | • Requires `sudo`; global scope—harder to change later |
| D. Ad-hoc `export` before each run | `export HOSTFS_MOUNT=... && docker compose up -d` | • Zero setup; ideal for quick tests | • Forget once → stack falls back to default `./data` |

> **Heads-up on symlinks**  
> `HOSTFS_MOUNT` must resolve to a *real directory*.  If the path you give Docker is a macOS symlink, the Linux VM inside Docker Desktop will see it as a **file**, causing the mount to fail with `mkdir … file exists` on every reboot.  Prefer the canonical path (e.g. `/Volumes/Work/DocAI`) or move the data under your home folder instead.

**Symlinking `.env`**
If your real `.env` already lives *inside* the shared folder you can avoid
duplicates:
```bash
ln -s /Users/<you>/docker-shares/DocAI/host/.env \
      /path/to/repo/.env
```
• Link is on the host FS → survives container rebuilds & reboots.<br>
• Keep the path stable; a renamed drive will break the link.

---

Once the variable resolves correctly you should be able to:
```bash
docker compose exec backend ls /hostfs
```
and see files from the host directory.

### Running with Docker

1. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

2. Access the dashboard at http://localhost:3000

3. Access the API at http://localhost:8000/api

### Running Without Docker (Development)

1. Install backend dependencies:
   ```bash
   cd src/backend
   pip install -r requirements.txt
   ```

2. Start the backend server:
   ```bash
   cd src/backend
   uvicorn app.main:app --reload
   ```

3. Access the API at http://localhost:8000/api

## Next Steps

1. **Frontend Development**
   - Implement the React + Tailwind frontend
   - Create document list and detail views
   - Add filtering and search functionality

2. **Testing and Validation**
   - Test each component individually
   - Perform integration testing
   - Validate against original requirements

3. **Deployment**
   - Test Docker deployment on macOS
   - Create user documentation

## API Documentation

The API provides the following endpoints:

- `GET /api/documents`: Get a list of documents
- `GET /api/documents/{document_id}`: Get a document by ID
- `POST /api/documents`: Create a new document manually
- `PUT /api/documents/{document_id}`: Update a document
- `DELETE /api/documents/{document_id}`: Delete a document
- `POST /api/upload`: Upload a document for processing
- `POST /api/documents/{document_id}/tags`: Add a tag to a document
- `DELETE /api/documents/{document_id}/tags/{tag_id}`: Remove a tag from a document
- `POST /api/documents/{document_id}/tasks`: Create a task for a document

For detailed API documentation, access the Swagger UI at http://localhost:8000/docs when the backend is running.

## Clean-Start Procedure (Wipe All Runtime Data)

Use this when you want to reset **everything** (Postgres rows, Qdrant vectors, IndexedDB cache) but keep the raw PDFs/images on disk.

> ⚠️  This is destructive – all metadata, tags, and embeddings will be re-created on next ingest.

### 1  Stop the stack
```bash
$ docker compose down
```

### 2  Remove persistent volumes
```bash
$ docker volume rm $(docker volume ls -q | grep postgres_data)
$ docker volume rm $(docker volume ls -q | grep qdrant_data)
```

### 3  (optional) Clear local browser cache
If you have the UI open, refresh with **Shift-Reload** or run in the DevTools console:
```js
indexedDB.deleteDatabase('docai_local');
localStorage.removeItem('cache_version');
```
This prevents stale rows from appearing after the reset.  Alternatively, developers can bump the `CACHE_VERSION` constant in `src/frontend/src/services/api.ts` (search for *"force-clear client cache"*) which triggers the same purge automatically on next reload.

### 4  Bring services back up
```bash
$ docker compose up -d --build
```
* Alembic re-creates all tables.
* Seed users `admin/admin`, `viewer/viewer` are inserted.
* FolderWatcher processes any files still present in `/hostfs/Inbox` and repopulates the database.

### 5  Verify
1. Login with **admin / admin**.
2. Open *Settings → Documents*; *Inbox Preview* should list your raw files.
3. The *Documents* page should initially be empty, then fill up as the watcher finishes.

---
Keep this recipe handy while iterating on schema or pipeline changes.
