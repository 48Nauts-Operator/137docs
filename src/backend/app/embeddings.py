import hashlib, math, os, json, logging, httpx
from typing import List
from app.config import settings

logger = logging.getLogger(__name__)

OLLAMA_BASE = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")

async def get_embedding(text: str, model: str = "nomic-embed-text") -> List[float]:
    """Return a 1536-dim float vector for *text* using the Ollama embeddings endpoint.
    Falls back to a deterministic pseudo-random embedding when the endpoint is not reachable
    so that the rest of the pipeline keeps working in offline dev.
    """
    url = f"{OLLAMA_BASE}/api/embeddings"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json={"model": model, "prompt": text})
            resp.raise_for_status()
            data = resp.json()
            return data.get("embedding")[:1536]  # truncate to pgvector dim
    except Exception as e:
        logger.warning("Embedding endpoint failed (%s); using fallback vector", e)
        # Simple hash-based fallback so identical text produces same vector
        h = hashlib.sha256(text.encode()).digest()
        # Repeat hash to reach length
        vals = list(h) * (1536 // len(h) + 1)
        # scale to -1..1
        return [ (v/128.0)-1.0 for v in vals[:1536] ] 