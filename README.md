# 137Docs – AI-Powered Document Management System

**Version 0.90** - *LLM Integration Phase 1 Complete*

137Docs is a full-stack, AI-powered document management system built for small teams and freelancers that need **OCR**, **semantic search**, **AI document processing**, **analytics**, and **calendar-driven reminders** without the enterprise price tag.

---

## ✨ Key Features

### 🤖 AI-Powered Document Processing
* **Multi-Provider LLM Support** – Ollama (local), OpenAI, Anthropic, LiteLLM, and custom APIs
* **Automated Metadata Extraction** – AI extracts titles, dates, amounts, and document types
* **Intelligent Tagging** – Automatic tag suggestions and application
* **Document Analysis** – AI-powered summaries, key points, entities, and sentiment analysis
* **Privacy-First Option** – Local processing with Ollama keeps sensitive data on-premises

### 📄 Document Management
* **Drag-&-drop inbox** – drop PDFs or images into `data/inbox/` or upload through the UI; they are auto-indexed via OCR and AI metadata extraction.
* **Powerful search** – combine full-text, faceted, and semantic search to locate any document in seconds.
* **Invoice intelligence** – due-date detection, currency normalisation, recurring-invoice grouping, payment-status tracking.

### 📅 Organization & Workflow
* **Calendar integration** – colour-coded events in the UI plus a personal ICS feed that you can subscribe to from Google / Apple Calendar.
* **Address book** – central contact store shared between documents and invoices.
* **Notification centre** – email / in-app reminders before invoices become overdue.
* **Analytics dashboard** – document-type distribution, monthly invoice totals, payment-status breakdown.

### 🎨 User Experience
* **Dark-mode first** – Tailwind & Radix-UI powered interface with a focus on accessibility.
* **Real-time AI processing** – Live status indicators and progress feedback
* **Comprehensive settings** – Fine-tune AI behavior, performance, and privacy preferences

---

## 🏗 Architecture Overview

| Layer          | Tech                                                     | Purpose |
| -------------- | -------------------------------------------------------- | ------- |
| Frontend (SPA) | React 18 + React-Router + TailwindCSS + Radix UI        | User interface, AI controls, data-table views, calendar, analytics visuals |
| API            | FastAPI, Uvicorn, SQLAlchemy Async                      | REST CRUD, authentication, notifications, calendar export, LLM integration |
| AI Services    | Tesseract / EasyOCR, Multi-LLM (Ollama, OpenAI, etc.)  | OCR, metadata extraction, document analysis, intelligent tagging |
| Database       | PostgreSQL + pgvector                                   | Persistent storage, vector embeddings, LLM configuration |
| Vector Store   | Qdrant                                                   | Semantic search, document embeddings |
| DevOps         | Docker Compose, GitHub Actions (CI suggested)           | Consistent local & CI environments |

See `docs/137docs_architecture.md` for a deep dive.

---

## 🚀 Quick-start (Local)

1. **Clone**
   ```bash
   git clone https://github.com/48Nauts-Operator/137docs.git
   cd 137docs
   ```
2. **Start the stack** (requires Docker Desktop):
   ```bash
   docker-compose up --build
   ```
   * Backend: http://localhost:8808
   * Frontend: http://localhost:3303
3. **Login** – in dev mode any user who POSTs to `/api/auth/login` with the password `test` receives a JWT.

> ℹ️  Without Docker you can also run the layers manually – see *Development workflow* below.

---

## 🛠 Development Workflow

### Prerequisites

* **Docker Desktop** – Required for running the full stack
* **Git** – For version control and repository management
* Optional: **VS Code** with Docker extension for easier container management

### Development Setup

1. **Clone and start the development environment**:
   ```bash
   git clone https://github.com/48Nauts-Operator/137docs.git
   cd 137docs
   docker-compose up --build
   ```

2. **Access the applications**:
   * **Frontend**: http://localhost:3303 (React + Vite dev server with hot reload)
   * **Backend**: http://localhost:8808 (FastAPI with auto-reload)
   * **Database**: PostgreSQL running internally (accessible via backend)
   * **Qdrant**: http://localhost:6333 (Vector database for embeddings)

3. **Development workflow**:
   ```bash
   # View logs for all services
   docker-compose logs -f
   
   # View logs for specific service
   docker-compose logs -f backend
   docker-compose logs -f frontend
   
   # Restart a specific service
   docker-compose restart backend
   
   # Rebuild after code changes
   docker-compose up --build
   
   # Stop all services
   docker-compose down
   ```

