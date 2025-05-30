#!/usr/bin/env python3
"""
Test script for tenant extraction on problematic documents.
"""
import asyncio
import sys
import os

# Add the src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from sqlalchemy.ext.asyncio import AsyncSession
from app.database import engine
from app.agents.tenant_agent import TenantExtractionAgent

async def test_tenant_extraction():
    """Test tenant extraction on document 82."""
    async with AsyncSession(engine) as session:
        agent = TenantExtractionAgent(session)
        
        # Test on document 82 (the problematic one from logs)
        result = await agent.analyze_and_assign_tenant(82, 1)
        
        print("Tenant extraction result:")
        print(f"Status: {result['status']}")
        print(f"Message: {result['message']}")
        
        if result['status'] == 'success':
            print(f"Tenant: {result['tenant']['alias']}")
            print(f"Confidence: {result.get('confidence', 'N/A')}")
        
        return result

if __name__ == "__main__":
    asyncio.run(test_tenant_extraction()) 