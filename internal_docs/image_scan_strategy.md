# Image-First Document Processing Strategy (ColPali Migration)

_Last updated: 2025-05-22_

This document describes **how we migrate the OCR-centric pipeline to an image-first pipeline** powered by the ColPali vision-language retriever.  It is an implementation companion to `docs/architecture.md`.

## 1  Rationale
* OCR often fails on noisy scans, stamps, tables, or mixed language documents.
* ColPali (ColBERT + PaliGemma, [repo](https://github.com/illuin-tech/colpali)) directly embeds the visual page, capturing both text _and_ layout.
* Multi-vector (late-interaction) embeddings → high recall + efficient ANN search.

## 2  Target Data Flow
```text
Watcher → PDF page → PyMuPDF → RGB 448×448 → ColPaliEmbedder →
         ├─ multi-vectors (≈196×128)  ─┐
         └─ global vec (128)          │   → Qdrant collection "pages"
                                      ▼
                             pgvector metadata DB ← Document row
```

## 3  Code Artefacts
| File | Purpose |
|------|---------|
| `src/backend/app/colpali_embedder.py` | Lazy-loaded ColPali helper returning `(multi_vecs, global_vec)` |
| `src/backend/requirements.txt` | Adds `colpali-engine`, `qdrant-client`, `torch`, `pillow` |
| `docker-compose.yml` | Adds `qdrant` service; injects `COLPALI_MODEL`, `VECTOR_DB_HOST` |
| Alembic revision ➜ `vectors` table | Stores mapping `doc_id`, `page`, `vector_ids` |
| Future: `app/search.py` update | Use late-interaction scoring against Qdrant |

## 4  Roll-out Phases
1. **PoC** – embed single page, manual query. _(in progress)_
2. **Backend Integration** – watcher → embedder → Qdrant insert.
3. **Hybrid Gate** – confidence threshold & OCR fallback.
4. **UI** – Vision search bar + thumbnails.
5. **Benchmark & Cleanup** – Recall@5 vs OCR baseline, latency, storage.

## 5  Fallback Policy
If ColPali raises OOM _or_ `∥global_vec∥ < 0.2`, the system falls back to the existing Tesseract OCR path and stores text-only embedding with Ollama.

## 6  Open Tasks
- [ ] Alembic migration for `vectors` table
- [x] Integrate Qdrant insert/query helpers
- [x] Adapt `process_new_document` in `main.py`
- [x] `/api/search/vision` endpoint
- [x] Front-end search UX

---
© DMS Team, v0.1 Image-First Strategy 