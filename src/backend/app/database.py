"""
Database connection and session management for the Document Management System.
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# Resolve DB URL – prefer explicit DATABASE_URL env, fallback to local SQLite
if settings.DATABASE_URL:
    ASYNC_DATABASE_URL = settings.DATABASE_URL
else:
    ASYNC_DATABASE_URL = f"sqlite+aiosqlite:///{settings.DATABASE_PATH}"

# Create async engine
async_engine = create_async_engine(ASYNC_DATABASE_URL, pool_pre_ping=True)

# Alias for legacy imports expecting `engine`
engine = async_engine

# Create async session factory
async_session = sessionmaker(
    async_engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# Create declarative base
Base = declarative_base()

# Dependency to get DB session
async def get_db():
    """
    Dependency for FastAPI to get a database session.
    Yields an async session and ensures it's closed after use.
    """
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
