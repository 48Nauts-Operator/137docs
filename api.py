"""
API routes for the Document Management System.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.repository import DocumentRepository
from app.ocr import OCRProcessor
from app.llm import LLMProcessor
import os
import shutil
from app.config import settings
from pydantic import BaseModel
from datetime import date

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Models for API requests and responses
class DocumentBase(BaseModel):
    title: Optional[str] = None
    sender: Optional[str] = None
    document_date: Optional[date] = None
    due_date: Optional[date] = None
    amount: Optional[float] = None
    document_type: Optional[str] = None
    status: Optional[str] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: int
    filename: str
    content_text: Optional[str] = None
    created_at: date
    updated_at: date

    class Config:
        orm_mode = True

class TagCreate(BaseModel):
    name: str
    color: Optional[str] = "#cccccc"

class TagResponse(TagCreate):
    id: int

    class Config:
        orm_mode = True

class TaskCreate(BaseModel):
    description: str
    due_date: Optional[date] = None

class TaskResponse(TaskCreate):
    id: int
    status: str

    class Config:
        orm_mode = True

# Routes
@router.get("/documents", response_model=List[DocumentResponse])
def get_documents(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    document_type: Optional[str] = None,
    status: Optional[str] = None,
    tag_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get a list of documents with optional filtering."""
    repo = DocumentRepository(db)
    documents = repo.get_documents(
        limit=limit,
        offset=offset,
        document_type=document_type,
        status=status,
        tag_id=tag_id
    )
    return documents

@router.get("/documents/{document_id}", response_model=DocumentResponse)
def get_document(document_id: int, db: Session = Depends(get_db)):
    """Get a document by ID."""
    repo = DocumentRepository(db)
    document = repo.get_document(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.post("/documents", response_model=DocumentResponse)
def create_document(document: DocumentCreate, db: Session = Depends(get_db)):
    """Create a new document manually."""
    repo = DocumentRepository(db)
    document_data = document.dict()
    created_document = repo.create_document(document_data)
    return created_document

@router.put("/documents/{document_id}", response_model=DocumentResponse)
def update_document(document_id: int, document: DocumentUpdate, db: Session = Depends(get_db)):
    """Update a document."""
    repo = DocumentRepository(db)
    document_data = document.dict(exclude_unset=True)
    updated_document = repo.update_document(document_id, document_data)
    if not updated_document:
        raise HTTPException(status_code=404, detail="Document not found")
    return updated_document

@router.delete("/documents/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    """Delete a document."""
    repo = DocumentRepository(db)
    success = repo.delete_document(document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted successfully"}

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a document for processing."""
    # Check file extension
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower().lstrip(".")
    if ext not in settings.ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed types: {', '.join(settings.ALLOWED_FILE_TYPES)}"
        )
    
    # Save file to inbox folder
    file_path = os.path.join(settings.INBOX_FOLDER, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Process document
    ocr_processor = OCRProcessor()
    document_data = ocr_processor.process_document(file_path)
    
    # Save to database
    repo = DocumentRepository(db)
    document = repo.create_document(document_data)
    
    return {"message": "Document uploaded and processed successfully", "document_id": document.id}

@router.post("/documents/{document_id}/tags", response_model=TagResponse)
def add_tag(document_id: int, tag: TagCreate, db: Session = Depends(get_db)):
    """Add a tag to a document."""
    repo = DocumentRepository(db)
    created_tag = repo.add_tag_to_document(document_id, tag.name, tag.color)
    if not created_tag:
        raise HTTPException(status_code=404, detail="Document not found")
    return created_tag

@router.delete("/documents/{document_id}/tags/{tag_id}")
def remove_tag(document_id: int, tag_id: int, db: Session = Depends(get_db)):
    """Remove a tag from a document."""
    repo = DocumentRepository(db)
    success = repo.remove_tag_from_document(document_id, tag_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document or tag not found")
    return {"message": "Tag removed successfully"}

@router.post("/documents/{document_id}/tasks", response_model=TaskResponse)
def create_task(document_id: int, task: TaskCreate, db: Session = Depends(get_db)):
    """Create a task for a document."""
    repo = DocumentRepository(db)
    created_task = repo.create_task(document_id, task.description, task.due_date)
    if not created_task:
        raise HTTPException(status_code=404, detail="Document not found")
    return created_task
