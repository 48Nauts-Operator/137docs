"""
Main application module for the Document Management System.
"""
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form, BackgroundTasks, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Union
from app.database import get_db, engine
from app.models import Base, Document, Tag, User, document_tag as dt, AddressEntry, VectorEntry, Entity
from app.repository import DocumentRepository, UserRepository, LLMConfigRepository, TenantRepository, ProcessingRuleRepository
from app.watcher import FolderWatcher
from app.ocr import OCRProcessor
from app.llm import LLMService
from app.auth import get_current_user, create_access_token, authenticate_user, get_current_user_optional
from app.config import settings
from app.notifications import NotificationService
from app.analytics import AnalyticsService
from app.calendar_export import CalendarExportService
from app.search import SearchService
from app.colpali_embedder import ColPaliEmbedder
from app.vector_store import upsert_page
import os
import asyncio
import logging
import re
import hashlib
from sqlalchemy import select, text, update, func, or_
import secrets
from functools import partial
from difflib import SequenceMatcher
from pdf2image import convert_from_path
import json
from PIL import Image
from datetime import datetime, timedelta
from app.services.entity import EntityService
from app.services.onboarding import OnboardingService
from collections import defaultdict
import calendar

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Document Management System API",
    description="API for managing documents, OCR processing, and analytics",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
from app.api.llm import router as llm_router
app.include_router(llm_router, prefix="/api/llm", tags=["llm"])

from app.api.endpoints.flight_check import router as flight_check_router
app.include_router(flight_check_router, prefix="/api/flight-check", tags=["diagnostics"])

# Initialize services
document_repository = DocumentRepository()
ocr_processor = OCRProcessor()
llm_service = LLMService()
notification_service = NotificationService()
user_repository = UserRepository()
llm_config_repository = LLMConfigRepository()
tenant_repository = TenantRepository()

# ---------------------------------------------------------------------------
# Filesystem browsing helper – expose host filesystem (mounted at HOSTFS_ROOT)
# ---------------------------------------------------------------------------

def _sanitize_and_resolve(path: str, root: str) -> str:
    """Resolve *path* against *root*, preventing directory traversal.

    Returns the absolute path if it is inside *root*, otherwise raises 403.
    """
    # If client passes an absolute path, keep it; else join to root
    candidate = os.path.abspath(path if os.path.isabs(path) else os.path.join(root, path.lstrip("/")))

    # Enforce that the resolved path is within the root mount
    if not candidate.startswith(os.path.abspath(root)):
        raise HTTPException(status_code=403, detail="Access denied: path outside allowed scope")

    return candidate

# ---------------------------------------------------------------------------
# API: /api/fs – list directory contents with pagination
# ---------------------------------------------------------------------------

@app.get("/api/fs")
async def list_directory(
    path: str = Query("/hostfs", description="Directory to list, absolute or relative to mount root"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of items to return"),
    current_user: User = Depends(get_current_user),
):
    """Return paginated listing of a directory inside the mounted host filesystem."""

    root = settings.HOSTFS_ROOT

    abs_path = _sanitize_and_resolve(path, root)

    if not os.path.exists(abs_path):
        raise HTTPException(status_code=404, detail="Path not found")

    if not os.path.isdir(abs_path):
        raise HTTPException(status_code=400, detail="Path is not a directory")

    try:
        entries = list(os.scandir(abs_path))
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=f"Permission denied: {exc}") from exc

    total = len(entries)

    # Stable sort: directories first, then files, alphabetical (case-insensitive)
    entries.sort(key=lambda e: (e.is_file(), e.name.lower()))

    slice_end = min(offset + limit, total)
    paginated = entries[offset:slice_end]

    file_items: list[dict] = []
    for entry in paginated:
        try:
            info = entry.stat(follow_symlinks=False)
        except FileNotFoundError:
            # Item disappeared between scan and stat – skip
            continue

        item_type = "dir" if entry.is_dir(follow_symlinks=False) else "file"
        if entry.is_symlink():
            item_type = "symlink"

        file_items.append(
            {
                "name": entry.name,
                "type": item_type,
                "size": info.st_size if item_type == "file" else None,
                "modified": datetime.fromtimestamp(info.st_mtime).isoformat(),
            }
        )

    return {
        "version": 1,
        "path": abs_path,
        "offset": offset,
        "limit": limit,
        "total": total,
        "hasMore": slice_end < total,
        "files": file_items,
    }

# Create database tables
@app.on_event("startup")
async def startup():
    # ------------------------------------------------------------------
    # If Postgres, ensure pgvector extension exists so that the "vector"
    # column type is available for subsequent DDL.
    # ------------------------------------------------------------------

    async with engine.begin() as conn:
        if conn.engine.url.get_backend_name().startswith("postgres"):
            try:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            except Exception:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pgvector"))

    async with engine.begin() as conn:
        # ------------------------------------------------------------------
        # Ensure database up to date – create tables if first run
        # ------------------------------------------------------------------

        await conn.run_sync(Base.metadata.create_all)

        # --- Alembic stamp/upgrade ------------------------------------------------
        # Run Alembic migration in a separate thread so we don't block / mix async loops
        async def _run_migrations(url: str):
            """Synchronously invoke Alembic in a thread to avoid event-loop clashes."""

            def _migrate():
                from alembic.config import Config as AlembicConfig  # local import to avoid heavy deps at top-level
                from alembic import command as alembic_command
                import sqlalchemy as sa
                import re

                # Alembic expects a *synchronous* SQLAlchemy URL.  When the runtime
                # engine is async (``postgresql+asyncpg://`` or ``sqlite+aiosqlite://``)
                # we strip the async driver name so that the migrations run against a
                # regular blocking connection.  This prevents the infamous
                # "await_only" warning and potential dead-locks when Alembic issues
                # DDL inside an event-loop.
                sync_url = re.sub(r"\+(asyncpg|aiosqlite|asyncmy|asyncpgsa)", "", url)

                alembic_cfg = AlembicConfig(os.path.join(os.path.dirname(__file__), '..', 'alembic.ini'))
                alembic_cfg.set_main_option('sqlalchemy.url', sync_url)

                # Ensure version table exists and decide whether to stamp or upgrade
                engine_sync = sa.create_engine(sync_url, future=True)
                with engine_sync.begin() as sync_conn:
                    sync_conn.execute(sa.text("CREATE TABLE IF NOT EXISTS alembic_version (version_num varchar(32) not null, primary key (version_num))"))
                    count = sync_conn.execute(sa.text("SELECT count(*) FROM alembic_version")).scalar()

                if count == 0:
                    alembic_command.stamp(alembic_cfg, "head")
                else:
                    alembic_command.upgrade(alembic_cfg, "head")

            try:
                await asyncio.to_thread(_migrate)
            except Exception as exc:  # pragma: no cover – diagnostics only
                logger.warning("Alembic migration failed: %s", exc)

        await _run_migrations(str(conn.engine.url))

        # --- Postgres-specific initialisation (vector support) --------------------
        if conn.engine.url.get_backend_name().startswith("postgres"):
            # Ensure embedding column exists (idempotent)
            await conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS embedding vector(1536)"))
            # Create ivfflat index for fast ANN if not present
            await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents USING ivfflat(embedding vector_cosine_ops)"))

        # For SQLite or other DBs without vector extension, add embedding column as TEXT if missing
        try:
            await conn.execute(text("SELECT embedding FROM documents LIMIT 1"))
        except Exception:
            await conn.execute(text("ALTER TABLE documents ADD COLUMN embedding TEXT"))

        # Ensure 'hash' column exists
        try:
            await conn.execute(text("SELECT hash FROM documents LIMIT 1"))
        except Exception:
            await conn.execute(text("ALTER TABLE documents ADD COLUMN hash VARCHAR(64)"))
            await conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_documents_hash ON documents(hash)"))

        # Ensure 'currency' column exists
        try:
            await conn.execute(text("SELECT currency FROM documents LIMIT 1"))
        except Exception:
            await conn.execute(text("ALTER TABLE documents ADD COLUMN currency VARCHAR(10)"))

        # Ensure new invoice-related columns exist
        columns_to_add = {
            'subtotal': 'FLOAT',
            'tax_rate': 'FLOAT',
            'tax_amount': 'FLOAT',
            'payment_date': 'VARCHAR(50)',
            'category': 'VARCHAR(100)',
            'recurring': 'BOOLEAN',
            'frequency': 'VARCHAR(20)',
            'parent_id': 'INTEGER',
            'original_file_name': 'VARCHAR(255)',
            'summary': 'TEXT',
            'confidence_score': 'FLOAT',
        }

        for col, sql_type in columns_to_add.items():
            try:
                await conn.execute(text(f"SELECT {col} FROM documents LIMIT 1"))
            except Exception:
                await conn.execute(text(f"ALTER TABLE documents ADD COLUMN {col} {sql_type}"))

        # ------------------------------------------------------------------
        # Ensure critical columns exist on users table (in case Alembic failed)
        # ------------------------------------------------------------------
        user_columns_to_add = {
            "full_name": "VARCHAR(100)",
            "role": "VARCHAR(20) NOT NULL DEFAULT 'viewer'",
            "disabled": "BOOLEAN DEFAULT FALSE",
        }

        for col, sql_type in user_columns_to_add.items():
            await conn.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col} {sql_type}"))

        # ------------------------------------------------------------------
        # Ensure address_book.country column can hold full country names
        # ------------------------------------------------------------------
        try:
            # Postgres & SQLite syntax differ – Postgres supports ALTER TYPE directly
            await conn.execute(text("ALTER TABLE address_book ALTER COLUMN country TYPE VARCHAR(100)"))
        except Exception:
            # SQLite (or already adjusted) – ignore
            pass

        # ------------------------------------------------------------------
        # Seed initial admin / viewer users if the DB is empty
        # ------------------------------------------------------------------
        try:
            res = await conn.execute(text("SELECT COUNT(*) FROM users"))
            user_count = res.scalar() or 0

            if user_count == 0:
                from app.auth import get_password_hash  # late import to avoid circular deps

                seed_users = [
                    {
                        "username": "admin",
                        "email": "admin@example.com",
                        "full_name": "Administrator",
                        "role": "admin",
                        "hashed_password": get_password_hash("admin"),
                        "disabled": False,
                    },
                    {
                        "username": "viewer",
                        "email": "viewer@example.com",
                        "full_name": "View Only",
                        "role": "viewer",
                        "hashed_password": get_password_hash("viewer"),
                        "disabled": False,
                    },
                ]

                for u in seed_users:
                    await conn.execute(
                        text(
                            """
                            INSERT INTO users (username, email, full_name, role, hashed_password, disabled, created_at)
                            VALUES (:username, :email, :full_name, :role, :hashed_password, :disabled, NOW())
                            """
                        ),
                        u,
                    )
                logger.info("Seeded default admin & viewer users (passwords: 'admin' / 'viewer')")

            # ------------------------------------------------------------------
            # Back-fill Address-Book from existing documents if empty
            # ------------------------------------------------------------------

            res = await conn.execute(text("SELECT COUNT(*) FROM address_book"))
            ab_count = res.scalar() or 0

            if ab_count == 0:
                logger.info("Address-book is empty – performing one-time back-fill from document senders…")

                # Fetch distinct senders (ignore null / empty)
                senders = (
                    await conn.execute(text("SELECT DISTINCT sender FROM documents WHERE sender IS NOT NULL AND sender <> ''"))
                ).scalars().all()

                # Insert as basic company entries; additional metadata will be enriched lazily on next upload
                for s in senders:
                    await conn.execute(
                        text(
                            "INSERT INTO address_book (name, entity_type, created_at) VALUES (:name, 'company', NOW())"
                        ),
                        {"name": s},
                    )

                logger.info("Back-filled %d address entries", len(senders))
        except Exception as exc:
            logger.warning("User seeding failed: %s", exc)

        # ------------------------------------------------------------------
        # Ensure a singleton row exists in the *settings* table so that the UI
        # can later mutate folder paths via the API.
        # ------------------------------------------------------------------

        try:
            res = await conn.execute(text("SELECT COUNT(*) FROM settings"))
            settings_count = res.scalar() or 0

            if settings_count == 0:
                # Use existing environment defaults on first run
                inbox_default = settings.WATCH_FOLDER

                # If the user already defined STORAGE_ROOT env-var keep it, else
                # derive a sane default next to the inbox folder (../Storage)
                _env_storage_root = os.getenv("STORAGE_ROOT")
                if _env_storage_root:
                    storage_default = _env_storage_root
                else:
                    inbox_parent = os.path.abspath(os.path.join(inbox_default, os.pardir))
                    storage_default = os.path.join(inbox_parent, "Storage")

                await conn.execute(
                    text(
                        """
                        INSERT INTO settings (id, inbox_path, storage_root, locked, created_at, updated_at)
                        VALUES (1, :inbox_path, :storage_root, FALSE, NOW(), NOW())
                        ON CONFLICT (id) DO NOTHING
                        """
                    ),
                    {"inbox_path": inbox_default, "storage_root": storage_default},
                )

            # ------------------------------------------------------------------
            #  Load current values and patch pydantic settings so that the rest
            #  of the runtime (watcher, upload endpoints) sees the DB override.
            # ------------------------------------------------------------------

            res = await conn.execute(
                text("SELECT inbox_path, storage_root FROM settings WHERE id = 1")
            )
            row = res.mappings().first()
            if row and row["inbox_path"]:
                settings.WATCH_FOLDER = str(row["inbox_path"])
                os.makedirs(settings.WATCH_FOLDER, exist_ok=True)

        except Exception as exc:
            logger.warning("Settings table initialisation failed: %s", exc)
    
    # Start background services ------------------------------------------------
    global _watcher_task
    _watcher_task = asyncio.create_task(start_folder_watcher(settings.WATCH_FOLDER))

    # Daily invoice-due reminder scheduler
    try:
        from app.scheduler import start_scheduler
        start_scheduler()
    except Exception as exc:
        logger.warning("Failed to start scheduler: %s", exc)

