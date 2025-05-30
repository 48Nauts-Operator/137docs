"""
LLM Service Factory for document processing integration.
"""
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.llm import LLMService
from app.models import Document
from app.repository import DocumentRepository

logger = logging.getLogger(__name__)

class DocumentLLMService:
    """High-level LLM service for document processing tasks."""
    
    def __init__(self, db_session: AsyncSession):
        """Initialize with database session."""
        self.db_session = db_session
        self.llm_service = LLMService(db_session=db_session)
        self.doc_repo = DocumentRepository()
    
    async def process_document(self, document_id: int, force: bool = False) -> Dict[str, Any]:
        """
        Process document with LLM: extract metadata, suggest tags, analyze content, and extract tenant info.
        
        Args:
            document_id: ID of document to process
            force: Whether to force reprocessing if already processed
            
        Returns:
            Dictionary with processing results
        """
        results = {
            "document_id": document_id,
            "status": "processing"
        }
        
        try:
            # Get document
            doc_repo = DocumentRepository()
            document = await doc_repo.get_by_id(self.db_session, document_id)
            if not document:
                return {"status": "error", "message": "Document not found"}
            
            # Skip if already processed and not forcing
            if not force and hasattr(document, 'llm_processed') and document.llm_processed:
                return {"status": "skipped", "message": "Document already processed"}
        
        except Exception as e:
            logger.error(f"Error retrieving document {document_id}: {str(e)}")
            return {"status": "error", "message": f"Could not retrieve document: {str(e)}"}
        
        try:
            # Extract metadata if auto-enrichment is enabled
            config = await self.llm_service.get_config()
            if config.get('auto_enrichment', True):
                metadata = await self.llm_service.extract_metadata(
                    document.content or "",
                    task_type='enricher'
                )
                if metadata:
                    results['metadata'] = metadata
                    # Update document with extracted metadata
                    await self._update_document_metadata(document, metadata)
            
            # Generate tags if auto-tagging is enabled
            if config.get('auto_tagging', True):
                tags = await self.llm_service.suggest_tags(document.content or "")
                if tags:
                    results['suggested_tags'] = tags
                    # Add tags to document
                    await self._add_tags_to_document(document_id, tags)
            
            # Generate analysis
            analysis = await self.llm_service.analyze_document(document.content or "")
            if analysis:
                results['analysis'] = analysis
            
            # Extract and assign tenant information (new feature)
            from app.agents.tenant_agent import TenantExtractionAgent
            tenant_agent = TenantExtractionAgent(self.db_session)
            
            # We need to get the user ID - for now, we'll use a simpler approach
            # In a real system, you'd pass the user_id to this method
            # For now, let's skip tenant extraction in the batch process
            # and only do it via the dedicated endpoint
            
            # Mark as processed
            if hasattr(document, 'llm_processed'):
                document.llm_processed = True
                await self.db_session.commit()
            
            results['status'] = 'success'
            results['message'] = 'Document processed successfully'
            
        except Exception as e:
            logger.error(f"Error processing document {document_id}: {str(e)}")
            results = {
                "status": "error",
                "message": f"Processing failed: {str(e)}"
            }
        
        return results
    
    async def batch_process_documents(self, document_ids: List[int], force: bool = False) -> Dict[str, Any]:
        """
        Process multiple documents in batch.
        
        Args:
            document_ids: List of document IDs to process
            force: Force processing even if already processed
            
        Returns:
            Batch processing results
        """
        if not await self.llm_service.is_enabled():
            return {"status": "disabled", "message": "LLM processing is disabled"}
        
        config = await self.llm_service.get_config()
        batch_size = config.get('batch_size', 5)
        concurrent_tasks = config.get('concurrent_tasks', 2)
        
        results = {
            "status": "success",
            "total": len(document_ids),
            "processed": 0,
            "skipped": 0,
            "errors": 0,
            "details": []
        }
        
        # Process in batches
        for i in range(0, len(document_ids), batch_size):
            batch = document_ids[i:i + batch_size]
            logger.info(f"Processing batch {i//batch_size + 1}: documents {batch}")
            
            # Process batch with limited concurrency
            import asyncio
            semaphore = asyncio.Semaphore(concurrent_tasks)
            
            async def process_with_semaphore(doc_id):
                async with semaphore:
                    return await self.process_document(doc_id, force=force)
            
            batch_results = await asyncio.gather(
                *[process_with_semaphore(doc_id) for doc_id in batch],
                return_exceptions=True
            )
            
            # Aggregate results
            for doc_id, result in zip(batch, batch_results):
                if isinstance(result, Exception):
                    results["errors"] += 1
                    results["details"].append({
                        "document_id": doc_id,
                        "status": "error",
                        "message": str(result)
                    })
                else:
                    if result.get("status") == "success":
                        results["processed"] += 1
                    elif result.get("status") == "skipped":
                        results["skipped"] += 1
                    else:
                        results["errors"] += 1
                    
                    results["details"].append({
                        "document_id": doc_id,
                        **result
                    })
        
        return results
    
    async def enrich_document_field(self, document_id: int, field_name: str) -> Dict[str, Any]:
        """
        Enrich a specific field of a document using LLM.
        
        Args:
            document_id: ID of the document
            field_name: Name of the field to enrich
            
        Returns:
            Enrichment result
        """
        if not await self.llm_service.is_enabled():
            return {"status": "disabled", "message": "LLM processing is disabled"}
        
        document = await self.doc_repo.get_by_id(self.db_session, document_id)
        if not document:
            return {"status": "error", "message": "Document not found"}
        
        try:
            # Create focused prompt for field enrichment
            prompt = f"""
            Extract the {field_name} from this document. Return only the value, no explanation.
            
            Document content:
            {document.content[:2000]}...
            
            {field_name}:
            """
            
            response = await self.llm_service._query_llm(prompt, task_type='enricher')
            
            if response and response.strip():
                return {
                    "status": "success",
                    "field": field_name,
                    "value": response.strip(),
                    "message": f"Successfully enriched {field_name}"
                }
            else:
                return {
                    "status": "error",
                    "message": f"Could not extract {field_name}"
                }
                
        except Exception as e:
            logger.error(f"Error enriching field {field_name} for document {document_id}: {str(e)}")
            return {
                "status": "error",
                "message": f"Enrichment failed: {str(e)}"
            }
    
    async def _update_document_metadata(self, document: Document, metadata: Dict[str, Any]) -> None:
        """Update document with extracted metadata."""
        try:
            # Map LLM metadata to document fields
            field_mapping = {
                'title': 'title',
                'document_type': 'document_type',
                'sender': 'sender',
                'recipient': 'recipient',
                'document_date': 'document_date',
                'due_date': 'due_date',
                'amount': 'amount',
                'currency': 'currency',
                'status': 'status',
            }
            
            updated = False
            for llm_field, doc_field in field_mapping.items():
                if llm_field in metadata and metadata[llm_field]:
                    current_value = getattr(document, doc_field, None)
                    new_value = metadata[llm_field]
                    
                    # Only update if field is empty or we have a better value
                    if not current_value or (isinstance(new_value, str) and len(new_value) > len(str(current_value))):
                        setattr(document, doc_field, new_value)
                        updated = True
                        logger.info(f"Updated {doc_field}: {new_value}")
            
            if updated:
                await self.db_session.commit()
                logger.info(f"Updated document {document.id} with LLM metadata")
                
        except Exception as e:
            logger.error(f"Error updating document metadata: {str(e)}")
            await self.db_session.rollback()
    
    async def _add_tags_to_document(self, document_id: int, tags: List[str]) -> None:
        """Add suggested tags to document."""
        try:
            config = await self.llm_service.get_config()
            min_confidence = config.get('min_confidence_tagging', 0.7)
            
            for tag in tags:
                # Simple confidence check - could be enhanced with actual confidence scores
                if len(tag) > 2 and tag.isalpha():  # Basic validation
                    await self.doc_repo.add_tag(self.db_session, document_id, tag.lower())
                    logger.info(f"Added tag '{tag}' to document {document_id}")
            
            await self.db_session.commit()
            
        except Exception as e:
            logger.error(f"Error adding tags to document {document_id}: {str(e)}")
            await self.db_session.rollback()

class LLMServiceFactory:
    """Factory for creating LLM service instances."""
    
    @staticmethod
    def create_document_service(db_session: AsyncSession) -> DocumentLLMService:
        """Create a document LLM service instance."""
        return DocumentLLMService(db_session)
    
    @staticmethod
    def create_llm_service(db_session: AsyncSession) -> LLMService:
        """Create a basic LLM service instance."""
        return LLMService(db_session) 