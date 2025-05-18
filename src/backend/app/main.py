"""
Main application module for the Document Management System.
"""
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Union
from app.database import get_db, engine
from app.models import Base, Document, Tag, User, document_tag as dt, AddressEntry
from app.repository import DocumentRepository
from app.watcher import FolderWatcher
from app.ocr import OCRProcessor
from app.llm import LLMService
from app.auth import get_current_user, create_access_token, authenticate_user, get_current_user_optional
from app.config import settings
from app.notifications import NotificationService
from app.analytics import AnalyticsService
from app.calendar_export import CalendarExportService
from app.search import SearchService
import os
import asyncio
import logging
import re
import hashlib
from sqlalchemy import select, text
import secrets

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

# Initialize services
document_repository = DocumentRepository()
ocr_processor = OCRProcessor()
llm_service = LLMService()
notification_service = NotificationService()

# Create database tables
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

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
    
    # Start folder watcher in background
    asyncio.create_task(start_folder_watcher())

async def start_folder_watcher():
    folder_watcher = FolderWatcher(settings.WATCH_FOLDER, process_new_document)
    await folder_watcher.start_watching()

async def process_new_document(file_path: str):
    """Process a new document detected by the folder watcher."""
    try:
        # Extract text using OCR
        text = await ocr_processor.process_document(file_path)
        
        # Extract metadata using LLM
        metadata = await llm_service.extract_metadata(text)
        
        # Save document to database
        async with AsyncSession(engine) as session:
            async with session.begin():
                # Compute SHA256 hash to detect duplicates
                with open(file_path, "rb") as f:
                    file_hash = hashlib.sha256(f.read()).hexdigest()

                # Skip if a document with same hash already exists
                existing = await session.execute(select(Document).filter(Document.hash == file_hash))
                if existing.scalars().first():
                    logger.info(f"Duplicate document ignored: {file_path}")
                    return

                document = Document(
                    title=metadata.get("title", os.path.basename(file_path)),
                    file_path=file_path,
                    content=text,
                    document_type=metadata.get("document_type", "unknown"),
                    sender=metadata.get("sender", ""),
                    recipient=metadata.get("recipient", ""),
                    document_date=metadata.get("document_date"),
                    due_date=metadata.get("due_date"),
                    amount=_normalize_amount(metadata.get("amount")),
                    currency=metadata.get("currency", "USD"),
                    status=metadata.get("status", "pending"),
                    hash=file_hash,
                )
                
                # Add tags
                if "tags" in metadata and isinstance(metadata["tags"], list):
                    for tag_name in metadata["tags"]:
                        tag = Tag(name=tag_name)
                        document.tags.append(tag)
                
                await document_repository.create(session, document)
                
                # Create notification if due date is present
                if document.due_date:
                    await notification_service.create_due_date_notification(session, document)
                
                logger.info(f"Document processed and saved: {document.title}")
    except Exception as e:
        logger.error(f"Error processing document {file_path}: {str(e)}")

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

# Authentication routes
@app.post("/api/auth/login")
async def login(username: str = Form(...), password: str = Form(...), db: AsyncSession = Depends(get_db)):
    # authenticate_user is synchronous; do not await it
    user = authenticate_user(db, username, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "is_active": current_user.is_active,
    }

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
        search=search
    )
    return documents

@app.get("/api/documents/{document_id}")
async def get_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = await document_repository.get_by_id(db, document_id)
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
        document.document_date = document_date
    if due_date:
        document.due_date = due_date
    if amount is not None:
        document.amount = amount
    if currency:
        document.currency = currency
    if status:
        document.status = status
    
    await document_repository.update(db, document)
    await db.commit()
    return document

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
    address: Union[str, None] = Form(None),
    country: Union[str, None] = Form(None),
    vat_id: Union[str, None] = Form(None),
    tags: Union[str, None] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = AddressEntry(
        name=name,
        entity_type=entity_type,
        email=email,
        phone=phone,
        address=address,
        country=country,
        vat_id=vat_id,
        tags=tags,
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
    address: Union[str, None] = Form(None),
    country: Union[str, None] = Form(None),
    vat_id: Union[str, None] = Form(None),
    tags: Union[str, None] = Form(None),
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
    if address: entry.address = address
    if country: entry.country = country
    if vat_id: entry.vat_id = vat_id
    if tags is not None: entry.tags = tags

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

# Settings routes
@app.get("/api/settings")
async def get_settings(
    current_user: User = Depends(get_current_user),
):
    return {
        "watch_folder": settings.WATCH_FOLDER,
        "llm_model": settings.LLM_MODEL,
        "notification_enabled": settings.NOTIFICATION_ENABLED,
        "auto_ocr": settings.AUTO_OCR,
        "auto_tagging": settings.AUTO_TAGGING,
    }

@app.put("/api/settings")
async def update_settings(
    watch_folder: Optional[str] = Form(None),
    llm_model: Optional[str] = Form(None),
    notification_enabled: Optional[bool] = Form(None),
    auto_ocr: Optional[bool] = Form(None),
    auto_tagging: Optional[bool] = Form(None),
    current_user: User = Depends(get_current_user),
):
    # In a real implementation, these would be saved to a database or config file
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
    
    return {
        "watch_folder": settings.WATCH_FOLDER,
        "llm_model": settings.LLM_MODEL,
        "notification_enabled": settings.NOTIFICATION_ENABLED,
        "auto_ocr": settings.AUTO_OCR,
        "auto_tagging": settings.AUTO_TAGGING,
    }

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

    if not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    filename = os.path.basename(document.file_path)
    return FileResponse(
        document.file_path,
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f"inline; filename={filename}"},
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
