"""
Pytest configuration and fixtures for 137Docs backend tests.
"""
import pytest
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from httpx import AsyncClient
from app.main import app
from tests.test_models import Base
from app.database import get_db
import os
import tempfile

# Test database URL - use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def test_engine():
    """Create test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        future=True
    )
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Cleanup
    await engine.dispose()

@pytest.fixture
async def test_session(test_engine):
    """Create test database session."""
    async_session = sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()

@pytest.fixture
async def test_client(test_session):
    """Create test HTTP client with database override."""
    
    async def override_get_db():
        yield test_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
    
    # Clean up
    app.dependency_overrides.clear()

@pytest.fixture
def mock_llm_config():
    """Mock LLM configuration for testing."""
    return {
        'provider': 'local',
        'api_url': 'http://localhost:11434',
        'api_key': '',
        'model_tagger': 'phi3',
        'model_enricher': 'llama3',
        'model_analytics': 'llama3',
        'model_responder': 'gpt-4',
        'enabled': True,
        'auto_tagging': True,
        'auto_enrichment': True,
        'external_enrichment': False,
        'max_retries': 3,
        'retry_delay': 300,
        'backup_provider': '',
        'backup_model': '',
        'batch_size': 5,
        'concurrent_tasks': 2,
        'cache_responses': True,
        'min_confidence_tagging': 0.7,
        'min_confidence_entity': 0.8,
    }

@pytest.fixture
def sample_document_text():
    """Sample document text for testing."""
    return """
    INVOICE #INV-2024-001
    
    From: Acme Corporation
    123 Business Street
    Business City, BC 12345
    
    To: Customer Company
    456 Customer Ave
    Customer City, CC 67890
    
    Date: 2024-01-15
    Due Date: 2024-02-15
    
    Description: Professional Services
    Amount: $1,250.00
    Tax (7.7%): $96.25
    Total: $1,346.25
    
    Payment Terms: Net 30 days
    """

@pytest.fixture
def temp_file():
    """Create a temporary file for testing."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write("Test document content")
        temp_path = f.name
    
    yield temp_path
    
    # Cleanup
    if os.path.exists(temp_path):
        os.unlink(temp_path) 