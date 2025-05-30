import asyncio
import sys
import os
sys.path.append('/app')

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.database import engine
from app.models import Document

async def check_processing():
    async with AsyncSession(engine) as session:
        # Check processing documents
        result = await session.execute(select(Document).filter(Document.status == 'processing'))
        docs = result.scalars().all()
        print(f'Documents with processing status: {len(docs)}')
        for doc in docs:
            print(f'  - {doc.title} (ID: {doc.id})')
        
        # Check recent documents
        result = await session.execute(text('SELECT id, title, status, created_at FROM documents ORDER BY created_at DESC LIMIT 5'))
        recent = result.fetchall()
        print(f'\nRecent documents:')
        for row in recent:
            print(f'  - {row[1]} (ID: {row[0]}, Status: {row[2]}, Created: {row[3]})')

if __name__ == "__main__":
    asyncio.run(check_processing()) 