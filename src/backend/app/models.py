"""
Database models for the Document Management System.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Table, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

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
    # SHA-256 hash of the original file, used for deduplication
    hash = Column(String(64), nullable=False, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tags = relationship("Tag", secondary=document_tag, back_populates="documents")
    notifications = relationship("Notification", back_populates="document", cascade="all, delete-orphan")

class Tag(Base):
    """Tag model for document categorization."""
    
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    documents = relationship("Document", secondary=document_tag, back_populates="tags")

class User(Base):
    """User model for authentication."""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
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
    address = Column(Text, nullable=True)
    country = Column(String(2), nullable=True)
    vat_id = Column(String(50), nullable=True)
    bank_details = Column(Text, nullable=True)  # encrypted or masked if needed
    tags = Column(String(255), nullable=True)  # comma-separated for MVP
    created_from = Column(String(255), nullable=True)  # file name / doc id source
    last_seen_in = Column(String(50), nullable=True)  # ISO date
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
