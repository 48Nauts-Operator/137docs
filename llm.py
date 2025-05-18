"""
LLM integration module for document processing.
"""
import logging
import httpx
import json
from typing import Dict, Any, List, Optional
from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

class LLMProcessor:
    """Handles LLM integration for document processing."""
    
    def __init__(self):
        """Initialize the LLM processor."""
        self.provider = settings.LLM_PROVIDER
        self.model = settings.LLM_MODEL
        self.base_url = settings.OLLAMA_BASE_URL
        
        logger.info(f"Initialized LLM processor with provider: {self.provider}, model: {self.model}")
    
    async def generate_tags(self, document_text: str, document_type: str) -> List[str]:
        """Generate tags for a document using LLM.
        
        Args:
            document_text: Document text content
            document_type: Document type classification
            
        Returns:
            List of suggested tags
        """
        # Prepare prompt for tag generation
        prompt = f"""
        You are an AI assistant helping to tag and categorize documents.
        
        Document type: {document_type}
        
        Document content:
        {document_text[:1000]}...
        
        Based on the document content and type, suggest 3-5 relevant tags that would help categorize this document.
        Return only the tags as a comma-separated list, without any additional text.
        """
        
        # Generate tags using LLM
        response = await self._query_llm(prompt)
        
        # Parse response to extract tags
        tags = []
        if response:
            # Clean up response and split by commas
            tags = [tag.strip() for tag in response.split(',')]
            # Remove any empty tags
            tags = [tag for tag in tags if tag]
            # Limit to 5 tags
            tags = tags[:5]
        
        logger.info(f"Generated tags: {tags}")
        return tags
    
    async def summarize_document(self, document_text: str) -> str:
        """Generate a summary for a document using LLM.
        
        Args:
            document_text: Document text content
            
        Returns:
            Document summary
        """
        # Prepare prompt for summarization
        prompt = f"""
        You are an AI assistant helping to summarize documents.
        
        Document content:
        {document_text[:2000]}...
        
        Please provide a concise summary of this document in 2-3 sentences.
        """
        
        # Generate summary using LLM
        response = await self._query_llm(prompt)
        
        logger.info("Generated document summary")
        return response
    
    async def extract_key_information(self, document_text: str, document_type: str) -> Dict[str, Any]:
        """Extract key information from a document using LLM.
        
        Args:
            document_text: Document text content
            document_type: Document type classification
            
        Returns:
            Dictionary of extracted information
        """
        # Prepare prompt based on document type
        if document_type == "invoice":
            prompt = f"""
            You are an AI assistant helping to extract information from invoices.
            
            Invoice content:
            {document_text[:2000]}...
            
            Please extract the following information in JSON format:
            - invoice_number: The invoice number
            - sender: The company or person who sent the invoice
            - recipient: The company or person receiving the invoice
            - issue_date: The date the invoice was issued (YYYY-MM-DD)
            - due_date: The date payment is due (YYYY-MM-DD)
            - total_amount: The total amount due
            - currency: The currency of the amount
            - payment_method: The payment method if specified
            
            Return only the JSON object, nothing else.
            """
        elif document_type == "receipt":
            prompt = f"""
            You are an AI assistant helping to extract information from receipts.
            
            Receipt content:
            {document_text[:2000]}...
            
            Please extract the following information in JSON format:
            - merchant: The company or person who issued the receipt
            - date: The date of purchase (YYYY-MM-DD)
            - total_amount: The total amount paid
            - currency: The currency of the amount
            - payment_method: The payment method if specified
            - items: List of items purchased (if available)
            
            Return only the JSON object, nothing else.
            """
        else:
            prompt = f"""
            You are an AI assistant helping to extract information from documents.
            
            Document content:
            {document_text[:2000]}...
            
            Please extract the following information in JSON format:
            - title: The document title or subject
            - sender: The company or person who sent the document
            - recipient: The company or person receiving the document
            - date: The document date (YYYY-MM-DD)
            - key_points: List of 2-3 key points from the document
            
            Return only the JSON object, nothing else.
            """
        
        # Generate extraction using LLM
        response = await self._query_llm(prompt)
        
        # Parse JSON response
        try:
            result = json.loads(response)
            logger.info("Extracted key information from document")
            return result
        except json.JSONDecodeError:
            logger.error("Failed to parse LLM response as JSON")
            return {}
    
    async def generate_tasks(self, document_text: str, document_type: str) -> List[Dict[str, str]]:
        """Generate suggested tasks based on document content.
        
        Args:
            document_text: Document text content
            document_type: Document type classification
            
        Returns:
            List of suggested tasks with descriptions and due dates
        """
        # Prepare prompt for task generation
        prompt = f"""
        You are an AI assistant helping to generate tasks based on document content.
        
        Document type: {document_type}
        
        Document content:
        {document_text[:2000]}...
        
        Based on this document, suggest 1-3 tasks that might need to be completed.
        For each task, provide a description and a suggested due date relative to today.
        
        Return the tasks in JSON format as an array of objects with "description" and "due_date" fields.
        The due_date should be in the format "in X days" or "on YYYY-MM-DD".
        
        Return only the JSON array, nothing else.
        """
        
        # Generate tasks using LLM
        response = await self._query_llm(prompt)
        
        # Parse JSON response
        try:
            tasks = json.loads(response)
            logger.info(f"Generated {len(tasks)} tasks")
            return tasks
        except json.JSONDecodeError:
            logger.error("Failed to parse LLM response as JSON")
            return []
    
    async def _query_llm(self, prompt: str) -> str:
        """Query the LLM with a prompt.
        
        Args:
            prompt: The prompt to send to the LLM
            
        Returns:
            LLM response text
        """
        if self.provider == "ollama":
            return await self._query_ollama(prompt)
        else:
            logger.error(f"Unsupported LLM provider: {self.provider}")
            return ""
    
    async def _query_ollama(self, prompt: str) -> str:
        """Query Ollama LLM with a prompt.
        
        Args:
            prompt: The prompt to send to Ollama
            
        Returns:
            Ollama response text
        """
        url = f"{self.base_url}/api/generate"
        
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=30.0)
                response.raise_for_status()
                result = response.json()
                return result.get("response", "")
        except httpx.HTTPError as e:
            logger.error(f"HTTP error when querying Ollama: {e}")
            return ""
        except Exception as e:
            logger.error(f"Error querying Ollama: {e}")
            return ""
