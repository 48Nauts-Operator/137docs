"""
Main application module for the Document Management System.
"""
import logging
import asyncio
import uvicorn
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import get_db, engine
from app.models import Base
from app.api import router as api_router
from app.watcher import DocumentWatcher
from app.ocr import OCRProcessor
from app.repository import DocumentRepository
from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Local Document Management System with OCR and LLM integration"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api")

# Document watcher instance
document_watcher = None

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    logger.info("Starting Document Management System")
    
    # Create database tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created")
    
    # Initialize document watcher
    global document_watcher
    document_watcher = DocumentWatcher(process_document)
    document_watcher.start()
    logger.info("Document watcher started")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    logger.info("Shutting down Document Management System")
    
    # Stop document watcher
    global document_watcher
    if document_watcher:
        document_watcher.stop()
        logger.info("Document watcher stopped")

def process_document(file_path: str):
    """Process a document file.
    
    Args:
        file_path: Path to the document file
    """
    try:
        # Create database session
        db = next(get_db())
        
        # Process document with OCR
        ocr_processor = OCRProcessor()
        document_data = ocr_processor.process_document(file_path)
        
        # Save to database
        repo = DocumentRepository(db)
        document = repo.create_document(document_data)
        
        logger.info(f"Document processed and saved: {document.id} - {document.title}")
        
        # Close database session
        db.close()
    except Exception as e:
        logger.error(f"Error processing document {file_path}: {e}")

@app.get("/")
def read_root():
    """Root endpoint."""
    return {
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running"
    }

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
