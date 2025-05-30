#!/usr/bin/env python3
"""
Test script to verify LLM tenant extraction functionality
"""
import asyncio
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost/137docs"

async def test_tenant_extraction():
    """Test the tenant extraction process"""
    
    # Create database connection
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # Import required modules
            from app.models import Document, Entity
            from app.agents.tenant_agent import TenantExtractionAgent
            from app.llm import LLMService
            
            logger.info("=== Testing LLM Tenant Extraction ===")
            
            # Check if LLM is enabled
            llm_service = LLMService(session)
            is_enabled = await llm_service.is_enabled()
            logger.info(f"LLM Service Enabled: {is_enabled}")
            
            if is_enabled:
                # Get LLM configuration
                from app.repository import LLMConfigRepository
                llm_repo = LLMConfigRepository()
                config = await llm_repo.get_config(session)
                if config:
                    logger.info(f"LLM Provider: {config.provider}")
                    logger.info(f"API URL: {config.api_url}")
                    logger.info(f"Models: Tagger={config.model_tagger}, Enricher={config.model_enricher}")
            
            # Get a sample document
            result = await session.execute(
                select(Document)
                .where(Document.content.isnot(None))
                .order_by(Document.id.desc())
                .limit(5)
            )
            documents = result.scalars().all()
            
            if not documents:
                logger.error("No documents found with content")
                return
            
            # Get existing tenants
            tenant_result = await session.execute(
                select(Entity)
                .where(Entity.is_active == True)
                .order_by(Entity.name)
            )
            tenants = tenant_result.scalars().all()
            logger.info(f"\nExisting Tenants ({len(tenants)}):")
            for tenant in tenants:
                logger.info(f"  - {tenant.name} (alias: {tenant.alias}, type: {tenant.type})")
            
            # Test tenant extraction on documents
            agent = TenantExtractionAgent(session)
            
            logger.info("\n=== Testing Documents ===")
            for doc in documents:
                logger.info(f"\nDocument ID: {doc.id}")
                logger.info(f"Title: {doc.title}")
                logger.info(f"Current Recipient: {doc.recipient}")
                logger.info(f"Content Preview: {doc.content[:200]}...")
                
                # Analyze document
                result = await agent.analyze_and_assign_tenant(doc.id, 1)  # Using user_id=1
                
                logger.info(f"Result Status: {result.get('status')}")
                logger.info(f"Message: {result.get('message')}")
                
                if result.get('extracted_info'):
                    info = result['extracted_info']
                    logger.info(f"Extracted Info:")
                    logger.info(f"  - Name: {info.get('name')}")
                    logger.info(f"  - Alias: {info.get('alias')}")
                    logger.info(f"  - Type: {info.get('type')}")
                    logger.info(f"  - Confidence: {info.get('confidence')}")
                
                if result.get('tenant'):
                    logger.info(f"Matched Tenant: {result['tenant']['alias']}")
                
                # Check if LLM extraction method was used
                if result.get('status') == 'success' or result.get('status') == 'no_match':
                    # Try to see if LLM was actually called
                    if hasattr(agent, '_extract_tenant_info'):
                        logger.info("  ✓ Tenant extraction method is available")
                
        except Exception as e:
            logger.error(f"Error during testing: {str(e)}")
            import traceback
            traceback.print_exc()
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_tenant_extraction()) 