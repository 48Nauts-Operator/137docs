#!/usr/bin/env python3
"""
Comprehensive test script for tenant automation issues.
"""
import asyncio
import sys
import os
sys.path.append('/app')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from app.agents.tenant_agent import TenantExtractionAgent
from app.models import Document, Entity, LLMConfig

# Create async engine
engine = create_async_engine(f"sqlite+aiosqlite:///./documents.db", echo=False)

async def test_tenant_automation():
    """Test tenant automation on the problematic documents."""
    print("🔧 Testing Tenant Automation System")
    print("=" * 60)
    
    async with AsyncSession(engine) as session:
        # 1. Test the tenant extraction agent
        agent = TenantExtractionAgent(session)
        
        # 2. Get all problematic documents
        from sqlalchemy import select
        result = await session.execute(
            select(Document).where(
                (Document.recipient.is_(None)) |
                (Document.recipient == '') |
                (Document.recipient == 'Your Company') |
                (Document.recipient == 'Unknown')
            )
        )
        problematic_docs = result.scalars().all()
        
        print(f"📄 Found {len(problematic_docs)} documents with problematic recipients")
        print()
        
        # 3. Test tenant extraction on each document
        for i, doc in enumerate(problematic_docs, 1):
            print(f"🔍 Testing Document {i}/{len(problematic_docs)}: {doc.title}")
            print(f"   Current recipient: {doc.recipient!r}")
            print(f"   Sender: {doc.sender}")
            print(f"   Content preview: {(doc.content or '')[:100]}...")
            
            try:
                # Test tenant extraction (user_id = 1)
                result = await agent.analyze_and_assign_tenant(doc.id, 1)
                
                print(f"   ✅ Result: {result['status']}")
                print(f"   📝 Message: {result['message']}")
                
                if result['status'] == 'success':
                    tenant = result['tenant']
                    print(f"   🎯 Assigned to: {tenant['alias']} (ID: {tenant['id']})")
                    print(f"   📊 Confidence: {result.get('confidence', 'N/A')}")
                elif 'extracted_info' in result:
                    extracted = result['extracted_info']
                    print(f"   📋 Extracted: {extracted.get('name', 'N/A')} (confidence: {extracted.get('confidence', 'N/A')})")
                
                print()
                
            except Exception as e:
                print(f"   ❌ Error: {e}")
                print()
        
        # 4. Test simple tenant extraction directly
        print("🧪 Testing Simple Tenant Extraction (without LLM)")
        print("-" * 50)
        
        for doc in problematic_docs[:2]:  # Test first 2 docs
            print(f"📄 Document: {doc.title}")
            try:
                extracted_info = await agent._simple_tenant_extraction(doc)
                if extracted_info:
                    print(f"   ✅ Extracted: {extracted_info['name']} (confidence: {extracted_info['confidence']})")
                    print(f"   🏷️ Alias: {extracted_info['alias']}")
                    print(f"   🏢 Type: {extracted_info['type']}")
                else:
                    print(f"   ❌ No extraction possible")
            except Exception as e:
                print(f"   ❌ Error: {e}")
            print()
        
        # 5. Check tenant matching capability
        print("👥 Testing Tenant Matching")
        print("-" * 30)
        
        # Get existing entities
        result = await session.execute(select(Entity))
        entities = result.scalars().all()
        
        # Convert to dict format expected by the agent
        existing_tenants = []
        for entity in entities:
            existing_tenants.append({
                "id": entity.id,
                "name": entity.name,
                "alias": entity.alias,
                "type": entity.type
            })
        
        # Test matching for extracted info
        test_cases = [
            {"name": "Google LLC", "alias": "Google", "confidence": 0.8},
            {"name": "André Wolke", "alias": "Personal", "confidence": 0.7},
            {"name": "Test Company Ltd.", "alias": "Test Corp", "confidence": 0.9},
            {"name": "Unknown Recipient", "alias": "Unknown", "confidence": 0.3}
        ]
        
        for test_case in test_cases:
            print(f"🔍 Testing match for: {test_case['name']}")
            match = agent._find_matching_tenant(test_case, existing_tenants)
            if match:
                print(f"   ✅ Matched: {match['alias']} (ID: {match['id']})")
            else:
                print(f"   ❌ No match found (threshold: 0.8)")
            print()

if __name__ == "__main__":
    asyncio.run(test_tenant_automation()) 