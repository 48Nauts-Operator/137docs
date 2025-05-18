"""
Document repository for data access operations.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_, delete as sqla_delete
from typing import List, Optional, Dict, Any
from app.models import Document, Tag, document_tag as dt
import logging

logger = logging.getLogger(__name__)

class DocumentRepository:
    """Repository for document data access operations."""
    
    async def create(self, db: AsyncSession, document: Document) -> Document:
        """
        Create a new document.
        
        Args:
            db: Database session
            document: Document to create
            
        Returns:
            Created document
        """
        db.add(document)
        await db.flush()
        await db.refresh(document)
        return document
    
    async def get_by_id(self, db: AsyncSession, document_id: int) -> Optional[Document]:
        """
        Get document by ID.
        
        Args:
            db: Database session
            document_id: Document ID
            
        Returns:
            Document if found, None otherwise
        """
        result = await db.execute(select(Document).filter(Document.id == document_id))
        return result.scalars().first()
    
    async def get_all(
        self, 
        db: AsyncSession, 
        status: Optional[str] = None,
        document_type: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Document]:
        """
        Get all documents with optional filtering.
        
        Args:
            db: Database session
            status: Filter by status
            document_type: Filter by document type
            search: Search term for title or content
            
        Returns:
            List of documents
        """
        query = select(Document)
        
        # Apply filters
        filters = []
        if status:
            filters.append(Document.status == status)
        if document_type:
            filters.append(Document.document_type == document_type)
        if search:
            filters.append(
                or_(
                    Document.title.ilike(f"%{search}%"),
                    Document.content.ilike(f"%{search}%"),
                    Document.sender.ilike(f"%{search}%")
                )
            )
        
        if filters:
            query = query.filter(and_(*filters))
        
        # Order by created_at descending
        query = query.order_by(Document.created_at.desc())
        
        result = await db.execute(query)
        return result.scalars().all()
    
    async def update(self, db: AsyncSession, document: Document) -> Document:
        """
        Update a document.
        
        Args:
            db: Database session
            document: Document to update
            
        Returns:
            Updated document
        """
        await db.flush()
        await db.refresh(document)
        return document
    
    async def delete(self, db: AsyncSession, document_id: int) -> bool:
        """
        Delete a document.
        
        Args:
            db: Database session
            document_id: Document ID
            
        Returns:
            True if deleted, False otherwise
        """
        document = await self.get_by_id(db, document_id)
        if not document:
            return False
        
        # Remove tag associations *without* touching the lazy-loaded attribute.
        # Direct SQL is safe here and avoids triggering a blocking lazy-load
        # that fails under async (MissingGreenlet).
        await db.execute(
            sqla_delete(dt).where(dt.c.document_id == document_id)
        )

        # Now we can safely delete the document row itself.
        await db.delete(document)
        return True
    
    async def add_tag(self, db: AsyncSession, document_id: int, tag_name: str) -> bool:
        """
        Add a tag to a document.
        
        Args:
            db: Database session
            document_id: Document ID
            tag_name: Tag name
            
        Returns:
            True if added, False otherwise
        """
        document = await self.get_by_id(db, document_id)
        if not document:
            return False
        
        # Check if tag already exists
        result = await db.execute(select(Tag).filter(Tag.name == tag_name))
        tag = result.scalars().first()
        
        if not tag:
            # Create new tag
            tag = Tag(name=tag_name)
            db.add(tag)
            await db.flush()
        
        # Add tag to document if not already added
        if tag not in document.tags:
            document.tags.append(tag)
            await db.flush()
        
        return True
    
    async def remove_tag(self, db: AsyncSession, document_id: int, tag_name: str) -> bool:
        """
        Remove a tag from a document.
        
        Args:
            db: Database session
            document_id: Document ID
            tag_name: Tag name
            
        Returns:
            True if removed, False otherwise
        """
        document = await self.get_by_id(db, document_id)
        if not document:
            return False
        
        # Find tag
        result = await db.execute(select(Tag).filter(Tag.name == tag_name))
        tag = result.scalars().first()
        
        if not tag:
            return False
        
        # Remove tag from document
        if tag in document.tags:
            document.tags.remove(tag)
            await db.flush()
        
        return True
    
    async def get_tags(self, db: AsyncSession, document_id: int) -> List[str]:
        """
        Get all tags for a document.
        
        Args:
            db: Database session
            document_id: Document ID
            
        Returns:
            List of tag names
        """
        document = await self.get_by_id(db, document_id)
        if not document:
            return []
        
        return [tag.name for tag in document.tags]
