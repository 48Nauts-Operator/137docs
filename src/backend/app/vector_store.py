"""Lightweight Qdrant helper used by ColPali integration.

The module lazily creates a single QdrantClient instance.  It exposes:
    • ensure_collection() – idempotently create expected collection
    • upsert_page(doc_id, page_idx, multi_vectors) – inserts patch vectors and
      returns their generated IDs (UUID strings).

We purposely keep the dependency surface minimal so it can be imported in the
`process_new_document` background task without heavy initialisation when the
vector DB is not required.
"""

from __future__ import annotations

import os
import uuid
from typing import List, Sequence

from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

_COLLECTION = os.getenv("QDRANT_COLLECTION", "colpali_pages")
_HOST = os.getenv("VECTOR_DB_HOST", "qdrant")
_PORT = int(os.getenv("VECTOR_DB_PORT", 6333))

_client: QdrantClient | None = None

def _get_client() -> QdrantClient:
    global _client
    if _client is None:
        _client = QdrantClient(host=_HOST, port=_PORT)
    return _client


def ensure_collection(vector_size: int = 128):
    client = _get_client()
    try:
        client.get_collection(_COLLECTION)
    except Exception:  # collection does not exist → create fresh
        client.recreate_collection(
            collection_name=_COLLECTION,
            vectors_config=qmodels.VectorParams(size=vector_size, distance=qmodels.Distance.COSINE),
        )


def upsert_page(doc_id: int, page_idx: int, multi_vectors: Sequence[Sequence[float]]) -> List[str]:
    """Insert *multi_vectors* for a given page -> returns list of point IDs."""
    ensure_collection(len(multi_vectors[0]))
    client = _get_client()

    point_ids: list[str] = []
    points: list[qmodels.PointStruct] = []

    for vec in multi_vectors:
        pid = uuid.uuid4().hex  # compact UUID string
        point_ids.append(pid)
        points.append(
            qmodels.PointStruct(
                id=pid,
                vector=list(vec),  # ensure plain list of float for Cython JSON
                payload={"doc_id": doc_id, "page": page_idx},
            )
        )

    client.upsert(collection_name=_COLLECTION, points=points)
    return point_ids


def search(query_vector: Sequence[float], top_k: int = 20):
    """Return top_k ScoredPoint results from Qdrant for *query_vector*."""
    ensure_collection(len(query_vector))
    client = _get_client()
    return client.search(collection_name=_COLLECTION, query_vector=list(query_vector), limit=top_k) 