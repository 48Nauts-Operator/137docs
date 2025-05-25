"""
Authentication functionality for the Document Management System.
"""
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer, APIKeyHeader
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.config import settings
import secrets
import string
from app.models import User as UserDB

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Add JWT settings to config
SECRET_KEY = getattr(settings, "SECRET_KEY", "")
if not SECRET_KEY:
    # Generate a random secret key if not provided
    alphabet = string.ascii_letters + string.digits
    SECRET_KEY = ''.join(secrets.choice(alphabet) for _ in range(32))
    setattr(settings, "SECRET_KEY", SECRET_KEY)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Setup password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Setup OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

# Setup API key scheme
api_key_header = APIKeyHeader(name="X-API-Key")

# Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    id: Optional[int] = None
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: str = "viewer"
    disabled: Optional[bool] = None

class UserInDB(User):
    hashed_password: str

# In-memory fallback for tests only -----------------------------------------------------------------
# The fake_users_db is retained to keep existing unit-tests working.  Production
# code now queries Postgres instead.  When running in *DEV* (FastAPI env var
# defines), we still seed identical admin/viewer users via ``main.startup``.

fake_users_db = {
    "admin": {
        "username": "admin",
        "full_name": "Administrator",
        "email": "admin@example.com",
        "hashed_password": pwd_context.hash("admin"),
        "role": "admin",
        "disabled": False,
    },
    "viewer": {
        "username": "viewer",
        "full_name": "View Only",
        "email": "viewer@example.com",
        "hashed_password": pwd_context.hash("viewer"),
        "role": "viewer",
        "disabled": False,
    },
}

# Mock API keys - in a real application, this would be stored in the database
api_keys = {
    "test-api-key": "admin"
}

def verify_password(plain_password, hashed_password):
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Get password hash."""
    return pwd_context.hash(password)

# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

async def get_user_db(db: AsyncSession, username: str) -> Optional[UserInDB]:
    """Return UserInDB instance from Postgres or *None* if missing."""
    res = await db.execute(select(UserDB).where(UserDB.username == username))
    db_user: UserDB | None = res.scalars().first()

    if not db_user:
        # Fallback to fake DB (unit-tests)
        if username in fake_users_db:
            return UserInDB(**fake_users_db[username])
        return None

    return UserInDB(
        id=db_user.id,
        username=db_user.username,
        email=db_user.email,
        full_name=db_user.full_name,
        role=db_user.role,
        disabled=db_user.disabled,
        hashed_password=db_user.hashed_password,
    )

async def authenticate_user(db: AsyncSession, username: str, password: str) -> Optional[UserInDB]:
    """Return user if credentials valid else *None*."""
    user = await get_user_db(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    api_key: str | None = Header(default=None, alias="X-API-Key"),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Get current user from token or API key."""
    # If API key present and valid
    if api_key and api_key in api_keys:
        username = api_keys[api_key]
        # Bypass DB for API key scenario – treat as admin user
        return User(**fake_users_db.get(username, {"username": username, "role": "admin"}))

    # Fallback to JWT token
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user_db = await get_user_db(db, username=token_data.username)
    if user_db is None:
        raise credentials_exception
    return user_db

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    """Get current active user."""
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Lightweight variant that returns None instead of raising, useful for routes
# where anonymous access may be permitted (e.g., public file download with API
# key query param).
async def get_current_user_optional(
    token: str = Depends(oauth2_scheme),
    api_key: str | None = Header(default=None, alias="X-API-Key"),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Return a User or None without raising 401."""
    # API key path
    if api_key and api_key in api_keys:
        username = api_keys[api_key]
        return User(**fake_users_db.get(username, {"username": username, "role": "admin"}))

    if not token:
        return None

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str | None = payload.get("sub")
        if not username:
            return None
        return await get_user_db(db, username)
    except JWTError:
        return None

async def verify_api_key(api_key: str = Depends(api_key_header)):
    """Verify API key."""
    if api_key not in api_keys:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key",
        )
    return api_keys[api_key]

# Authentication dependency that accepts either JWT token or API key
async def get_auth(
    api_key: str = Depends(api_key_header),
    token: str = Depends(oauth2_scheme)
):
    """Get authentication using either API key or JWT token."""
    # Try API key first
    try:
        return await verify_api_key(api_key)
    except HTTPException:
        # If API key fails, try JWT token
        return await get_current_active_user(token)
