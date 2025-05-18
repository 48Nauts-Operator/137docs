"""
Document repository for database operations.
"""
import logging
from sqlalchemy.orm import Session
from sqlalchemy.future import select
from typing import Dict, Any, List, Optional
from app.models import Document, Tag, DocumentTag, Relationship, Task
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

class DocumentRepository:
    """Repository for document database operations."""
    
    def __init__(self, db: Session):
        """Initialize the repository with a database session."""
        self.db = db
    
    def create_document(self, document_data: Dict[str, Any]) -> Document:
        """Create a new document record.
        
        Args:
            document_data: Dictionary containing document data
            
        Returns:
            Created document instance
        """
        # Create document instance
        document = Document(
            filename=document_data.get("filename", ""),
            original_path=document_data.get("original_path", ""),
            archive_path=document_data.get("archive_path", ""),
            content_text=document_data.get("content_text", ""),
            title=document_data.get("title", ""),
            sender=document_data.get("sender", ""),
            document_date=document_data.get("document_date"),
            due_date=document_data.get("due_date"),
            amount=document_data.get("amount"),
            document_type=document_data.get("document_type", "unknown"),
            status="processed"
        )
        
        # Add to database
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)
        
        logger.info(f"Created document record: {document.id} - {document.title}")
        return document
    
    def get_document(self, document_id: int) -> Optional[Document]:
        """Get a document by ID.
        
        Args:
            document_id: Document ID
            
        Returns:
            Document instance or None if not found
        """
        return self.db.query(Document).filter(Document.id == document_id).first()
    
    def get_documents(self, 
                     limit: int = 100, 
                     offset: int = 0,
                     document_type: Optional[str] = None,
                     status: Optional[str] = None,
                     tag_id: Optional[int] = None) -> List[Document]:
        """Get documents with optional filtering.
        
        Args:
            limit: Maximum number of documents to return
            offset: Number of documents to skip
            document_type: Filter by document type
            status: Filter by status
            tag_id: Filter by tag ID
            
        Returns:
            List of document instances
        """
        query = self.db.query(Document)
        
        # Apply filters
        if document_type:
            query = query.filter(Document.document_type == document_type)
        
        if status:
            query = query.filter(Document.status == status)
        
        if tag_id:
            query = query.join(DocumentTag).filter(DocumentTag.tag_id == tag_id)
        
        # Apply pagination
        query = query.order_by(Document.created_at.desc()).offset(offset).limit(limit)
        
        return query.all()
    
    def update_document(self, document_id: int, document_data: Dict[str, Any]) -> Optional[Document]:
        """Update a document.
        
        Args:
            document_id: Document ID
            document_data: Dictionary containing document data to update
            
        Returns:
            Updated document instance or None if not found
        """
        document = self.get_document(document_id)
        if not document:
            return None
        
        # Update fields
        for key, value in document_data.items():
            if hasattr(document, key):
                setattr(document, key, value)
        
        # Update timestamp
        document.updated_at = datetime.utcnow()
        
        # Commit changes
        self.db.commit()
        self.db.refresh(document)
        
        logger.info(f"Updated document: {document.id} - {document.title}")
        return document
    
    def delete_document(self, document_id: int) -> bool:
        """Delete a document.
        
        Args:
            document_id: Document ID
            
        Returns:
            True if document was deleted, False otherwise
        """
        document = self.get_document(document_id)
        if not document:
            return False
        
        # Delete document
        self.db.delete(document)
        self.db.commit()
        
        logger.info(f"Deleted document: {document_id}")
        return True
    
    def add_tag_to_document(self, document_id: int, tag_name: str, tag_color: str = "#cccccc") -> Optional[Tag]:
        """Add a tag to a document.
        
        Args:
            document_id: Document ID
            tag_name: Tag name
            tag_color: Tag color (hex code)
            
        Returns:
            Tag instance or None if document not found
        """
        document = self.get_document(document_id)
        if not document:
            return None
        
        # Get or create tag
        tag = self.db.query(Tag).filter(Tag.name == tag_name).first()
        if not tag:
            tag = Tag(name=tag_name, color=tag_color)
            self.db.add(tag)
            self.db.commit()
            self.db.refresh(tag)
        
        # Check if document already has this tag
        existing_tag = self.db.query(DocumentTag).filter(
            DocumentTag.document_id == document_id,
            DocumentTag.tag_id == tag.id
        ).first()
        
        if not existing_tag:
            # Add tag to document
            document_tag = DocumentTag(document_id=document_id, tag_id=tag.id)
            self.db.add(document_tag)
            self.db.commit()
            
            logger.info(f"Added tag '{tag_name}' to document {document_id}")
        
        return tag
    
    def remove_tag_from_document(self, document_id: int, tag_id: int) -> bool:
        """Remove a tag from a document.
        
        Args:
            document_id: Document ID
            tag_id: Tag ID
            
        Returns:
            True if tag was removed, False otherwise
        """
        document_tag = self.db.query(DocumentTag).filter(
            DocumentTag.document_id == document_id,
            DocumentTag.tag_id == tag_id
        ).first()
        
        if not document_tag:
            return False
        
        # Remove tag from document
        self.db.delete(document_tag)
        self.db.commit()
        
        logger.info(f"Removed tag {tag_id} from document {document_id}")
        return True
    
    def create_relationship(self, source_id: int, target_id: int, relationship_type: str) -> Optional[Relationship]:
        """Create a relationship between two documents.
        
        Args:
            source_id: Source document ID
            target_id: Target document ID
            relationship_type: Type of relationship
            
        Returns:
            Relationship instance or None if documents not found
        """
        source = self.get_document(source_id)
        target = self.get_document(target_id)
        
        if not source or not target:
            return None
        
        # Create relationship
        relationship = Relationship(
            source_document_id=source_id,
            target_document_id=target_id,
            relationship_type=relationship_type
        )
        
        self.db.add(relationship)
        self.db.commit()
        self.db.refresh(relationship)
        
        logger.info(f"Created relationship: {source_id} -> {target_id} ({relationship_type})")
        return relationship
    
    def create_task(self, document_id: int, description: str, due_date=None) -> Optional[Task]:
        """Create a task for a document.
        
        Args:
            document_id: Document ID
            description: Task description
            due_date: Task due date
            
        Returns:
            Task instance or None if document not found
        """
        document = self.get_document(document_id)
        if not document:
            return None
        
        # Create task
        task = Task(
            document_id=document_id,
            description=description,
            due_date=due_date,
            status="pending"
        )
        
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        
        logger.info(f"Created task for document {document_id}: {description}")
        return task
