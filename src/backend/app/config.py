"""
Configuration management for the Document Management System.
"""
import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    """Application settings."""
    
    # Database settings
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
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# Create settings instance
settings = Settings()
