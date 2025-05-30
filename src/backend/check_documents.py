#!/usr/bin/env python3
"""
Script to check document recipient assignments and identify issues.
"""
import asyncio
import sys
import os
sys.path.append('/app')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set the database URL to the correct location
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///src/backend/documents.db"

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, func
from app.models import Document, Entity, LLMConfig

# Create async engine directly
engine = create_async_engine(f"sqlite+aiosqlite:///src/backend/documents.db", echo=False)

async def check_documents():
    """Check document recipient status and identify problems."""
    print("🔍 Checking Document Recipient Assignments")
    print("=" * 60)
    
    async with AsyncSession(engine) as session:
        # 1. Check documents with problematic recipients
        result = await session.execute(
            select(Document.id, Document.title, Document.recipient, Document.sender)
            .where(
                (Document.recipient.is_(None)) |
                (Document.recipient == '') |
                (Document.recipient == 'Your Company') |
                (Document.recipient == 'Unknown')
            )
            .limit(15)
        )
        problematic_docs = result.all()
        
        print("❌ Documents with problematic recipients:")
        for doc in problematic_docs:
            print(f"  ID: {doc.id:3d} | {doc.title[:40]:<40} | Recipient: {doc.recipient!r:15} | Sender: {doc.sender}")
        
        if not problematic_docs:
            print("✅ No documents with problematic recipients found")
        
        # 2. Count total documents by recipient status
        result = await session.execute(
            select(func.count(Document.id))
            .where(
                (Document.recipient.is_(None)) |
                (Document.recipient == '') |
                (Document.recipient == 'Your Company') |
                (Document.recipient == 'Unknown')
            )
        )
        problematic_count = result.scalar()
        
        result = await session.execute(select(func.count(Document.id)))
        total_count = result.scalar()
        
        print(f"\n📊 Document Statistics:")
        print(f"  Total documents: {total_count}")
        print(f"  Problematic recipients: {problematic_count}")
        print(f"  Properly assigned: {total_count - problematic_count}")
        print(f"  Assignment rate: {((total_count - problematic_count) / total_count * 100):.1f}%" if total_count > 0 else "  Assignment rate: 0%")
        
        # 3. Check available tenants
        result = await session.execute(select(Entity.id, Entity.name, Entity.alias, Entity.type))
        tenants = result.all()
        
        print(f"\n👥 Available Tenants ({len(tenants)}):")
        for tenant in tenants:
            print(f"  ID: {tenant.id:3d} | {tenant.alias:<20} | Type: {tenant.type:<10} | Name: {tenant.name}")
        
        # 4. Check LLM configuration
        try:
            result = await session.execute(select(LLMConfig))
            llm_config = result.scalar_one_or_none()
            
            if llm_config:
                print(f"\n🧠 LLM Configuration:")
                print(f"  Enabled: {llm_config.enabled}")
                print(f"  Provider: {llm_config.provider}")
                print(f"  Auto-tagging: {llm_config.auto_tagging}")
                print(f"  Auto-enrichment: {llm_config.auto_enrichment}")
            else:
                print(f"\n🧠 LLM Configuration: Not found")
        except Exception as e:
            print(f"\n🧠 LLM Configuration: Error loading ({e})")
        
        # 5. Sample of documents with good recipients
        result = await session.execute(
            select(Document.id, Document.title, Document.recipient, Document.sender)
            .where(
                Document.recipient.isnot(None) &
                (Document.recipient != '') &
                (Document.recipient != 'Your Company') &
                (Document.recipient != 'Unknown')
            )
            .limit(5)
        )
        good_docs = result.all()
        
        if good_docs:
            print(f"\n✅ Examples of properly assigned documents:")
            for doc in good_docs:
                print(f"  ID: {doc.id:3d} | {doc.title[:40]:<40} | Recipient: {doc.recipient!r:15} | Sender: {doc.sender}")

if __name__ == "__main__":
    asyncio.run(check_documents()) 