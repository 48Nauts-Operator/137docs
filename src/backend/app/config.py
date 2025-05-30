"""
Configuration management for the Document Management System.
"""
import os
# ---------------------------------------------------------------------------
# Pydantic v1 / v2 compatibility layer
# ---------------------------------------------------------------------------

try:
    # Pydantic < 2.0
    from pydantic import BaseSettings  # type: ignore
except (ImportError, AttributeError):  # pragma: no cover – v2.x only
    # From Pydantic 2.0 onwards BaseSettings moved to separate package
    from pydantic_settings import BaseSettings  # type: ignore

class Settings(BaseSettings):
    """Application settings."""
    
    # Database settings
    DATABASE_URL: str | None = os.getenv("DATABASE_URL")
    DATABASE_PATH: str = os.path.join(os.getcwd(), "documents.db")
    
    # Folder monitoring settings
    WATCH_FOLDER: str = os.path.join(os.path.expanduser("~"), "Documents", "Inbox")
    
    # LLM settings
    LLM_MODEL: str = "gwen2.5"
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_API_URL: str = os.getenv("LLM_API_URL", "http://localhost:11434/api/generate")
    
    # Authentication settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Feature flags
    NOTIFICATION_ENABLED: bool = True
    AUTO_OCR: bool = True
    AUTO_TAGGING: bool = True
    
    # Application defaults
    DEFAULT_CURRENCY: str = os.getenv("DEFAULT_CURRENCY", "USD")
    
    # Host filesystem mount root inside the container – used by the file-browser API
    HOSTFS_ROOT: str = os.getenv("HOSTFS_ROOT", "/hostfs")
    
    # Additional fields that might be passed from environment/config
    hostfs_mount: str | None = None
    archive_folder: str | None = None
    ollama_base_url: str | None = None
    litellm_url: str | None = None
    litellm_api: str | None = None
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Allow extra fields to be ignored

# Create settings instance
settings = Settings()