# ---------------------------------------------------------------------------
#  Folder-Watcher lifecycle helpers (hot-reload when inbox_path changes)
# ---------------------------------------------------------------------------

_watcher_task: asyncio.Task | None = None  # Global ref so we can cancel/reload


async def start_folder_watcher(path: str):
    """Run a FolderWatcher for *path* until cancelled."""
    # Use shorter polling interval for better responsiveness on Docker/macOS
    folder_watcher = FolderWatcher(path, process_new_document, poll_interval=10)
    await folder_watcher.start_watching()


def reload_watcher(new_path: str):
    """Cancel existing watcher task (if any) and start a new one for *new_path*."""

    global _watcher_task

    async def _restart():
        nonlocal new_path
        global _watcher_task

        if _watcher_task and not _watcher_task.done():
            _watcher_task.cancel()
            try:
                await _watcher_task
            except asyncio.CancelledError:
                pass
        # Launch new watcher
        _watcher_task = asyncio.create_task(start_folder_watcher(new_path))

    # Schedule on event-loop (fire-and-forget)
    asyncio.get_event_loop().create_task(_restart())

async def process_new_document(file_path: str):
    """Process a new document detected by the folder watcher."""
    document_id = None
    try:
        # Extract text using OCR
        text = await ocr_processor.process_document(file_path)
        # Remove any NUL bytes that break Postgres UTF-8 encoder
        if "\x00" in text:
            text = text.replace("\x00", "")
        
        # Extract metadata using LLM
        metadata = await llm_service.extract_metadata(text)
        
        # Save document to database
        from sqlalchemy.ext.asyncio import AsyncSession
        from app.database import engine as _eng
        async with AsyncSession(_eng) as session:
            async with session.begin():
                # Compute SHA256 hash to detect duplicates
                with open(file_path, "rb") as f:
                    file_hash = hashlib.sha256(f.read()).hexdigest()

                # Skip if a document with same hash already exists
                existing = await session.execute(select(Document).filter(Document.hash == file_hash))
                if existing.scalars().first():
                    logger.info(f"Duplicate document ignored: {file_path}")
                    return

                def _to_str(val):
                    """Convert value to string, handling various input types."""
                    if val is None:
                        return None
                    if isinstance(val, str):
                        return val.strip() if val.strip() else None
                    if isinstance(val, (dict, list)):
                        try:
                            import json
                            return json.dumps(val, ensure_ascii=False)
                        except Exception:
                            return str(val)
                    return str(val)

                def _validate_and_convert_date_global(date_str: str) -> str | None:
                    """
                    Global date validation and conversion to ISO format (YYYY-MM-DD).
                    Handles European (DD.MM.YYYY) and American (MM/DD/YYYY) formats.
                    Returns None if date cannot be parsed.
                    """
                    if not date_str or not isinstance(date_str, str):
                        return None
                    
                    date_str = date_str.strip()
                    if not date_str:
                        return None
                    
                    from datetime import datetime
                    
                    # Try ISO format first (already correct)
                    try:
                        dt = datetime.fromisoformat(date_str)
                        return dt.strftime('%Y-%m-%d')
                    except:
                        pass
                    
                    # Try European format (DD.MM.YYYY)
                    try:
                        if '.' in date_str:
                            parts = date_str.split('.')
                            if len(parts) == 3:
                                day, month, year = parts
                                dt = datetime(int(year), int(month), int(day))
                                logger.info(f"Converted European date {date_str} -> {dt.strftime('%Y-%m-%d')}")
                                return dt.strftime('%Y-%m-%d')
                    except:
                        pass
                    
                    # Try American format (MM/DD/YYYY)
                    try:
                        if '/' in date_str:
                            parts = date_str.split('/')
                            if len(parts) == 3:
                                month, day, year = parts
                                dt = datetime(int(year), int(month), int(day))
                                logger.info(f"Converted American date {date_str} -> {dt.strftime('%Y-%m-%d')}")
                                return dt.strftime('%Y-%m-%d')
                    except:
                        pass
                    
                    # Try other common formats
                    formats_to_try = [
                        '%Y-%m-%d',  # ISO (shouldn't reach here but just in case)
                        '%d-%m-%Y',  # DD-MM-YYYY
                        '%m-%d-%Y',  # MM-DD-YYYY
                        '%d/%m/%Y',  # DD/MM/YYYY
                        '%Y/%m/%d',  # YYYY/MM/DD
                    ]
                    
                    for fmt in formats_to_try:
                        try:
                            dt = datetime.strptime(date_str, fmt)
                            converted = dt.strftime('%Y-%m-%d')
                            logger.info(f"Converted date {date_str} ({fmt}) -> {converted}")
                            return converted
                        except:
                            continue
                    
                    logger.warning(f"Could not parse date: {date_str}")
                    return None

                def _extract_sender_name(sender_data):
                    """Extract clean company name from sender data."""
                    if sender_data is None:
                        return ""
                    
                    # If it's already a string, return it
                    if isinstance(sender_data, str):
                        return sender_data.strip()
                    
                    # If it's a dict, try to extract the name field
                    if isinstance(sender_data, dict):
                        # Try common name fields
                        for name_field in ['name', 'company', 'sender', 'company_name']:
                            if name_field in sender_data and sender_data[name_field]:
                                return str(sender_data[name_field]).strip()
                        
                        # If no name field found, return the first non-empty string value
                        for key, value in sender_data.items():
                            if isinstance(value, str) and value.strip():
                                return value.strip()
                    
                    # Fallback to string conversion
                    return str(sender_data).strip()

                # Create document with "processing" status initially
                document = Document(
                    title=_to_str(metadata.get("title", os.path.basename(file_path))) or os.path.basename(file_path).replace('.pdf', '').replace('_', ' '),
                    file_path=file_path,
                    content=text,
                    document_type=_to_str((lambda dt: dt.lower() if isinstance(dt,str) else dt)(metadata.get("document_type", "unknown"))),
                    sender=_extract_sender_name(metadata.get("sender", "")),
                    recipient=_to_str(metadata.get("recipient", "")),
                    document_date=_validate_and_convert_date_global(metadata.get("document_date")),
                    due_date=_validate_and_convert_date_global(metadata.get("due_date")),
                    amount=_normalize_amount(metadata.get("amount")),
                    subtotal=_normalize_amount(metadata.get("subtotal")),
                    tax_rate=_normalize_amount(metadata.get("tax_rate")),
                    tax_amount=_normalize_amount(metadata.get("tax_amount")),
                    currency=_to_str(metadata.get("currency", settings.DEFAULT_CURRENCY)),
                    status="processing",  # Set to processing initially
                    hash=file_hash,
                )
                
                # Ensure title is never null
                if not document.title or document.title.strip() == "":
                    document.title = os.path.basename(file_path).replace('.pdf', '').replace('_', ' ')
                
                # Persist DB row early so we have an ID for vector mapping and dashboard display
                await document_repository.create(session, document)
                document_id = document.id
                logger.info(f"Document created with processing status: {document.title} (ID: {document_id})")
                
                # Commit immediately so the processing status is visible in dashboard
                await session.commit()
                
                # Add a longer delay to make the processing status visible in the dashboard
                await asyncio.sleep(5)
                
                # Continue with processing in a new transaction
                try:
                    async with session.begin():
                        # Refresh the document object for the new transaction
                        document = await session.get(Document, document_id)
                        if not document:
                            logger.error(f"Document {document_id} not found in new transaction")
                            return
                        
                        # ------------------------------------------------------------------
                        #  If VAT not explicitly returned, derive from subtotal vs total
                        # ------------------------------------------------------------------
                        if (
                            document.tax_amount is None
                            and document.amount is not None
                            and document.subtotal is not None
                        ):
                            try:
                                document.tax_amount = round(document.amount - document.subtotal, 2)
                            except Exception:
                                pass
                        
                        # Add tags
                        if "tags" in metadata and isinstance(metadata["tags"], list):
                            for tag_name in metadata["tags"]:
                                # Normalise
                                tag_name = str(tag_name).strip()
                                if not tag_name:
                                    continue
                                # Check if tag already exists (case-insensitive)
                                existing_tag_res = await session.execute(
                                    select(Tag).filter(Tag.name.ilike(tag_name))
                                )
                                existing_tag = existing_tag_res.scalars().first()
                                if existing_tag:
                                    document.tags.append(existing_tag)
                                else:
                                    new_tag = Tag(name=tag_name)
                                    session.add(new_tag)
                                    await session.flush()
                                    document.tags.append(new_tag)
                        
                        # ------------------------------------------------------------------
                        #  Auto-tag with year / month (for easier filter)
                        # ------------------------------------------------------------------

                        def _extract_date_year_month() -> tuple[str | None, str | None]:
                            for key in (metadata.get("document_date"), metadata.get("due_date")):
                                if key:
                                    try:
                                        from datetime import datetime
                                        dt = datetime.fromisoformat(str(key)[:10])
                                        return str(dt.year), f"{dt.year}-{dt.month:02d}"
                                    except Exception:
                                        pass
                            # Fallback: created_at (now)
                            from datetime import datetime
                            dt = datetime.utcnow()
                            return str(dt.year), f"{dt.year}-{dt.month:02d}"

                        _year, _ym = _extract_date_year_month()

                        for auto_tag in [f"year-{_year}" if _year else None, f"month-{_ym}" if _ym else None]:
                            if not auto_tag:
                                continue
                            existing_tag_res = await session.execute(select(Tag).filter(Tag.name == auto_tag))
                            existing_tag = existing_tag_res.scalars().first()
                            if existing_tag:
                                document.tags.append(existing_tag)
                            else:
                                nt = Tag(name=auto_tag)
                                session.add(nt)
                                await session.flush()
                                document.tags.append(nt)
                        
                        # ------------------------------------------------------------------
                        # Infer document_type if still unknown --------------------------------
                        # ------------------------------------------------------------------

                        if document.document_type in ("unknown", "", None):
                            lowered = text.lower()

                            def _looks_like_invoice() -> bool:
                                if document.due_date or document.tax_amount is not None:
                                    return True
                                if any(k in lowered for k in ("invoice", "rechnung", "facture", "fattura")):
                                    return True
                                return False

                            if _looks_like_invoice():
                                document.document_type = "invoice"
                            elif any(k in lowered for k in ("tax", "steuer", "mwst", "vat")):
                                document.document_type = "tax"
                            else:
                                document.document_type = "document"

                        # --------------------------------------------------------------
                        #  Vision embeddings (ColPali) – insert per page into Qdrant
                        # --------------------------------------------------------------

                        try:
                            embedder = ColPaliEmbedder()

                            images: list[Image.Image] = []
                            ext = os.path.splitext(file_path)[1].lower()

                            if ext == ".pdf":
                                # Reuse PDF->PIL conversion; low dpi to save mem (processor will resize)
                                images = await asyncio.to_thread(convert_from_path, file_path, dpi=240)
                            elif ext in {".jpg", ".jpeg", ".png", ".tiff", ".tif"}:
                                img = await asyncio.to_thread(Image.open, file_path)
                                images = [img]

                            # Iterate pages – embed & upsert
                            for page_idx, pil_img in enumerate(images):
                                multi_vecs, _ = embedder.embed_page(pil_img)

                                vector_ids = upsert_page(document.id, page_idx, multi_vecs)

                                ve = VectorEntry(
                                    doc_id=document.id,
                                    page=page_idx,
                                    vector_ids=json.dumps(vector_ids, ensure_ascii=False),
                                )
                                session.add(ve)

                        except Exception as exc:
                            logger.warning("ColPali embedding failed: %s", exc)
                        
                        # Compute *text* embedding (async) and persist for legacy search
                        try:
                            from app.embeddings import get_embedding
                            emb = await get_embedding(text[:2048])  # limit tokens
                            # Convert to pgvector input format (list of floats) – SQLAlchemy will adapt
                            document.embedding = emb  # type: ignore[attr-defined]
                        except Exception as e:
                            logger.warning("Embedding generation failed: %s", e)
                        
                        # Create notification if due date is present
                        if document.due_date:
                            await notification_service.create_due_date_notification(session, document)

                        # ------------------------------------------------------------------
                        #  Auto-enrich Address-Book with vendor / sender details
                        # ------------------------------------------------------------------

                        vendor_name = _extract_sender_name(metadata.get("sender", "")).strip()

                        vendor_entry: AddressEntry | None = None  # initialise to satisfy later reference

                        # ------------------------------------------------------------------
                        #  Helper – canonical representation of company names to avoid dupes
                        # ------------------------------------------------------------------

                        _LEGAL_SUFFIX_RE = re.compile(r"\b(ag|gmbh|sa|sarl|inc|ltd)\b\.?", re.I)

                        def _canonical_name(name: str) -> str:
                            name = _LEGAL_SUFFIX_RE.sub("", name.lower())
                            return re.sub(r"[^a-z0-9]", "", name)

                        # ------------------------------------------------------------------
                        # 1) Canonical match (after stripping legal suffix & punctuation)
                        # ------------------------------------------------------------------
                        canon = _canonical_name(vendor_name)

                        all_entries = (await session.execute(select(AddressEntry))).scalars().all()

                        for entry in all_entries:
                            if _canonical_name(entry.name) == canon:
                                vendor_entry = entry
                                break

                        # ------------------------------------------------------------------
                        # 2) Fuzzy fallback – token-overlap + edit-distance (robust to typos)
                        #    We purposely allow a lower similarity threshold (≥ 0.7) so that
                        #    variants like "Visana Service AG" / "Visa naa AG" / "Visana" map
                        #    to the same company. This greatly reduces duplicates caused by
                        #    OCR misreads.
                        # ------------------------------------------------------------------

                        def _tokenize(n: str) -> set[str]:
                            n = _LEGAL_SUFFIX_RE.sub("", n.lower())
                            tokens = re.split(r"[^a-z0-9]+", n)
                            return {t for t in tokens if t}

                        def _token_overlap(a: str, b: str) -> float:
                            ta, tb = _tokenize(a), _tokenize(b)
                            if not ta or not tb:
                                return 0.0
                            common = ta & tb
                            return len(common) / max(len(ta), len(tb))

                        if vendor_entry is None:
                            best_score = 0.0
                            for entry in all_entries:
                                overlap = _token_overlap(entry.name, vendor_name)
                                # Combine with SequenceMatcher ratio for fine-grained score
                                ed_ratio = SequenceMatcher(None, _canonical_name(entry.name), canon).ratio()
                                score = max(overlap, ed_ratio)
                                if score >= 0.7 and score > best_score:
                                    vendor_entry = entry
                                    best_score = score

                        # 3) Merge duplicates (same canonical but different rows)
                        if vendor_entry is not None:
                            dupes = [
                                e
                                for e in all_entries
                                if e.id != vendor_entry.id
                                and (
                                    _canonical_name(e.name) == canon
                                    or _token_overlap(e.name, vendor_entry.name) >= 0.7
                                )
                            ]

                            for d in dupes:
                                # Copy non-empty fields from dupe to canonical record
                                for col in (
                                    "email",
                                    "phone",
                                    "street",
                                    "address2",
                                    "town",
                                    "zip",
                                    "county",
                                    "country",
                                    "vat_id",
                                    "tags",
                                    "group_name",
                                ):
                                    if getattr(vendor_entry, col) in (None, "") and (
                                        val := getattr(d, col)
                                    ):
                                        setattr(vendor_entry, col, val)

                                # Keep the latest transaction date
                                try:
                                    if (d.last_transaction or "") > (vendor_entry.last_transaction or ""):
                                        vendor_entry.last_transaction = d.last_transaction
                                except Exception:
                                    pass

                                await session.delete(d)

                        entry_data: dict[str, str | None] = {}
                        # Map common metadata keys → AddressEntry columns
                        field_map = {
                            "street": "street",
                            "address2": "address2",
                            "town": "town",
                            "zip": "zip",
                            "county": "county",
                            "country": "country",
                            "sender_email": "email",
                            "email": "email",
                            "phone": "phone",
                            "vat_id": "vat_id",
                        }

                        for meta_key, col in field_map.items():
                            val = metadata.get(meta_key)
                            if val is not None:
                                # Workaround: if column still limited to 2 chars (legacy schema) truncate overly long country strings.
                                if col == "country":
                                    val_str = _to_str(val)
                                    if len(val_str) > 100:
                                        val_str = val_str[:100]
                                        # If previous schema is still VARCHAR(2) we at least store ISO code
                                        if len(val_str) > 2:
                                            iso = val_str[:2].upper()
                                            entry_data[col] = iso
                                        else:
                                            entry_data[col] = val_str
                                else:
                                    entry_data[col] = _to_str(val)

                        # Always update last_transaction to latest invoice date or today
                        entry_data["last_transaction"] = document.document_date or document.created_at.isoformat()

                        if vendor_entry is None:
                            # Create new record
                            vendor_entry = AddressEntry(name=vendor_name, entity_type="company", **entry_data)
                            session.add(vendor_entry)
                        else:
                            # Patch empty fields to keep data fresh
                            for col, val in entry_data.items():
                                if getattr(vendor_entry, col) in (None, "") and val:
                                    setattr(vendor_entry, col, val)

                        # Ensure the document's sender reflects the canonicalised vendor name
                        if vendor_entry is not None and vendor_entry.name:
                            document.sender = vendor_entry.name

                        await session.flush()

                        logger.info(f"Address entry processed and saved: {vendor_entry.name}")

                        # ------------------------------------------------------------------
                        # Mark document as completed after successful processing
                        # ------------------------------------------------------------------
                        final_status = _to_str(metadata.get("status", "pending"))
                        if final_status == "processing":  # Don't override if LLM provided a specific status
                            final_status = "pending"
                        
                        document.status = final_status
                        await session.flush()
                        
                        logger.info(f"Document processing completed: {document.title} (ID: {document_id}) - Status: {final_status}")

                        # ------------------------------------------------------------------
                        # Auto-extract and assign tenant (enhanced automation)
                        # ------------------------------------------------------------------
                        try:
                            from app.agents.tenant_agent import TenantExtractionAgent
                            
                            # Enhanced user detection: try to find the user who owns the document
                            # Look for a default user first, then fallback to admin
                            async def get_processing_user_id():
                                # Try to find a user marked as default processor
                                from app.models import User
                                result = await session.execute(
                                    select(User).where(User.disabled == False).order_by(User.id)
                                )
                                users = result.scalars().all()
                                
                                if users:
                                    # Use first active user (could be enhanced with more logic)
                                    return users[0].id
                                
                                # Fallback: assume user ID 1 exists
                                return 1
                            
                            processing_user_id = await get_processing_user_id()
                            
                            tenant_agent = TenantExtractionAgent(session)
                            tenant_result = await tenant_agent.analyze_and_assign_tenant(document_id, processing_user_id)
                            
                            if tenant_result.get("status") == "success" and tenant_result.get("tenant"):
                                logger.info(f"Auto-assigned document {document_id} to tenant: {tenant_result['tenant']['alias']}")
                            elif tenant_result.get("status") == "no_match":
                                logger.info(f"No tenant match found for document {document_id}, keeping original recipient: {document.recipient}")
                            else:
                                logger.info(f"Tenant auto-assignment skipped for document {document_id}: {tenant_result['message']}")
                                
                        except Exception as tenant_error:
                            logger.warning(f"Tenant extraction failed for document {document_id}: {tenant_error}")
                            # Don't fail the entire process if tenant extraction fails
                        
                        # ------------------------------------------------------------------
                        # Mark document as successfully processed
                        # ------------------------------------------------------------------
                        document.status = "processed" 
                        await session.flush()
                        logger.info(f"Document successfully processed: {document.title} (ID: {document_id})")
                        
                except Exception as inner_error:
                    logger.error(f"Error in processing transaction for {file_path}: {str(inner_error)}")
                    # Mark as failed in a separate transaction
                    try:
                        from sqlalchemy.ext.asyncio import AsyncSession
                        from app.database import engine as _eng
                        async with AsyncSession(_eng) as fail_session:
                            async with fail_session.begin():
                                failed_doc = await fail_session.execute(select(Document).filter(Document.id == document_id))
                                doc = failed_doc.scalars().first()
                                if doc:
                                    doc.status = "failed"
                                    await fail_session.flush()
                                    logger.info(f"Document marked as failed: {doc.title} (ID: {document_id})")
                    except Exception as update_error:
                        logger.error(f"Failed to update document status to failed: {update_error}")

                # ------------------------------------------------------------------
    except Exception as e:
        logger.error(f"Error processing document {file_path}: {str(e)}")
        
        # Mark document as failed if we have a document_id
        if document_id:
            try:
                from sqlalchemy.ext.asyncio import AsyncSession
                from app.database import engine as _eng
                async with AsyncSession(_eng) as session:
                    async with session.begin():
                        failed_doc = await session.execute(select(Document).filter(Document.id == document_id))
                        doc = failed_doc.scalars().first()
                        if doc:
                            doc.status = "failed"
                            await session.flush()
                            logger.info(f"Document marked as failed: {doc.title} (ID: {document_id})")
            except Exception as update_error:
                logger.error(f"Failed to update document status to failed: {update_error}")

