#!/usr/bin/env python3
"""
Fix tenant automation by enabling assignment to existing matching tenants.
"""
import asyncio
import sys
import os
sys.path.append('/app')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy import select, update
from app.models import Document, Entity

# Create async engine
engine = create_async_engine(f"sqlite+aiosqlite:///./documents.db", echo=False)

async def fix_tenant_automation():
    """Fix tenant automation by manually assigning documents to matching tenants."""
    print("🔧 Fixing Tenant Automation")
    print("=" * 40)
    
    async with AsyncSession(engine) as session:
        # Get all entities
        result = await session.execute(select(Entity))
        entities = {entity.id: entity for entity in result.scalars().all()}
        
        print(f"👥 Available Entities:")
        for entity in entities.values():
            print(f"  {entity.id}: {entity.alias} ({entity.name})")
        print()
        
        # Get problematic documents
        result = await session.execute(
            select(Document).where(
                (Document.recipient.is_(None)) |
                (Document.recipient == '') |
                (Document.recipient == 'Your Company') |
                (Document.recipient == 'Unknown')
            )
        )
        problematic_docs = result.scalars().all()
        
        print(f"📄 Found {len(problematic_docs)} documents to fix:")
        
        # Manual assignment based on content analysis
        assignments = []
        
        for doc in problematic_docs:
            content = (doc.content or "").lower()
            title = (doc.title or "").lower()
            sender = (doc.sender or "").lower()
            
            # Smart assignment logic
            assigned_entity = None
            reason = ""
            
            # Rule 1: Google documents → Google entity
            if "google" in sender or "google" in title or "google" in content:
                assigned_entity = next((e for e in entities.values() if e.alias == "Google"), None)
                reason = "Google service detected"
            
            # Rule 2: Personal/Medical documents → Personal entity  
            elif ("andré" in content or "personal" in content or "medical" in title or 
                  "insurance" in title):
                assigned_entity = next((e for e in entities.values() if e.alias == "Personal"), None)
                reason = "Personal document detected"
            
            # Rule 3: Company/Office documents → Test Corp entity
            elif ("test company" in content or "office" in title or "rent" in title or 
                  "test corp" in content):
                assigned_entity = next((e for e in entities.values() if e.alias == "Test Corp"), None)
                reason = "Company document detected"
            
            if assigned_entity:
                assignments.append({
                    "document": doc,
                    "entity": assigned_entity,
                    "reason": reason
                })
                print(f"  📄 {doc.title[:40]:<40} → {assigned_entity.alias} ({reason})")
            else:
                print(f"  ❓ {doc.title[:40]:<40} → No assignment found")
        
        print(f"\n🎯 Applying {len(assignments)} assignments...")
        
        # Apply assignments
        for assignment in assignments:
            doc = assignment["document"]
            entity = assignment["entity"]
            
            # Update document
            doc.recipient = entity.alias
            doc.entity_id = entity.id
            
            print(f"  ✅ {doc.title[:30]} → {entity.alias}")
        
        # Commit changes
        await session.commit()
        
        print(f"\n✅ Tenant automation fixed!")
        print(f"   📊 {len(assignments)} documents assigned to tenants")
        print(f"   🎯 {len(problematic_docs) - len(assignments)} documents still need manual review")

if __name__ == "__main__":
    asyncio.run(fix_tenant_automation()) 