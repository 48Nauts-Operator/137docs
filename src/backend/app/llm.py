"""
LLM integration module for metadata extraction and document analysis.
"""
import httpx
import json
import logging
from typing import Dict, Any, Optional
from app.config import settings
import re

logger = logging.getLogger(__name__)

class LLMService:
    """Service for interacting with LLM APIs."""
    
    async def extract_metadata(
        self,
        text: str,
        *,
        max_attempts: int = 3,
        target_score: float = 0.6,
    ) -> Dict[str, Any]:
        """Return *metadata* with at least *target_score* completeness.

        The method performs up to *max_attempts* LLM calls. After every call it
        1. parses the JSON
        2. enriches it with regex-based heuristics (phones, e-mails, amounts…)
        3. scores the result.  If the score ≥ *target_score* it stops early.
        """

        logger.info("Extracting metadata using LLM – target %.0f%%", target_score * 100)

        attempt = 0
        metadata: Dict[str, Any] = {}

        missing_fields: list[str] | None = None

        while attempt < max_attempts:
            attempt += 1

            prompt = self._create_metadata_extraction_prompt(text, missing_fields)
            response = await self._query_llm(prompt)
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
        - document_date: The date of the document (YYYY-MM-DD format)
        - due_date: Due date if applicable (YYYY-MM-DD format)
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
        """Return ratio \[0,1] of populated *required* fields."""

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
