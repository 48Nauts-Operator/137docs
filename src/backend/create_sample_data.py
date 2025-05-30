#!/usr/bin/env python3
"""
Create sample data to test tenant automation functionality.
"""
import asyncio
import sys
import os
import hashlib
from datetime import datetime, timedelta
sys.path.append('/app')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from app.models import Document, Entity, LLMConfig, User
from passlib.context import CryptContext

# Create async engine
engine = create_async_engine(f"sqlite+aiosqlite:///./documents.db", echo=False)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_sample_data():
    """Create sample data for testing tenant automation."""
    print("📝 Creating Sample Data for Tenant Automation Testing")
    print("=" * 60)
    
    async with AsyncSession(engine) as session:
        try:
            # 1. Create sample users
            admin_user = User(
                username="admin",
                email="admin@example.com",
                full_name="Administrator",
                role="admin",
                hashed_password=pwd_context.hash("admin123"),
                disabled=False
            )
            session.add(admin_user)
            
            # 2. Create sample entities (tenants)
            entities = [
                Entity(
                    name="Personal Entity",
                    alias="Personal",
                    type="individual",
                    street="Main Street 123",
                    house_number="123",
                    area_code="8001",
                    county="Zurich",
                    country="Switzerland",
                    aliases='["André Wolke", "A. Wolke", "Personal"]',
                    is_active=True
                ),
                Entity(
                    name="Test Company Ltd.",
                    alias="Test Corp",
                    type="company", 
                    street="Business Park 456",
                    house_number="456",
                    area_code="8002",
                    county="Zurich",
                    country="Switzerland",
                    vat_id="CHE-123.456.789",
                    iban="CH93 0076 2011 6238 5295 7",
                    aliases='["Test Company", "Test Corp", "TestCorp Ltd"]',
                    is_active=True
                ),
                Entity(
                    name="Google LLC",
                    alias="Google",
                    type="company",
                    street="Googleplex 1600 Amphitheatre Parkway",
                    area_code="94043",
                    county="Mountain View",
                    country="United States",
                    aliases='["Google", "Google LLC", "Google Cloud", "Alphabet Inc"]',
                    is_active=True
                )
            ]
            
            for entity in entities:
                session.add(entity)
            
            # 3. Create LLM Configuration
            llm_config = LLMConfig(
                provider="local",
                api_url="http://localhost:11434",
                model_tagger="phi3",
                model_enricher="llama3",
                enabled=True,
                auto_tagging=True,
                auto_enrichment=True,
                external_enrichment=False,
                max_retries=3,
                retry_delay=300,
                batch_size=5,
                concurrent_tasks=2,
                min_confidence_tagging=0.7,
                min_confidence_entity=0.8
            )
            session.add(llm_config)
            
            # Commit entities and config first so we can reference them
            await session.commit()
            
            # 4. Create sample documents with various recipient scenarios
            documents = [
                # Documents with problematic recipients that should be auto-assigned
                Document(
                    title="Google Cloud Invoice - March 2024",
                    file_path="/storage/invoices/google_cloud_march_2024.pdf", 
                    content="Invoice from Google Cloud Platform for services...",
                    document_type="invoice",
                    sender="Google LLC",
                    recipient="Your Company",  # Problematic - should be auto-assigned
                    document_date="2024-03-15",
                    due_date="2024-04-15",
                    amount=89.42,
                    currency="USD",
                    status="pending",
                    hash=hashlib.sha256(b"google_cloud_march_2024").hexdigest(),
                    entity_id=None  # Should be auto-assigned to Google entity
                ),
                Document(
                    title="Personal Medical Insurance Bill",
                    file_path="/storage/bills/medical_insurance_feb_2024.pdf",
                    content="Medical insurance premium invoice for André Wolke...",
                    document_type="bill",
                    sender="Swiss Health Insurance Co.",
                    recipient="",  # Empty - should be auto-assigned
                    document_date="2024-02-01",
                    due_date="2024-02-28",
                    amount=450.00,
                    currency="CHF",
                    status="pending", 
                    hash=hashlib.sha256(b"medical_insurance_feb_2024").hexdigest(),
                    entity_id=None  # Should be auto-assigned to Personal entity
                ),
                Document(
                    title="Office Rent Invoice Q1 2024",
                    file_path="/storage/invoices/office_rent_q1_2024.pdf",
                    content="Quarterly office rent for Test Company Ltd...",
                    document_type="invoice",
                    sender="Property Management AG",
                    recipient=None,  # NULL - should be auto-assigned
                    document_date="2024-01-01",
                    due_date="2024-01-31",
                    amount=3500.00,
                    currency="CHF", 
                    status="pending",
                    hash=hashlib.sha256(b"office_rent_q1_2024").hexdigest(),
                    entity_id=None  # Should be auto-assigned to Test Corp entity
                ),
                Document(
                    title="Google Workspace Subscription",
                    file_path="/storage/bills/google_workspace_april_2024.pdf",
                    content="Monthly Google Workspace subscription for Test Corp...",
                    document_type="subscription",
                    sender="Google LLC",
                    recipient="Unknown",  # Problematic - should be auto-assigned  
                    document_date="2024-04-01",
                    due_date="2024-04-30",
                    amount=14.40,
                    currency="USD",
                    status="pending",
                    hash=hashlib.sha256(b"google_workspace_april_2024").hexdigest(),
                    entity_id=None  # Should be auto-assigned
                ),
                # Document with proper recipient (for comparison)
                Document(
                    title="Properly Assigned Document",
                    file_path="/storage/invoices/proper_assignment_example.pdf",
                    content="This document has been properly assigned...",
                    document_type="invoice",
                    sender="Supplier ABC",
                    recipient="Test Company Ltd.",  # Properly assigned
                    document_date="2024-05-01",
                    due_date="2024-05-31", 
                    amount=1200.00,
                    currency="CHF",
                    status="pending",
                    hash=hashlib.sha256(b"proper_assignment_example").hexdigest(),
                    entity_id=2  # Properly linked to Test Corp entity
                )
            ]
            
            for doc in documents:
                session.add(doc)
            
            await session.commit()
            
            print("✅ Sample data created successfully!")
            print(f"📊 Created:")
            print(f"  - 1 admin user")
            print(f"  - {len(entities)} entities (tenants)")
            print(f"  - 1 LLM configuration (enabled)")
            print(f"  - {len(documents)} sample documents")
            print(f"    • {len([d for d in documents if d.recipient in [None, '', 'Your Company', 'Unknown']])} with problematic recipients")
            print(f"    • {len([d for d in documents if d.recipient not in [None, '', 'Your Company', 'Unknown']])} properly assigned")
            
        except Exception as e:
            print(f"❌ Error creating sample data: {e}")
            await session.rollback()
        finally:
            await session.close()

if __name__ == "__main__":
    asyncio.run(create_sample_data()) 