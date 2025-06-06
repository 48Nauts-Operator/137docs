<!--
This documentation was auto-generated by Claude on 2025-06-01T06-19-14.
Source file: ./src/backend/app/config.py
-->

# Configuration Management Module

## Overview

The configuration management module provides centralized settings management for the Document Management System. It leverages Pydantic for configuration validation and supports loading settings from environment variables and `.env` files.

## Module Structure

### Classes

#### `Settings`

A Pydantic-based configuration class that manages all application settings with type validation and environment variable integration.

**Inheritance:** `BaseSettings` (from Pydantic)

### Configuration Categories

#### Database Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `DATABASE_URL` | `str \| None` | Environment variable | Primary database connection URL |
| `DATABASE_PATH` | `str` | `{cwd}/documents.db` | SQLite database file path |

#### File Monitoring

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `WATCH_FOLDER` | `str` | `~/Documents/Inbox` | Directory monitored for new documents |

#### LLM Integration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `LLM_MODEL` | `str` | `"gwen2.5"` | Large Language Model identifier |
| `LLM_API_KEY` | `str` | Environment variable | API authentication key |
| `LLM_API_URL` | `str` | `"http://localhost:11434/api/generate"` | LLM service endpoint |

#### Authentication & Security

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `SECRET_KEY` | `str` | Default JWT key | Application secret for token signing |
| `ALGORITHM` | `str` | `"HS256"` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `int` | `30` | Token expiration duration |

#### Feature Toggles

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `NOTIFICATION_ENABLED` | `bool` | `True` | Enable system notifications |
| `AUTO_OCR` | `bool` | `True` | Automatic OCR processing |
| `AUTO_TAGGING` | `bool` | `True` | Automatic document tagging |

#### System Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `DEFAULT_CURRENCY` | `str` | `"USD"` | Default currency for financial documents |
| `HOSTFS_ROOT` | `str` | `"/hostfs"` | Container filesystem mount point |

#### Optional Extensions

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `hostfs_mount` | `str \| None` | `None` | Alternative filesystem mount |
| `archive_folder` | `str \| None` | `None` | Document archive location |
| `ollama_base_url` | `str \| None` | `None` | Ollama service URL |
| `litellm_url` | `str \| None` | `None` | LiteLLM service endpoint |
| `litellm_api` | `str \| None` | `None` | LiteLLM API configuration |

## Usage

### Basic Usage

```python
from config import settings

# Access configuration values
db_url = settings.DATABASE_URL
watch_dir = settings.WATCH_FOLDER
llm_model = settings.LLM_MODEL
```

### Environment Variables

The module supports configuration through environment variables:

```bash
export DATABASE_URL="postgresql://user:pass@localhost/docs"
export LLM_API_KEY="your-api-key"
export SECRET_KEY="your-secret-key"
export DEFAULT_CURRENCY="EUR"
```

### Environment File

Create a `.env` file in your project root:

```env
DATABASE_URL=postgresql://user:pass@localhost/docs
LLM_API_KEY=your-api-key
SECRET_KEY=your-secret-key
DEFAULT_CURRENCY=EUR
NOTIFICATION_ENABLED=false
```

## Compatibility

### Pydantic Version Support

The module includes a compatibility layer for Pydantic v1 and v2:

- **Pydantic v1.x**: Uses `pydantic.BaseSettings`
- **Pydantic v2.x**: Uses `pydantic_settings.BaseSettings`

This ensures seamless operation across different Pydantic versions.

## Configuration Behavior

### Environment Variable Priority

Settings are resolved in the following order:

1. Explicitly set environment variables
2. Values from `.env` file
3. Default values defined in the class

### Validation

All settings undergo Pydantic validation:

- Type checking
- Format validation
- Required field enforcement

### Error Handling

- Missing required environment variables raise validation errors
- Invalid types are automatically converted when possible
- Extra fields in environment/config files are ignored

## Security Considerations

⚠️ **Security Notice**: The default `SECRET_KEY` is provided for development only. Always set a unique, secure key in production environments.

```bash
# Generate a secure secret key
export SECRET_KEY=$(openssl rand -hex 32)
```

## Global Settings Instance

The module provides a pre-configured settings instance:

```python
# Global settings instance
settings = Settings()
```

This instance is immediately available for import and use throughout the application.