# Utility – safely convert various LLM outputs to a float
def _normalize_amount(value):
    """Return float(value) or None if not parseable.

    Handles cases where the LLM returns:
      • a string with currency symbols ("CHF 980.69")
      • a string with commas ("1,234.50")
      • a dict like {"amount": "$85.41", "total": null}
    """
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    # If dict, try common keys or first convertible value
    if isinstance(value, dict):
        for k in ("amount", "total", "value"):
            if k in value:
                maybe = _normalize_amount(value[k])
                if maybe is not None:
                    return maybe
        # Fallback: iterate values
        for v in value.values():
            maybe = _normalize_amount(v)
            if maybe is not None:
                return maybe
        return None
    if isinstance(value, str):
        # Remove any currency symbols or letters, keep digits, commas, dots, minus
        cleaned = re.sub(r"[^0-9,.-]", "", value)
        # Replace comma decimal separator with dot if there is no dot already
        if cleaned.count(',') == 1 and cleaned.count('.') == 0:
            cleaned = cleaned.replace(',', '.')
        # Remove thousand separators (commas) if both comma and dot exist and dot is decimal
        if cleaned.count('.') > 1:
            # Assume commas are thousand sep, remove commas
            cleaned = cleaned.replace(',', '')
        try:
            return float(cleaned)
        except ValueError:
            return None
    return None

