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

    async def get_by_username(self, db: AsyncSession, username: str) -> Optional[UserDB]:
        """Get user by username - returns the actual model for authentication purposes."""
        res = await db.execute(sa_select(UserDB).where(UserDB.username == username))
        return res.scalars().first()

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

# ---------------------------------------------------------------------------
# LLM Config repository
# ---------------------------------------------------------------------------

class LLMConfigRepository:
    """Repository for LLM configuration data access operations."""
    
    async def get_config(self, db: AsyncSession) -> Optional[dict]:
        """Get the current LLM configuration (singleton)."""
        from app.models import LLMConfig
        res = await db.execute(sa_select(LLMConfig).order_by(LLMConfig.id.desc()).limit(1))
        config = res.scalars().first()
        return self._to_dict(config) if config else None
    
    async def create_default_config(self, db: AsyncSession) -> dict:
        """Create default LLM configuration."""
        from app.models import LLMConfig
        config = LLMConfig()  # Uses model defaults
        db.add(config)
        await db.flush()
        await db.refresh(config)
        return self._to_dict(config)
    
    async def update_config(self, db: AsyncSession, **data) -> dict:
        """Update LLM configuration (create if doesn't exist)."""
        from app.models import LLMConfig
        
        # Get existing config or create new one
        res = await db.execute(sa_select(LLMConfig).limit(1))
        config = res.scalars().first()
        
        if not config:
            # Create new config with provided data
            config = LLMConfig(**data)
            db.add(config)
        else:
            # Update existing config
            for key, value in data.items():
                if hasattr(config, key):
                    setattr(config, key, value)
        
        await db.flush()
        await db.refresh(config)
        return self._to_dict(config)
    
    async def test_connection(self, db: AsyncSession, provider: str, api_url: str = None, api_key: str = None) -> dict:
        """Test LLM provider connection."""
        try:
            from app.llm import LLMService
            llm_service = LLMService(db_session=db)
            result = await llm_service.test_connection(provider, api_url, api_key)
            return result
        except Exception as e:
            logger.error(f"Connection test failed: {str(e)}")
            return {
                "status": "error",
                "message": f"Connection test failed: {str(e)}",
                "available_models": []
            }
    
    @staticmethod
    def _to_dict(config) -> dict:
        """Convert LLMConfig model to dictionary."""
        if config is None:
            return {}
        
        from datetime import datetime
        
        result = {}
        for column in config.__table__.columns:
            value = getattr(config, column.name)
            if isinstance(value, datetime):
                result[column.name] = value.isoformat()
            else:
                result[column.name] = value
        
        return result

# ---------------------------------------------------------------------------
# Tenant/Entity repository
# ---------------------------------------------------------------------------

