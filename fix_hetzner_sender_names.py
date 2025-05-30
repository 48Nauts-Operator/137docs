#!/usr/bin/env python3
"""
Script to fix Hetzner invoice sender names that contain JSON strings.
This will clean up the sender field to show just "Hetzner Online GmbH".
"""
import asyncio
import sys
import json
import re

# Add the backend path to sys.path so we can import the modules
sys.path.insert(0, '/app')

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.database import async_engine
from app.models import Document

def extract_sender_name(sender_data):
    """Extract clean company name from sender data."""
    if not sender_data:
        return ""
    
    # If it's already a clean string, return it
    if isinstance(sender_data, str):
        # Check if it looks like JSON
        if sender_data.strip().startswith('{') and sender_data.strip().endswith('}'):
            try:
                # Try to parse as JSON
                data = json.loads(sender_data)
                if isinstance(data, dict):
                    # Try common name fields
                    for name_field in ['name', 'company', 'sender', 'company_name']:
                        if name_field in data and data[name_field]:
                            return str(data[name_field]).strip()
                    
                    # If no name field found, return the first non-empty string value
                    for key, value in data.items():
                        if isinstance(value, str) and value.strip():
                            return value.strip()
            except json.JSONDecodeError:
                pass
        
        return sender_data.strip()
    
    return str(sender_data).strip()

async def fix_hetzner_sender_names():
    """Fix Hetzner invoice sender names that contain JSON strings."""
    
    async with AsyncSession(async_engine) as session:
        # Find all Hetzner documents with problematic sender names
        result = await session.execute(
            select(Document).where(
                Document.sender.ilike('%hetzner%')
            )
        )
        hetzner_docs = result.scalars().all()
        
        print(f"Found {len(hetzner_docs)} Hetzner documents to check:")
        
        fixed_count = 0
        for doc in hetzner_docs:
            original_sender = doc.sender
            cleaned_sender = extract_sender_name(original_sender)
            
            print(f"\nDocument ID {doc.id}:")
            print(f"  Original: {original_sender}")
            print(f"  Cleaned:  {cleaned_sender}")
            
            if original_sender != cleaned_sender:
                # Update the document
                await session.execute(
                    update(Document)
                    .where(Document.id == doc.id)
                    .values(sender=cleaned_sender)
                )
                fixed_count += 1
                print(f"  ✅ Fixed!")
            else:
                print(f"  ✓ Already clean")
        
        if fixed_count > 0:
            await session.commit()
            print(f"\n🎉 Successfully fixed {fixed_count} Hetzner invoice sender names!")
        else:
            print(f"\n✓ All Hetzner invoice sender names are already clean.")

if __name__ == "__main__":
    asyncio.run(fix_hetzner_sender_names()) 