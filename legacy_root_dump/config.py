"""
Configuration management for the Document Management System.
"""
import os
import yaml
from pydantic import BaseSettings
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings(BaseSettings):
    """Application settings."""
    # App settings
    APP_NAME: str = "Document Management System"
    APP_VERSION: str = "0.1.0"
    
    # File paths
    INBOX_FOLDER: str = os.getenv("INBOX_FOLDER", "~/Documents/Inbox")
    ARCHIVE_FOLDER: str = os.getenv("ARCHIVE_FOLDER", "~/Documents/Archive")
    
    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./documents.db")
    
    # OCR settings
    OCR_ENGINE: str = os.getenv("OCR_ENGINE", "tesseract")
    TESSERACT_CMD: Optional[str] = os.getenv("TESSERACT_CMD")
    
    # LLM settings
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "ollama")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gwen2.5")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    
    # API settings
    API_KEY: Optional[str] = os.getenv("API_KEY")
    
    # File types
    ALLOWED_FILE_TYPES: List[str] = ["pdf", "jpg", "jpeg", "png"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

def load_yaml_config(config_path: str = "config.yaml") -> Dict[str, Any]:
    """Load configuration from YAML file."""
    if os.path.exists(config_path):
        with open(config_path, "r") as f:
            return yaml.safe_load(f)
    return {}

def get_settings() -> Settings:
    """Get application settings with YAML config overrides."""
    settings = Settings()
    
    # Override with YAML config if available
    yaml_config = load_yaml_config()
    if yaml_config:
        for key, value in yaml_config.items():
            if hasattr(settings, key):
                setattr(settings, key, value)
    
    # Expand user paths
    settings.INBOX_FOLDER = os.path.expanduser(settings.INBOX_FOLDER)
    settings.ARCHIVE_FOLDER = os.path.expanduser(settings.ARCHIVE_FOLDER)
    
    # Create folders if they don't exist
    os.makedirs(settings.INBOX_FOLDER, exist_ok=True)
    os.makedirs(settings.ARCHIVE_FOLDER, exist_ok=True)
    
    return settings

# Create settings instance
settings = get_settings()
