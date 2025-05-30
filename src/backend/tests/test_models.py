"""
Simplified models for testing that work with SQLite.
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class Document(Base):
    """Simplified Document model for testing."""
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text)
    file_path = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class LLMConfig(Base):
    """LLM Configuration model for testing."""
    __tablename__ = "llm_config"
    
    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String(50), default='local')
    api_key = Column(String(255))
    api_url = Column(String(255))
    model_tagger = Column(String(100), default='phi3')
    model_enricher = Column(String(100), default='llama3')
    model_analytics = Column(String(100), default='llama3')
    model_responder = Column(String(100))
    enabled = Column(Boolean, default=False)
    auto_tagging = Column(Boolean, default=True)
    auto_enrichment = Column(Boolean, default=True)
    external_enrichment = Column(Boolean, default=False)
    max_retries = Column(Integer, default=3)
    retry_delay = Column(Integer, default=300)
    backup_provider = Column(String(50))
    backup_model = Column(String(100))
    batch_size = Column(Integer, default=5)
    concurrent_tasks = Column(Integer, default=2)
    cache_responses = Column(Boolean, default=True)
    min_confidence_tagging = Column(Float, default=0.7)
    min_confidence_entity = Column(Float, default=0.8)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now()) 