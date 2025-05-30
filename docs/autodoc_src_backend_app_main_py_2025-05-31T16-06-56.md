<!--
This documentation was auto-generated by Claude on 2025-05-31T16-06-56.
Source file: ./src/backend/app/main.py
-->

# Document Management System API Documentation

## Overview

The Document Management System API is a comprehensive FastAPI-based application that provides document processing, OCR capabilities, LLM integration, and analytics for managing documents, invoices, and business data.

## Features

- **Document Management**: Upload, process, and organize documents with OCR
- **LLM Integration**: Automated metadata extraction and document analysis
- **Authentication**: JWT-based authentication with role-based access control
- **Address Book**: Contact and vendor management
- **Analytics**: Document and financial analytics with reporting
- **Search**: Text, semantic, and vision-based search capabilities
- **Calendar**: Export due dates and events to calendar formats
- **Tenant Management**: Multi-tenant support for organizations
- **Processing Rules**: Automated document processing workflows

## Dependencies

```python
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form, BackgroundTasks, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, update, func, or_
```

## Application Configuration

### FastAPI App Initialization

```python
app = FastAPI(
    title="Document Management System API",
    description="API for managing documents, OCR processing, and analytics",
    version="1.0.0",
)
```

### CORS Configuration

The application is configured with permissive CORS settings for development. In production, `allow_origins` should be restricted to specific domains.

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Core Services

### Document Processing

The system automatically processes documents through:

1. **OCR Processing**: Extract text from PDF and image files
2. **LLM Analysis**: Extract metadata, entities, and structured data
3. **Vector Embeddings**: Generate embeddings for semantic search
4. **Address Book Integration**: Automatically enrich vendor information

### Folder Watcher

Monitors a specified directory for new documents and processes them automatically:

```python
async def process_new_document(file_path: str):
    """Process a new document detected by the folder watcher."""
    # OCR processing
    text = await ocr_processor.process_document(file_path)
    
    # LLM metadata extraction
    metadata = await llm_service.extract_metadata(text)
    
    # Database storage with deduplication
    # Vector embedding generation
    # Address book enrichment
```

## API Endpoints

### Authentication

#### POST `/api/auth/login`
Authenticate user and return JWT token.

**Parameters:**
- `username` (form): Username
- `password` (form): Password

**Response:**
```json
{
    "access_token": "jwt_token",
    "token_type": "bearer"
}
```

#### GET `/api/auth/me`
Get current user information.

**Response:**
```json
{
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "disabled": false
}
```

#### POST `/api/auth/change-password`
Change current user's password.

**Parameters:**
- `old_password` (form): Current password
- `new_password` (form): New password

### Documents

#### GET `/api/documents`
Retrieve documents with optional filtering.

**Query Parameters:**
- `status` (optional): Filter by document status
- `document_type` (optional): Filter by document type
- `search` (optional): Text search query

**Response:**
```json
[
    {
        "id": 1,
        "title": "Invoice 2024-001",
        "document_type": "invoice",
        "sender": "Company XYZ",
        "amount": 1500.00,
        "currency": "CHF",
        "status": "pending"
    }
]
```

#### GET `/api/documents/{document_id}`
Get specific document by ID.

#### PUT `/api/documents/{document_id}`
Update document fields.

**Parameters:**
- `title` (form, optional): Document title
- `document_type` (form, optional): Document type
- `sender` (form, optional): Sender name
- `recipient` (form, optional): Recipient name
- `document_date` (form, optional): Document date (YYYY-MM-DD)
- `due_date` (form, optional): Due date (YYYY-MM-DD)
- `amount` (form, optional): Amount
- `currency` (form, optional): Currency code
- `status` (form, optional): Document status

#### DELETE `/api/documents/{document_id}`
Delete a document.

#### POST `/api/documents/upload`
Upload a new document for processing.

**Parameters:**
- `file` (file): Document file (PDF, image)

#### GET `/api/documents/{document_id}/file`
Download the original document file.

**Query Parameters:**
- `api_key` (optional): API key for token-less access

### Tags

#### GET `/api/documents/{document_id}/tags`
Get tags for a specific document.

#### POST `/api/documents/{document_id}/tags`
Add a tag to a document.

**Parameters:**
- `tag` (form): Tag name

#### DELETE `/api/documents/{document_id}/tags/{tag_name}`
Remove a tag from a document.

### Address Book

#### GET `/api/address-book`
List all address book entries.

#### POST `/api/address-book`
Create a new address book entry.

**Parameters:**
- `name` (form): Entity name
- `entity_type` (form): Entity type ("company", "person")
- `email` (form, optional): Email address
- `phone` (form, optional): Phone number
- `street` (form, optional): Street address
- `town` (form, optional): City/town
- `country` (form, optional): Country
- `vat_id` (form, optional): VAT identification number

#### PUT `/api/address-