"""
Database models for the Document Management System.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class Document(Base):
    """Document model for storing document metadata."""
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    original_path = Column(String)
    archive_path = Column(String)
    content_text = Column(Text)
    title = Column(String, index=True)
    sender = Column(String, index=True)
    document_date = Column(Date, index=True)
    due_date = Column(Date, index=True)
    amount = Column(Float)
    document_type = Column(String, index=True)
    status = Column(String, index=True, default="unprocessed")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tags = relationship("DocumentTag", back_populates="document")
    source_relationships = relationship("Relationship", foreign_keys="Relationship.source_document_id", back_populates="source_document")
    target_relationships = relationship("Relationship", foreign_keys="Relationship.target_document_id", back_populates="target_document")
    tasks = relationship("Task", back_populates="document")


class Tag(Base):
    """Tag model for document categorization."""
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    color = Column(String, default="#cccccc")
    
    # Relationships
    documents = relationship("DocumentTag", back_populates="tag")


class DocumentTag(Base):
    """Association table for document-tag many-to-many relationship."""
    __tablename__ = "document_tags"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    tag_id = Column(Integer, ForeignKey("tags.id"))
    
    # Relationships
    document = relationship("Document", back_populates="tags")
    tag = relationship("Tag", back_populates="documents")


class Relationship(Base):
    """Model for document relationships."""
    __tablename__ = "relationships"
    
    id = Column(Integer, primary_key=True, index=True)
    source_document_id = Column(Integer, ForeignKey("documents.id"))
    target_document_id = Column(Integer, ForeignKey("documents.id"))
    relationship_type = Column(String)  # e.g., "invoice_reminder", "invoice_payment"
    
    # Relationships
    source_document = relationship("Document", foreign_keys=[source_document_id], back_populates="source_relationships")
    target_document = relationship("Document", foreign_keys=[target_document_id], back_populates="target_relationships")


class Task(Base):
    """Model for document-related tasks."""
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    description = Column(String)
    due_date = Column(Date)
    status = Column(String, default="pending")  # pending, completed, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    document = relationship("Document", back_populates="tasks")
