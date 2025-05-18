"""
LLM integration module for metadata extraction and document analysis.
"""
import httpx
import json
import logging
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

class LLMService:
    """Service for interacting with LLM APIs."""
    
    async def extract_metadata(self, text: str) -> Dict[str, Any]:
        """
        Extract metadata from document text using LLM.
        
        Args:
            text: Document text content
            
        Returns:
            Dictionary of extracted metadata
        """
        logger.info("Extracting metadata using LLM")
        
        # Prepare prompt for metadata extraction
        prompt = self._create_metadata_extraction_prompt(text)
        
        # Get LLM response
        response = await self._query_llm(prompt)
        
        # Parse metadata from response
        metadata = self._parse_metadata_response(response)
        
        return metadata
    
    async def analyze_document(self, text: str) -> Dict[str, Any]:
        """
        Analyze document content using LLM.
        
        Args:
            text: Document text content
            
        Returns:
            Dictionary of analysis results
        """
        logger.info("Analyzing document using LLM")
        
        # Prepare prompt for document analysis
        prompt = self._create_document_analysis_prompt(text)
        
        # Get LLM response
        response = await self._query_llm(prompt)
        
        # Parse analysis from response
        analysis = self._parse_analysis_response(response)
        
        return analysis
    
    async def suggest_tags(self, text: str) -> list:
        """
        Suggest tags for a document based on its content.
        
        Args:
            text: Document text content
            
        Returns:
            List of suggested tags
        """
        logger.info("Suggesting tags using LLM")
        
        # Prepare prompt for tag suggestion
        prompt = self._create_tag_suggestion_prompt(text)
        
        # Get LLM response
        response = await self._query_llm(prompt)
        
        # Parse tags from response
        tags = self._parse_tags_response(response)
        
        return tags
    
    async def _query_llm(self, prompt: str) -> str:
        """
        Query the LLM API with a prompt.
        
        Args:
            prompt: The prompt to send to the LLM
            
        Returns:
            LLM response text
        """
        # Decide which endpoint to use.
        # Heuristic: if an explicit API key is provided we assume a generic
        # hosted provider (OpenAI, Together, etc.).  If *no* key is present we
        # fall back to the local Ollama endpoint.

        if settings.LLM_API_KEY:
            return await self._query_generic_llm(prompt)

        # No API key → treat the target as an Ollama instance
        return await self._query_ollama(prompt)
    
    async def _query_ollama(self, prompt: str) -> str:
        """Query Ollama API."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    settings.LLM_API_URL,
                    json={
                        "model": settings.LLM_MODEL,
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
    
    async def _query_generic_llm(self, prompt: str) -> str:
        """Query a generic LLM API."""
        try:
            headers = {}
            if settings.LLM_API_KEY:
                # Only set the header if a token is actually present – sending
                # an empty Bearer header causes certain HTTP clients to raise
                # "Illegal header value" errors.
                headers["Authorization"] = f"Bearer {settings.LLM_API_KEY}"
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    settings.LLM_API_URL,
                    headers=headers,
                    json={
                        "model": settings.LLM_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.1
                    },
                    timeout=60.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get("choices", [{}])[0].get("message", {}).get("content", "")
                else:
                    logger.error(f"LLM API error: {response.status_code} - {response.text}")
                    return f"Error: {response.status_code}"
        except Exception as e:
            logger.error(f"Error querying LLM: {str(e)}")
            return f"Error: {str(e)}"
    
    def _create_metadata_extraction_prompt(self, text: str) -> str:
        """Create prompt for metadata extraction."""
        # Truncate text if too long
        truncated_text = text[:3000] + "..." if len(text) > 3000 else text
        
        return f"""
        Extract the following metadata from this document text. Return the result as a JSON object.
        
        Fields to extract:
        - title: The document title
        - document_type: Type of document (invoice, contract, letter, etc.)
        - sender: The sender or issuer of the document
        - recipient: The recipient of the document
        - document_date: The date of the document (YYYY-MM-DD format)
        - due_date: Due date if applicable (YYYY-MM-DD format)
        - amount: Total amount if applicable (numeric value only)
        - status: Document status (paid, unpaid, pending, etc.)
        - tags: List of relevant tags for the document
        
        Document text:
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

class LLMProcessor(LLMService):
    """Backward-compatibility alias for code that expects LLMProcessor."""
    pass
