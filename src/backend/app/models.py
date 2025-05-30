"""
Database models for the Document Management System.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Table, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

# Try to import Vector for PostgreSQL, fall back to Text for SQLite
try:
    from pgvector.sqlalchemy import Vector
except ImportError:
    # For SQLite, use Text to store vector data as JSON
    Vector = lambda size: Text

# Association table for document-tag relationship
document_tag = Table(
    "document_tag",
    Base.metadata,
    Column("document_id", Integer, ForeignKey("documents.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
)

# Mapped helper class for analytics compatibility
class DocumentTag(Base):
    """ORM mapping for the document_tag association table (no extra columns)."""

    __table__ = document_tag

    # Optional.relationship definitions if needed later
    document = relationship("Document", backref="document_tag_assoc")
    tag = relationship("Tag", backref="document_tag_assoc")

class Document(Base):
    """Document model representing a processed document."""
    
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    file_path = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    document_type = Column(String(50), nullable=True)
    sender = Column(String(255), nullable=True)
    recipient = Column(String(255), nullable=True)
    document_date = Column(String(50), nullable=True)
    due_date = Column(String(50), nullable=True)
    amount = Column(Float, nullable=True)
    subtotal = Column(Float, nullable=True)
    tax_rate = Column(Float, nullable=True)
    tax_amount = Column(Float, nullable=True)
    payment_date = Column(String(50), nullable=True)
    category = Column(String(100), nullable=True)
    recurring = Column(Boolean, nullable=True)
    frequency = Column(String(20), nullable=True)  # monthly, quarterly etc.
    parent_id = Column(Integer, ForeignKey('documents.id'), nullable=True)
    original_file_name = Column(String(255), nullable=True)
    summary = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=True)
    currency = Column(String(10), nullable=True)
    status = Column(String(50), default="pending")
    embedding = Column(Vector(1536), nullable=True)
    # SHA-256 hash of the original file, used for deduplication
    hash = Column(String(64), nullable=False, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    # Multi-company FK (nullable for legacy docs)
    entity_id = Column(Integer, ForeignKey("entities.id"), nullable=True, index=True)
    entity = relationship("Entity")
    
    # Relationships
    tags = relationship(
        "Tag",
        secondary=document_tag,
        back_populates="documents",
        lazy="selectin",          # eager-load to avoid async lazy IO
        overlaps="document_tag_assoc,documents,tags,document,tag",  # silence SAWarnings
    )
    notifications = relationship("Notification", back_populates="document", cascade="all, delete-orphan")

class Tag(Base):
    """Tag model for document categorization."""
    
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    documents = relationship(
        "Document",
        secondary=document_tag,
        back_populates="tags",
        lazy="selectin",
        overlaps="document_tag_assoc,documents,tags,document,tag",
    )

class User(Base):
    """User model for authentication."""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    full_name = Column(String(100), nullable=True)
    role = Column(String(20), nullable=False, default="viewer")  # admin | viewer | ...
    hashed_password = Column(String(255), nullable=False)
    disabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
class Notification(Base):
    """Notification model for user alerts."""
    
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=False)  # e.g., "overdue", "reminder", "system"
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    document = relationship("Document", back_populates="notifications")

# ---------------------------------------------------------------------------
# Address Book
# ---------------------------------------------------------------------------

class AddressEntry(Base):
    """Address book entry representing a person or organisation."""

    __tablename__ = "address_book"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    entity_type = Column(String(20), default="company")  # company | person | government
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    street = Column(String(255), nullable=True)
    address2 = Column(String(255), nullable=True)
    town = Column(String(255), nullable=True)
    zip = Column(String(20), nullable=True)
    county = Column(String(100), nullable=True)
    # ISO alpha-2 code is usually 2 letters but we increasingly store full "Switzerland", "United Kingdom" etc.
    # Therefore widen column to 100 characters to avoid truncation errors.
    country = Column(String(100), nullable=True)
    group_name = Column(String(100), nullable=True)
    last_transaction = Column(String(50), nullable=True)
    # Legacy single-address field kept for backward compatibility
    address = Column(Text, nullable=True)
    vat_id = Column(String(50), nullable=True)
    bank_details = Column(Text, nullable=True)  # encrypted or masked if needed
    tags = Column(String(255), nullable=True)  # comma-separated for MVP
    created_from = Column(String(255), nullable=True)  # file name / doc id source
    last_seen_in = Column(String(50), nullable=True)  # ISO date
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# ---------------------------------------------------------------------------
#  Vision embeddings (ColPali) mapping table
# ---------------------------------------------------------------------------

class VectorEntry(Base):
    """Mapping between internal document pages and Qdrant point IDs.

    Each row stores the list of patch-level vector IDs (UUID strings) that were
    inserted for the given page.  We serialise the list as JSON inside a TEXT
    column to keep the schema simple across SQLite & Postgres.
    """

    __tablename__ = "vectors"

    id = Column(Integer, primary_key=True, index=True)
    doc_id = Column(Integer, ForeignKey("documents.id"), nullable=False, index=True)
    page = Column(Integer, nullable=False)
    vector_ids = Column(Text, nullable=False)  # JSON list e.g. '["uuid1", "uuid2", ...]'

    document = relationship("Document")

# ---------------------------------------------------------------------------
#  Application-wide settings (single-row table)
# ---------------------------------------------------------------------------

# We store runtime-changeable paths (Inbox, Storage root) here instead of
# relying purely on environment variables so that the UI can update them at
# runtime and multiple containers / processes see a consistent value.


class AppSettings(Base):
    """Singleton table holding mutable configuration like folder paths."""

    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)

    # Absolute path that the watcher observes for new uploads
    inbox_path = Column(String(255), nullable=False)

    # Root directory where the system organises its year / Archive sub-folders
    storage_root = Column(String(255), nullable=False)

    # Once the user confirmed the initial choice we protect accidental changes
    locked = Column(Boolean, default=False)

    tos_accepted_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# ---------------------------------------------------------------------------
#  LLM Configuration (local-first AI integration)
# ---------------------------------------------------------------------------


class LLMConfig(Base):
    """LLM configuration for local-first AI integration."""

    __tablename__ = "llm_config"

    id = Column(Integer, primary_key=True, index=True)

    # Provider configuration
    provider = Column(String(50), default="local")  # local | openai | anthropic | custom
    api_key = Column(String(255), nullable=True)  # encrypted API key for cloud providers
    api_url = Column(String(255), nullable=True)  # custom endpoint URL (e.g., LiteLLM)
    
    # Model preferences per task type
    model_tagger = Column(String(100), default="phi3")  # small model for tagging
    model_enricher = Column(String(100), default="llama3")  # mid-size for field completion
    model_analytics = Column(String(100), default="llama3")  # analytics summaries
    model_responder = Column(String(100), nullable=True)  # large model for responses (Pro feature)
    
    # Processing configuration
    enabled = Column(Boolean, default=False)  # master enable/disable switch
    auto_tagging = Column(Boolean, default=True)  # automatic document tagging
    auto_enrichment = Column(Boolean, default=True)  # automatic field completion
    external_enrichment = Column(Boolean, default=False)  # internet-based enrichment
    
    # Reliability settings
    max_retries = Column(Integer, default=3)  # retry attempts before fallback
    retry_delay = Column(Integer, default=300)  # delay in seconds (5 minutes)
    backup_provider = Column(String(50), nullable=True)  # fallback provider
    backup_model = Column(String(100), nullable=True)  # fallback model
    
    # Performance settings
    batch_size = Column(Integer, default=5)  # documents per batch
    concurrent_tasks = Column(Integer, default=2)  # parallel LLM operations
    cache_responses = Column(Boolean, default=True)  # cache LLM responses
    
    # Confidence thresholds
    min_confidence_tagging = Column(Float, default=0.7)  # minimum confidence for auto-tagging
    min_confidence_entity = Column(Float, default=0.8)  # minimum confidence for entity matching
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# ---------------------------------------------------------------------------
#  Entity / multi-tenant models
# ---------------------------------------------------------------------------


class Entity(Base):
    """Company or personal profile representing a billing/ownership context (Tenant)."""

    __tablename__ = "entities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    alias = Column(String(100), nullable=False)  # Display name (Personal, Company A, etc.)
    type = Column(String(20), default="company")  # company | individual
    
    # Address fields (as requested in profile.md)
    street = Column(String(255), nullable=True)
    house_number = Column(String(20), nullable=True)
    apartment = Column(String(50), nullable=True)
    area_code = Column(String(20), nullable=True)
    county = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    
    # Financial information
    iban = Column(String(50), nullable=True)
    vat_id = Column(String(50), nullable=True)
    
    # Additional metadata
    aliases = Column(Text, nullable=True)  # JSON string list of known names for LLM matching
    is_active = Column(Boolean, default=True)  # for tenant switching
    
    # Legacy JSON field for backward compatibility
    address_json = Column(Text, nullable=True)  # JSON string for MVP
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserEntity(Base):
    """Link table between users and entities (tenant access control)."""

    __tablename__ = "user_entities"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    entity_id = Column(Integer, ForeignKey("entities.id"), primary_key=True)
    role = Column(String(20), default="owner")  # owner | member
    is_default = Column(Boolean, default=False)  # default tenant for this user

    entity = relationship("Entity")
    user = relationship("User")

# ---------------------------------------------------------------------------
#  Document Processing Rules
# ---------------------------------------------------------------------------

class ProcessingRule(Base):
    """Rule for automated document processing and classification."""

    __tablename__ = "processing_rules"

    id = Column(Integer, primary_key=True, index=True)
    
    # Basic rule identification
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Rule matching criteria
    vendor = Column(String(255), nullable=True, index=True)
    preferred_tenant_id = Column(Integer, ForeignKey("entities.id"), nullable=True)
    
    # Conditions and actions stored as JSON strings
    conditions = Column(Text, nullable=False)  # JSON: [{"field": "text", "operator": "contains", "value": "Invoice"}]
    actions = Column(Text, nullable=False)     # JSON: [{"type": "assign_tenant", "value": "entity_id"}]
    
    # Rule management
    priority = Column(Integer, default=0, index=True)  # Lower number = higher priority
    enabled = Column(Boolean, default=True, index=True)
    
    # Usage statistics
    matches_count = Column(Integer, default=0)
    last_matched_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    preferred_tenant = relationship("Entity", foreign_keys=[preferred_tenant_id])
