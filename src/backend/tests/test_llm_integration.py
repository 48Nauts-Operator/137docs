"""
Integration tests for LLM functionality in 137Docs.
"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.llm import LLMService
from app.services.llm_service import DocumentLLMService, LLMServiceFactory
from app.repository import LLMConfigRepository
from tests.test_models import Document, LLMConfig
import json

class TestLLMService:
    """Test the core LLM service functionality."""
    
    @pytest.mark.asyncio
    async def test_llm_service_initialization(self, test_session):
        """Test LLM service can be initialized with database session."""
        llm_service = LLMService(db_session=test_session)
        assert llm_service.db_session == test_session
        assert llm_service._config_cache is None
    
    @pytest.mark.asyncio
    async def test_get_config_with_database(self, test_session, mock_llm_config):
        """Test configuration loading from database."""
        # Create LLM config in database
        config = LLMConfig(**mock_llm_config)
        test_session.add(config)
        await test_session.commit()
        
        llm_service = LLMService(db_session=test_session)
        loaded_config = await llm_service.get_config()
        
        assert loaded_config['provider'] == 'local'
        assert loaded_config['enabled'] is True
        assert loaded_config['model_tagger'] == 'phi3'
    
    @pytest.mark.asyncio
    async def test_get_config_fallback_to_env(self, test_session):
        """Test configuration fallback to environment variables."""
        llm_service = LLMService(db_session=test_session)
        config = await llm_service.get_config()
        
        # Should get fallback config
        assert 'provider' in config
        assert 'enabled' in config
        assert config['provider'] == 'local'  # Default fallback
    
    @pytest.mark.asyncio
    async def test_is_enabled(self, test_session, mock_llm_config):
        """Test LLM enabled status check."""
        # Test enabled
        config = LLMConfig(**mock_llm_config)
        test_session.add(config)
        await test_session.commit()
        
        llm_service = LLMService(db_session=test_session)
        assert await llm_service.is_enabled() is True
        
        # Test disabled
        config.enabled = False
        await test_session.commit()
        llm_service._config_cache = None  # Clear cache
        assert await llm_service.is_enabled() is False
    
    @pytest.mark.asyncio
    async def test_extract_metadata_disabled(self, test_session):
        """Test metadata extraction when LLM is disabled."""
        config = LLMConfig(enabled=False)
        test_session.add(config)
        await test_session.commit()
        
        llm_service = LLMService(db_session=test_session)
        result = await llm_service.extract_metadata("test document")
        
        assert result == {}
    
    @pytest.mark.asyncio
    @patch('app.llm.LLMService._query_llm')
    async def test_extract_metadata_success(self, mock_query, test_session, mock_llm_config, sample_document_text):
        """Test successful metadata extraction."""
        # Setup
        config = LLMConfig(**mock_llm_config)
        test_session.add(config)
        await test_session.commit()
        
        # Mock LLM response
        mock_response = json.dumps({
            "title": "INV-2024-001",
            "document_type": "invoice",
            "sender": "Acme Corporation",
            "amount": 1346.25,
            "currency": "USD",
            "document_date": "2024-01-15",
            "due_date": "2024-02-15"
        })
        mock_query.return_value = mock_response
        
        llm_service = LLMService(db_session=test_session)
        result = await llm_service.extract_metadata(sample_document_text)
        
        assert result['title'] == "INV-2024-001"
        assert result['document_type'] == "invoice"
        assert result['sender'] == "Acme Corporation"
        assert result['amount'] == 1346.25
        assert mock_query.called
    
    @pytest.mark.asyncio
    @patch('app.llm.LLMService._query_llm')
    async def test_suggest_tags(self, mock_query, test_session, mock_llm_config, sample_document_text):
        """Test tag suggestion functionality."""
        # Setup
        config = LLMConfig(**mock_llm_config)
        test_session.add(config)
        await test_session.commit()
        
        # Mock LLM response
        mock_query.return_value = '["invoice", "business", "acme", "2024"]'
        
        llm_service = LLMService(db_session=test_session)
        result = await llm_service.suggest_tags(sample_document_text)
        
        assert "invoice" in result
        assert "business" in result
        assert "acme" in result
        assert len(result) == 4
    
    @pytest.mark.asyncio
    @patch('app.llm.LLMService._query_llm')
    async def test_analyze_document(self, mock_query, test_session, mock_llm_config, sample_document_text):
        """Test document analysis functionality."""
        # Setup
        config = LLMConfig(**mock_llm_config)
        test_session.add(config)
        await test_session.commit()
        
        # Mock LLM response
        mock_analysis = {
            "summary": "Professional services invoice from Acme Corporation",
            "key_points": ["Invoice #INV-2024-001", "Due in 30 days", "Total $1,346.25"],
            "entities": ["Acme Corporation", "Customer Company"],
            "sentiment": "neutral",
            "action_items": ["Process payment by 2024-02-15"]
        }
        mock_query.return_value = json.dumps(mock_analysis)
        
        llm_service = LLMService(db_session=test_session)
        result = await llm_service.analyze_document(sample_document_text)
        
        assert result['summary'] == "Professional services invoice from Acme Corporation"
        assert len(result['key_points']) == 3
        assert "Acme Corporation" in result['entities']
        assert result['sentiment'] == "neutral"

class TestLLMConfigRepository:
    """Test LLM configuration repository."""
    
    @pytest.mark.asyncio
    async def test_create_default_config(self, test_session):
        """Test creating default LLM configuration."""
        repo = LLMConfigRepository()
        config = await repo.create_default_config(test_session)
        
        assert config['provider'] == 'local'
        assert config['enabled'] is False  # Default disabled
        assert 'model_tagger' in config
        assert 'model_enricher' in config
    
    @pytest.mark.asyncio
    async def test_update_config(self, test_session):
        """Test updating LLM configuration."""
        repo = LLMConfigRepository()
        
        # Create initial config
        config = await repo.update_config(test_session, provider='openai', enabled=True)
        assert config['provider'] == 'openai'
        assert config['enabled'] is True
        
        # Update existing config
        updated = await repo.update_config(test_session, model_tagger='gpt-3.5-turbo')
        assert updated['provider'] == 'openai'  # Unchanged
        assert updated['model_tagger'] == 'gpt-3.5-turbo'  # Updated
    
    @pytest.mark.asyncio
    @patch('app.llm.LLMService.test_connection')
    async def test_test_connection(self, mock_test, test_session):
        """Test connection testing through repository."""
        mock_test.return_value = {
            "status": "success",
            "message": "Connected successfully",
            "available_models": ["llama3", "phi3"]
        }
        
        repo = LLMConfigRepository()
        result = await repo.test_connection(test_session, 'local', 'http://localhost:11434')
        
        assert result['status'] == 'success'
        assert 'llama3' in result['available_models']

class TestDocumentLLMService:
    """Test document-specific LLM service."""
    
    @pytest.mark.asyncio
    async def test_service_initialization(self, test_session):
        """Test document LLM service initialization."""
        service = DocumentLLMService(test_session)
        assert service.db_session == test_session
        assert service.llm_service is not None
        assert service.doc_repo is not None
    
    @pytest.mark.asyncio
    async def test_process_document_disabled(self, test_session):
        """Test document processing when LLM is disabled."""
        # Create disabled config
        config = LLMConfig(enabled=False)
        test_session.add(config)
        await test_session.commit()
        
        service = DocumentLLMService(test_session)
        result = await service.process_document(1, force=False)
        
        assert result['status'] == 'disabled'
        assert 'disabled' in result['message']
    
    @pytest.mark.asyncio
    async def test_process_document_not_found(self, test_session, mock_llm_config):
        """Test processing non-existent document."""
        config = LLMConfig(**mock_llm_config)
        test_session.add(config)
        await test_session.commit()
        
        service = DocumentLLMService(test_session)
        result = await service.process_document(999, force=False)
        
        assert result['status'] == 'error'
        assert 'not found' in result['message']
    
    @pytest.mark.asyncio
    @patch('app.services.llm_service.DocumentLLMService._update_document_metadata')
    @patch('app.services.llm_service.DocumentLLMService._add_tags_to_document')
    @patch('app.llm.LLMService.extract_metadata')
    @patch('app.llm.LLMService.suggest_tags')
    @patch('app.llm.LLMService.analyze_document')
    async def test_process_document_success(self, mock_analyze, mock_tags, mock_metadata, 
                                          mock_add_tags, mock_update, test_session, mock_llm_config):
        """Test successful document processing."""
        # Setup
        config = LLMConfig(**mock_llm_config)
        test_session.add(config)
        
        # Create test document
        document = Document(
            title="Test Invoice",
            content="Test invoice content",
            file_path="/test/invoice.pdf"
        )
        test_session.add(document)
        await test_session.commit()
        
        # Mock LLM responses
        mock_metadata.return_value = {"title": "Updated Title", "amount": 100.0}
        mock_tags.return_value = ["invoice", "test"]
        mock_analyze.return_value = {"summary": "Test analysis"}
        mock_update.return_value = None
        mock_add_tags.return_value = None
        
        service = DocumentLLMService(test_session)
        result = await service.process_document(document.id, force=False)
        
        assert result['status'] == 'success'
        assert 'metadata' in result
        assert 'suggested_tags' in result
        assert 'analysis' in result
        assert mock_metadata.called
        assert mock_tags.called
        assert mock_analyze.called
    
    @pytest.mark.asyncio
    async def test_batch_process_documents(self, test_session, mock_llm_config):
        """Test batch document processing."""
        # Setup
        config = LLMConfig(**mock_llm_config)
        test_session.add(config)
        
        # Create test documents
        doc1 = Document(title="Doc 1", content="Content 1", file_path="/test/1.pdf")
        doc2 = Document(title="Doc 2", content="Content 2", file_path="/test/2.pdf")
        test_session.add_all([doc1, doc2])
        await test_session.commit()
        
        service = DocumentLLMService(test_session)
        
        with patch.object(service, 'process_document') as mock_process:
            mock_process.return_value = {"status": "success"}
            
            result = await service.batch_process_documents([doc1.id, doc2.id], force=False)
            
            assert result['status'] == 'success'
            assert result['total'] == 2
            assert result['processed'] == 2
            assert result['errors'] == 0
            assert mock_process.call_count == 2

class TestLLMAPIEndpoints:
    """Test LLM API endpoints."""
    
    @pytest.mark.asyncio
    async def test_get_llm_config(self, test_client, mock_llm_config):
        """Test GET /api/llm/config endpoint."""
        response = await test_client.get("/api/llm/config")
        assert response.status_code == 200
        
        data = response.json()
        assert 'config' in data
    
    @pytest.mark.asyncio
    async def test_update_llm_config(self, test_client):
        """Test PUT /api/llm/config endpoint."""
        form_data = {
            'provider': 'openai',
            'enabled': 'true',
            'model_tagger': 'gpt-3.5-turbo'
        }
        
        response = await test_client.put("/api/llm/config", data=form_data)
        assert response.status_code == 200
        
        data = response.json()
        assert 'config' in data
        assert data['config']['provider'] == 'openai'
    
    @pytest.mark.asyncio
    @patch('app.repository.LLMConfigRepository.test_connection')
    async def test_test_connection_endpoint(self, mock_test, test_client):
        """Test POST /api/llm/test-connection endpoint."""
        mock_test.return_value = {
            "status": "success",
            "message": "Connected",
            "available_models": ["llama3"]
        }
        
        form_data = {
            'provider': 'local',
            'api_url': 'http://localhost:11434'
        }
        
        response = await test_client.post("/api/llm/test-connection", data=form_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data['status'] == 'success'
        assert 'llama3' in data['available_models']
    
    @pytest.mark.asyncio
    async def test_llm_status_endpoint(self, test_client, mock_llm_config):
        """Test GET /api/llm/status endpoint."""
        response = await test_client.get("/api/llm/status")
        assert response.status_code == 200
        
        data = response.json()
        assert 'enabled' in data
        assert 'provider' in data
        assert 'models' in data

class TestLLMServiceFactory:
    """Test LLM service factory."""
    
    def test_create_document_service(self, test_session):
        """Test creating document LLM service."""
        service = LLMServiceFactory.create_document_service(test_session)
        assert isinstance(service, DocumentLLMService)
        assert service.db_session == test_session
    
    def test_create_llm_service(self, test_session):
        """Test creating basic LLM service."""
        service = LLMServiceFactory.create_llm_service(test_session)
        assert isinstance(service, LLMService)
        assert service.db_session == test_session

class TestLLMProviderIntegration:
    """Test integration with different LLM providers."""
    
    @pytest.mark.asyncio
    @patch('httpx.AsyncClient.post')
    async def test_ollama_integration(self, mock_post, test_session):
        """Test Ollama provider integration."""
        # Mock Ollama response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"response": "Test response"}
        mock_post.return_value = mock_response
        
        llm_service = LLMService(db_session=test_session)
        result = await llm_service._query_ollama_direct("test prompt", "http://localhost:11434", "llama3")
        
        assert result == "Test response"
        mock_post.assert_called_once()
    
    @pytest.mark.asyncio
    @patch('httpx.AsyncClient.post')
    async def test_openai_integration(self, mock_post, test_session):
        """Test OpenAI provider integration."""
        # Mock OpenAI response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "Test response"}}]
        }
        mock_post.return_value = mock_response
        
        llm_service = LLMService(db_session=test_session)
        result = await llm_service._query_generic_llm_direct(
            "test prompt", "https://api.openai.com/v1", "sk-test", "gpt-3.5-turbo"
        )
        
        assert result == "Test response"
        mock_post.assert_called_once()
    
    @pytest.mark.asyncio
    @patch('httpx.AsyncClient.get')
    async def test_get_available_models_ollama(self, mock_get, test_session):
        """Test getting available models from Ollama."""
        # Mock Ollama models response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "models": [
                {"name": "llama3"},
                {"name": "phi3"},
                {"name": "codellama"}
            ]
        }
        mock_get.return_value = mock_response
        
        llm_service = LLMService(db_session=test_session)
        models = await llm_service._get_available_models('local', 'http://localhost:11434')
        
        assert 'llama3' in models
        assert 'phi3' in models
        assert 'codellama' in models
        assert len(models) == 3

# Integration test markers
pytestmark = pytest.mark.asyncio 