def _validate_and_convert_date_global(date_str: str) -> str | None:
    """
    Global date validation and conversion to ISO format (YYYY-MM-DD).
    Handles European (DD.MM.YYYY) and American (MM/DD/YYYY) formats.
    Returns None if date cannot be parsed.
    """
    if not date_str or not isinstance(date_str, str):
        return None
    
    date_str = date_str.strip()
    if not date_str:
        return None
    
    from datetime import datetime
    
    # Try ISO format first (already correct)
    try:
        dt = datetime.fromisoformat(date_str)
        return dt.strftime('%Y-%m-%d')
    except:
        pass
    
    # Try European format (DD.MM.YYYY)
    try:
        if '.' in date_str:
            parts = date_str.split('.')
            if len(parts) == 3:
                day, month, year = parts
                dt = datetime(int(year), int(month), int(day))
                logger.info(f"Converted European date {date_str} -> {dt.strftime('%Y-%m-%d')}")
                return dt.strftime('%Y-%m-%d')
    except:
        pass
    
    # Try American format (MM/DD/YYYY)
    try:
        if '/' in date_str:
            parts = date_str.split('/')
            if len(parts) == 3:
                month, day, year = parts
                dt = datetime(int(year), int(month), int(day))
                logger.info(f"Converted American date {date_str} -> {dt.strftime('%Y-%m-%d')}")
                return dt.strftime('%Y-%m-%d')
    except:
        pass
    
    # Try other common formats
    formats_to_try = [
        '%Y-%m-%d',  # ISO (shouldn't reach here but just in case)
        '%d-%m-%Y',  # DD-MM-YYYY
        '%m-%d-%Y',  # MM-DD-YYYY
        '%d/%m/%Y',  # DD/MM/YYYY
        '%Y/%m/%d',  # YYYY/MM/DD
    ]
    
    for fmt in formats_to_try:
        try:
            dt = datetime.strptime(date_str, fmt)
            converted = dt.strftime('%Y-%m-%d')
            logger.info(f"Converted date {date_str} ({fmt}) -> {converted}")
            return converted
        except:
            continue
    
    logger.warning(f"Could not parse date: {date_str}")
    return None

# Authentication routes
@app.post("/api/auth/login")
async def login(username: str = Form(...), password: str = Form(...), db: AsyncSession = Depends(get_db)):
    # authenticate_user is async – await it
    user = await authenticate_user(db, username, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "disabled": current_user.disabled,
    }

# Password change route
@app.post("/api/auth/change-password")
async def change_password(
    old_password: str = Form(...),
    new_password: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Allow the currently authenticated user to change their password."""

    from app.auth import verify_password, get_password_hash, fake_users_db
    from app.models import User as UserDB

    # 1) DB path ------------------------------------------------------------
    res = await db.execute(select(UserDB).where(UserDB.username == current_user.username))
    user_db: UserDB | None = res.scalars().first()

    if user_db:
        if not verify_password(old_password, user_db.hashed_password):
            raise HTTPException(status_code=401, detail="Old password incorrect")

        new_hash = get_password_hash(new_password)
        await db.execute(
            update(UserDB).where(UserDB.id == user_db.id).values(hashed_password=new_hash)
        )
        await db.commit()
        return {"message": "Password updated"}

    # 2) Fallback – unit-test / dev in-memory
    user_rec = fake_users_db.get(current_user.username)
    if user_rec and verify_password(old_password, user_rec["hashed_password"]):
        user_rec["hashed_password"] = get_password_hash(new_password)
        return {"message": "Password updated"}

    raise HTTPException(status_code=400, detail="User record not found")

# Document routes
@app.get("/api/documents")
async def get_documents(
    status: Optional[str] = None,
    document_type: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    documents = await document_repository.get_all(
        db,
        status=status,
        document_type=document_type,
        search=search,
    )

    # Safety: convert any SQLAlchemy model instances left over to plain dicts to
    # avoid FastAPI jsonable_encoder errors.
    serialisable = [
        DocumentRepository._to_dict(d) if not isinstance(d, dict) else d
        for d in documents
    ]

    # FastAPI's default jsonable_encoder stumbles over edge-cases here; bypass by
    # returning a pre-encoded JSONResponse which uses the high-performance
    # orjson backend internally (if installed) and happily serialises plain
    # Python primitives.
    return JSONResponse(content=serialisable)

@app.get("/api/documents/{document_id}")
async def get_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = await document_repository.get_by_id(db, document_id, as_dict=True)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@app.put("/api/documents/{document_id}")
async def update_document(
    document_id: int,
    title: Optional[str] = Form(None),
    document_type: Optional[str] = Form(None),
    sender: Optional[str] = Form(None),
    recipient: Optional[str] = Form(None),
    document_date: Optional[str] = Form(None),
    due_date: Optional[str] = Form(None),
    amount: Optional[float] = Form(None),
    currency: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = await document_repository.get_by_id(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Update fields if provided
    if title:
        document.title = title
    if document_type:
        document.document_type = document_type
    if sender:
        document.sender = sender
    if recipient:
        document.recipient = recipient
    if document_date:
        document.document_date = _validate_and_convert_date_global(document_date)
    if due_date:
        document.due_date = _validate_and_convert_date_global(due_date)
    if amount is not None:
        document.amount = amount
    if currency:
        document.currency = currency
    if status:
        document.status = status
    
    await document_repository.update(db, document)
    await db.commit()
    return DocumentRepository._to_dict(document)

@app.delete("/api/documents/{document_id}")
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = await document_repository.get_by_id(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    await document_repository.delete(db, document_id)
    await db.commit()
    return {"message": "Document deleted successfully"}

@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    # Save file to watch folder
    file_path = os.path.join(settings.WATCH_FOLDER, file.filename)
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    # Process document in background
    background_tasks.add_task(process_new_document, file_path)
    
    return {"message": "Document uploaded successfully", "file_path": file_path}

# Tag routes
@app.get("/api/documents/{document_id}/tags")
async def get_document_tags(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Efficiently fetch tag names without triggering lazy-load IO in an async-unsafe context
    result = await db.execute(
        select(Tag.name)
        .select_from(Tag)
        .join(dt, dt.c.tag_id == Tag.id)
        .where(dt.c.document_id == document_id)
    )
    return [row[0] for row in result.all()]

@app.post("/api/documents/{document_id}/tags")
async def add_tag_to_document(
    document_id: int,
    tag: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = await document_repository.get_by_id(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check if tag already exists
    for existing_tag in document.tags:
        if existing_tag.name == tag:
            return {"message": "Tag already exists"}
    
    # Add new tag
    new_tag = Tag(name=tag)
    document.tags.append(new_tag)
    await document_repository.update(db, document)
    
    return {"message": "Tag added successfully"}

@app.delete("/api/documents/{document_id}/tags/{tag_name}")
async def remove_tag_from_document(
    document_id: int,
    tag_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = await document_repository.get_by_id(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Find and remove tag
    for i, tag in enumerate(document.tags):
        if tag.name == tag_name:
            document.tags.pop(i)
            await document_repository.update(db, document)
            return {"message": "Tag removed successfully"}
    
    raise HTTPException(status_code=404, detail="Tag not found")

# Notification routes
@app.get("/api/notifications")
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notifications = await notification_service.get_all_notifications(db)
    return notifications

@app.put("/api/notifications/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    success = await notification_service.mark_as_read(db, notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}

@app.put("/api/notifications/read-all")
async def mark_all_notifications_as_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await notification_service.mark_all_as_read(db)
    return {"message": "All notifications marked as read"}

@app.delete("/api/notifications/{notification_id}")
async def delete_notification(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    success = await notification_service.delete_notification(db, notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification deleted"}

# ---------------- Address Book Routes ----------------

class AddressRepository:
    async def get_all(self, db: AsyncSession):
        result = await db.execute(select(AddressEntry).order_by(AddressEntry.name))
        return result.scalars().all()

    async def get_by_id(self, db: AsyncSession, entry_id: int):
        res = await db.execute(select(AddressEntry).filter(AddressEntry.id == entry_id))
        return res.scalars().first()

    async def create(self, db: AsyncSession, entry: AddressEntry):
        db.add(entry)
        await db.flush()
        await db.refresh(entry)
        return entry

    async def update(self, db: AsyncSession, entry: AddressEntry):
        await db.flush()
        await db.refresh(entry)
        return entry

    async def delete(self, db: AsyncSession, entry_id: int):
        entry = await self.get_by_id(db, entry_id)
        if not entry:
            return False
        await db.delete(entry)
        return True

address_repository = AddressRepository()

@app.get("/api/address-book")
async def list_address_entries(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await address_repository.get_all(db)

# Optional trailing-slash alias for robustness
app.get("/api/address-book/")(list_address_entries)

@app.post("/api/address-book")
async def create_address_entry(
    name: str = Form(...),
    entity_type: str = Form("company"),
    email: Union[str, None] = Form(None),
    phone: Union[str, None] = Form(None),
    street: Union[str, None] = Form(None),
    address2: Union[str, None] = Form(None),
    town: Union[str, None] = Form(None),
    zip: Union[str, None] = Form(None),
    county: Union[str, None] = Form(None),
    address: Union[str, None] = Form(None),
    country: Union[str, None] = Form(None),
    vat_id: Union[str, None] = Form(None),
    tags: Union[str, None] = Form(None),
    group_name: Union[str, None] = Form(None),
    last_transaction: Union[str, None] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = AddressEntry(
        name=name,
        entity_type=entity_type,
        email=email,
        phone=phone,
        street=street,
        address2=address2,
        town=town,
        zip=zip,
        county=county,
        address=address,
        country=country,
        vat_id=vat_id,
        tags=tags,
        group_name=group_name,
        last_transaction=last_transaction,
    )
    await address_repository.create(db, entry)
    await db.commit()
    return entry

@app.put("/api/address-book/{entry_id}")
async def update_address_entry(
    entry_id: int,
    name: Union[str, None] = Form(None),
    entity_type: Union[str, None] = Form(None),
    email: Union[str, None] = Form(None),
    phone: Union[str, None] = Form(None),
    street: Union[str, None] = Form(None),
    address2: Union[str, None] = Form(None),
    town: Union[str, None] = Form(None),
    zip: Union[str, None] = Form(None),
    county: Union[str, None] = Form(None),
    address: Union[str, None] = Form(None),
    country: Union[str, None] = Form(None),
    vat_id: Union[str, None] = Form(None),
    tags: Union[str, None] = Form(None),
    group_name: Union[str, None] = Form(None),
    last_transaction: Union[str, None] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = await address_repository.get_by_id(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Address entry not found")

    if name: entry.name = name
    if entity_type: entry.entity_type = entity_type
    if email: entry.email = email
    if phone: entry.phone = phone
    if street is not None: entry.street = street
    if address2 is not None: entry.address2 = address2
    if town is not None: entry.town = town
    if zip is not None: entry.zip = zip
    if county is not None: entry.county = county
    if address is not None: entry.address = address
    if country: entry.country = country
    if vat_id: entry.vat_id = vat_id
    if tags is not None: entry.tags = tags
    if group_name is not None: entry.group_name = group_name
    if last_transaction is not None: entry.last_transaction = last_transaction

    await address_repository.update(db, entry)
    await db.commit()
    return entry

@app.delete("/api/address-book/{entry_id}")
async def delete_address_entry(entry_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    success = await address_repository.delete(db, entry_id)
    await db.commit()
    if not success:
        raise HTTPException(status_code=404, detail="Address entry not found")
    return {"message": "Deleted"}

# Analytics routes
@app.get("/api/analytics/document-types")
async def get_document_type_distribution(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analytics_service = AnalyticsService(db)
    distribution = await analytics_service.get_document_type_distribution()
    return distribution

@app.get("/api/analytics/payment-status")
async def get_payment_status_distribution(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analytics_service = AnalyticsService(db)
    distribution = await analytics_service.get_payment_status_distribution()
    return distribution

@app.get("/api/analytics/monthly-documents")
async def get_monthly_document_count(
    year: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analytics_service = AnalyticsService(db)
    monthly_count = await analytics_service.get_monthly_document_count(year)
    return monthly_count

@app.get("/api/analytics/monthly-invoices")
async def get_monthly_invoice_amount(
    year: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analytics_service = AnalyticsService(db)
    monthly_amount = await analytics_service.get_monthly_invoice_amount(year)
    return monthly_amount

@app.get("/api/analytics/summary")
async def get_summary_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analytics_service = AnalyticsService(db)
    summary = await analytics_service.get_summary_metrics()
    return summary

# Calendar routes
@app.get("/api/calendar/events")
async def get_calendar_events(
    month: int,
    year: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    calendar_service = CalendarExportService(db)
    events = await calendar_service.get_events_for_month(db, month, year)
    return events

@app.get("/api/calendar/events/date")
async def get_events_for_date(
    date: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    calendar_service = CalendarExportService(db)
    events = await calendar_service.get_events_for_date(db, date)
    return events

@app.get("/api/calendar/export")
async def export_calendar(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    calendar_service = CalendarExportService(db)
    ics_content = calendar_service.generate_ics_file()
    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={"Content-Disposition": "attachment; filename=calendar.ics"},
    )

# ---------------------------------------------------------------------------
#  New token-based ICS export (public, read-only)
# ---------------------------------------------------------------------------

@app.post("/api/calendar/api-key")
async def create_calendar_api_key(current_user: User = Depends(get_current_user)):
    """Return an API key that can be used to access the public /api/calendar/export/ics endpoint.

    The key is generated server-side and mapped to the current user in the shared
    ``api_keys`` registry from :pyfile:`app.auth`. Subsequent calls will return the
    same key instead of creating a new one, so that the user keeps a stable
    calendar URL.
    """

    # Re-use the global in-memory api_keys mapping used elsewhere in the app.
    from app.auth import api_keys  # Local import to avoid circular deps at top level

    # Check if a key already exists for this user and return if so
    for key, username in api_keys.items():
        if username == current_user.username:
            return {"api_key": key}

    # Otherwise generate a new secure token
    token = secrets.token_urlsafe(32)
    api_keys[token] = current_user.username
    return {"api_key": token}

@app.get("/api/calendar/export/ics")
async def export_calendar_ics(
    api_key: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Public (token-authenticated) ICS feed.

    Clients may supply either a valid **Bearer/JWT** token (handled by the standard
    dependency) *or* an ``api_key`` query parameter obtained from
    ``POST /api/calendar/api-key``. This mirrors the behaviour of the document file
    download endpoint to make the API consistent.
    """

    # If no authenticated user, fall back to API-key validation
    if current_user is None:
        from app.auth import api_keys  # Local import to avoid circular deps

        if not api_key or api_key not in api_keys:
            raise HTTPException(status_code=401, detail="Could not validate credentials")

    calendar_service = CalendarExportService(db)
    ics_content = calendar_service.generate_ics_file()
    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={"Content-Disposition": "attachment; filename=calendar.ics"},
    )