class TenantRepository:
    """Repository for tenant (Entity) profile management."""
    
    async def get_user_tenants(self, db: AsyncSession, user_id: int) -> List[dict]:
        """Get all tenants for a user."""
        from app.models import Entity, UserEntity
        
        # Join entities with user_entities to get user's tenants
        stmt = (
            sa_select(Entity, UserEntity.is_default)
            .join(UserEntity, Entity.id == UserEntity.entity_id)
            .where(UserEntity.user_id == user_id)
            .where(Entity.is_active == True)
            .order_by(UserEntity.is_default.desc(), Entity.alias)
        )
        
        result = await db.execute(stmt)
        rows = result.all()
        
        tenants = []
        for entity, is_default in rows:
            tenant = self._entity_to_dict(entity)
            tenant['is_default'] = is_default
            tenants.append(tenant)
        
        return tenants
    
    async def get_default_tenant(self, db: AsyncSession, user_id: int) -> Optional[dict]:
        """Get the default tenant for a user."""
        from app.models import Entity, UserEntity
        
        stmt = (
            sa_select(Entity)
            .join(UserEntity, Entity.id == UserEntity.entity_id)
            .where(UserEntity.user_id == user_id)
            .where(UserEntity.is_default == True)
            .where(Entity.is_active == True)
        )
        
        result = await db.execute(stmt)
        entity = result.scalars().first()
        
        if entity:
            tenant = self._entity_to_dict(entity)
            tenant['is_default'] = True
            return tenant
        
        return None
    
    async def get_tenant_by_id(self, db: AsyncSession, user_id: int, tenant_id: int) -> Optional[dict]:
        """Get a specific tenant by ID for a user."""
        from app.models import Entity, UserEntity
        
        stmt = (
            sa_select(Entity, UserEntity.is_default)
            .join(UserEntity, Entity.id == UserEntity.entity_id)
            .where(UserEntity.user_id == user_id)
            .where(Entity.id == tenant_id)
            .where(Entity.is_active == True)
        )
        
        result = await db.execute(stmt)
        row = result.first()
        
        if row:
            entity, is_default = row
            tenant = self._entity_to_dict(entity)
            tenant['is_default'] = is_default
            return tenant
        
        return None
    
    async def create_tenant(self, db: AsyncSession, user_id: int, **data) -> dict:
        """Create a new tenant for a user."""
        from app.models import Entity, UserEntity
        
        # Extract UserEntity-specific fields
        is_default = data.pop('is_default', False)
        
        # Create the entity with only Entity fields
        entity = Entity(**data)
        db.add(entity)
        await db.flush()
        await db.refresh(entity)
        
        # If this is set as default, unset any existing defaults first
        if is_default:
            await self._unset_default_tenant(db, user_id)
        
        # Link to user
        user_entity = UserEntity(
            user_id=user_id,
            entity_id=entity.id,
            role="owner",
            is_default=is_default
        )
        db.add(user_entity)
        
        await db.flush()
        
        tenant = self._entity_to_dict(entity)
        tenant['is_default'] = is_default
        return tenant
    
    async def update_tenant(self, db: AsyncSession, user_id: int, tenant_id: int, **data) -> Optional[dict]:
        """Update a tenant for a user."""
        from app.models import Entity, UserEntity
        
        # Get the entity and verify user access
        entity_result = await db.execute(
            sa_select(Entity)
            .join(UserEntity, Entity.id == UserEntity.entity_id)
            .where(UserEntity.user_id == user_id)
            .where(Entity.id == tenant_id)
        )
        entity = entity_result.scalars().first()
        
        if not entity:
            return None
        
        # Update entity fields
        for key, value in data.items():
            if hasattr(entity, key) and key != 'is_default':
                setattr(entity, key, value)
        
        # Handle default tenant change
        if 'is_default' in data and data['is_default']:
            await self._unset_default_tenant(db, user_id)
            await db.execute(
                sa_update(UserEntity)
                .where(UserEntity.user_id == user_id)
                .where(UserEntity.entity_id == tenant_id)
                .values(is_default=True)
            )
        
        await db.flush()
        await db.refresh(entity)
        
        # Get updated tenant with default status
        return await self.get_tenant_by_id(db, user_id, tenant_id)
    
    async def delete_tenant(self, db: AsyncSession, user_id: int, tenant_id: int) -> bool:
        """Soft delete a tenant (mark as inactive)."""
        from app.models import Entity, UserEntity
        
        # Verify user has access and entity exists
        entity_result = await db.execute(
            sa_select(Entity)
            .join(UserEntity, Entity.id == UserEntity.entity_id)
            .where(UserEntity.user_id == user_id)
            .where(Entity.id == tenant_id)
        )
        entity = entity_result.scalars().first()
        
        if not entity:
            return False
        
        # Soft delete by marking as inactive
        entity.is_active = False
        await db.flush()
        
        return True
    
    async def set_default_tenant(self, db: AsyncSession, user_id: int, tenant_id: int) -> bool:
        """Set a tenant as the default for a user."""
        from app.models import UserEntity
        
        # Verify user has access to this tenant
        tenant = await self.get_tenant_by_id(db, user_id, tenant_id)
        if not tenant:
            return False
        
        # Unset existing default
        await self._unset_default_tenant(db, user_id)
        
        # Set new default
        await db.execute(
            sa_update(UserEntity)
            .where(UserEntity.user_id == user_id)
            .where(UserEntity.entity_id == tenant_id)
            .values(is_default=True)
        )
        
        await db.flush()
        return True
    
    async def _unset_default_tenant(self, db: AsyncSession, user_id: int):
        """Unset the current default tenant for a user."""
        from app.models import UserEntity
        
        await db.execute(
            sa_update(UserEntity)
            .where(UserEntity.user_id == user_id)
            .values(is_default=False)
        )

    async def clear_default_tenant(self, db: AsyncSession, user_id: int):
        """Clear the default tenant for a user (set all to non-default)."""
        await self._unset_default_tenant(db, user_id)
        await db.flush()
    
    @staticmethod
    def _entity_to_dict(entity) -> dict:
        """Convert Entity to dict."""
        return {
            "id": entity.id,
            "name": entity.name,
            "alias": entity.alias,
            "type": entity.type,
            "street": entity.street,
            "house_number": entity.house_number,
            "apartment": entity.apartment,
            "area_code": entity.area_code,
            "county": entity.county,
            "country": entity.country,
            "iban": entity.iban,
            "vat_id": entity.vat_id,
            "aliases": entity.aliases,
            "is_active": entity.is_active,
            "created_at": entity.created_at.isoformat() if entity.created_at else None,
            "updated_at": entity.updated_at.isoformat() if entity.updated_at else None,
        }


