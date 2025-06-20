<!-- Auto-generated by Claude on 2025-06-08 06:13 -->

# Document Status Checker

## Overview

This Python script is a diagnostic utility designed to monitor and display the status of documents in a database. It provides insights into document processing workflows by showing both documents currently being processed and recently created documents.

## Purpose

The script serves as a **monitoring and debugging tool** for document management systems, allowing administrators and developers to:

- Monitor documents stuck in "processing" status
- View recent document activity
- Debug document workflow issues
- Perform quick database health checks

## Dependencies

The script requires the following modules:

- `asyncio` - For asynchronous execution
- `sqlalchemy` - For database operations
- Custom application modules:
  - `app.database` - Database engine configuration
  - `app.models` - Document model definitions

## Key Components

### Main Function: `check_processing()`

```python
async def check_processing():
```

This asynchronous function performs two main database queries:

#### 1. Processing Documents Check
- **Purpose**: Identifies documents currently in "processing" status
- **Query**: Filters documents by `status == 'processing'`
- **Output**: Count and details of processing documents

#### 2. Recent Documents Overview
- **Purpose**: Shows the 5 most recently created documents
- **Query**: Raw SQL query ordered by `created_at DESC`
- **Output**: Document details including ID, title, status, and creation timestamp

### Database Operations

The script uses SQLAlchemy's async session management:

```python
async with AsyncSession(engine) as session:
```

This ensures proper connection handling and automatic cleanup.

## Usage

Run the script directly from the command line:

```bash
python check_processing.py
```

### Sample Output

```
Documents with processing status: 2
  - Annual Report 2023 (ID: 123)
  - Marketing Proposal (ID: 145)

Recent documents:
  - Project Summary (ID: 156, Status: completed, Created: 2023-12-01 14:30:22)
  - Budget Analysis (ID: 155, Status: processing, Created: 2023-12-01 12:15:33)
  - Team Meeting Notes (ID: 154, Status: completed, Created: 2023-11-30 16:45:12)
```

## Important Notes

### Path Configuration
```python
sys.path.append('/app')
```
⚠️ **Note**: The script assumes the application is located at `/app`. This suggests it's designed to run in a containerized environment (likely Docker).

### Database Connection
- Uses the application's existing database engine configuration
- Assumes the `Document` model has at minimum: `id`, `title`, `status`, and `created_at` fields

## Suggestions for Improvement

### 1. Error Handling
Add try-catch blocks for database connection issues:

```python
try:
    async with AsyncSession(engine) as session:
        # existing code
except Exception as e:
    print(f"Database error: {e}")
```

### 2. Configuration
Make the path and query limits configurable:

```python
LIMIT = int(os.getenv('RECENT_DOCS_LIMIT', 5))
```

### 3. Logging
Replace print statements with proper logging:

```python
import logging
logging.info(f'Documents with processing status: {len(docs)}')
```

### 4. Additional Metrics
Consider adding:
- Count of documents by status
- Average processing time
- Documents older than a threshold in "processing" status

## Use Cases

- **DevOps Monitoring**: Include in health check scripts
- **Debugging**: Identify bottlenecks in document processing
- **Operations**: Regular status reporting
- **Development**: Quick database state verification during testing