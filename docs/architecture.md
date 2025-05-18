# Local Document Management System - Architecture Design

## System Overview

The Local Document Management System (DMS) is designed as a containerized application that runs locally on macOS, providing document ingestion, OCR processing, metadata extraction, and a user-friendly dashboard for document management. The system is built with privacy in mind, operating entirely offline with no external API dependencies.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Docker Environment                           │
│                                                                     │
│  ┌───────────────┐      ┌───────────────┐      ┌───────────────┐    │
│  │  Frontend     │      │  Backend      │      │  LLM Service  │    │
│  │  Container    │◄────►│  Container    │◄────►│  Container    │    │
│  │  (React)      │      │  (FastAPI)    │      │  (Ollama)     │    │
│  └───────────────┘      └───────┬───────┘      └───────────────┘    │
│                                 │                                    │
│                         ┌───────▼───────┐                           │
│                         │  Database     │                           │
│                         │  Container    │                           │
│                         │  (SQLite)     │                           │
│                         └───────────────┘                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                 ▲
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Host System (macOS)                         │
│                                                                     │
│  ┌───────────────┐      ┌───────────────┐      ┌───────────────┐    │
│  │  Inbox        │      │  Archive      │      │  Config       │    │
│  │  Folder       │      │  Folder       │      │  Files        │    │
│  └───────────────┘      └───────────────┘      └───────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Frontend Container (React + Tailwind)
- **Purpose**: Provides the user interface for document management
- **Key Components**:
  - Dashboard views (Inbox, Invoices, Due Soon, etc.)
  - Document preview panel
  - Tagging and categorization interface
  - Timeline and relationship visualization
  - Status tracking interface
- **Technologies**:
  - React for UI components
  - Tailwind CSS for styling
  - React Router for navigation
  - React Query for data fetching

### 2. Backend Container (FastAPI)
- **Purpose**: Handles business logic, file processing, and API endpoints
- **Key Components**:
  - Document ingestion service (using watchdog)
  - OCR processing service
  - Metadata extraction service
  - Document classification service
  - REST API endpoints
- **Technologies**:
  - FastAPI for API framework
  - Tesseract/PaddleOCR for OCR
  - PyMuPDF/pdfplumber for PDF parsing
  - SQLAlchemy for database ORM

### 3. LLM Service Container (Ollama)
- **Purpose**: Provides LLM capabilities for smart features
- **Key Components**:
  - Ollama server running gwen2.5 model
  - HTTP interface for LLM queries
- **Technologies**:
  - Ollama for LLM container
  - gwen2.5 as default model (configurable)

### 4. Database Container (SQLite)
- **Purpose**: Stores document metadata and relationships
- **Key Components**:
  - Document metadata table
  - Tags and categories tables
  - Document relationships table
  - Task and reminder tables
- **Technologies**:
  - SQLite for database
  - Volume mapping for persistence

## Data Flow

1. **Document Ingestion**:
   - Watchdog monitors the Inbox folder on the host system
   - New files are detected and passed to the backend container
   - Backend validates file types and prepares for processing

2. **Document Processing**:
   - OCR is performed on the document
   - Metadata is extracted (title, sender, dates, amounts)
   - LLM is queried for smart tagging and classification
   - Results are stored in the SQLite database

3. **Document Management**:
   - Processed documents are moved to the Archive folder
   - Frontend displays document metadata and preview
   - User can edit tags, status, and relationships
   - Timeline view shows related documents

4. **API Access**:
   - External applications can push documents via REST API
   - API endpoints provide access to document metadata and status

## Database Schema

### Documents Table
```
id: INTEGER PRIMARY KEY
filename: TEXT
original_path: TEXT
archive_path: TEXT
content_text: TEXT
title: TEXT
sender: TEXT
document_date: DATE
due_date: DATE
amount: DECIMAL
document_type: TEXT
status: TEXT
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

### Tags Table
```
id: INTEGER PRIMARY KEY
name: TEXT
color: TEXT
```

### DocumentTags Table
```
id: INTEGER PRIMARY KEY
document_id: INTEGER (FOREIGN KEY)
tag_id: INTEGER (FOREIGN KEY)
```

### Relationships Table
```
id: INTEGER PRIMARY KEY
source_document_id: INTEGER (FOREIGN KEY)
target_document_id: INTEGER (FOREIGN KEY)
relationship_type: TEXT
```

### Tasks Table
```
id: INTEGER PRIMARY KEY
document_id: INTEGER (FOREIGN KEY)
description: TEXT
due_date: DATE
status: TEXT
```

## Configuration System

A flexible configuration system will be implemented to allow customization of:
- File paths (Inbox, Archive)
- OCR settings
- LLM model selection (local Ollama or API-based)
- UI preferences

Configuration will be stored in:
1. `.env` file for environment variables
2. `config.yaml` for detailed configuration

## Docker Containerization

The system will be containerized using Docker Compose with the following services:
1. `frontend`: React + Tailwind UI
2. `backend`: FastAPI server
3. `llm`: Ollama service
4. `db`: SQLite database

Volume mappings will be used to:
- Mount the Inbox and Archive folders from the host system
- Persist the SQLite database
- Store configuration files

## Security & Privacy

- All processing happens locally
- No data is sent to external services
- Configuration allows for encrypted SQLite database
- API authentication using API keys

## Extensibility

The architecture is designed to be modular and extensible, allowing for:
- Additional document types
- New LLM models
- Enhanced analytics
- Vector database integration (future phase)
- Mobile app integration via API
