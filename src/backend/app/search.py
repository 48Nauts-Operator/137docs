"""
LLM-powered search functionality for the Document Management System.
"""
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import Document
from app.llm import LLMProcessor
import re
import json
from sqlalchemy.sql import text

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

class SearchService:
    """Service for LLM-powered document search."""
    
    def __init__(self, db: Session):
        """Initialize the search service with a database session."""
        self.db = db
        self.llm_processor = LLMProcessor()
    
    async def basic_search(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Perform a basic keyword search on documents.
        
        Args:
            query: Search query
            limit: Maximum number of results to return
            
        Returns:
            List of matching documents
        """
        # Split query into keywords
        keywords = query.lower().split()
        
        # Build filter conditions for each keyword
        results = []
        
        # Search in document content, title, and sender
        documents = self.db.query(Document).filter(
            Document.content_text.ilike(f"%{query}%") |
            Document.title.ilike(f"%{query}%") |
            Document.sender.ilike(f"%{query}%")
        ).limit(limit).all()
        
        # Format results
        for doc in documents:
            results.append({
                "id": doc.id,
                "title": doc.title,
                "sender": doc.sender,
                "document_date": doc.document_date.isoformat() if doc.document_date else None,
                "document_type": doc.document_type,
                "status": doc.status,
                "relevance": "high" if query.lower() in doc.title.lower() else "medium"
            })
        
        return results
    
    async def semantic_search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Vector-based semantic search using pgvector.<- returns docs ordered by cosine distance."""

        from app.embeddings import get_embedding
        embed = await get_embedding(query)

        # Use pgvector operator <-> for cosine distance
        sql = (
            "SELECT * , embedding <-> :emb AS distance "
            "FROM documents WHERE embedding IS NOT NULL ORDER BY embedding <-> :emb LIMIT :lim"
        )
        rows = self.db.execute(text(sql), {"emb": embed, "lim": limit})
        results = []
        for row in rows:
            doc = row[0] if isinstance(row, tuple) else row  # depending on execution style
            results.append({
                "id": doc.id,
                "title": doc.title,
                "sender": doc.sender,
                "document_type": doc.document_type,
                "status": doc.status,
                "relevance_score": 1 - row['distance'] if isinstance(row, dict) else None
            })
        return results
    
    async def extract_search_intent(self, query: str) -> Dict[str, Any]:
        """Extract search intent from a natural language query using LLM.
        
        Args:
            query: Natural language search query
            
        Returns:
            Dictionary with extracted search parameters
        """
        prompt = f"""
        You are an AI assistant helping with document search. Given the following natural language search query,
        extract the search intent and parameters.
        
        Search query: "{query}"
        
        Return a JSON object with the following fields (include only if mentioned in the query):
        - document_type: The type of document (invoice, receipt, contract, etc.)
        - sender: The sender of the document
        - date_range: An object with "start" and "end" dates in YYYY-MM-DD format
        - amount_range: An object with "min" and "max" amounts
        - status: The document status (paid, unpaid, etc.)
        - keywords: An array of important keywords from the query
        
        Example response format:
        {{
          "document_type": "invoice",
          "sender": "Acme Corp",
          "date_range": {{"start": "2023-01-01", "end": "2023-03-31"}},
          "amount_range": {{"min": 100, "max": 500}},
          "status": "unpaid",
          "keywords": ["urgent", "electricity"]
        }}
        """
        
        # Get LLM response
        llm_response = await self.llm_processor._query_llm(prompt)
        
        try:
            # Parse LLM response to get search parameters
            search_params = json.loads(llm_response)
            return search_params
        except json.JSONDecodeError:
            logger.error("Failed to parse LLM response as JSON")
            return {"keywords": [query]}
    
    async def advanced_search(self, params, limit: int = 20) -> List[Dict[str, Any]]:
        """Perform an advanced search using LLM to extract search intent and find relevant documents.
        
        Args:
            params: Search parameters (can be a dict or a query string)
            limit: Maximum number of results to return
            
        Returns:
            List of matching documents
        """
        # Determine whether params is already a dict of filters or a query string
        if isinstance(params, dict):
            search_params = params
        else:
            # Treat params as natural-language query and extract intent
            query = str(params)
            search_params = await self.extract_search_intent(query)
        
        # Build DB query based on extracted parameters
        db_query = self.db.query(Document)
        
        # Apply filters based on search parameters
        if "document_type" in search_params and search_params["document_type"]:
            db_query = db_query.filter(Document.document_type == search_params["document_type"])
        
        if "sender" in search_params and search_params["sender"]:
            db_query = db_query.filter(Document.sender.ilike(f"%{search_params['sender']}%"))
        
        if "status" in search_params and search_params["status"]:
            db_query = db_query.filter(Document.status == search_params["status"])
        
        if "date_range" in search_params and search_params["date_range"]:
            date_range = search_params["date_range"]
            if "start" in date_range and date_range["start"]:
                db_query = db_query.filter(Document.document_date >= date_range["start"])
            if "end" in date_range and date_range["end"]:
                db_query = db_query.filter(Document.document_date <= date_range["end"])
        
        if "amount_range" in search_params and search_params["amount_range"]:
            amount_range = search_params["amount_range"]
            if "min" in amount_range and amount_range["min"] is not None:
                db_query = db_query.filter(Document.amount >= amount_range["min"])
            if "max" in amount_range and amount_range["max"] is not None:
                db_query = db_query.filter(Document.amount <= amount_range["max"])
        
        # Apply keyword filters if available
        if "keywords" in search_params and search_params["keywords"]:
            for keyword in search_params["keywords"]:
                db_query = db_query.filter(
                    Document.content_text.ilike(f"%{keyword}%") |
                    Document.title.ilike(f"%{keyword}%")
                )
        
        # Get DB results
        documents = db_query.limit(limit).all()
        
        # Format results
        results = []
        for doc in documents:
            results.append({
                "id": doc.id,
                "title": doc.title,
                "sender": doc.sender,
                "document_date": doc.document_date.isoformat() if doc.document_date else None,
                "document_type": doc.document_type,
                "status": doc.status,
                "amount": float(doc.amount) if doc.amount else None
            })
        
        return results
    
    async def suggest_related_documents(self, document_id: int, limit: int = 5) -> List[Dict[str, Any]]:
        """Suggest related documents for a given document using LLM.
        
        Args:
            document_id: Document ID
            limit: Maximum number of results to return
            
        Returns:
            List of related documents
        """
        # Get the source document
        source_doc = self.db.query(Document).filter(Document.id == document_id).first()
        if not source_doc:
            return []
        
        # Get potential related documents (excluding the source document)
        potential_related = self.db.query(Document).filter(Document.id != document_id).limit(30).all()
        if not potential_related:
            return []
        
        # Prepare data for LLM
        source_data = {
            "id": source_doc.id,
            "title": source_doc.title,
            "sender": source_doc.sender,
            "content_preview": source_doc.content_text[:500] + "..." if source_doc.content_text and len(source_doc.content_text) > 500 else source_doc.content_text,
            "document_type": source_doc.document_type,
            "document_date": source_doc.document_date.isoformat() if source_doc.document_date else None
        }
        
        potential_data = []
        for doc in potential_related:
            potential_data.append({
                "id": doc.id,
                "title": doc.title,
                "sender": doc.sender,
                "content_preview": doc.content_text[:200] + "..." if doc.content_text and len(doc.content_text) > 200 else doc.content_text,
                "document_type": doc.document_type,
                "document_date": doc.document_date.isoformat() if doc.document_date else None
            })
        
        # Create prompt for LLM
        prompt = f"""
        You are an AI assistant helping to find related documents. Given a source document and a list of potential related documents,
        identify which documents are most likely related to the source document and explain the relationship.
        
        Source document:
        {json.dumps(source_data, indent=2)}
        
        Potential related documents:
        {json.dumps(potential_data, indent=2)}
        
        Return a JSON array of objects with document IDs, relationship types, and confidence scores (0-10).
        Each object should have "id", "relationship_type", and "confidence" fields.
        Only include documents with a confidence score of 5 or higher, sorted by confidence (highest first).
        
        Relationship types can be:
        - "same_sender": Documents from the same sender
        - "invoice_payment": An invoice and its payment
        - "invoice_reminder": An invoice and its reminder
        - "related_subject": Documents with related subject matter
        - "time_sequence": Documents that are part of a time sequence
        
        Example response format:
        [
          {{"id": 5, "relationship_type": "invoice_payment", "confidence": 9}},
          {{"id": 2, "relationship_type": "same_sender", "confidence": 7}},
          {{"id": 10, "relationship_type": "related_subject", "confidence": 6}}
        ]
        """
        
        # Get LLM response
        llm_response = await self.llm_processor._query_llm(prompt)
        
        try:
            # Parse LLM response to get related documents
            related_docs = json.loads(llm_response)
            
            # Format results
            results = []
            for item in related_docs[:limit]:
                doc_id = item["id"]
                relationship_type = item["relationship_type"]
                confidence = item["confidence"]
                
                # Find document in potential related
                for doc in potential_related:
                    if doc.id == doc_id:
                        results.append({
                            "id": doc.id,
                            "title": doc.title,
                            "sender": doc.sender,
                            "document_date": doc.document_date.isoformat() if doc.document_date else None,
                            "document_type": doc.document_type,
                            "relationship_type": relationship_type,
                            "confidence": confidence
                        })
                        break
            
            return results
        except json.JSONDecodeError:
            logger.error("Failed to parse LLM response as JSON")
            return []

    # ------------------------------------------------------------------
    #  Vision search (ColPali + Qdrant) ---------------------------------
    # ------------------------------------------------------------------

    async def vision_search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search ColPali multi-vector index using late-interaction approximation.

        We encode the textual *query* with ColPali's text encoder → 128-d vector
        and perform ANN search in Qdrant over patch vectors.  Returned patch
        scores are aggregated to document-level by taking the *max* score per
        doc_id.
        """

        from app.colpali_embedder import ColPaliEmbedder
        from app.vector_store import search as qdrant_search

        embedder = ColPaliEmbedder()
        q_vec = embedder.embed_text(query)

        points = qdrant_search(q_vec, top_k=50)  # fetch more to allow aggregation

        # Aggregate by document id --------------------------------------
        doc_best: dict[int, float] = {}
        for p in points:
            doc_id = p.payload.get("doc_id") if p.payload else None
            if doc_id is None:
                continue
            score = p.score or 0.0
            if doc_id not in doc_best or score > doc_best[doc_id]:
                doc_best[doc_id] = score

        # Sort and trim --------------------------------------------------
        ranked = sorted(doc_best.items(), key=lambda x: x[1], reverse=True)[:limit]

        # Retrieve documents --------------------------------------------
        results: list[dict[str, any]] = []
        if not ranked:
            return results

        doc_ids = [d for d, _ in ranked]
        rows = self.db.query(Document).filter(Document.id.in_(doc_ids)).all()
        doc_map = {d.id: d for d in rows}

        for doc_id, score in ranked:
            d = doc_map.get(doc_id)
            if d:
                results.append({
                    "id": d.id,
                    "title": d.title,
                    "sender": d.sender,
                    "document_type": d.document_type,
                    "status": d.status,
                    "vision_score": score,
                })

        return results