### Environment Configuration

Environment variables are configured in `docker-compose.yml` and `.env`:

**Backend Configuration**:
* `DATABASE_URL` – PostgreSQL connection (auto-configured)
* `QDRANT_HOST` – Vector database connection
* `OLLAMA_HOST` – LLM service endpoint (default: host.docker.internal:11434)
* `LLM_MODEL` – Default model name (default: llama3)
* `HOSTFS_MOUNT` – Host filesystem mount point for document storage

**Frontend Configuration**:
* Automatically proxies `/api` calls to the backend
* Hot reload enabled for development
* Built with Vite for fast development experience

### Database Management

```bash
# Access database migrations
docker-compose exec backend alembic upgrade head

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# View migration history
docker-compose exec backend alembic history

# Access PostgreSQL directly
docker-compose exec postgres psql -U postgres -d docai
```

### File System Access

The application uses Docker volume mounts for persistent storage:
* `./data/inbox` → Container inbox for document processing
* `./data/storage` → Document archive and storage
* `./backups` → Database backups

### External Dependencies

**Optional External Services**:
* **Ollama** – For local LLM inference (install separately or use cloud APIs)
  ```bash
  # Install Ollama (macOS/Linux)
  curl -fsSL https://ollama.ai/install.sh | sh
  
  # Pull recommended models
  ollama pull llama3
  ollama pull phi3
  ```

> ℹ️ **Note**: All core functionality runs in Docker containers. External services like Ollama are optional and can be replaced with cloud API endpoints.

---

## 📅 Calendar Sync

1. Open **Calendar** in the sidebar.
2. Click **"Sync / Export ICS"** – the app will request a personal API key and open the URL:
   `https://<host>/api/calendar/export/ics?api_key=<your-token>`.
3. Copy that address into Google Calendar ("Add by URL") or Apple Calendar ("New subscription").

The feed is read-only & updated each time you add / update a document with a due date.

---

## 🧪 Tests

*Backend* tests live in `src/backend/tests/` (pytest).

```bash
pytest -q
```

*Frontend* tests use React Testing Library: `npm test`.

---

## 🎯 Roadmap

See `docs/sprint-plan.md` – feel free to open issues or PRs!

---

## 📄 License

**137Docs Self-Hosted License Agreement (Non-Commercial Use)**

*Version: 1.0 | Effective Date: 2025-05-25*

### 1. Overview
This license governs the use of the self-hosted version of 137Docs. By deploying, running, or interacting with the software in any way, you agree to be bound by the terms below.

### 2. Grant of License
You are granted a limited, non-transferable, non-exclusive, revocable license to:
* Run and use 137Docs on your own infrastructure
* Use the system solely for personal or internal business administration
* Modify the codebase for personal/private use only

### 3. Restrictions
You may not:
* Use 137Docs or any part of it for commercial resale, SaaS hosting, or client services
* Distribute, sublicense, or host 137Docs for third parties
* Remove or modify any license, attribution, or module restriction mechanisms
* Train or fine-tune language models using data from this system without explicit permission

Commercial use requires a separate license — please contact [licensing@137docs.com].

### 4. No Warranty
This self-hosted version is provided "AS IS", without warranty of any kind.
* The authors do not guarantee correctness, security, or compatibility
* You use the software at your own risk

### 5. No Support
There is no official support offered for the self-hosted version.
* Community assistance may be available on GitHub or forums
* Critical or legal use cases are not recommended without commercial support

### 6. AI / LLM Cost Responsibility
If you connect 137Docs to any AI model (e.g., via OpenAI, Ollama, or local LLMs), you are entirely responsible for:
* Any associated API usage fees
* The legality and compliance of processed data
* The setup and security of your AI integrations

### 7. Data Ownership
All scanned documents, metadata, and configuration files remain your own.
137Docs does not transmit or store any data unless explicitly configured to do so.

### 8. Termination
This license will terminate automatically if you violate any of these terms.
Upon termination, you must delete all copies of the software.

### 9. Acknowledgement
By continuing setup, you acknowledge and accept this agreement.
You affirm that you are not using 137Docs for commercial benefit or resale.

For the complete license agreement, see `docs/licence-agreement_2025-05.md`. 