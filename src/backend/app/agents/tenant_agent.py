"""
Tenant Extraction and Auto-Assignment Agent.

This agent reads document content, extracts recipient/tenant information,
and automatically creates or assigns documents to the appropriate tenant profiles.
"""
import logging
import re
import json
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import Document, Entity, UserEntity
from app.repository import TenantRepository, DocumentRepository
from app.llm import LLMService

logger = logging.getLogger(__name__)

class TenantExtractionAgent:
    """Agent for automatic tenant extraction and document assignment."""
    
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
        self.tenant_repository = TenantRepository()
        self.document_repository = DocumentRepository()
        self.llm_service = LLMService(db_session)
    
    async def analyze_and_assign_tenant(self, document_id: int, user_id: int) -> Dict[str, Any]:
        """
        Analyze document content to extract tenant information and assign to appropriate tenant.
        
        Args:
            document_id: ID of the document to analyze
            user_id: ID of the user who owns the document
            
        Returns:
            Dictionary with analysis results and assignment status
        """
        try:
            # Get document
            document = await self.document_repository.get_by_id(self.db_session, document_id)
            if not document:
                return {"status": "error", "message": "Document not found"}
            
            # Skip if document already has a good recipient assignment
            if (document.recipient and 
                document.recipient.strip() and 
                document.recipient not in ["Your Company", "", "Unknown"]):
                return {
                    "status": "no_match", 
                    "message": f"Document already has recipient: {document.recipient}"
                }
            
            # Extract tenant information from document
            tenant_info = await self._extract_tenant_info(document)
            if not tenant_info:
                return {
                    "status": "no_match", 
                    "message": "Could not extract tenant information from document content"
                }
            
            # Validate minimum confidence
            confidence = tenant_info.get("confidence", 0.0)
            if confidence < 0.5:
                return {
                    "status": "no_match", 
                    "message": f"Low confidence extraction: {confidence:.2f}"
                }
            
            # Find or create matching tenant
            tenant_result = await self._find_or_create_tenant(tenant_info, user_id)
            
            # Assign document to tenant
            if tenant_result["status"] == "success":
                await self._assign_document_to_tenant(document, tenant_result["tenant"])
                
                return {
                    "status": "success",
                    "message": f"Document assigned to tenant: {tenant_result['tenant']['alias']}",
                    "tenant": tenant_result["tenant"],
                    "extracted_info": tenant_info,
                    "confidence": confidence,
                    "action": tenant_result["action"]  # "found", "created", or "updated"
                }
            elif tenant_result["status"] == "vendor_rejected":
                return {
                    "status": "vendor_rejected",
                    "message": tenant_result["message"],
                    "extracted_info": tenant_info,
                    "confidence": confidence
                }
            else:
                return tenant_result
                
        except Exception as e:
            logger.error(f"Error in tenant analysis for document {document_id}: {str(e)}")
            # Still return a result so the process doesn't completely fail
            return {
                "status": "error", 
                "message": f"Analysis failed: {str(e)}"
            }
    
    async def _extract_tenant_info(self, document: Document) -> Optional[Dict[str, Any]]:
        """Extract tenant/recipient information from document content."""
        
        if not await self.llm_service.is_enabled():
            logger.info("LLM not enabled, falling back to simple extraction")
            return await self._simple_tenant_extraction(document)
        
        # Use LLM for sophisticated extraction
        prompt = self._create_tenant_extraction_prompt(document.content or "", document.title or "")
        
        try:
            response = await self.llm_service._query_llm(prompt, task_type='enricher')
            return self._parse_tenant_response(response)
        except Exception as e:
            logger.warning(f"LLM tenant extraction failed: {e}, falling back to simple extraction")
            return await self._simple_tenant_extraction(document)
    
    def _create_tenant_extraction_prompt(self, content: str, title: str) -> str:
        """Create LLM prompt for tenant extraction."""
        # Truncate content for efficiency
        truncated_content = content[:4000] + "..." if len(content) > 4000 else content
        
        return f"""
        Analyze this document and extract ONLY the RECIPIENT information - the person or company 
        that the document is addressed TO, billed TO, or intended FOR.
        
        CRITICAL: DO NOT extract information about the sender, vendor, or service provider.
        ONLY extract information about the recipient/customer/addressee.
        
        Document Title: {title}
        
        Document Content:
        {truncated_content}
        
        IMPORTANT RULES:
        1. Your response must be ONLY a valid JSON object with no additional text
        2. ONLY extract RECIPIENT information (who receives/pays the bill)
        3. DO NOT extract VENDOR/SENDER information (who sends/issues the bill)
        4. Look for "Bill To:", "Customer:", "Recipient:", or address blocks for recipients
        5. IGNORE company names in headers, letterheads, or "From:" sections
        6. If the document is FROM a company TO you, extract YOUR information, not theirs
        
        Common vendor names to IGNORE (these are senders, not recipients):
        - Hetzner Online GmbH, Digital Ocean, AWS, Google Cloud
        - Blockonauts, Impact Labs, Chainstack, GitBook  
        - Visana, Swica, CSS, health insurance companies
        - Banks, telecommunications, utility companies
        - Any company in the header/letterhead sending the bill
        
        For invoices: Extract the CUSTOMER being billed, not the company issuing the invoice.
        For letters: Extract the ADDRESSEE, not the sender.
        For legal documents: Extract the CLIENT, not the law firm.
        
        Extract the following information about the RECIPIENT only:
        
        {{
            "name": "Full legal name of the RECIPIENT person or company",
            "alias": "Short friendly name for the RECIPIENT",
            "type": "company" or "individual",
            "address": {{
                "street": "RECIPIENT's street address",
                "house_number": "RECIPIENT's house number",
                "apartment": "RECIPIENT's apartment/unit",
                "area_code": "RECIPIENT's postal code", 
                "county": "RECIPIENT's state/province",
                "country": "RECIPIENT's country"
            }},
            "contact": {{
                "phone": "RECIPIENT's phone number",
                "email": "RECIPIENT's email address"
            }},
            "business_info": {{
                "vat_id": "RECIPIENT's VAT/Tax ID",
                "iban": "RECIPIENT's bank account"
            }},
            "confidence": 0.0
        }}
        
        Look for RECIPIENT patterns like:
        - "To:", "Bill to:", "Customer:", "Client:" sections
        - Address blocks showing where to send the bill
        - Personal names as addressees (not in company headers)
        - Invoice recipient information (customer details)
        - Legal document clients (not the law firm)
        
        Set confidence based on RECIPIENT clarity:
        - 0.9-1.0 if RECIPIENT is clearly identified with address
        - 0.7-0.8 if RECIPIENT is clearly named but limited address
        - 0.5-0.6 if only partial RECIPIENT information available
        - 0.0 if no clear RECIPIENT or only VENDOR/SENDER information found
        
        If you only see vendor/sender information and no clear recipient, return: {{"confidence": 0.0}}
        
        Response (JSON only):"""
    
    def _parse_tenant_response(self, response: str) -> Optional[Dict[str, Any]]:
        """Parse LLM response for tenant information with robust error handling."""
        try:
            # Clean up response
            response = response.strip()
            if response.lower() == "null" or not response:
                return None
            
            # Log the response for debugging
            logger.debug(f"Parsing tenant response: {response[:200]}...")
            
            # Try multiple JSON extraction strategies
            tenant_data = None
            
            # Strategy 1: Direct JSON parsing
            try:
                tenant_data = json.loads(response)
            except json.JSONDecodeError:
                pass
            
            # Strategy 2: Extract JSON from response text
            if not tenant_data:
                json_patterns = [
                    r'\{.*\}',  # Standard JSON block
                    r'```json\s*(\{.*?\})\s*```',  # Markdown code block
                    r'JSON[:\s]*(\{.*?\})',  # After "JSON:" label
                ]
                
                for pattern in json_patterns:
                    json_match = re.search(pattern, response, re.DOTALL | re.IGNORECASE)
                    if json_match:
                        json_str = json_match.group(1) if len(json_match.groups()) > 0 else json_match.group()
                        try:
                            tenant_data = json.loads(json_str)
                            break
                        except json.JSONDecodeError:
                            continue
            
            # Strategy 3: Try to fix common JSON issues
            if not tenant_data:
                # Remove trailing commas, fix quotes, etc.
                cleaned_response = self._clean_json_response(response)
                try:
                    tenant_data = json.loads(cleaned_response)
                except json.JSONDecodeError:
                    logger.warning(f"Could not parse tenant response after cleaning: {response[:100]}...")
                    return None
            
            if not tenant_data or not isinstance(tenant_data, dict):
                logger.warning("Tenant response is not a valid dictionary")
                return None
            
            # Validate confidence score
            confidence = tenant_data.get("confidence", 0.0)
            if confidence < 0.5:  # Low confidence, skip
                logger.info(f"Low confidence tenant extraction: {confidence}")
                return None
            
            # Validate required fields
            if not tenant_data.get("name") and not tenant_data.get("alias"):
                logger.warning("Tenant response missing required name/alias fields")
                return None
            
            # Normalize and validate the data
            normalized_data = self._normalize_tenant_data(tenant_data)
            
            return normalized_data
            
        except Exception as e:
            logger.warning(f"Failed to parse tenant response: {e}")
            logger.debug(f"Problematic response: {response}")
            return None
    
    def _clean_json_response(self, response: str) -> str:
        """Clean common JSON formatting issues in LLM responses."""
        # Remove any markdown formatting
        response = re.sub(r'```json\s*', '', response)
        response = re.sub(r'\s*```', '', response)
        
        # Find the JSON object
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if not json_match:
            return response
        
        json_str = json_match.group()
        
        # Fix common issues
        # Remove trailing commas before closing braces
        json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
        
        # Fix unquoted keys
        json_str = re.sub(r'(\w+)(?=\s*:)', r'"\1"', json_str)
        
        # Fix single quotes to double quotes
        json_str = json_str.replace("'", '"')
        
        # Remove comments
        json_str = re.sub(r'//.*$', '', json_str, flags=re.MULTILINE)
        
        return json_str
    
    def _normalize_tenant_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize and validate tenant data structure."""
        normalized = {
            "name": str(data.get("name", "")).strip(),
            "alias": str(data.get("alias", "")).strip(),
            "type": str(data.get("type", "individual")).lower(),
            "confidence": float(data.get("confidence", 0.5))
        }
        
        # Ensure we have at least a name or alias
        if not normalized["name"] and not normalized["alias"]:
            normalized["name"] = "Unknown Recipient"
            normalized["alias"] = "Unknown"
        elif not normalized["alias"]:
            normalized["alias"] = self._generate_alias(normalized["name"])
        elif not normalized["name"]:
            normalized["name"] = normalized["alias"]
        
        # Validate type
        if normalized["type"] not in ["company", "individual"]:
            normalized["type"] = "individual"
        
        # Process nested structures safely
        address = data.get("address", {})
        if isinstance(address, dict):
            normalized["address"] = {
                "street": str(address.get("street", "")).strip(),
                "house_number": str(address.get("house_number", "")).strip(),
                "apartment": str(address.get("apartment", "")).strip(), 
                "area_code": str(address.get("area_code", "")).strip(),
                "county": str(address.get("county", "")).strip(),
                "country": str(address.get("country", "")).strip()
            }
            # Remove empty fields
            normalized["address"] = {k: v for k, v in normalized["address"].items() if v}
        
        contact = data.get("contact", {})
        if isinstance(contact, dict):
            normalized["contact"] = {
                "phone": str(contact.get("phone", "")).strip(),
                "email": str(contact.get("email", "")).strip()
            }
            # Remove empty fields
            normalized["contact"] = {k: v for k, v in normalized["contact"].items() if v}
        
        business_info = data.get("business_info", {})
        if isinstance(business_info, dict):
            normalized["business_info"] = {
                "vat_id": str(business_info.get("vat_id", "")).strip(),
                "iban": str(business_info.get("iban", "")).strip()
            }
            # Remove empty fields
            normalized["business_info"] = {k: v for k, v in normalized["business_info"].items() if v}
        
        return normalized
    
    async def _simple_tenant_extraction(self, document: Document) -> Optional[Dict[str, Any]]:
        """Simple rule-based tenant extraction when LLM is not available."""
        content = (document.content or "").lower()
        title = (document.title or "").lower()
        original_content = document.content or ""  # Keep original case for extraction
        
        # Check if document already has recipient info
        if document.recipient and document.recipient.strip() and document.recipient != "Your Company":
            return {
                "name": document.recipient,
                "alias": self._generate_alias(document.recipient),
                "type": "company" if any(indicator in document.recipient.lower() 
                                      for indicator in ["gmbh", "ag", "ltd", "inc", "corp", "llc", "sa", "sarl"]) else "individual",
                "confidence": 0.7
            }
        
        # Swiss legal document patterns
        swiss_patterns = [
            r"unsere\s+referenz[:\s]*([^\n]+)",
            r"ihre\s+referenz[:\s]*([^\n]+)", 
            r"gläubiger[:\s]*([^\n]+)",
            r"zuständig\s+mitarbeiter[:\s]*([^\n]+)",
            r"pr\.\s+([a-z\s]+calanni)",  # Specific pattern from the image
            r"andré\s+([a-z\s]+)",  # Another pattern from the image
        ]
        
        # Standard patterns
        standard_patterns = [
            r"(?:bill\s+to|to|recipient|customer)[:\s]*([^\n]{5,100})",
            r"(?:mr\.|mrs\.|ms\.|dr\.)\s+([a-z\s]{3,50})",
            r"([a-z\s]+\s+(?:gmbh|ag|ltd|inc|corp|llc|sa|sarl))",
            r"([a-z][a-z\s]+[a-z])\s*\n\s*(?:technology|technologie|labs|lab|gmbh|ag|sa)",
            r"address[:\s]*([^\n]{10,100})",
        ]
        
        # Try Swiss patterns first (for Swiss legal documents)
        for pattern in swiss_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE | re.MULTILINE)
            if matches:
                recipient = matches[0].strip()
                # Clean up common artifacts
                recipient = re.sub(r'\s+', ' ', recipient)
                recipient = recipient.replace(':', '').strip()
                
                if len(recipient) > 3 and not recipient.lower() in ['tel', 'email', 'fax']:
                    return {
                        "name": recipient,
                        "alias": self._generate_alias(recipient),
                        "type": "individual" if any(title in recipient.lower() for title in ["mr", "mrs", "ms", "dr", "prof"]) else "company",
                        "confidence": 0.6
                    }
        
        # Try standard patterns
        for pattern in standard_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            if matches:
                recipient = matches[0].strip()
                # Clean up and validate
                recipient = re.sub(r'\s+', ' ', recipient)
                recipient = recipient.replace(':', '').strip()
                
                if len(recipient) > 3 and not any(skip in recipient.lower() for skip in ['email', 'tel', 'fax', 'phone', 'www']):
                    return {
                        "name": recipient,
                        "alias": self._generate_alias(recipient),
                        "type": "company" if any(indicator in recipient.lower() 
                                              for indicator in ["gmbh", "ag", "ltd", "inc", "corp", "llc", "sa", "sarl"]) else "individual",
                        "confidence": 0.6
                    }
        
        # Last resort: look for any proper nouns that might be names
        proper_nouns = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', original_content)
        if proper_nouns:
            # Filter out common words and take the most likely candidate
            common_words = {'The', 'This', 'That', 'Date', 'Time', 'Amount', 'Total', 'Invoice', 'Document', 'Page', 'Email', 'Phone', 'Address'}
            candidates = [name for name in proper_nouns if name not in common_words and len(name) > 2]
            
            if candidates:
                # Take the most frequent or first reasonable candidate
                candidate = candidates[0]
                return {
                    "name": candidate,
                    "alias": self._generate_alias(candidate),
                    "type": "individual",
                    "confidence": 0.5
                }
        
        return None
    
    def _generate_alias(self, name: str) -> str:
        """Generate a friendly alias from a full name."""
        if not name:
            return "Unknown"
        
        # Remove common business suffixes for cleaner alias
        clean_name = re.sub(r'\b(gmbh|ag|ltd|inc|corp|llc|sa|sarl)\b', '', name, flags=re.IGNORECASE).strip()
        
        # Take first few words or characters
        words = clean_name.split()
        if len(words) <= 2:
            return clean_name.title()
        elif len(words) <= 4:
            return " ".join(words[:2]).title()
        else:
            # For longer names, take first word + abbreviation
            return f"{words[0].title()} ({words[1][0].upper()}...)"
    
    async def _find_or_create_tenant(self, tenant_info: Dict[str, Any], user_id: int) -> Dict[str, Any]:
        """Find existing tenant - NEVER creates new tenants automatically."""
        try:
            # Get user's existing tenants
            existing_tenants = await self.tenant_repository.get_user_tenants(self.db_session, user_id)
            
            # Try to find matching tenant
            match = self._find_matching_tenant(tenant_info, existing_tenants)
            
            if match:
                # Update existing tenant with new information
                updated_tenant = await self._update_tenant_info(match, tenant_info)
                return {
                    "status": "success",
                    "tenant": updated_tenant,
                    "action": "found"
                }
            else:
                # NO AUTOMATIC CREATION - User must create tenants manually
                logger.info(f"No matching tenant found for '{tenant_info.get('name', 'Unknown')}' - tenant creation disabled for security")
                return {
                    "status": "no_match",
                    "message": f"No matching tenant found for '{tenant_info.get('name', 'Unknown')}'. Please create tenant manually if needed.",
                    "extracted_info": tenant_info
                }
                
        except Exception as e:
            logger.error(f"Error finding tenant: {str(e)}")
            return {"status": "error", "message": f"Tenant search failed: {str(e)}"}
    
    def _find_matching_tenant(self, tenant_info: Dict[str, Any], existing_tenants: List[Dict]) -> Optional[Dict]:
        """Find matching tenant using fuzzy matching."""
        from difflib import SequenceMatcher
        
        target_name = tenant_info.get("name", "").lower()
        target_alias = tenant_info.get("alias", "").lower()
        
        best_match = None
        best_score = 0.0
        threshold = 0.8  # High threshold for tenant matching
        
        for tenant in existing_tenants:
            # Compare names
            name_score = SequenceMatcher(None, target_name, tenant.get("name", "").lower()).ratio()
            alias_score = SequenceMatcher(None, target_alias, tenant.get("alias", "").lower()).ratio()
            
            # Use the better score
            score = max(name_score, alias_score)
            
            if score > threshold and score > best_score:
                best_match = tenant
                best_score = score
        
        return best_match
    
    async def _update_tenant_info(self, tenant: Dict, new_info: Dict[str, Any]) -> Dict:
        """Update existing tenant with new information."""
        # Only update empty fields to avoid overwriting good data
        update_data = {}
        
        # Extract nested information
        address = new_info.get("address", {})
        contact = new_info.get("contact", {})
        business = new_info.get("business_info", {})
        
        # Update only if current field is empty
        for field, value in {
            "street": address.get("street"),
            "house_number": address.get("house_number"),
            "apartment": address.get("apartment"),
            "area_code": address.get("area_code"),
            "county": address.get("county"),
            "country": address.get("country"),
            "iban": business.get("iban"),
            "vat_id": business.get("vat_id")
        }.items():
            if value and not tenant.get(field):
                update_data[field] = value
        
        if update_data:
            updated = await self.tenant_repository.update_tenant(
                self.db_session, 
                tenant["id"], 
                tenant["id"],  # user_id is not used in the method, but required
                **update_data
            )
            return updated or tenant
        
        return tenant
    
    async def _assign_document_to_tenant(self, document: Document, tenant: Dict) -> None:
        """Assign document to the specified tenant."""
        # Update document recipient to match tenant alias
        document.recipient = tenant["alias"]
        await self.db_session.flush()
        
        logger.info(f"Assigned document {document.id} to tenant {tenant['alias']}") 