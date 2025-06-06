<!--
This documentation was auto-generated by Claude on 2025-06-01T06-23-11.
Source file: ./src/backend/app/repository.py
-->

# Document Repository Documentation

## Overview

This module provides data access layer (repository pattern) implementations for document management operations. It includes repositories for documents, users, LLM configurations, tenants (entities), and processing rules.

## Classes

### DocumentRepository

Repository class for managing document-related database operations.

#### Methods

##### `create(db: AsyncSession, document: Document) -> Document`

Creates a new document in the database.

**Parameters:**
- `db` (AsyncSession): Database session for the operation
- `document` (Document): Document instance to create

**Returns:**
- `Document`: The created document with populated database fields

**Example:**
```python
repo = DocumentRepository()
new_doc = Document(title="Sample", content="Content")
created = await repo.create(db, new_doc)
```

##### `get_by_id(db: AsyncSession, document_id: int, as_dict: bool = False) -> Optional[Union[Document, Dict[str, Any]]]`

Retrieves a document by its ID with associated tags loaded.

**Parameters:**
- `db` (AsyncSession): Database session
- `document_id` (int): ID of the document to retrieve
- `as_dict` (bool, optional): Return as dictionary instead of model instance. Defaults to False

**Returns:**
- `Optional[Union[Document, Dict[str, Any]]]`: Document instance/dict if found, None otherwise

##### `get_all(db: AsyncSession, status: Optional[str] = None, document_type: Optional[str] = None, search: Optional[str] = None) -> List[Union[Document, Dict[str, Any]]]`

Retrieves all documents with optional filtering and searching capabilities.

**Parameters:**
- `db` (AsyncSession): Database session
- `status` (Optional[str]): Filter by document status
- `document_type` (Optional[str]): Filter by document type
- `search` (Optional[str]): Search term for title, content, or sender

**Returns:**
- `List[Union[Document, Dict[str, Any]]]`: List of documents as dictionaries, ordered by creation date (descending)

**Search Behavior:**
- Performs case-insensitive search across title, content, and sender fields
- Multiple filters are combined with AND logic

##### `update(db: AsyncSession, document: Document) -> Document`

Updates an existing document in the database.

**Parameters:**
- `db` (AsyncSession): Database session
- `document` (Document): Document instance with updated values

**Returns:**
- `Document`: The updated document with refreshed database state

##### `delete(db: AsyncSession, document_id: int) -> bool`

Deletes a document and its tag associations.

**Parameters:**
- `db` (AsyncSession): Database session
- `document_id` (int): ID of the document to delete

**Returns:**
- `bool`: True if document was deleted, False if document not found

**Note:** This method safely removes tag associations first to avoid async lazy-loading issues, then deletes the document.

##### `add_tag(db: AsyncSession, document_id: int, tag_name: str) -> bool`

Adds a tag to a document, creating the tag if it doesn't exist.

**Parameters:**
- `db` (AsyncSession): Database session
- `document_id` (int): ID of the target document
- `tag_name` (str): Name of the tag to add

**Returns:**
- `bool`: True if tag was added, False if document not found

##### `remove_tag(db: AsyncSession, document_id: int, tag_name: str) -> bool`

Removes a tag from a document.

**Parameters:**
- `db` (AsyncSession): Database session
- `document_id` (int): ID of the target document
- `tag_name` (str): Name of the tag to remove

**Returns:**
- `bool`: True if tag was removed, False if document or tag not found

##### `get_tags(db: AsyncSession, document_id: int) -> List[str]`

Retrieves all tag names associated with a document.

**Parameters:**
- `db` (AsyncSession): Database session
- `document_id` (int): ID of the target document

**Returns:**
- `List[str]`: List of tag names, empty list if document not found

#### Static Methods

##### `_to_dict(doc: Document, include_tags: bool = True) -> Dict[str, Any]`

Converts a Document model instance to a JSON-serializable dictionary.

**Parameters:**
- `doc` (Document): Document instance to convert
- `include_tags` (bool): Whether to include tags in the output. Defaults to True

**Returns:**
- `Dict[str, Any]`: Serializable dictionary representation

**Features:**
- Converts vector embeddings to float lists
- Handles datetime serialization to ISO format
- Converts numpy types and decimals to JSON-compatible types
- Flattens tag relationships to simple name lists
- Strips SQLAlchemy internal state

---

### UserRepository

Repository for user management operations.

#### Methods

##### `get_all(db: AsyncSession) -> List[dict]`

Retrieves all users ordered by creation date.

##### `get_by_id(db: AsyncSession, user_id: int) -> Optional[dict]`

Retrieves a user by ID as a dictionary.

##### `get_by_username(db: AsyncSession, username: str) -> Optional[UserDB]`

Retrieves a user by username, returning the actual model instance for authentication.

##### `create(db: AsyncSession, **data) -> dict`

Creates a new user with the provided data.

##### `update(db: AsyncSession, user_id: int, **data) -> Optional[dict]`

Updates user information by ID.

##### `delete(db: AsyncSession, user_id: int) -> bool`

Deletes a user by ID, returns True if successful.

---

### LLMConfigRepository

Repository for managing Large Language Model configuration settings.

#### Methods

##### `get_config(db: AsyncSession) -> Optional[dict]`

Retrieves the current LLM configuration (singleton pattern).

##### `create_default_config(db: AsyncSession) -> dict`

Creates a default LLM configuration with model defaults.

##### `update_config(db: AsyncSession, **data) -> dict`

Updates or creates LLM configuration