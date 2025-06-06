<!-- Auto-generated by Claude on 2025-06-01 10:12 -->

# Document Management System - Database Models

This file defines the SQLAlchemy ORM models for a comprehensive Document Management System with features including document processing, multi-tenancy, AI integration, and automated workflows.

## Overview

The database models support a full-featured document management system with the following capabilities:
- Document storage and metadata extraction
- Multi-tenant architecture
- AI-powered document processing
- Vector embeddings for semantic search
- User management and notifications
- Address book management
- Automated processing rules

## Core Models

### Document
The main document model that stores processed documents with extensive metadata.

```python
class Document(Base):
    __tablename__ = "documents"
```

**Key Features:**
- Full document metadata (title, content, file path)
- Financial information (amounts, tax rates, payment dates)
- Document classification (type, category, sender/recipient)
- Vector embeddings for semantic search
- Multi-tenant support via `entity_id`
- SHA-256 hash for deduplication
- Relationship management with tags and notifications

**Important Fields:**
- `embedding`: Vector field for semantic search (supports PostgreSQL pgvector or SQLite text)
- `hash`: SHA-256 hash for duplicate detection
- `entity_id`: Multi-tenant foreign key
- `parent_id`: Self-referencing for document hierarchies

### Tag
Simple tagging system for document categorization.

```python
class Tag(Base):
    __tablename__ = "tags"
```

- Many-to-many relationship with documents
- Unique tag names
- Eager loading configured to avoid async issues

### User
User authentication and authorization model.

```python
class User(Base):
    __tablename__ = "users"
```

**Features:**
- Role-based access control (`admin`, `viewer`, etc.)
- Account management (disabled flag)
- Secure password hashing

## Multi-Tenancy & Entity Management

### Entity
Represents companies or individuals in a multi-tenant setup.

```python
class Entity(Base):
    __tablename__ = "entities"
```

**Key Features:**
- Complete address information
- Financial details (IBAN, VAT ID)
- Type classification (company/individual)
- JSON aliases for LLM matching
- Active/inactive status for tenant switching

### UserEntity
Links users to entities for access control.

```python
class UserEntity(Base):
    __tablename__ = "user_entities"
```

- Role-based entity access (`owner`, `member`)
- Default tenant selection per user

## AI & Processing Features

### LLMConfig
Configuration for local-first AI integration.

```python
class LLMConfig(Base):
    __tablename__ = "llm_config"
```

**Capabilities:**
- Multiple provider support (local, OpenAI, Anthropic, custom)
- Task-specific model configuration
- Reliability settings with fallback options
- Performance tuning parameters
- Confidence thresholds for automated processing

### ProcessingRule
Automated document processing and classification rules.

```python
class ProcessingRule(Base):
    __tablename__ = "processing_rules"
```

**Features:**
- JSON-based condition and action definitions
- Priority-based rule execution
- Usage statistics tracking
- Vendor-specific rule matching

### VectorEntry
Maps document pages to vector embeddings in external vector databases.

```python
class VectorEntry(Base):
    __tablename__ = "vectors"
```

- Links to external vector database (Qdrant)
- Page-level vector ID storage
- JSON serialization for cross-database compatibility

## Utility Models

### AddressEntry
Comprehensive address book for contacts and organizations.

**Features:**
- Person/company/government classification
- Complete address information
- Financial details (VAT ID, bank details)
- Transaction history tracking
- Source document tracking

### Notification
User notification system.

**Features:**
- Multiple notification types
- Document-linked notifications
- Read/unread status tracking

### AppSettings
Singleton configuration table for runtime settings.

**Key Settings:**
- Inbox and storage paths
- Configuration locking
- Terms of service acceptance

## Technical Notes

### Database Compatibility
- **PostgreSQL**: Uses `pgvector` extension for vector embeddings
- **SQLite**: Falls back to Text fields with JSON serialization

```python
try:
    from pgvector.sqlalchemy import Vector
except ImportError:
    Vector = lambda size: Text
```

### Relationship Management
- Uses `lazy="selectin"` for eager loading to avoid async issues
- Includes `overlaps` parameters to suppress SQLAlchemy warnings
- Proper cascade deletion for related records

### Security Considerations
- Password hashing for user authentication
- Encrypted storage capability for sensitive data
- SHA-256 file hashing for integrity verification

## Suggestions

### Performance Optimization
- Consider adding database indexes for frequently queried fields
- Implement connection pooling for production deployments
- Monitor vector embedding query performance

### Data Integrity
- Add database constraints for business rules
- Implement soft delete patterns for audit trails
- Consider adding created_by/updated_by fields for audit logging

### Scalability
- Plan for database partitioning as document volume grows
- Consider read replicas for analytics queries
- Implement caching strategies for frequently accessed data

### Security Enhancements
- Encrypt sensitive fields at rest
- Implement field-level access controls
- Add audit logging for sensitive operations