class ProcessingRuleRepository:
    """Repository for processing rule data access operations."""
    
    async def get_all(self, db: AsyncSession) -> List[dict]:
        """Get all processing rules ordered by priority."""
        from app.models import ProcessingRule
        
        stmt = select(ProcessingRule).order_by(ProcessingRule.priority.asc(), ProcessingRule.created_at.desc())
        result = await db.execute(stmt)
        rules = result.scalars().all()
        return [self._to_dict(rule) for rule in rules]
    
    async def get_by_id(self, db: AsyncSession, rule_id: int) -> Optional[dict]:
        """Get processing rule by ID."""
        from app.models import ProcessingRule
        
        stmt = select(ProcessingRule).filter(ProcessingRule.id == rule_id)
        result = await db.execute(stmt)
        rule = result.scalars().first()
        return self._to_dict(rule) if rule else None
    
    async def get_enabled_rules(self, db: AsyncSession) -> List[dict]:
        """Get all enabled processing rules ordered by priority."""
        from app.models import ProcessingRule
        
        stmt = (
            select(ProcessingRule)
            .filter(ProcessingRule.enabled == True)
            .order_by(ProcessingRule.priority.asc(), ProcessingRule.created_at.desc())
        )
        result = await db.execute(stmt)
        rules = result.scalars().all()
        return [self._to_dict(rule) for rule in rules]
    
    async def create(self, db: AsyncSession, **data) -> dict:
        """Create a new processing rule."""
        from app.models import ProcessingRule
        import json
        
        # Convert conditions and actions to JSON strings if they're dicts/lists
        if isinstance(data.get('conditions'), (dict, list)):
            data['conditions'] = json.dumps(data['conditions'])
        if isinstance(data.get('actions'), (dict, list)):
            data['actions'] = json.dumps(data['actions'])
        
        rule = ProcessingRule(**data)
        db.add(rule)
        await db.flush()
        await db.refresh(rule)
        return self._to_dict(rule)
    
    async def update(self, db: AsyncSession, rule_id: int, **data) -> Optional[dict]:
        """Update a processing rule."""
        from app.models import ProcessingRule
        import json
        
        stmt = select(ProcessingRule).filter(ProcessingRule.id == rule_id)
        result = await db.execute(stmt)
        rule = result.scalars().first()
        
        if not rule:
            return None
        
        # Convert conditions and actions to JSON strings if they're dicts/lists
        if isinstance(data.get('conditions'), (dict, list)):
            data['conditions'] = json.dumps(data['conditions'])
        if isinstance(data.get('actions'), (dict, list)):
            data['actions'] = json.dumps(data['actions'])
        
        # Update fields
        for key, value in data.items():
            if hasattr(rule, key):
                setattr(rule, key, value)
        
        await db.flush()
        await db.refresh(rule)
        return self._to_dict(rule)
    
    async def delete(self, db: AsyncSession, rule_id: int) -> bool:
        """Delete a processing rule."""
        from app.models import ProcessingRule
        
        stmt = select(ProcessingRule).filter(ProcessingRule.id == rule_id)
        result = await db.execute(stmt)
        rule = result.scalars().first()
        
        if not rule:
            return False
        
        await db.delete(rule)
        return True
    
    async def increment_matches(self, db: AsyncSession, rule_id: int) -> None:
        """Increment the matches count for a rule."""
        from app.models import ProcessingRule
        from datetime import datetime
        
        stmt = (
            sa_update(ProcessingRule)
            .where(ProcessingRule.id == rule_id)
            .values(
                matches_count=ProcessingRule.matches_count + 1,
                last_matched_at=datetime.utcnow()
            )
        )
        await db.execute(stmt)
    
    @staticmethod
    def _to_dict(rule) -> dict:
        """Convert ProcessingRule to dict."""
        import json
        
        if not rule:
            return {}
        
        # Parse JSON strings back to objects
        conditions = rule.conditions
        actions = rule.actions
        
        try:
            if isinstance(conditions, str):
                conditions = json.loads(conditions)
        except (json.JSONDecodeError, TypeError):
            conditions = []
        
        try:
            if isinstance(actions, str):
                actions = json.loads(actions)
        except (json.JSONDecodeError, TypeError):
            actions = []
        
        return {
            "id": rule.id,
            "name": rule.name,
            "description": rule.description,
            "vendor": rule.vendor,
            "preferred_tenant_id": rule.preferred_tenant_id,
            "conditions": conditions,
            "actions": actions,
            "priority": rule.priority,
            "enabled": rule.enabled,
            "matches_count": rule.matches_count,
            "last_matched_at": rule.last_matched_at.isoformat() if rule.last_matched_at else None,
            "created_at": rule.created_at.isoformat() if rule.created_at else None,
            "updated_at": rule.updated_at.isoformat() if rule.updated_at else None,
        }
