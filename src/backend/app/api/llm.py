from fastapi import APIRouter, Depends, Request, HTTPException, Form
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.llm_service import LLMServiceFactory
from app.repository import DocumentRepository, LLMConfigRepository
import logging
from typing import Optional, List
from app.agents.tenant_agent import TenantExtractionAgent
from app.auth import get_current_user
from app.models import User, Document
from sqlalchemy import select, or_

logger = logging.getLogger(__name__)
router = APIRouter()

# Configuration endpoints
@router.get("/config")
async def get_llm_config(db: AsyncSession = Depends(get_db)):
    """Get current LLM configuration."""
    llm_config_repository = LLMConfigRepository()
    config = await llm_config_repository.get_config(db)
    if not config:
        config = await llm_config_repository.create_default_config(db)
    return {"config": config}

@router.put("/config")
async def update_llm_config(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Update LLM configuration."""
    try:
        form = await request.form()
        
        # Extract configuration fields
        update_data = {}
        
        # Provider settings
        if form.get("provider"):
            update_data["provider"] = form.get("provider")
        if form.get("api_key"):
            update_data["api_key"] = form.get("api_key")
        if form.get("api_url"):
            update_data["api_url"] = form.get("api_url")
        
        # Model settings
        if form.get("model_tagger"):
            update_data["model_tagger"] = form.get("model_tagger")
        if form.get("model_enricher"):
            update_data["model_enricher"] = form.get("model_enricher")
        if form.get("model_analytics"):
            update_data["model_analytics"] = form.get("model_analytics")
        if form.get("model_responder"):
            update_data["model_responder"] = form.get("model_responder")
        
        # Boolean settings
        if form.get("enabled") is not None:
            update_data["enabled"] = form.get("enabled").lower() == "true"
        if form.get("auto_tagging") is not None:
            update_data["auto_tagging"] = form.get("auto_tagging").lower() == "true"
        if form.get("auto_enrichment") is not None:
            update_data["auto_enrichment"] = form.get("auto_enrichment").lower() == "true"
        if form.get("external_enrichment") is not None:
            update_data["external_enrichment"] = form.get("external_enrichment").lower() == "true"
        if form.get("cache_responses") is not None:
            update_data["cache_responses"] = form.get("cache_responses").lower() == "true"
        
        # Numeric settings
        for field in ["max_retries", "retry_delay", "batch_size", "concurrent_tasks"]:
            if form.get(field):
                try:
                    update_data[field] = int(form.get(field))
                except ValueError:
                    pass
        
        for field in ["min_confidence_tagging", "min_confidence_entity"]:
            if form.get(field):
                try:
                    update_data[field] = float(form.get(field))
                except ValueError:
                    pass
        
        # Backup settings
        if form.get("backup_provider"):
            update_data["backup_provider"] = form.get("backup_provider")
        if form.get("backup_model"):
            update_data["backup_model"] = form.get("backup_model")
        
        llm_config_repository = LLMConfigRepository()
        config = await llm_config_repository.update_config(db, **update_data)
        
        return {"message": "LLM configuration updated successfully", "config": config}
        
    except Exception as e:
        logger.error(f"Error updating LLM config: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update configuration: {str(e)}")

@router.post("/test-connection")
async def test_llm_connection(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Test LLM provider connection."""
    try:
        form = await request.form()
        provider = form.get("provider")
        api_url = form.get("api_url")
        api_key = form.get("api_key")
        
        if not provider:
            raise HTTPException(status_code=400, detail="Provider is required")
        
        llm_config_repository = LLMConfigRepository()
        result = await llm_config_repository.test_connection(db, provider, api_url, api_key)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error testing LLM connection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Connection test failed: {str(e)}")

# Document processing endpoints

@router.post("/process-document/{document_id}")
async def process_document(
    document_id: int,
    force: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """Process a single document with LLM."""
    try:
        llm_service = LLMServiceFactory.create_document_service(db)
        result = await llm_service.process_document(document_id, force=force)
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing document {document_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@router.post("/batch-process")
async def batch_process_documents(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Process multiple documents in batch."""
    try:
        form = await request.form()
        document_ids_str = form.get("document_ids", "")
        force = form.get("force", "false").lower() == "true"
        
        # Parse document IDs
        if not document_ids_str:
            raise HTTPException(status_code=400, detail="No document IDs provided")
        
        try:
            document_ids = [int(id.strip()) for id in document_ids_str.split(",") if id.strip()]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid document ID format")
        
        if not document_ids:
            raise HTTPException(status_code=400, detail="No valid document IDs provided")
        
        llm_service = LLMServiceFactory.create_document_service(db)
        result = await llm_service.batch_process_documents(document_ids, force=force)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in batch processing: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")

@router.post("/enrich-field/{document_id}")
async def enrich_document_field(
    document_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Enrich a specific field of a document."""
    try:
        form = await request.form()
        field_name = form.get("field_name")
        
        if not field_name:
            raise HTTPException(status_code=400, detail="Field name is required")
        
        llm_service = LLMServiceFactory.create_document_service(db)
        result = await llm_service.enrich_document_field(document_id, field_name)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error enriching field for document {document_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Field enrichment failed: {str(e)}")

@router.get("/status")
async def get_llm_status(db: AsyncSession = Depends(get_db)):
    """Get LLM service status and configuration."""
    try:
        llm_service = LLMServiceFactory.create_llm_service(db)
        config = await llm_service.get_config()
        
        return {
            "enabled": config.get("enabled", False),
            "provider": config.get("provider", "local"),
            "auto_tagging": config.get("auto_tagging", True),
            "auto_enrichment": config.get("auto_enrichment", True),
            "models": {
                "tagger": config.get("model_tagger", ""),
                "enricher": config.get("model_enricher", ""),
                "analytics": config.get("model_analytics", ""),
                "responder": config.get("model_responder", "")
            },
            "performance": {
                "batch_size": config.get("batch_size", 5),
                "concurrent_tasks": config.get("concurrent_tasks", 2),
                "max_retries": config.get("max_retries", 3)
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting LLM status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")

@router.post("/suggest-tags/{document_id}")
async def suggest_document_tags(
    document_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get tag suggestions for a document."""
    try:
        doc_repo = DocumentRepository()
        document = await doc_repo.get_by_id(db, document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        llm_service = LLMServiceFactory.create_llm_service(db)
        tags = await llm_service.suggest_tags(document.content or "")
        
        return {
            "document_id": document_id,
            "suggested_tags": tags,
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error suggesting tags for document {document_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Tag suggestion failed: {str(e)}")

@router.post("/analyze/{document_id}")
async def analyze_document(
    document_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Analyze a document with LLM."""
    try:
        doc_repo = DocumentRepository()
        document = await doc_repo.get_by_id(db, document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        llm_service = LLMServiceFactory.create_llm_service(db)
        analysis = await llm_service.analyze_document(document.content or "")
        
        return {
            "document_id": document_id,
            "analysis": analysis,
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing document {document_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Document analysis failed: {str(e)}")

@router.post("/extract-tenant/{document_id}")
async def extract_and_assign_tenant(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Extract tenant information from document and auto-assign."""
    try:
        agent = TenantExtractionAgent(db)
        result = await agent.analyze_and_assign_tenant(document_id, current_user.id)
        
        if result["status"] == "success":
            await db.commit()
            # Trigger document refresh for UI
            logger.info(f"Successfully processed tenant for document {document_id}: {result['message']}")
            
        return result
        
    except Exception as e:
        logger.error(f"Error in tenant extraction for document {document_id}: {str(e)}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Tenant extraction failed: {str(e)}")

@router.post("/batch-extract-tenants")
async def batch_extract_tenants(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Batch extract and assign tenants for multiple documents."""
    try:
        # Parse JSON body
        body = await request.json()
        document_ids = body.get("document_ids")
        all_documents = body.get("all_documents", False)
        
        # Determine which documents to process
        if all_documents:
            # Process all documents that don't have tenant assignments
            result = await db.execute(
                select(Document).where(
                    Document.recipient.is_(None) | 
                    (Document.recipient == "") |
                    (Document.recipient == "Your Company")
                )
            )
            documents_to_process = [doc.id for doc in result.scalars().all()]
        elif document_ids:
            documents_to_process = document_ids
        else:
            return {"status": "error", "message": "Either document_ids or all_documents=true must be specified"}
        
        if not documents_to_process:
            return {
                "status": "success", 
                "message": "No documents need tenant processing",
                "processed": 0,
                "skipped": 0,
                "errors": 0
            }
        
        # Process documents in batches
        agent = TenantExtractionAgent(db)
        results = {
            "status": "processing",
            "total": len(documents_to_process),
            "processed": 0,
            "skipped": 0,
            "errors": 0,
            "details": []
        }
        
        batch_size = 10  # Process 10 documents at a time
        for i in range(0, len(documents_to_process), batch_size):
            batch = documents_to_process[i:i + batch_size]
            
            for doc_id in batch:
                try:
                    result = await agent.analyze_and_assign_tenant(doc_id, current_user.id)
                    
                    if result["status"] == "success":
                        results["processed"] += 1
                        results["details"].append({
                            "document_id": doc_id,
                            "status": "success",
                            "tenant": result["tenant"]["alias"],
                            "confidence": result.get("confidence", 0)
                        })
                    elif result["status"] == "no_match":
                        results["skipped"] += 1
                        results["details"].append({
                            "document_id": doc_id,
                            "status": "no_match",
                            "message": result["message"]
                        })
                    else:
                        results["skipped"] += 1
                        results["details"].append({
                            "document_id": doc_id,
                            "status": "skipped",
                            "message": result.get("message", "Unknown reason")
                        })
                        
                except Exception as e:
                    results["errors"] += 1
                    results["details"].append({
                        "document_id": doc_id,
                        "status": "error",
                        "message": str(e)
                    })
                    logger.error(f"Error processing document {doc_id}: {e}")
            
            # Commit after each batch
            await db.commit()
            
        results["status"] = "completed"
        results["message"] = f"Batch processing completed: {results['processed']} processed, {results['skipped']} skipped, {results['errors']} errors"
        
        return results
        
    except Exception as e:
        logger.error(f"Error in batch tenant extraction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")

@router.post("/auto-assign-unmatched")
async def auto_assign_unmatched_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Automatically assign unmatched documents to tenants based on patterns."""
    try:
        # Find documents with generic or empty recipients
        result = await db.execute(
            select(Document).where(
                or_(
                    Document.recipient.is_(None),
                    Document.recipient == "",
                    Document.recipient == "Your Company",
                    Document.recipient.like("%Inc.%"),
                    Document.recipient.like("%Ltd.%"),
                    Document.recipient.like("%GmbH%"),
                    Document.recipient.like("%AG%")
                )
            ).limit(50)  # Process max 50 at a time
        )
        
        unmatched_docs = result.scalars().all()
        
        if not unmatched_docs:
            return {
                "status": "success",
                "message": "No unmatched documents found",
                "processed": 0
            }
        
        agent = TenantExtractionAgent(db)
        processed = 0
        assigned = 0
        
        for doc in unmatched_docs:
            try:
                result = await agent.analyze_and_assign_tenant(doc.id, current_user.id)
                processed += 1
                
                if result["status"] == "success":
                    assigned += 1
                    logger.info(f"Auto-assigned document {doc.id} to tenant: {result['tenant']['alias']}")
                    
            except Exception as e:
                logger.error(f"Error auto-assigning document {doc.id}: {e}")
        
        await db.commit()
        
        return {
            "status": "success",
            "message": f"Auto-assignment completed: {assigned} documents assigned from {processed} processed",
            "processed": processed,
            "assigned": assigned
        }
        
    except Exception as e:
        logger.error(f"Error in auto-assignment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Auto-assignment failed: {str(e)}") 