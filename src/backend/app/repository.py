"""
Document repository for data access operations.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import or_, and_, delete as sqla_delete
from typing import List, Optional, Dict, Any, Union
from app.models import Document, Tag, document_tag as dt, User as UserDB
import logging
from sqlalchemy import select as sa_select, update as sa_update, delete as sa_delete

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
    
    async def get_by_id(self, db: AsyncSession, document_id: int, as_dict: bool = False) -> Optional[Union[Document, Dict[str, Any]]]:
        """
        Get document by ID.
        
        Args:
            db: Database session
            document_id: Document ID
            
        Returns:
            Document if found, None otherwise
        """
        stmt = select(Document).options(selectinload(Document.tags)).filter(Document.id == document_id)
        result = await db.execute(stmt)
        doc = result.scalars().first()
        return self._to_dict(doc) if as_dict and doc else doc
    
    async def get_all(
        self, 
        db: AsyncSession, 
        status: Optional[str] = None,
        document_type: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Union[Document, Dict[str, Any]]]:
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
        query = select(Document).options(selectinload(Document.tags))
        
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
        docs = result.scalars().all()
        # Return plain dicts for JSON response
        return [self._to_dict(d) for d in docs]
    
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

    # Shared helper ---------------------------------------------------------

    @staticmethod
    def _to_dict(doc: Document, include_tags: bool = True) -> Dict[str, Any]:
        """Return a JSON-serialisable representation of *doc* (no SA state).

        Vector columns are converted to `list[float] | None` and the SQLAlchemy
        "_sa_instance_state" attribute is stripped.  Tags are flattened to a
        list of names by default so the frontend doesn't need to deal with the
        association table.
        """

        if doc is None:
            return {}

        out: Dict[str, Any] = {
            col.name: getattr(doc, col.name) for col in doc.__table__.columns  # type: ignore[attr-defined]
        }

        # pgvector Vector -> list[float]
        try:
            from pgvector import Vector  # type: ignore
            import numpy as np  # type: ignore
            vector_types = (list, tuple, Vector, np.ndarray)
        except ImportError:
            try:
                import numpy as np  # type: ignore
                vector_types = (list, tuple, np.ndarray)
            except ImportError:
                vector_types = (list, tuple)

        if isinstance(out.get("embedding"), vector_types):
            # Convert to plain Python float list to satisfy standard json encoder
            out["embedding"] = [float(x) for x in out["embedding"]]

        # Tags – use already-loaded collection to avoid lazy IO after session close
        if include_tags:
            loaded_tags = doc.__dict__.get("tags")  # populated by selectinload
            if loaded_tags is not None:
                out["tags"] = [t.name for t in loaded_tags]
            else:
                out["tags"] = []

        # Convert any remaining non-JSON-serialisable primitives ------------

        from datetime import datetime, date
        try:
            import numpy as _np  # type: ignore
            _np_generic = (_np.generic,)  # numpy scalar types
        except Exception:  # pragma: no cover – numpy absent
            _np_generic = tuple()

        import decimal

        for key, value in list(out.items()):  # copy to avoid mutation while iterating
            if isinstance(value, (datetime, date)):
                out[key] = value.isoformat()
            elif isinstance(value, decimal.Decimal):
                out[key] = float(value)
            elif _np_generic and isinstance(value, _np_generic):
                # Convert numpy scalar (e.g., np.float32) -> python float/int
                out[key] = value.item()

        return out

# ---------------------------------------------------------------------------
# User repository
# ---------------------------------------------------------------------------

class UserRepository:  # noqa: D101 – simple data-access class
    async def get_all(self, db: AsyncSession) -> List[dict]:
        res = await db.execute(sa_select(UserDB).order_by(UserDB.created_at))
        users = res.scalars().all()
        return [self._to_dict(u) for u in users]

    async def get_by_id(self, db: AsyncSession, user_id: int) -> Optional[dict]:
        res = await db.execute(sa_select(UserDB).where(UserDB.id == user_id))
        user = res.scalars().first()
        return self._to_dict(user) if user else None

    async def create(self, db: AsyncSession, **data) -> dict:
        user = UserDB(**data)
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return self._to_dict(user)

    async def update(self, db: AsyncSession, user_id: int, **data) -> Optional[dict]:
        await db.execute(sa_update(UserDB).where(UserDB.id == user_id).values(**data))
        await db.flush()
        return await self.get_by_id(db, user_id)

    async def delete(self, db: AsyncSession, user_id: int) -> bool:
        res = await db.execute(sa_delete(UserDB).where(UserDB.id == user_id))
        return res.rowcount > 0

    # ---------------------------------------------------------------------
    @staticmethod
    def _to_dict(u: UserDB | None) -> dict:
        if u is None:
            return {}
        return {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "disabled": u.disabled,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
