#!/usr/bin/env python3
"""
Initialize the database with all tables.
"""
import asyncio
import sys
import os
sys.path.append('/app')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine
from app.models import Base
from app.config import settings

async def init_database():
    """Initialize the database with all tables."""
    print("🗄️ Initializing Database")
    print("=" * 40)
    
    # Create engine
    if settings.DATABASE_URL:
        DATABASE_URL = settings.DATABASE_URL
    else:
        DATABASE_URL = f"sqlite+aiosqlite:///{settings.DATABASE_PATH}"
    
    print(f"Database URL: {DATABASE_URL}")
    
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    try:
        # Create all tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        print("\n✅ Database initialized successfully!")
        print("📊 Tables created:")
        print("  - users")
        print("  - documents") 
        print("  - entities (tenants)")
        print("  - user_entities")
        print("  - llm_config")
        print("  - address_book")
        print("  - tags")
        print("  - document_tag")
        print("  - notifications")
        print("  - settings")
        print("  - vectors")
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_database()) 