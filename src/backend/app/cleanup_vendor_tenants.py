#!/usr/bin/env python3
"""
Cleanup script to remove vendor companies that were incorrectly created as tenants.
These companies should be senders/vendors, not recipients/tenants.
"""
import asyncio
import sys
import os

# Add the src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from sqlalchemy.ext.asyncio import AsyncSession
from app.database import engine
from app.models import Entity, Document
from sqlalchemy import select, or_

async def cleanup_vendor_tenants():
    """Remove vendor companies that were incorrectly created as tenants."""
    
    # Known vendor companies that should NOT be tenants
    vendor_names = [
        "Hetzner Online GmbH", "Hetzner",
        "Team Blockonauts", "Blockonauts", 
        "Impact Labs", "21 Impact Labs AG",
        "Chainstack Pte.", "Chainstack",
        "GitBook", "GitBook (Company)",
        "Digital Ocean", "DigitalOcean",
        "Candoo Labs", "Candoo Labs (Company)",
        "Validity Labs", "Validity Labs (Company)",
        "DAT AG", "DAT AG (Company)"
    ]
    
    async with AsyncSession(engine) as session:
        print("🔍 Searching for vendor companies incorrectly created as tenants...")
        
        # Find entities (tenants) with vendor names
        vendor_conditions = [Entity.name.ilike(f"%{name}%") for name in vendor_names]
        vendor_conditions.extend([Entity.alias.ilike(f"%{name}%") for name in vendor_names])
        
        result = await session.execute(
            select(Entity).where(or_(*vendor_conditions))
        )
        vendor_tenants = result.scalars().all()
        
        if not vendor_tenants:
            print("✅ No vendor companies found in tenant list - all clean!")
            return
        
        print(f"Found {len(vendor_tenants)} vendor companies incorrectly created as tenants:")
        for tenant in vendor_tenants:
            print(f"  - ID: {tenant.id}, Name: {tenant.name}, Alias: {tenant.alias}")
        
        # Check which documents are using these vendor tenants as recipients
        affected_docs = []
        for tenant in vendor_tenants:
            docs_result = await session.execute(
                select(Document).where(Document.recipient == tenant.alias)
            )
            docs = docs_result.scalars().all()
            if docs:
                affected_docs.extend([(doc, tenant) for doc in docs])
        
        if affected_docs:
            print(f"\n📋 Found {len(affected_docs)} documents using vendor tenants as recipients:")
            for doc, tenant in affected_docs:
                print(f"  - Doc ID: {doc.id}, Title: {doc.title[:50]}..., Using: {tenant.alias}")
            
            # Reset recipient field for affected documents
            print(f"\n🔄 Resetting recipient field for {len(affected_docs)} documents...")
            for doc, tenant in affected_docs:
                doc.recipient = None  # Reset to allow re-processing
                print(f"  ✓ Reset document {doc.id}")
        
        # Remove vendor tenant entities
        print(f"\n🗑️  Removing {len(vendor_tenants)} vendor tenant entities...")
        for tenant in vendor_tenants:
            await session.delete(tenant)
            print(f"  ✓ Removed tenant: {tenant.name} ({tenant.alias})")
        
        # Commit changes
        await session.commit()
        
        print(f"\n🎉 Cleanup completed successfully!")
        print(f"   - Removed {len(vendor_tenants)} vendor tenant entities")
        print(f"   - Reset {len(affected_docs)} document recipients for re-processing")
        print("\n💡 Tip: Run 'Run Batch Processing' in Settings > Automation to re-process these documents")

if __name__ == "__main__":
    asyncio.run(cleanup_vendor_tenants()) 