# Search routes
@app.get("/api/search")
async def basic_search(
    query: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    search_service = SearchService(db)
    results = await search_service.basic_search(query)
    return results

@app.post("/api/search/advanced")
async def advanced_search(
    search_params: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    search_service = SearchService(db)
    results = await search_service.advanced_search(search_params)
    return results

@app.get("/api/search/semantic")
async def semantic_search(
    query: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    search_service = SearchService(db)
    results = await search_service.semantic_search(query)
    return results

@app.get("/api/search/related/{document_id}")
async def get_related_documents(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = await document_repository.get_by_id(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    search_service = SearchService(db)
    related_docs = await search_service.suggest_related_documents(document_id=document.id)
    return related_docs

# ---------------------------------------------------------------------------
#  Vision Search endpoint
# ---------------------------------------------------------------------------

@app.get("/api/search/vision")
async def vision_search(
    query: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    search_service = SearchService(db)
    results = await search_service.vision_search(query)
    return results

# ---------------------------------------------------------------------------
# Vendor Analytics routes
# ---------------------------------------------------------------------------

@app.get("/api/vendors/{vendor_name}/analytics")
async def get_vendor_analytics(
    vendor_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get comprehensive analytics for a specific vendor."""
    from collections import defaultdict
    import calendar
    
    # Get all documents for this vendor
    result = await db.execute(
        select(Document).where(
            Document.sender.ilike(f"%{vendor_name}%")
        ).order_by(Document.document_date.desc())
    )
    documents = result.scalars().all()
    
    if not documents:
        raise HTTPException(status_code=404, detail="No documents found for this vendor")
    
    # Convert to dictionaries for easier processing
    invoices = []
    for doc in documents:
        invoice_data = DocumentRepository._to_dict(doc)
        invoices.append(invoice_data)
    
    # Analyze invoice patterns
    current_year = datetime.now().year
    yearly_totals = defaultdict(float)
    yearly_vat = defaultdict(float)
    yearly_counts = defaultdict(int)
    monthly_pattern = defaultdict(list)  # year-month -> [invoices]
    
    # Process each invoice
    for invoice in invoices:
        doc_date = invoice.get('document_date')
        amount = invoice.get('amount') or 0
        vat_amount = invoice.get('tax_amount') or 0
        
        if doc_date:
            try:
                if isinstance(doc_date, str):
                    # Try different date formats
                    date_obj = None
                    for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%dT%H:%M:%S.%f']:
                        try:
                            date_obj = datetime.strptime(doc_date.replace('Z', '').replace('+00:00', ''), fmt)
                            break
                        except ValueError:
                            continue
                    
                    if date_obj is None:
                        # Try fromisoformat as fallback
                        date_obj = datetime.fromisoformat(doc_date.replace('Z', '+00:00'))
                else:
                    date_obj = doc_date
                
                year = date_obj.year
                month = date_obj.month
                
                yearly_totals[year] += amount
                yearly_vat[year] += vat_amount
                yearly_counts[year] += 1
                monthly_pattern[f"{year}-{month:02d}"].append(invoice)
                
            except (ValueError, TypeError):
                continue
    
    # Detect missing invoices (simple heuristic: if we have invoices in consecutive months, flag missing months)
    missing_periods = []
    if len(monthly_pattern) >= 3:  # Need at least 3 invoices to detect pattern
        # Get all year-month keys and sort them
        periods = sorted(monthly_pattern.keys())
        
        # Check for gaps in monthly pattern for the last 2 years
        start_date = datetime(current_year - 1, 1, 1)
        end_date = datetime(current_year, 12, 31)
        
        current_date = start_date
        while current_date <= end_date:
            period_key = f"{current_date.year}-{current_date.month:02d}"
            
            # If this period is missing and we have invoices before and after
            if period_key not in monthly_pattern:
                # Check if we have invoices in surrounding months
                prev_month = current_date - timedelta(days=32)
                next_month = current_date + timedelta(days=32)
                prev_key = f"{prev_month.year}-{prev_month.month:02d}"
                next_key = f"{next_month.year}-{next_month.month:02d}"
                
                if prev_key in monthly_pattern and next_key in monthly_pattern:
                    missing_periods.append({
                        "period": period_key,
                        "month_name": calendar.month_name[current_date.month],
                        "year": current_date.year
                    })
            
            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
    
    # Calculate frequency pattern
    frequency_analysis = "unknown"
    if len(monthly_pattern) >= 6:
        # Count how many months have invoices vs total months spanned
        periods = sorted(monthly_pattern.keys())
        if periods:
            start_period = periods[0]
            end_period = periods[-1]
            start_year, start_month = map(int, start_period.split('-'))
            end_year, end_month = map(int, end_period.split('-'))
            
            total_months = (end_year - start_year) * 12 + (end_month - start_month) + 1
            months_with_invoices = len(monthly_pattern)
            
            coverage_ratio = months_with_invoices / total_months
            
            if coverage_ratio >= 0.9:
                frequency_analysis = "monthly"
            elif coverage_ratio >= 0.7:
                frequency_analysis = "mostly_monthly"
            elif coverage_ratio >= 0.25:
                frequency_analysis = "quarterly"
            else:
                frequency_analysis = "irregular"
    
    # Prepare yearly breakdown for charts
    yearly_breakdown = []
    for year in sorted(yearly_totals.keys(), reverse=True):
        yearly_breakdown.append({
            "year": year,
            "total_amount": round(yearly_totals[year], 2),
            "total_vat": round(yearly_vat[year], 2),
            "invoice_count": yearly_counts[year],
            "average_amount": round(yearly_totals[year] / yearly_counts[year], 2) if yearly_counts[year] > 0 else 0
        })
    
    # Calculate totals
    total_amount = sum(yearly_totals.values())
    total_vat = sum(yearly_vat.values())
    total_invoices = len(invoices)
    
    # Recent activity (last 12 months)
    twelve_months_ago = datetime.now() - timedelta(days=365)
    recent_invoices = []
    
    for inv in invoices:
        doc_date = inv.get('document_date')
        if doc_date:
            try:
                if isinstance(doc_date, str):
                    # Try different date formats
                    date_obj = None
                    for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%dT%H:%M:%S.%f']:
                        try:
                            date_obj = datetime.strptime(doc_date.replace('Z', '').replace('+00:00', ''), fmt)
                            break
                        except ValueError:
                            continue
                    
                    if date_obj is None:
                        # Try fromisoformat as fallback
                        date_obj = datetime.fromisoformat(doc_date.replace('Z', '+00:00'))
                else:
                    date_obj = doc_date
                
                if date_obj >= twelve_months_ago:
                    recent_invoices.append(inv)
            except (ValueError, TypeError):
                continue
    
    return {
        "vendor_name": vendor_name,
        "summary": {
            "total_amount": round(total_amount, 2),
            "total_vat": round(total_vat, 2),
            "total_invoices": total_invoices,
            "years_active": len(yearly_totals),
            "frequency_pattern": frequency_analysis,
            "recent_activity": len(recent_invoices)
        },
        "yearly_breakdown": yearly_breakdown,
        "missing_periods": missing_periods,
        "all_invoices": invoices,
        "monthly_pattern": dict(monthly_pattern),
        "currency": invoices[0].get('currency', 'CHF') if invoices else 'CHF'
    }

# Settings routes
@app.get("/api/settings")
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return runtime settings, including folder paths from DB."""

    # Fetch singleton row (id=1); in very early setups it may still be empty
    res = await db.execute(text("SELECT inbox_path, storage_root, locked FROM settings WHERE id = 1"))
    row = res.mappings().first() or {}

    return {
        "inbox_path": row.get("inbox_path", settings.WATCH_FOLDER),
        "storage_root": row.get("storage_root"),
        "locked": row.get("locked", False),
        "watch_folder": settings.WATCH_FOLDER,  # legacy name (to be removed later)
        "llm_model": settings.LLM_MODEL,
        "notification_enabled": settings.NOTIFICATION_ENABLED,
        "auto_ocr": settings.AUTO_OCR,
        "auto_tagging": settings.AUTO_TAGGING,
        "default_currency": settings.DEFAULT_CURRENCY,
    }

@app.put("/api/settings")
async def update_settings(
    inbox_path: Optional[str] = Form(None),
    storage_root: Optional[str] = Form(None),
    watch_folder: Optional[str] = Form(None),  # legacy param
    llm_model: Optional[str] = Form(None),
    notification_enabled: Optional[bool] = Form(None),
    auto_ocr: Optional[bool] = Form(None),
    auto_tagging: Optional[bool] = Form(None),
    default_currency: Optional[str] = Form(None),
    force: bool = False,  # query param to override lock
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update mutable settings.  Folder paths are persisted in DB."""

    # ---------- Folder paths (DB-stored) --------------------------------------
    if inbox_path or storage_root:
        res = await db.execute(text("SELECT inbox_path, storage_root, locked FROM settings WHERE id = 1 FOR UPDATE"))
        row = res.mappings().first()
        if not row:
            raise HTTPException(status_code=500, detail="Settings row missing")

        if row["locked"] and not force:
            raise HTTPException(status_code=409, detail="Settings are locked – supply force=true to override")

        update_cols = {}
        if inbox_path:
            update_cols["inbox_path"] = inbox_path
        if storage_root:
            update_cols["storage_root"] = storage_root

        if update_cols:
            set_expr = ", ".join(f"{k} = :{k}" for k in update_cols.keys())
            update_cols["id"] = 1
            await db.execute(text(f"UPDATE settings SET {set_expr}, updated_at = NOW() WHERE id = :id"), update_cols)
            await db.commit()

            # Runtime update so that new uploads / watcher pick the new path; it
            # will take effect after a hot-reload (watcher reload API TBD)
            if inbox_path:
                settings.WATCH_FOLDER = inbox_path
                reload_watcher(inbox_path)

    # ---------- Classic env-derived settings ---------------------------------
    if watch_folder:
        settings.WATCH_FOLDER = watch_folder
    if llm_model:
        settings.LLM_MODEL = llm_model
    if notification_enabled is not None:
        settings.NOTIFICATION_ENABLED = notification_enabled
    if auto_ocr is not None:
        settings.AUTO_OCR = auto_ocr
    if auto_tagging is not None:
        settings.AUTO_TAGGING = auto_tagging
    if default_currency:
        settings.DEFAULT_CURRENCY = default_currency

    return await get_settings(db=db, current_user=current_user)

# ---------------------------------------------------------------------------
#  Storage root migration task & status endpoint
# ---------------------------------------------------------------------------

_migration_state: dict[str, str | None] = {"state": "idle", "detail": None}


async def _copy_tree(src: str, dst: str):
    """Recursive copy preserving metadata, similar to rsync -a."""
    import shutil, os

    for root, dirs, files in os.walk(src):
        rel = os.path.relpath(root, src)
        target_dir = os.path.join(dst, rel) if rel != "." else dst
        os.makedirs(target_dir, exist_ok=True)
        for d in dirs:
            os.makedirs(os.path.join(target_dir, d), exist_ok=True)
        for f in files:
            shutil.copy2(os.path.join(root, f), os.path.join(target_dir, f))


@app.post("/api/settings/migrate-storage")
async def migrate_storage(
    new_root: str = Form(...),
    force: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Async migration of storage_root to *new_root*.

    Copies Archive & year subfolders, then updates settings row and deletes the
    old root (if successful).  Returns immediately; UI can poll status.
    """

    if _migration_state.get("state") == "running":
        raise HTTPException(status_code=409, detail="Migration already in progress")

    # Read current settings
    res = await db.execute(text("SELECT storage_root, locked FROM settings WHERE id = 1"))
    row = res.mappings().first()
    if not row:
        raise HTTPException(status_code=500, detail="Settings row missing")

    current_root = str(row["storage_root"])
    if row["locked"] and not force:
        raise HTTPException(status_code=409, detail="Settings locked – supply force=true")

    if os.path.abspath(new_root) == os.path.abspath(current_root):
        raise HTTPException(status_code=400, detail="New root is identical to current")

    # Fire background task ----------------------------------------------------

    async def _run_migration(old_root: str, dest_root: str):
        import shutil, traceback

        try:
            _migration_state.update({"state": "running", "detail": None})

            # Ensure destination exists
            os.makedirs(dest_root, exist_ok=True)

            subdirs = [
                "Archive",
                str(datetime.utcnow().year),
                str(datetime.utcnow().year - 1),
                str(datetime.utcnow().year - 2),
            ]

            for sd in subdirs:
                src_sd = os.path.join(old_root, sd)
                dst_sd = os.path.join(dest_root, sd)
                if os.path.exists(src_sd):
                    await asyncio.to_thread(_copy_tree, src_sd, dst_sd)

            # Update DB
            await db.execute(
                text("UPDATE settings SET storage_root = :sr, updated_at = NOW() WHERE id = 1"),
                {"sr": dest_root},
            )
            await db.commit()

            # Delete old root (optional, keep Archive?)
            try:
                shutil.rmtree(old_root)
            except Exception:
                pass

            _migration_state.update({"state": "completed", "detail": None})
        except Exception as exc:
            _migration_state.update({"state": "error", "detail": str(exc)})
            traceback.print_exc()

    asyncio.create_task(_run_migration(current_root, new_root))

    return {"status": "started"}


@app.get("/api/settings/migration-status")
async def migration_status(current_user: User = Depends(get_current_user)):
    """Return current migration progress state."""
    return _migration_state

# ---------------------------------------------------------------------------
# LLM Configuration API endpoints
# ---------------------------------------------------------------------------

@app.get("/api/llm/config")
async def get_llm_config(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current LLM configuration."""
    config = await llm_config_repository.get_config(db)
    if not config:
        # Create default config if none exists
        config = await llm_config_repository.create_default_config(db)
        await db.commit()
    return {"config": config}

@app.put("/api/llm/config")
async def update_llm_config(
    provider: Optional[str] = Form(None),
    api_key: Optional[str] = Form(None),
    api_url: Optional[str] = Form(None),
    model_tagger: Optional[str] = Form(None),
    model_enricher: Optional[str] = Form(None),
    model_analytics: Optional[str] = Form(None),
    model_responder: Optional[str] = Form(None),
    enabled: Optional[bool] = Form(None),
    auto_tagging: Optional[bool] = Form(None),
    auto_enrichment: Optional[bool] = Form(None),
    external_enrichment: Optional[bool] = Form(None),
    max_retries: Optional[int] = Form(None),
    retry_delay: Optional[int] = Form(None),
    backup_provider: Optional[str] = Form(None),
    backup_model: Optional[str] = Form(None),
    batch_size: Optional[int] = Form(None),
    concurrent_tasks: Optional[int] = Form(None),
    cache_responses: Optional[bool] = Form(None),
    min_confidence_tagging: Optional[float] = Form(None),
    min_confidence_entity: Optional[float] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update LLM configuration."""
    # Only include non-None values in the update
    update_data = {}
    for key, value in {
        "provider": provider,
        "api_key": api_key,
        "api_url": api_url,
        "model_tagger": model_tagger,
        "model_enricher": model_enricher,
        "model_analytics": model_analytics,
        "model_responder": model_responder,
        "enabled": enabled,
        "auto_tagging": auto_tagging,
        "auto_enrichment": auto_enrichment,
        "external_enrichment": external_enrichment,
        "max_retries": max_retries,
        "retry_delay": retry_delay,
        "backup_provider": backup_provider,
        "backup_model": backup_model,
        "batch_size": batch_size,
        "concurrent_tasks": concurrent_tasks,
        "cache_responses": cache_responses,
        "min_confidence_tagging": min_confidence_tagging,
        "min_confidence_entity": min_confidence_entity,
    }.items():
        if value is not None:
            update_data[key] = value
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields provided for update")
    
    config = await llm_config_repository.update_config(db, **update_data)
    await db.commit()
    
    return {"message": "LLM configuration updated successfully", "config": config}

@app.post("/api/llm/test-connection")
async def test_llm_connection(
    provider: str = Form(...),
    api_url: Optional[str] = Form(None),
    api_key: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Test LLM provider connection."""
    result = await llm_config_repository.test_connection(db, provider, api_url, api_key)
    return result

# Serve static files (directory relative to project root)
STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir, "static"))
# Ensure directory exists; if not, create an empty one so Starlette does not raise
os.makedirs(STATIC_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory=STATIC_DIR, check_dir=False), name="static")

# Default route
@app.get("/")
async def root():
    return {"message": "Document Management System API"}

@app.get("/api/documents/{document_id}/file")
async def download_document_file(
    document_id: int,
    api_key: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Return the raw file (PDF/image) for a document.

    For browser-embedded previews we cannot easily add custom headers, so we
    also accept `?api_key=...` as a query parameter in development mode.
    """

    # If user not authenticated via token, try API-key query param
    if current_user is None:
        from app.auth import api_keys

        if not api_key or api_key not in api_keys:
            raise HTTPException(status_code=401, detail="Could not validate credentials")

    """Return the raw file (PDF/image) for a document."""
    document = await document_repository.get_by_id(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    path = document.file_path
    if not os.path.exists(path):
        # Fallback: historical records may still reference /inbox/ after they
        # have been moved to /archive/.  If so, try to derive the archive
        # path by replacing the prefix.
        inbox_prefix = os.getenv("WATCH_FOLDER", "/inbox")
        archive_prefix = os.getenv("ARCHIVE_FOLDER", "/archive")
        if path.startswith(inbox_prefix):
            alt_path = archive_prefix + path[len(inbox_prefix):]
            if os.path.exists(alt_path):
                path = alt_path
            else:
                raise HTTPException(status_code=404, detail="File not found on disk")
        else:
            raise HTTPException(status_code=404, detail="File not found on disk")

    filename = os.path.basename(path)
    return FileResponse(
        path,
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f"inline; filename={filename}"},
    )

# ---------------------------------------------------------------------------
# Admin-only dependency
# ---------------------------------------------------------------------------

from fastapi import Security  # at top already? we have depends; Security not used else; but easier: just use Depends

def admin_required(current_user: User = Depends(get_current_user)) -> User:
    """Raise 403 if the caller is not an admin."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user

# ---------------- User Management Routes (admin only) ----------------

from app.auth import get_password_hash

@app.get("/api/users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    current: User | None = Depends(get_current_user_optional),
):
    # Allow unauthenticated access if there are zero users (first-run setup)
    res = await db.execute(select(func.count(User.id)))
    if res.scalar() == 0:
        return []

    # Otherwise require admin
    if current is None or current.role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")

    return await user_repository.get_all(db)

@app.post("/api/users")
async def create_user(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    full_name: Optional[str] = Form(None),
    role: str = Form("viewer"),
    disabled: bool = Form(False),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(admin_required),
):
    # Check duplicates
    existing = await user_repository.get_all(db)
    if any(u["username"] == username for u in existing):
        raise HTTPException(status_code=400, detail="Username already exists")
    if any(u["email"] == email for u in existing):
        raise HTTPException(status_code=400, detail="Email already exists")

    data = {
        "username": username,
        "email": email,
        "full_name": full_name,
        "role": role,
        "hashed_password": get_password_hash(password),
        "disabled": disabled,
    }
    return await user_repository.create(db, **data)

@app.put("/api/users/{user_id}")
async def update_user(
    user_id: int,
    username: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    full_name: Optional[str] = Form(None),
    role: Optional[str] = Form(None),
    disabled: Optional[bool] = Form(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(admin_required),
):
    data = {}
    if username is not None:
        data["username"] = username
    if email is not None:
        data["email"] = email
    if full_name is not None:
        data["full_name"] = full_name
    if role is not None:
        data["role"] = role
    if disabled is not None:
        data["disabled"] = disabled

    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")

    updated = await user_repository.update(db, user_id, **data)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated

@app.delete("/api/users/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(admin_required),
):
    success = await user_repository.delete(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    await db.commit()
    return {"message": "Deleted"}

@app.post("/api/users/{user_id}/reset-password")
async def reset_password(
    user_id: int,
    new_password: str = Form(...),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(admin_required),
):
    hashed = get_password_hash(new_password)
    updated = await user_repository.update(db, user_id, hashed_password=hashed)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    await db.commit()
    return {"message": "Password reset"}

# Helper to ensure directories exist ------------------------------------------------


def _ensure_dir(path: str):
    """Create directory recursively if it does not exist."""
    try:
        os.makedirs(path, exist_ok=True)
    except Exception as exc:  # pragma: no cover
        raise exc


# ---------------------------------------------------------------------------
#  Validate folders endpoint (creates sub-folders, checks permissions)
# ---------------------------------------------------------------------------


@app.post("/api/settings/validate-folders")
async def validate_folders(
    inbox_path: str = Form(...),
    storage_root: str = Form(...),
    current_user: User = Depends(get_current_user),
):
    """Verify read/write access for proposed paths (creates sub-dirs if missing)."""

    def _check(path: str, create: bool = False) -> dict[str, str]:
        try:
            if create:
                _ensure_dir(path)
            elif not os.path.exists(path):
                return {"status": "missing"}

            # R/W test
            import uuid, pathlib
            tmp = pathlib.Path(path) / f".tmp_{uuid.uuid4().hex}"
            with open(tmp, "w") as f:
                f.write("test")
            tmp.unlink()
            return {"status": "ok"}
        except Exception as exc:
            return {"status": "error", "detail": str(exc)}

    inbox_res = _check(inbox_path, create=True)

    storage_res = _check(storage_root, create=True)
    subs = ["Archive", str(datetime.utcnow().year), str(datetime.utcnow().year - 1), str(datetime.utcnow().year - 2)]
    sub_status: dict[str, dict[str, str]] = {}
    for sd in subs:
        sub_status[sd] = _check(os.path.join(storage_root, sd), create=True)

    return {"inbox_path": inbox_res, "storage_root": storage_res, "subfolders": sub_status}

# ---------------------------------------------------------------------------
# Health probe (public)
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health(db: AsyncSession = Depends(get_db)):
    """Health check endpoint."""
    try:
        # Test database connection
        result = await db.execute(text("SELECT 1"))
        db_status = "healthy" if result else "unhealthy"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "unhealthy"

    # Test LLM service
    try:
        llm_status = "healthy" if await llm_service.is_configured() else "not_configured"
    except Exception as e:
        logger.error(f"LLM health check failed: {e}")
        llm_status = "unhealthy"

    # Test folder watcher
    watcher_status = "healthy" if hasattr(app.state, 'folder_watcher') and app.state.folder_watcher else "not_running"

    return {
        "status": "healthy",
        "database": db_status,
        "llm": llm_status,
        "watcher": watcher_status,
        "timestamp": datetime.now().isoformat(),
    }

@app.get("/api/version")
async def get_version():
    """Get current application version."""
    from app.version import get_version, get_release_info
    return {
        "version": get_version(),
        "release": get_release_info()
    }

@app.get("/api/version/history")
async def get_version_history():
    """Get complete version history."""
    from app.version import get_version_history
    return {
        "history": get_version_history()
    }

@app.get("/api/version/features")
async def get_latest_features():
    """Get features from the latest release."""
    from app.version import get_latest_features
    return {
        "features": get_latest_features()
    }

# ---------------------------------------------------------------------------
# Keep CLI entry-point for local dev ------------------------------------------------
# ---------------------------------------------------------------------------


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

# ---------------------------------------------------------------------------
#  Onboarding API
# ---------------------------------------------------------------------------

@app.post("/api/onboarding/accept-tos")
async def accept_tos(db: AsyncSession = Depends(get_db)):
    ts = await OnboardingService(db).accept_tos()
    return {"accepted_at": ts.isoformat()}

@app.get("/api/onboarding/status")
async def onboarding_status(db: AsyncSession = Depends(get_db)):
    accepted = await OnboardingService(db).tos_accepted()
    return {"tosAccepted": accepted}

# ---------------------------------------------------------------------------
#  Entity CRUD
# ---------------------------------------------------------------------------

@app.get("/api/entities")
async def list_entities(db: AsyncSession = Depends(get_db)):
    ents = await EntityService(db).list()
    return ents

@app.post("/api/entities")
async def create_entity(payload: dict, db: AsyncSession = Depends(get_db)):
    ent = await EntityService(db).create(**payload)
    return ent

@app.put("/api/entities/{entity_id}")
async def update_entity(entity_id: int, payload: dict, db: AsyncSession = Depends(get_db)):
    ent = await EntityService(db).update(entity_id, **payload)
    if not ent:
        raise HTTPException(status_code=404, detail="Entity not found")
    return ent

# ---------------------------------------------------------------------------
#  TOS enforcement middleware
# ---------------------------------------------------------------------------

@app.middleware("http")
async def tos_guard(request: Request, call_next):
    # Skip static/docs endpoints, health, onboarding endpoints until accepted
    if request.url.path.startswith("/api/") and not request.url.path.startswith("/api/onboarding"):
        from sqlalchemy.ext.asyncio import AsyncSession
        from app.database import engine as _eng
        async with AsyncSession(_eng) as db:
            svc = OnboardingService(db)
            if not await svc.tos_accepted():
                return JSONResponse(status_code=451, content={"detail": "TOS not accepted"})
    return await call_next(request)

@app.post("/api/auth/register")
async def register(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    """Initial admin account creation. Allowed only if no users exist."""

    res = await db.execute(select(func.count(User.id)))
    if (cnt := res.scalar()) and cnt > 0:
        raise HTTPException(status_code=409, detail="Users already exist – registration disabled")

    from app.auth import get_password_hash

    user = User(
        username=username,
        email=email,
        full_name=username,
        role="admin",
        hashed_password=get_password_hash(password),
        disabled=False,
    )
    db.add(user)
    await db.commit()
    return {"created": True}

# ---------------------------------------------------------------------------
# Tenant Management API endpoints
# ---------------------------------------------------------------------------

@app.get("/api/tenants")
async def get_user_tenants(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all tenants for the current user."""
    tenants = await tenant_repository.get_user_tenants(db, current_user.id)
    return {"tenants": tenants}

@app.get("/api/tenants/default")
async def get_default_tenant(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the default tenant for the current user."""
    tenant = await tenant_repository.get_default_tenant(db, current_user.id)
    if not tenant:
        raise HTTPException(status_code=404, detail="No default tenant found")
    return {"tenant": tenant}

@app.get("/api/tenants/{tenant_id}")
async def get_tenant(
    tenant_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific tenant by ID."""
    tenant = await tenant_repository.get_tenant_by_id(db, current_user.id, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return {"tenant": tenant}

@app.post("/api/tenants")
async def create_tenant(
    name: str = Form(...),
    alias: str = Form(...),
    type: str = Form("company"),
    street: Optional[str] = Form(None),
    house_number: Optional[str] = Form(None),
    apartment: Optional[str] = Form(None),
    area_code: Optional[str] = Form(None),
    county: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    iban: Optional[str] = Form(None),
    vat_id: Optional[str] = Form(None),
    is_default: bool = Form(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new tenant for the current user."""
    tenant_data = {
        "name": name,
        "alias": alias,
        "type": type,
        "street": street,
        "house_number": house_number,
        "apartment": apartment,
        "area_code": area_code,
        "county": county,
        "country": country,
        "iban": iban,
        "vat_id": vat_id,
        "is_default": is_default,
        "is_active": True
    }
    
    # Remove None values
    tenant_data = {k: v for k, v in tenant_data.items() if v is not None}
    
    tenant = await tenant_repository.create_tenant(db, current_user.id, **tenant_data)
    await db.commit()
    return {"tenant": tenant}

@app.put("/api/tenants/{tenant_id}")
async def update_tenant(
    tenant_id: int,
    name: Optional[str] = Form(None),
    alias: Optional[str] = Form(None),
    type: Optional[str] = Form(None),
    street: Optional[str] = Form(None),
    house_number: Optional[str] = Form(None),
    apartment: Optional[str] = Form(None),
    area_code: Optional[str] = Form(None),
    county: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    iban: Optional[str] = Form(None),
    vat_id: Optional[str] = Form(None),
    is_default: Optional[bool] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a tenant for the current user."""
    update_data = {}
    
    # Build update data dictionary
    if name is not None:
        update_data["name"] = name
    if alias is not None:
        update_data["alias"] = alias
    if type is not None:
        update_data["type"] = type
    if street is not None:
        update_data["street"] = street
    if house_number is not None:
        update_data["house_number"] = house_number
    if apartment is not None:
        update_data["apartment"] = apartment
    if area_code is not None:
        update_data["area_code"] = area_code
    if county is not None:
        update_data["county"] = county
    if country is not None:
        update_data["country"] = country
    if iban is not None:
        update_data["iban"] = iban
    if vat_id is not None:
        update_data["vat_id"] = vat_id
    if is_default is not None:
        update_data["is_default"] = is_default
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    tenant = await tenant_repository.update_tenant(db, current_user.id, tenant_id, **update_data)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    await db.commit()
    return {"tenant": tenant}

@app.delete("/api/tenants/{tenant_id}")
async def delete_tenant(
    tenant_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete (deactivate) a tenant."""
    success = await tenant_repository.delete_tenant(db, current_user.id, tenant_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    await db.commit()
    return {"message": "Tenant deleted successfully"}

@app.post("/api/tenants/{tenant_id}/set-default")
async def set_default_tenant(
    tenant_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Set a tenant as the default for the current user."""
    success = await tenant_repository.set_default_tenant(db, current_user.id, tenant_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    await db.commit()
    return {"message": "Default tenant updated successfully"}

@app.post("/api/tenants/clear-default")
async def clear_default_tenant(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Clear the default tenant for the current user."""
    await tenant_repository.clear_default_tenant(db, current_user.id)
    await db.commit()
    return {"message": "Default tenant cleared successfully"}

@app.post("/api/tenants/cleanup-vendors")
async def cleanup_vendor_tenants(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove vendor companies that were incorrectly created as tenants."""
    try:
        # Known vendor companies that should NOT be tenants
        vendor_names = [
            "Hetzner Online GmbH", "Hetzner",
            "Team Blockonauts", "Blockonauts", 
            "Impact Labs", "21 Impact Labs AG",
            "Chainstack Pte.", "Chainstack",
            "GitBook", "GitBook (Company)",
            "Digital Ocean", "DigitalOcean",
            "Candoo Labs", "Candoo Labs (Company)",
            "Validity Labs", "Validity Labs (Company)",
            "DAT AG", "DAT AG (Company)"
        ]
        
        # Find entities (tenants) with vendor names
        from sqlalchemy import or_
        vendor_conditions = [Entity.name.ilike(f"%{name}%") for name in vendor_names]
        vendor_conditions.extend([Entity.alias.ilike(f"%{name}%") for name in vendor_names])
        
        result = await db.execute(
            select(Entity).where(or_(*vendor_conditions))
        )
        vendor_tenants = result.scalars().all()
        
        if not vendor_tenants:
            return {
                "status": "success",
                "message": "No vendor companies found in tenant list - all clean!",
                "removed": 0,
                "documents_reset": 0
            }
        
        # Check which documents are using these vendor tenants as recipients
        affected_docs = []
        for tenant in vendor_tenants:
            docs_result = await db.execute(
                select(Document).where(Document.recipient == tenant.alias)
            )
            docs = docs_result.scalars().all()
            if docs:
                affected_docs.extend([(doc, tenant) for doc in docs])
        
        # Reset recipient field for affected documents
        for doc, tenant in affected_docs:
            doc.recipient = None  # Reset to allow re-processing
        
        # Remove vendor tenant entities - handle foreign key constraints
        for tenant in vendor_tenants:
            # First, remove any user_entities relationships 
            await db.execute(
                text("DELETE FROM user_entities WHERE entity_id = :entity_id"),
                {"entity_id": tenant.id}
            )
            # Then delete the entity itself
            await db.delete(tenant)
        
        # Commit changes
        await db.commit()
        
        return {
            "status": "success",
            "message": f"Cleanup completed: removed {len(vendor_tenants)} vendor tenants, reset {len(affected_docs)} documents",
            "removed": len(vendor_tenants),
            "documents_reset": len(affected_docs),
            "vendor_tenants": [{"id": t.id, "name": t.name, "alias": t.alias} for t in vendor_tenants]
        }
        
    except Exception as e:
        logger.error(f"Error cleaning up vendor tenants: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")

@app.post("/api/admin/cleanup-dates")
async def cleanup_date_formats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Clean up date formats in the database, converting all to ISO format."""
    from sqlalchemy import text
    
    # Get all documents with non-null dates
    result = await db.execute(
        text("SELECT id, document_date, due_date FROM documents WHERE document_date IS NOT NULL OR due_date IS NOT NULL")
    )
    documents = result.fetchall()
    
    converted_count = 0
    errors = []
    
    for doc_id, doc_date, due_date in documents:
        try:
            # Check and convert document_date
            if doc_date:
                converted_doc_date = _validate_and_convert_date_global(str(doc_date))
                if converted_doc_date != str(doc_date):
                    await db.execute(
                        text("UPDATE documents SET document_date = :new_date WHERE id = :doc_id"),
                        {"new_date": converted_doc_date, "doc_id": doc_id}
                    )
                    converted_count += 1
                    logger.info(f"Updated document {doc_id} document_date: {doc_date} -> {converted_doc_date}")
            
            # Check and convert due_date
            if due_date:
                converted_due_date = _validate_and_convert_date_global(str(due_date))
                if converted_due_date != str(due_date):
                    await db.execute(
                        text("UPDATE documents SET due_date = :new_date WHERE id = :doc_id"),
                        {"new_date": converted_due_date, "doc_id": doc_id}
                    )
                    converted_count += 1
                    logger.info(f"Updated document {doc_id} due_date: {due_date} -> {converted_due_date}")
        
        except Exception as e:
            error_msg = f"Failed to convert dates for document {doc_id}: {str(e)}"
            errors.append(error_msg)
            logger.error(error_msg)
    
    await db.commit()
    
    return {
        "status": "success",
        "converted_count": converted_count,
        "total_documents": len(documents),
        "errors": errors
    }

@app.get("/api/processing/status")
async def get_processing_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current processing queue status for dashboard display."""
    
    # Get current processing documents
    processing_result = await db.execute(
        select(Document).filter(Document.status == 'processing').order_by(Document.created_at.desc())
    )
    processing_docs = processing_result.scalars().all()
    
    # Get recent failed documents (last 10)
    failed_result = await db.execute(
        select(Document).filter(Document.status == 'failed').order_by(Document.updated_at.desc()).limit(10)
    )
    failed_docs = failed_result.scalars().all()
    
    # Get recent successful documents (last 10)
    success_result = await db.execute(
        select(Document).filter(Document.status == 'processed').order_by(Document.updated_at.desc()).limit(10)
    )
    success_docs = success_result.scalars().all()
    
    # Check if folder watcher is active (simple heuristic - any recent activity)
    from datetime import datetime, timedelta
    recent_threshold = datetime.utcnow() - timedelta(minutes=5)
    
    recent_activity_result = await db.execute(
        select(func.count(Document.id)).filter(Document.created_at >= recent_threshold)
    )
    recent_activity_count = recent_activity_result.scalar() or 0
    
    return {
        "processing": {
            "count": len(processing_docs),
            "documents": [
                {
                    "id": doc.id,
                    "title": doc.title or "Processing...",
                    "filename": os.path.basename(doc.file_path) if doc.file_path else "unknown",
                    "created_at": doc.created_at.isoformat() if doc.created_at else None,
                    "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
                }
                for doc in processing_docs
            ]
        },
        "recent_failed": {
            "count": len(failed_docs),
            "documents": [
                {
                    "id": doc.id,
                    "title": doc.title or "Failed Document",
                    "filename": os.path.basename(doc.file_path) if doc.file_path else "unknown",
                    "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
                }
                for doc in failed_docs
            ]
        },
        "recent_success": {
            "count": len(success_docs),
            "documents": [
                {
                    "id": doc.id,
                    "title": doc.title or "Document",
                    "filename": os.path.basename(doc.file_path) if doc.file_path else "unknown",
                    "updated_at": doc.updated_at.isoformat() if doc.updated_at else None,
                }
                for doc in success_docs
            ]
        },
        "watcher_active": recent_activity_count > 0,
        "stats": {
            "recent_activity_count": recent_activity_count,
            "processing_count": len(processing_docs),
            "failed_count": len(failed_docs),
        }
    }

# ---------------------------------------------------------------------------
# Processing Rules API Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/processing/rules")
async def get_processing_rules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all processing rules."""
    from app.repository import ProcessingRuleRepository
    
    rule_repo = ProcessingRuleRepository()
    rules = await rule_repo.get_all(db)
    
    return {
        "status": "success",
        "rules": rules
    }

@app.get("/api/processing/rules/{rule_id}")
async def get_processing_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific processing rule by ID."""
    from app.repository import ProcessingRuleRepository
    
    rule_repo = ProcessingRuleRepository()
    rule = await rule_repo.get_by_id(db, rule_id)
    
    if not rule:
        raise HTTPException(status_code=404, detail="Processing rule not found")
    
    return {
        "status": "success",
        "rule": rule
    }

@app.post("/api/processing/rules")
async def create_processing_rule(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    vendor: Optional[str] = Form(None),
    preferred_tenant_id: Optional[int] = Form(None),
    conditions: str = Form(...),  # JSON string
    actions: str = Form(...),     # JSON string
    priority: int = Form(0),
    enabled: bool = Form(True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new processing rule."""
    from app.repository import ProcessingRuleRepository
    import json
    
    try:
        # Validate JSON strings
        conditions_data = json.loads(conditions)
        actions_data = json.loads(actions)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON format: {str(e)}")
    
    rule_repo = ProcessingRuleRepository()
    
    rule_data = {
        "name": name,
        "description": description,
        "vendor": vendor,
        "preferred_tenant_id": preferred_tenant_id,
        "conditions": conditions_data,
        "actions": actions_data,
        "priority": priority,
        "enabled": enabled,
    }
    
    try:
        rule = await rule_repo.create(db, **rule_data)
        await db.commit()
        
        return {
            "status": "success",
            "message": "Processing rule created successfully",
            "rule": rule
        }
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating processing rule: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create processing rule: {str(e)}")

@app.put("/api/processing/rules/{rule_id}")
async def update_processing_rule(
    rule_id: int,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    vendor: Optional[str] = Form(None),
    preferred_tenant_id: Optional[int] = Form(None),
    conditions: Optional[str] = Form(None),  # JSON string
    actions: Optional[str] = Form(None),     # JSON string
    priority: Optional[int] = Form(None),
    enabled: Optional[bool] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing processing rule."""
    from app.repository import ProcessingRuleRepository
    import json
    
    rule_repo = ProcessingRuleRepository()
    
    # Check if rule exists
    existing_rule = await rule_repo.get_by_id(db, rule_id)
    if not existing_rule:
        raise HTTPException(status_code=404, detail="Processing rule not found")
    
    # Prepare update data
    update_data = {}
    
    if name is not None:
        update_data["name"] = name
    if description is not None:
        update_data["description"] = description
    if vendor is not None:
        update_data["vendor"] = vendor
    if preferred_tenant_id is not None:
        update_data["preferred_tenant_id"] = preferred_tenant_id
    if priority is not None:
        update_data["priority"] = priority
    if enabled is not None:
        update_data["enabled"] = enabled
    
    # Validate and parse JSON strings
    if conditions is not None:
        try:
            update_data["conditions"] = json.loads(conditions)
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=400, detail=f"Invalid conditions JSON: {str(e)}")
    
    if actions is not None:
        try:
            update_data["actions"] = json.loads(actions)
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=400, detail=f"Invalid actions JSON: {str(e)}")
    
    try:
        rule = await rule_repo.update(db, rule_id, **update_data)
        await db.commit()
        
        return {
            "status": "success",
            "message": "Processing rule updated successfully",
            "rule": rule
        }
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating processing rule {rule_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update processing rule: {str(e)}")

@app.delete("/api/processing/rules/{rule_id}")
async def delete_processing_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a processing rule."""
    from app.repository import ProcessingRuleRepository
    
    rule_repo = ProcessingRuleRepository()
    
    # Check if rule exists
    existing_rule = await rule_repo.get_by_id(db, rule_id)
    if not existing_rule:
        raise HTTPException(status_code=404, detail="Processing rule not found")
    
    try:
        success = await rule_repo.delete(db, rule_id)
        if success:
            await db.commit()
            return {
                "status": "success",
                "message": "Processing rule deleted successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to delete processing rule")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting processing rule {rule_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete processing rule: {str(e)}")

@app.post("/api/processing/rules/{rule_id}/test")
async def test_processing_rule(
    rule_id: int,
    document_id: int = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Test a processing rule against a specific document."""
    from app.repository import ProcessingRuleRepository, DocumentRepository
    from app.rule_engine import RuleEvaluator
    
    rule_repo = ProcessingRuleRepository()
    doc_repo = DocumentRepository()
    
    # Get rule and document
    rule = await rule_repo.get_by_id(db, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Processing rule not found")
    
    document = await doc_repo.get_by_id(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        evaluator = RuleEvaluator()
        
        # Test if rule matches document
        matches = await evaluator._evaluate_rule(document, rule)
        
        return {
            "status": "success",
            "rule_id": rule_id,
            "document_id": document_id,
            "matches": matches,
            "rule_name": rule["name"],
            "document_title": document.title,
            "actions": rule["actions"] if matches else []
        }
    except Exception as e:
        logger.error(f"Error testing processing rule {rule_id} against document {document_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to test processing rule: {str(e)}")

@app.post("/api/processing/rules/process-document")
async def process_document_with_rules(
    document_id: int = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Process a document through all enabled processing rules."""
    from app.repository import DocumentRepository
    from app.rule_engine import DocumentRuleProcessor
    
    doc_repo = DocumentRepository()
    
    # Get document
    document = await doc_repo.get_by_id(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        processor = DocumentRuleProcessor()
        result = await processor.process_document(db, document)
        
        return {
            "status": "success",
            "message": "Document processed through rule engine",
            "result": result
        }
    except Exception as e:
        logger.error(f"Error processing document {document_id} through rule engine: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")
