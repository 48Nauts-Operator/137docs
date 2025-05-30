"""
LLM integration module for metadata extraction and document analysis.
"""
import httpx
import json
import logging
from typing import Dict, Any, Optional, List
from app.config import settings
from sqlalchemy.ext.asyncio import AsyncSession
import re
import asyncio
import os

logger = logging.getLogger(__name__)

class LLMService:
    """Service for interacting with LLM APIs with configuration support."""
    
    def __init__(self, db_session: Optional[AsyncSession] = None):
        """Initialize LLM service with optional database session for configuration."""
        self.db_session = db_session
        self._config_cache = None
        self._cache_timestamp = None
        
    async def get_config(self) -> Dict[str, Any]:
        """Get LLM configuration from database with caching."""
        import time
        
        # Cache configuration for 5 minutes to avoid repeated DB queries
        if (self._config_cache is not None and 
            self._cache_timestamp is not None and 
            time.time() - self._cache_timestamp < 300):
            return self._config_cache
            
        if self.db_session:
            try:
                from app.repository import LLMConfigRepository
                repo = LLMConfigRepository()
                config = await repo.get_config(self.db_session)
                
                if config:
                    self._config_cache = config
                    self._cache_timestamp = time.time()
                    return config
            except Exception as e:
                logger.warning(f"Failed to load LLM config from database: {e}")
        
        # Fallback to environment variables
        fallback_config = {
            'provider': 'local',
            'api_url': os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434"),
            'api_key': settings.LLM_API_KEY,
            'model_tagger': settings.LLM_MODEL,
            'model_enricher': settings.LLM_MODEL,
            'model_analytics': settings.LLM_MODEL,
            'model_responder': settings.LLM_MODEL,
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
        
        self._config_cache = fallback_config
        self._cache_timestamp = time.time()
        return fallback_config
    
    async def is_enabled(self) -> bool:
        """Check if LLM features are enabled."""
        config = await self.get_config()
        return config.get('enabled', False)
    
    async def is_configured(self) -> bool:
        """Check if LLM service is properly configured."""
        try:
            config = await self.get_config()
            provider = config.get('provider', 'local')
            
            if provider == 'local':
                # For local provider (Ollama), check if API URL is set
                api_url = config.get('api_url')
                return bool(api_url and api_url.strip())
            else:
                # For other providers, check if both URL and key are set
                api_url = config.get('api_url')
                api_key = config.get('api_key')
                return bool(api_url and api_url.strip() and api_key and api_key.strip())
        except Exception as e:
            logger.error(f"Error checking LLM configuration: {e}")
            return False
    
    async def extract_metadata(
        self,
        text: str,
        *,
        max_attempts: Optional[int] = None,
        target_score: float = 0.6,
        task_type: str = 'enricher'
    ) -> Dict[str, Any]:
        """Return *metadata* with at least *target_score* completeness.

        The method performs up to *max_attempts* LLM calls. After every call it
        1. parses the JSON
        2. enriches it with regex-based heuristics (phones, e-mails, amounts…)
        3. scores the result.  If the score ≥ *target_score* it stops early.
        """
        if not await self.is_enabled():
            logger.info("LLM features disabled, skipping metadata extraction")
            return {}

        config = await self.get_config()
        if max_attempts is None:
            max_attempts = config.get('max_retries', 3)

        logger.info("Extracting metadata using LLM – target %.0f%%", target_score * 100)

        attempt = 0
        metadata: Dict[str, Any] = {}
        missing_fields: list[str] | None = None

        while attempt < max_attempts:
            attempt += 1

            prompt = self._create_metadata_extraction_prompt(text, missing_fields)
            response = await self._query_llm(prompt, task_type=task_type)
            metadata = self._parse_metadata_response(response)

            # Heuristic post-processing fills in obvious items that the LLM
            # sometimes misses (e-mail, phone, currency / amount etc.)
            metadata = self._heuristic_enrich(text, metadata)

            score = self._score_metadata(metadata)
            logger.info("Metadata extraction attempt %d – completeness %.0f%%", attempt, score * 100)

            if score >= target_score:
                break

            # Prepare a focused re-prompt with the *still* missing fields
            missing_fields = [k for k, v in self._REQUIRED_FIELDS.items() if not metadata.get(k)]

            # Add delay between retries
            if attempt < max_attempts:
                retry_delay = config.get('retry_delay', 300)
                logger.info(f"Waiting {retry_delay} seconds before retry...")
                await asyncio.sleep(retry_delay)

        return metadata
    
    async def analyze_document(self, text: str) -> Dict[str, Any]:
        """
        Analyze document content using LLM.
        
        Args:
            text: Document text content
            
        Returns:
            Dictionary of analysis results
        """
        if not await self.is_enabled():
            logger.info("LLM features disabled, skipping document analysis")
            return {}
            
        logger.info("Analyzing document using LLM")
        
        # Prepare prompt for document analysis
        prompt = self._create_document_analysis_prompt(text)
        
        # Get LLM response
        response = await self._query_llm(prompt, task_type='analytics')
        
        # Parse analysis from response
        analysis = self._parse_analysis_response(response)
        
        return analysis
    
    async def suggest_tags(self, text: str) -> List[str]:
        """
        Suggest tags for a document based on its content.
        
        Args:
            text: Document text content
            
        Returns:
            List of suggested tags
        """
        if not await self.is_enabled():
            logger.info("LLM features disabled, skipping tag suggestion")
            return []
            
        config = await self.get_config()
        if not config.get('auto_tagging', True):
            logger.info("Auto-tagging disabled, skipping tag suggestion")
            return []
            
        logger.info("Suggesting tags using LLM")
        
        # Prepare prompt for tag suggestion
        prompt = self._create_tag_suggestion_prompt(text)
        
        # Get LLM response
        response = await self._query_llm(prompt, task_type='tagger')
        
        # Parse tags from response
        tags = self._parse_tags_response(response)
        
        return tags
    
    async def test_connection(self, provider: str, api_url: Optional[str] = None, api_key: Optional[str] = None) -> Dict[str, Any]:
        """Test connection to LLM provider with detailed debugging."""
        debug_info = {
            "test_details": []
        }
        
        try:
            # Use provided parameters or fall back to config
            if not api_url:
                config = await self.get_config()
                api_url = config.get('api_url') or self._get_default_url(provider)
            
            debug_info["test_details"].append(f"Testing {provider} provider")
            debug_info["test_details"].append(f"API URL: {api_url}")
            debug_info["test_details"].append(f"API Key: {'Provided' if api_key else 'Not provided'}")
            
            # Create a simple test prompt
            test_prompt = "Hello, please respond with 'Connection successful' and nothing else."
            debug_info["test_details"].append("Sending test prompt...")
            
            # Test the connection based on provider
            if provider == 'local':
                debug_info["test_details"].append("Using Ollama API format")
                response = await self._query_ollama_direct(test_prompt, api_url, 'llama3')
            else:
                debug_info["test_details"].append("Using OpenAI-compatible API format")
                response = await self._query_generic_llm_direct(test_prompt, api_url, api_key, 'gpt-3.5-turbo')
            
            debug_info["test_details"].append(f"Response received: {len(response) if response else 0} characters")
            
            # Check if we got a reasonable response (not an error message)
            if response and len(response.strip()) > 0 and not response.startswith("Error:"):
                debug_info["test_details"].append("✅ Basic connectivity test passed")
                debug_info["test_details"].append("Discovering available models...")
                
                # Try to get available models
                available_models = await self._get_available_models(provider, api_url, api_key)
                debug_info["test_details"].append(f"Found {len(available_models)} models")
                
                if available_models:
                    debug_info["test_details"].append(f"Sample models: {', '.join(available_models[:3])}")
                    if len(available_models) > 3:
                        debug_info["test_details"].append(f"... and {len(available_models) - 3} more")
                
                return {
                    "status": "success",
                    "message": f"Successfully connected to {provider}",
                    "available_models": available_models,
                    "debug_info": debug_info
                }
            else:
                debug_info["test_details"].append("❌ Test prompt failed")
                debug_info["test_details"].append(f"Response: {response[:100] if response else 'No response'}")
                return {
                    "status": "error",
                    "message": f"Connection failed: {response if response else 'No response received'}",
                    "available_models": [],
                    "debug_info": debug_info
                }
                
        except Exception as e:
            debug_info["test_details"].append(f"❌ Exception occurred: {str(e)}")
            logger.error(f"Connection test failed for {provider}: {str(e)}")
            return {
                "status": "error",
                "message": f"Connection failed: {str(e)}",
                "available_models": [],
                "debug_info": debug_info
            }
    
    async def _get_available_models(self, provider: str, api_url: str, api_key: Optional[str] = None) -> List[str]:
        """Get list of available models from the provider."""
        try:
            logger.info(f"Discovering models for {provider} at {api_url}")
            
            if provider == 'local':
                # Ollama models endpoint
                async with httpx.AsyncClient() as client:
                    response = await client.get(f"{api_url}/api/tags", timeout=10.0)
                    logger.info(f"Ollama response status: {response.status_code}")
                    if response.status_code == 200:
                        data = response.json()
                        models = [model['name'] for model in data.get('models', [])]
                        logger.info(f"Ollama models found: {models}")
                        return models
                    else:
                        logger.warning(f"Ollama API returned {response.status_code}: {response.text}")
            elif provider in ['openai', 'anthropic', 'litellm', 'custom']:
                # OpenAI-compatible models endpoint (works for OpenAI, LiteLLM, and most custom APIs)
                headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
                async with httpx.AsyncClient() as client:
                    response = await client.get(f"{api_url}/models", headers=headers, timeout=10.0)
                    logger.info(f"{provider} response status: {response.status_code}")
                    if response.status_code == 200:
                        data = response.json()
                        logger.info(f"{provider} raw response: {data}")
                        
                        models = []
                        if 'data' in data:
                            # OpenAI format
                            models = [model['id'] for model in data.get('data', [])]
                        elif 'models' in data:
                            # Alternative format
                            models = [model['id'] if isinstance(model, dict) else str(model) for model in data.get('models', [])]
                        elif isinstance(data, list):
                            # Simple list format
                            models = [model['id'] if isinstance(model, dict) else str(model) for model in data]
                        
                        # Filter out system models and sort
                        filtered_models = [m for m in models if not m.startswith('system-') and not m.startswith('_')]
                        sorted_models = sorted(filtered_models)
                        logger.info(f"{provider} filtered models: {sorted_models}")
                        return sorted_models
                    else:
                        logger.warning(f"{provider} API returned {response.status_code}: {response.text}")
            
        except Exception as e:
            logger.warning(f"Failed to get available models for {provider}: {str(e)}")
        
        return []
    
    def _get_default_url(self, provider: str) -> str:
        """Get default API URL for provider."""
        defaults = {
            'local': 'http://host.docker.internal:11434',
            'openai': 'https://api.openai.com/v1',
            'anthropic': 'https://api.anthropic.com',
            'litellm': 'http://host.docker.internal:4000',
            'custom': ''
        }
        return defaults.get(provider, '')
    
    async def _query_llm(self, prompt: str, task_type: str = 'enricher') -> str:
        """
        Query the LLM API with a prompt using configuration.
        
        Args:
            prompt: The prompt to send to the LLM
            task_type: Type of task (tagger, enricher, analytics, responder)
            
        Returns:
            LLM response text
        """
        config = await self.get_config()
        
        # Get model for specific task
        model_key = f'model_{task_type}'
        model = config.get(model_key, config.get('model_enricher', settings.LLM_MODEL))
        
        # Get provider configuration
        provider = config.get('provider', 'local')
        api_url = config.get('api_url') or self._get_default_url(provider)
        api_key = config.get('api_key')
        
        # Decide which endpoint to use based on provider
        if provider == 'local':
            return await self._query_ollama_direct(prompt, api_url, model)
        else:
            return await self._query_generic_llm_direct(prompt, api_url, api_key, model)
    
    async def _query_ollama_direct(self, prompt: str, api_url: str, model: str) -> str:
        """Query Ollama API directly."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{api_url}/api/generate",
                    json={
                        "model": model,
                        "prompt": prompt,
                        "stream": False
                    },
                    timeout=60.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get("response", "")
                else:
                    logger.error(f"Ollama API error: {response.status_code} - {response.text}")
                    return f"Error: {response.status_code}"
        except Exception as e:
            logger.error(f"Error querying Ollama: {str(e)}")
            return f"Error: {str(e)}"
    
    async def _query_generic_llm_direct(self, prompt: str, api_url: str, api_key: Optional[str], model: str) -> str:
        """Query a generic LLM API directly."""
        try:
            headers = {}
            if api_key:
                headers["Authorization"] = f"Bearer {api_key}"
            
            logger.info(f"Querying LLM at {api_url}/chat/completions with model {model}")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{api_url}/chat/completions",
                    headers=headers,
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.1
                    },
                    timeout=60.0
                )
                
                logger.info(f"LLM API response status: {response.status_code}")
                
                if response.status_code == 200:
                    result = response.json()
                    content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                    logger.info(f"LLM response content length: {len(content)}")
                    return content
                else:
                    error_msg = f"HTTP {response.status_code}: {response.text}"
                    logger.error(f"LLM API error: {error_msg}")
                    return f"Error: {error_msg}"
        except httpx.ConnectTimeout as e:
            error_msg = f"Connection timeout to {api_url}"
            logger.error(f"Error querying LLM: {error_msg}")
            return f"Error: {error_msg}"
        except httpx.ConnectError as e:
            error_msg = f"Connection failed to {api_url}: {str(e)}"
            logger.error(f"Error querying LLM: {error_msg}")
            return f"Error: {error_msg}"
        except Exception as e:
            error_msg = f"Unexpected error: {type(e).__name__}: {str(e)}"
            logger.error(f"Error querying LLM: {error_msg}")
            return f"Error: {error_msg}"
    
    # Legacy methods for backward compatibility
    async def _query_ollama(self, prompt: str) -> str:
        """Query Ollama API (legacy method)."""
        config = await self.get_config()
        api_url = config.get('api_url', settings.LLM_API_URL)
        model = config.get('model_enricher', settings.LLM_MODEL)
        return await self._query_ollama_direct(prompt, api_url, model)
    
    async def _query_generic_llm(self, prompt: str) -> str:
        """Query a generic LLM API (legacy method)."""
        config = await self.get_config()
        api_url = config.get('api_url', settings.LLM_API_URL)
        api_key = config.get('api_key', settings.LLM_API_KEY)
        model = config.get('model_enricher', settings.LLM_MODEL)
        return await self._query_generic_llm_direct(prompt, api_url, api_key, model)
    
    def _create_metadata_extraction_prompt(
        self,
        text: str,
        missing_fields: list[str] | None = None,
    ) -> str:
        """Create prompt for metadata extraction."""
        # Truncate text if too long
        truncated_text = text[:3000] + "..." if len(text) > 3000 else text
        
        # Build dynamic field list – for retries we only emphasise the missing
        # ones to save prompt tokens and steer the LLM.
        if not missing_fields:
            field_lines = """- title: The document title
        - document_type: Type of document (invoice, contract, letter, etc.)
        - sender: The sender or issuer of the document
        - recipient: The recipient of the document
        - document_date: The date of the document (YYYY-MM-DD format ONLY - never use DD.MM.YYYY or DD/MM/YYYY)
        - due_date: Due date if applicable (YYYY-MM-DD format ONLY - never use DD.MM.YYYY or DD/MM/YYYY)
        - amount: Total amount incl. VAT (numeric value only)
        - subtotal: Amount excluding VAT (numeric value only)
        - tax_rate: VAT rate as percent (numeric, e.g. 7.7)
        - tax_amount: VAT amount (numeric value only)
        - currency: ISO currency code (e.g. CHF, EUR, USD)
        - status: Document status (paid, unpaid, pending, etc.)
        - street, address2, zip, town, county, country: Address lines if present on letterhead
        - sender_email, phone: Contact details if present
        - tags: List of relevant tags for the document"""
        else:
            field_lines = "\n".join(f"- {f}:" for f in missing_fields)

        return f"""
        Extract the following metadata from this document text (Swiss / EU invoices typical). Return **only** a JSON object – no markdown fence.

        Fields to extract (leave null if not present):
        {field_lines}

        CRITICAL DATE FORMAT REQUIREMENT:
        - ALL dates MUST be in ISO format: YYYY-MM-DD (e.g. "2024-03-15")
        - NEVER use European format like "15.03.2024" or American format like "03/15/2024"
        - If you see a date like "30.10.2024", convert it to "2024-10-30"
        - If you see a date like "10/30/2024", convert it to "2024-10-30"
        - If date is unclear, leave it null rather than guessing the format

        Document text (truncated):
        {truncated_text}

        JSON output:
        """
    
    def _create_document_analysis_prompt(self, text: str) -> str:
        """Create prompt for document analysis."""
        # Truncate text if too long
        truncated_text = text[:3000] + "..." if len(text) > 3000 else text
        
        return f"""
        Analyze this document and provide the following information as a JSON object:
        
        - summary: A brief summary of the document (max 100 words)
        - key_points: List of key points or important information
        - entities: List of named entities (people, organizations, locations)
        - sentiment: Overall sentiment (positive, negative, neutral)
        - action_items: List of any action items or required actions
        
        Document text:
        {truncated_text}
        
        JSON output:
        """
    
    def _create_tag_suggestion_prompt(self, text: str) -> str:
        """Create prompt for tag suggestion."""
        # Truncate text if too long
        truncated_text = text[:3000] + "..." if len(text) > 3000 else text
        
        return f"""
        Suggest 3-5 relevant tags for categorizing this document. Return the result as a JSON array of strings.
        
        Document text:
        {truncated_text}
        
        JSON output:
        """
    
    def _parse_metadata_response(self, response: str) -> Dict[str, Any]:
        """Parse metadata from LLM response."""
        try:
            # Try to extract JSON from the response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = response[json_start:json_end]
                try:
                    metadata = json.loads(json_str)
                except json.JSONDecodeError:
                    try:
                        import json5  # type: ignore
                        metadata = json5.loads(json_str)
                    except Exception:
                        logger.warning("Failed to parse metadata with json5 fallback")
                        metadata = {}
                return metadata
            else:
                logger.warning("No valid JSON found in LLM response")
                return {}
        except Exception as e:
            logger.error(f"Error parsing metadata response: {str(e)}")
            return {}
    
    def _parse_analysis_response(self, response: str) -> Dict[str, Any]:
        """Parse analysis from LLM response."""
        try:
            # Try to extract JSON from the response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = response[json_start:json_end]
                try:
                    analysis = json.loads(json_str)
                except json.JSONDecodeError:
                    try:
                        import json5  # type: ignore
                        analysis = json5.loads(json_str)
                    except Exception:
                        logger.warning("Failed to parse analysis with json5 fallback")
                        analysis = {}
                return analysis
            else:
                logger.warning("No valid JSON found in LLM response")
                return {}
        except Exception as e:
            logger.error(f"Error parsing analysis response: {str(e)}")
            return {}
    
    def _parse_tags_response(self, response: str) -> list:
        """Parse tags from LLM response."""
        try:
            # Try to extract JSON array from the response
            json_start = response.find('[')
            json_end = response.rfind(']') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = response[json_start:json_end]
                try:
                    tags = json.loads(json_str)
                except json.JSONDecodeError:
                    try:
                        import json5  # type: ignore
                        tags = json5.loads(json_str)
                    except Exception:
                        logger.warning("Failed to parse tags with json5 fallback")
                        tags = []
                return tags
            else:
                logger.warning("No valid JSON array found in LLM response")
                return []
        except Exception as e:
            logger.error(f"Error parsing tags response: {str(e)}")
            return []

    # ------------------------------------------------------------------
    #  Helper utilities
    # ------------------------------------------------------------------

    _REQUIRED_FIELDS: dict[str, bool] = {
        # Basic doc info
        "title": True,
        "document_type": True,
        "sender": True,
        # Financials
        "amount": True,
        "currency": True,
        # Address book enrichment
        "street": False,
        "address2": False,
        "zip": False,
        "town": False,
        "country": False,
        "sender_email": False,
        "email": False,
        "phone": False,
    }

    def _score_metadata(self, metadata: Dict[str, Any]) -> float:
        """Return ratio [0,1] of populated *required* fields."""

        if not metadata:
            return 0.0

        total = sum(self._REQUIRED_FIELDS.values())
        filled = 0
        for key, is_required in self._REQUIRED_FIELDS.items():
            if not is_required:
                # optional – ignore for scoring, but still nice to have
                continue
            val = metadata.get(key)
            if val not in (None, "", [], {}):
                filled += 1

        return filled / max(total, 1)

    # ------------------------------------------------------------------
    #  Heuristic enrichment – cheap regexes that rescue common omissions
    # ------------------------------------------------------------------

    _EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
    _PHONE_RE = re.compile(r"\+?\d[\d\s\-]{7,}")
    _CURRENCY_AMOUNT_RE = re.compile(r"(?P<cur>CHF|EUR|USD|GBP)?\s*(?P<amt>[0-9]{1,3}(?:[',\.][0-9]{3})*(?:[\.,][0-9]{2}))")

    # Swiss/EU address blocks often have two lines: Street then "1234 City".
    _ADDRESS_BLOCK_RE = re.compile(
        r"(?P<street>[A-Za-zÄÖÜäöüß0-9 .,'-]{5,})\s*\n\s*(?P<zip>\d{4,5})\s+(?P<town>[A-Za-zÄÖÜäöüß .'-]{2,})",
        re.M,
    )

    # Swiss UID VAT pattern (CHE-123.456.789)
    _VAT_RE = re.compile(r"(?i)che[- ]?\d{3}[\. ]?\d{3}[\. ]?\d{3}")

    # VAT amount line (e.g., "VAT 7.7% CHF 7.25" or "MWST CHF 7.25")
    _VAT_LINE_RE = re.compile(r"(?i)(vat|mwst|tva|iva)[^\n]*?(?P<perc>[0-9]{1,2}[\.,][0-9]{1,2})?%?[^0-9]*(?P<cur>CHF|EUR|USD|GBP)?\s*(?P<amt>[0-9]{1,3}(?:[',\.][0-9]{3})*(?:[\.,][0-9]{2}))")

    def _heuristic_enrich(self, text: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Best-effort regex pass to fill obvious missing details."""

        # Currency + amount ------------------------------------------------
        if not metadata.get("amount"):
            m = self._CURRENCY_AMOUNT_RE.search(text)
            if m:
                amt = m.group("amt").replace("'", "").replace(",", ".")
                try:
                    metadata["amount"] = float(amt)
                except ValueError:
                    pass
        if not metadata.get("currency"):
            m = self._CURRENCY_AMOUNT_RE.search(text)
            if m and m.group("cur"):
                metadata["currency"] = m.group("cur")

        # Email -----------------------------------------------------------
        if not metadata.get("sender_email") and not metadata.get("email"):
            m = self._EMAIL_RE.search(text)
            if m:
                metadata["email"] = m.group(0)

        # Phone -----------------------------------------------------------
        if not metadata.get("phone"):
            m = self._PHONE_RE.search(text)
            if m:
                metadata["phone"] = m.group(0)

        # Address block ---------------------------------------------------
        if not metadata.get("street") or not metadata.get("zip") or not metadata.get("town"):
            m = self._ADDRESS_BLOCK_RE.search(text)
            if m:
                metadata.setdefault("street", m.group("street").strip())
                metadata.setdefault("zip", m.group("zip"))
                metadata.setdefault("town", m.group("town").strip())

        # VAT -------------------------------------------------------------
        if not metadata.get("vat_id"):
            m = self._VAT_RE.search(text)
            if m:
                metadata["vat_id"] = m.group(0).upper().replace(" ", "").replace(".", "-")

        # VAT amount / rate ----------------------------------------------
        if not metadata.get("tax_amount") or not metadata.get("tax_rate"):
            m = self._VAT_LINE_RE.search(text)
            if m:
                amt_raw = m.group("amt")
                cur = m.group("cur")
                perc = m.group("perc")

                try:
                    amt = float(amt_raw.replace("'", "").replace(",", "."))
                    metadata.setdefault("tax_amount", amt)
                    if cur and not metadata.get("currency"):
                        metadata["currency"] = cur
                except Exception:
                    pass

                if perc and not metadata.get("tax_rate"):
                    try:
                        metadata["tax_rate"] = float(perc.replace(",", "."))
                    except Exception:
                        pass

        return metadata

class LLMProcessor(LLMService):
    """Backward-compatibility alias for code that expects LLMProcessor."""
    pass
