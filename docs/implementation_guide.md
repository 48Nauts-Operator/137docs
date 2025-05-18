# Local Document Management System - Implementation Guide

## Overview

This document provides an implementation guide for the Local Document Management System (DMS) MVP. The system is designed to monitor an inbox folder for new documents, perform OCR, extract metadata, classify documents, and provide a dashboard for document management.

## System Components

The system consists of three main components:

1. **Backend (FastAPI)**: Handles document processing, OCR, metadata extraction, and API endpoints
2. **Frontend (React + Tailwind)**: Provides the user interface for document management
3. **LLM Service (Ollama)**: Provides LLM capabilities for smart tagging and document analysis

## Implementation Progress

### Completed Components

1. **Document Ingestion**
   - Folder monitoring system using watchdog
   - File type detection and validation
   - Archive folder structure
   - File movement logic after processing

2. **OCR & Metadata Extraction**
   - OCR functionality using Tesseract
   - Metadata extraction (title, sender, dates, amounts)
   - Document type classification
   - SQLite database storage

3. **Tagging & Categorization**
   - Basic keyword and rule-based classification
   - LLM integration for smart tagging
   - Tag management system

4. **API Access**
   - REST API with FastAPI
   - Document upload endpoints
   - Metadata retrieval endpoints

5. **LLM Integration**
   - Ollama integration with gwen2.5
   - Configuration system for LLM flexibility
   - Document summarization
   - Q&A functionality
   - Task generation system

### Pending Components

1. **Dashboard UI**
   - React + Tailwind frontend project
   - Document list/grid views
   - Metadata-rich preview panel

2. **Containerization & Deployment**
   - Docker configuration (created but not tested)
   - Deployment documentation

## File Structure

```
/
├── architecture.md        # System architecture documentation
├── todo.md                # Project todo list with progress
├── docker-compose.yml     # Docker Compose configuration
├── src/
│   ├── backend/           # Backend code
│   │   ├── app/           # Application code
│   │   │   ├── __init__.py
│   │   │   ├── api.py     # API routes
│   │   │   ├── config.py  # Configuration management
│   │   │   ├── database.py # Database connection
│   │   │   ├── llm.py     # LLM integration
│   │   │   ├── main.py    # Main application
│   │   │   ├── models.py  # Database models
│   │   │   ├── ocr.py     # OCR processing
│   │   │   ├── repository.py # Data repository
│   │   │   └── watcher.py # Folder monitoring
│   │   ├── Dockerfile     # Backend Dockerfile
│   │   └── requirements.txt # Python dependencies
│   └── frontend/          # Frontend code (placeholder)
│       └── Dockerfile     # Frontend Dockerfile
```

## Setup Instructions

### Prerequisites

- Docker and Docker Compose
- macOS environment
- Ollama installed locally (for development without Docker)

### Configuration

1. Create a `.env` file in the root directory with the following variables:
   ```
   INBOX_FOLDER=~/Documents/Inbox
   ARCHIVE_FOLDER=~/Documents/Archive
   LLM_MODEL=gwen2.5
   ```

2. Create the inbox and archive folders:
   ```bash
   mkdir -p ~/Documents/Inbox ~/Documents/Archive
   ```

### Running with Docker

1. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

2. Access the dashboard at http://localhost:3000

3. Access the API at http://localhost:8000/api

### Running Without Docker (Development)

1. Install backend dependencies:
   ```bash
   cd src/backend
   pip install -r requirements.txt
   ```

2. Start the backend server:
   ```bash
   cd src/backend
   uvicorn app.main:app --reload
   ```

3. Access the API at http://localhost:8000/api

## Next Steps

1. **Frontend Development**
   - Implement the React + Tailwind frontend
   - Create document list and detail views
   - Add filtering and search functionality

2. **Testing and Validation**
   - Test each component individually
   - Perform integration testing
   - Validate against original requirements

3. **Deployment**
   - Test Docker deployment on macOS
   - Create user documentation

## API Documentation

The API provides the following endpoints:

- `GET /api/documents`: Get a list of documents
- `GET /api/documents/{document_id}`: Get a document by ID
- `POST /api/documents`: Create a new document manually
- `PUT /api/documents/{document_id}`: Update a document
- `DELETE /api/documents/{document_id}`: Delete a document
- `POST /api/upload`: Upload a document for processing
- `POST /api/documents/{document_id}/tags`: Add a tag to a document
- `DELETE /api/documents/{document_id}/tags/{tag_id}`: Remove a tag from a document
- `POST /api/documents/{document_id}/tasks`: Create a task for a document

For detailed API documentation, access the Swagger UI at http://localhost:8000/docs when the backend is running.
