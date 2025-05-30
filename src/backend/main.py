from pathlib import Path
import os
import shutil
import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uvicorn

from database import get_db, init_database
from models import Document, User, Tenant, ProcessingRule
from schemas import DocumentCreate, DocumentUpdate, DocumentResponse, UserCreate, UserResponse, TenantCreate, TenantUpdate, TenantResponse, ProcessingRuleCreate, ProcessingRuleUpdate, ProcessingRuleResponse
from auth import create_access_token, verify_token, hash_password, verify_password, get_current_user
from document_service import DocumentService
from utils import save_uploaded_file, cleanup_temp_files
from vision_ai import VisionAnalyzer, LLMNotConfiguredError
from tenant_extractor import TenantExtractor
from tenant_auto_assigner import TenantAutoAssigner
from document_rule_processor import DocumentRuleProcessor
from rule_repository import RuleRepository
from version import get_version, get_release_info, get_version_history 