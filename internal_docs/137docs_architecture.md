# 137Docs – Architecture Overview

*Last updated: 2025-05-25*

---

## 1. High-Level Diagram

```
┌──────────────┐   JWT / REST   ┌───────────────────┐
│   Frontend   │ ─────────────► │ FastAPI Backend   │
│ React + Vite │ ◄───────────── │  (async/pg)       │
└─────▲────────┘  WebSockets    └────────┬──────────┘
      │                                   │
      │                                   │ SQLAlchemy ORM
      │                                   ▼
┌─────┴────────┐   pgvector   ┌───────────────────┐
│ PostgreSQL   │ ◄──────────► │ Qdrant (vectors) │
│  entities    │              │  embeddings       │
└──────────────┘              └───────────────────┘
```

*   **Frontend** – TypeScript / React 18, Tailwind + ShadCN.  Compiled by Vite and served via a lightweight Node-alpine container.
*   **Backend** – FastAPI running on Uvicorn (Python 3.11).  Async SQLAlchemy + asyncpg driver.
*   **Database** – Postgres 16 with pgvector extension for text embeddings.
*   **Vector DB** – Qdrant 1.9 for vision & text ANN search.
*   **Vision Embedder** – ColVision (ColPali-based) multi-vector page embeddings are generated first.
*   **LLM / OCR (fallback)** – Host-running Ollama summariser & text embeddings; Tesseract/Poppler OCR when ColVision confidence is low.

---

## 2. Key Modules

| Folder | Purpose |
|--------|---------|
| `src/backend/app` | FastAPI application, services, models, routes |
| `src/backend/app/services` | Bounded-context helpers (`EntityService`, `OnboardingService`, etc.) |
| `src/backend/alembic` | DB migration history |
| `src/frontend/src/modules` | Front-end feature slices (`entity`, `onboarding`, …) |
| `docs/` | Engineering docs & specs |

### Runtime flow
1. **User hits `/login`** – if no users exist backend returns `[]`; UI shows *Create Admin Account* which triggers `/onboarding` wizard.
2. **Wizard sequence**
   1. Admin account (POST `/auth/register`)
   2. Licence acceptance (POST `/onboarding/accept-tos` ➜ `settings.tos_accepted_at`)
   3. Usage intent (personal / business)
   4. Company details (POST `/entities` → `entities` table)
3. **Dashboard** – React pulls data via hooks; each hook uses `useEntityFilter` to append `entity_id` so multi-company isolation is enforced.
4. **Document ingest** – `FolderWatcher` detects a file → rasterises pages → ColVision embeds → inserts vectors into Qdrant/`vectors` table; if embedder fails or confidence < τ, falls back to OCR + text embedding before persisting `Document`.
5. **Classifier alias match** (TODO) looks at `Entity.aliases` to auto-set `entity_id` and adds a tag `alias:<name>`.

---

## 3. Database Schema (excerpt)

```
entities(id PK, name, type, vat_id, iban, aliases[], created_at)
user_entities(user_id FK, entity_id FK, role)
settings(id=1, inbox_path, storage_root, tos_accepted_at, ...)
documents(…, entity_id FK nullable, hash UNIQUE, embedding vector)
```

Alembic manages migrations; first-run containers auto-apply them during startup.

---

## 4. Security & Auth

*   **JWT** – access/refresh tokens stored in `localStorage`.  Role claim (`admin|viewer`).
*   **TOS middleware** – every `/api/*` call is blocked with HTTP 451 until `tos_accepted_at` is set.
*   **Admin-only endpoints** – safeguarded by `admin_required` dependency.
*   **Self-Hosted policy** – `POLICY_MODE=self-hosted` env var returns "all features enabled"; SaaS tier can inject limits later.

---

## 5. Extensibility Points

1. **Modules** – front-end is split by folder; Module Router lazy-loads code based on `settings.enabledModules`.
2. **Marketplace** – Tile triggers subset onboarding to add new companies.
3. **Policy Service** – pluggable feature-flag / limit system (future SaaS).

---

## 6. Deployment

```
# One-liner
$ docker compose up -d --build

frontend  →  port 3303
backend   →  port 8808
postgres  →  internal only
qdrant    →  port 6333 (REST) / 6334 (gRPC)
```

Edit `.env` to point backend to remote LLM / pg credentials.

---

## 7. Vision & LLM Processing

The system employs **two complementary AI components**: a page-level vision embedder (**ColVision**) and a text-only large-language model (**LLM**, default *Llama 3* via Ollama). These work in tandem during different phases of the pipeline:

### 7.1 Ingestion-time pipeline
```
PDF / image           ┌─────────────┐   multi-vecs + global-vec  ┌───────────────┐
(binary) ───────────► │  ColVision   │ ──────────────────────────►│ Qdrant pages  │
                     │  (ColPali)  │                             └──────┬────────┘
                     └─────────────┘                                    │    ANN search
                             ▲  fallback OCR text                       │
Watcher ───▶ raster page ───▶ │                                          ▼
                       ┌────────────┐                         pgvector `documents`
                       │  OCR + LLM │ (if ColVision OOM / low-conf)
                       │ (Tesseract │  ──► text chunks ──► embeddings │
                       └────────────┘
```
1. **ColVision** (a trimmed ColPali model) receives a 448 × 448 RGB rendering of each page and outputs:  
   • `global_vec` – a single 128-dimensional summary vector.  
   • `multi_vecs` – ≈196 local vectors enabling *late-interaction* scoring.  
   These vectors are inserted into the `pages` collection in Qdrant.
2. **Confidence gate** – If the norm of `global_vec` falls below τ = 0.2 **or** the embedder raises OOM, the page is routed through OCR + text embedding instead, preserving robustness.
3. **Metadata write** – A row in `documents` links each stored page (`doc_id`, `page_no`) to its vector IDs for rapid lookup.

### 7.2 Post-ingest LLM tasks
The text-generative LLM (served by Ollama) is invoked for:

| Task | Endpoint | Prompt style | Output persisted to |
|------|----------|--------------|---------------------|
| Field extraction (e.g. invoice amount, due date) | `POST /api/llm/extract` | JSON Schema + few-shot examples | `invoices` table columns |
| Summarisation / TL;DR | `POST /api/llm/summarise` | role=system+user template | `documents.summary` |
| Conversational QA | `POST /api/chat` (WebSocket stream) | retrieval-augmented with top-k vectors from Qdrant | ephemeral |

All calls stream tokens back to the client; concurrency is throttled by an asyncio semaphore (`MAX_LLM_WORKERS`).

### 7.3 Model hosting & configuration
* By default the backend talks to a **local Ollama daemon** (`OLLAMA_HOST=http://host.docker.internal:11434`).  The model name is configurable via `LLM_MODEL` (defaults to `llama3:latest`).
* For GPU clusters the same FastAPI layer can be pointed at an **OpenAI-compatible endpoint** (e.g. Together.ai) by switching `LLM_PROVIDER=openai` and supplying an API key.
* A `/health/llm` probe measures round-trip latency and exposes it on the dashboard *HealthStatus* strip.

---

## 8. Version History

| Date | Version | Notes |
|------|---------|-------|
| 2025-05-25 | 0.06 | Entities tables, TOS guard, onboarding wizard, admin registration |
| 2025-05-24 | 0.05 | ShadCN dashboard, vector table, disabled users column |
| … | … | … |

---

Made with ❤️ by the 137Docs team. 