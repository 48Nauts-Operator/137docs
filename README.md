# 137Docs – AI-Powered Document Management System

**Version 0.92** - *Enterprise-Grade Multi-Tenant Platform*

137Docs is a full-stack, AI-powered document management system built for small teams and freelancers that need **OCR**, **semantic search**, **AI document processing**, **multi-tenant organization**, **automated workflows**, **analytics**, and **calendar-driven reminders** without the enterprise price tag.

---

## ✨ Key Features

### 🤖 AI-Powered Document Processing
* **Multi-Provider LLM Support** – Ollama (local), OpenAI, Anthropic, LiteLLM, and custom APIs
* **Automated Metadata Extraction** – AI extracts titles, dates, amounts, and document types
* **Intelligent Tagging** – Automatic tag suggestions and application
* **Document Analysis** – AI-powered summaries, key points, entities, and sentiment analysis
* **Privacy-First Option** – Local processing with Ollama keeps sensitive data on-premises
* **Tenant Extraction** – AI automatically detects and assigns document recipients

### 🏢 Multi-Tenant Organization
* **Tenant Management** – Comprehensive profile system for individuals and companies
* **Automatic Document Assignment** – AI-powered recipient detection and assignment
* **Tenant Switching** – Easy switching between different entities/contexts
* **Document Filtering** – View documents by specific tenant or across all tenants
* **Address & Financial Info** – Complete tenant profiles with IBAN, VAT ID, addresses

### ⚙️ Automation & Rules Engine
* **Processing Rules** – Visual rule builder for automated document classification
* **Smart Actions** – Auto-assign tenants, set categories, add tags, update status
* **Priority-Based Execution** – Rules execute in customizable priority order
* **Real-Time Testing** – Test rules against documents before activation
* **Rule Analytics** – Track rule usage and effectiveness

### 📄 Document Management
* **Drag-&-drop inbox** – drop PDFs or images into `data/inbox/` or upload through the UI; they are auto-indexed via OCR and AI metadata extraction.
* **Powerful search** – combine full-text, faceted, and semantic search to locate any document in seconds.
* **Invoice intelligence** – due-date detection, currency normalisation, recurring-invoice grouping, payment-status tracking.
* **Document Relationships** – Link related documents and track document families

### 📊 Advanced Analytics
* **Financial Analytics** – Comprehensive spending analysis and KPI tracking
* **Vendor Analytics** – Dynamic vendor insights with missing invoice detection
* **Payment Tracking** – Real-time payment status and overdue monitoring
* **Processing Analytics** – Document processing pipeline status and performance
* **Interactive Charts** – Modern visualizations with drill-down capabilities

### 📅 Organization & Workflow
* **Calendar integration** – colour-coded events in the UI plus a personal ICS feed that you can subscribe to from Google / Apple Calendar.
* **Address book** – central contact store shared between documents and invoices.
* **Notification centre** – email / in-app reminders before invoices become overdue.
* **Processing Activity** – Real-time document processing pipeline monitoring

### 🌐 Network & Deployment
* **Local Network Access** – Access from any device on your local network
* **Docker-First** – Complete containerized deployment with hot-reload
* **Environment Configuration** – Easy network and API configuration
* **Health Monitoring** – Comprehensive system health checks and diagnostics

### 🔧 System Reliability
* **Flight Check System** – Comprehensive platform diagnostics with 100+ test cases
* **Error Boundaries** – Robust error handling with graceful degradation
* **Real-Time Status** – Live system status indicators and processing queues
* **Backup & Recovery** – Automated database backups and migration tools

### 🎨 User Experience
* **Dark-mode first** – Tailwind & Radix-UI powered interface with a focus on accessibility.
* **Real-time AI processing** – Live status indicators and progress feedback
* **Comprehensive settings** – Fine-tune AI behavior, performance, and privacy preferences
* **Responsive Design** – Mobile-first design that works on all devices

---

## 🏗 Architecture Overview

| Layer          | Tech                                                     | Purpose |
| -------------- | -------------------------------------------------------- | ------- |
| Frontend (SPA) | React 18 + React-Router + TailwindCSS + Radix UI        | User interface, AI controls, multi-tenant views, analytics, rules engine |
| API            | FastAPI, Uvicorn, SQLAlchemy Async                      | REST CRUD, authentication, multi-tenant, processing rules, notifications |
| AI Services    | Tesseract / EasyOCR, Multi-LLM (Ollama, OpenAI, etc.)  | OCR, metadata extraction, document analysis, tenant detection |
| Database       | PostgreSQL + pgvector                                   | Persistent storage, vector embeddings, tenant data, processing rules |
| Vector Store   | Qdrant                                                   | Semantic search, document embeddings, ColVision integration |
| Automation     | Rule Engine, Processing Pipeline, Background Workers    | Automated document processing, tenant assignment, workflow execution |
| DevOps         | Docker Compose, GitHub Actions (CI suggested)           | Consistent local & CI environments, network access |

See `docs/137docs_architecture.md` for a deep dive.

---

## 🚀 Quick-start (Local)

1. **Clone**
   ```bash
   git clone https://github.com/48Nauts-Operator/137docs.git
   cd 137docs
   ```

2. **Configure Network Access** (Optional - for local network access):
   ```bash
   # Copy network configuration template
   cp network-config.env .env
   
   # Edit .env and replace 192.168.1.178 with your actual IP
   # Find your IP: ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

3. **Start the stack** (requires Docker Desktop):
   ```bash
   docker-compose up --build
   ```
   * Backend: http://localhost:8808 (or http://YOUR_IP:8808)
   * Frontend: http://localhost:3303 (or http://YOUR_IP:3303)

4. **Login** – Use the admin/admin credentials or create a new account
   * Default admin user: `admin` / `admin`
   * Or register a new account through the UI

5. **First-Time Setup**:
   * Configure your first tenant in Settings → Tenants
   * Set up LLM provider in Settings → AI Configuration
   * Create processing rules in Processing → Rules

> ℹ️  **Network Access**: With proper `.env` configuration, access from any device on your network using your computer's IP address.

---

## 🌐 Network Access Configuration

To access 137Docs from any device on your local network:

1. **Find Your Local IP**:
   ```bash
   # On macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # On Windows
   ipconfig | findstr "IPv4"
   ```

2. **Configure Environment**:
   ```bash
   # Create .env file
   echo "FRONTEND_API_URL=http://YOUR_IP_ADDRESS:8808/api" > .env
   ```

3. **Restart Services**:
   ```bash
   docker-compose down && docker-compose up -d
   ```

4. **Access from Network**:
   * **Main App**: `http://YOUR_IP_ADDRESS:3303`
   * **API Health**: `http://YOUR_IP_ADDRESS:8808/api/health`

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

**Network Configuration**:
* `FRONTEND_API_URL` – API endpoint for frontend (enables network access)

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
* Network access configuration via environment variables

### Database Management

```bash
# Access database migrations
docker-compose exec backend alembic upgrade head

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# View migration history
docker-compose exec backend alembic history

# Access PostgreSQL directly
docker-compose exec db psql -U postgres -d 137docs

# Create database backup
docker-compose exec db pg_dump -U postgres 137docs > backup_$(date +%Y%m%d_%H%M%S).sql
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
  ollama pull deepseek
  ```

> ℹ️ **Note**: All core functionality runs in Docker containers. External services like Ollama are optional and can be replaced with cloud API endpoints.

---

## 🔧 System Health & Diagnostics

137Docs includes a comprehensive flight check system for diagnosing issues:

### Health Check Endpoints
* **Quick Health**: `GET /api/health`
* **Detailed Status**: `GET /api/processing/status`
* **LLM Status**: `GET /api/llm/status`

### Flight Check System
The platform includes 100+ diagnostic tests covering:
* Database connectivity and schema validation
* Authentication and authorization
* AI/LLM service functionality
* Multi-tenant system integrity
* Document processing pipeline
* Network and security configuration

See `docs/flight-check.md` for the complete diagnostic specification.

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

## 📋 Multi-Tenant Setup

1. **Create Your First Tenant**:
   * Go to Settings → Tenants
   * Click "Add New Tenant"
   * Fill in details (name, alias, type, address)
   * Set as default tenant

2. **Configure Tenant Automation**:
   * Enable AI tenant extraction in Settings → Automation
   * Set up processing rules for automatic assignment
   * Configure smart recipient patterns

3. **Document Assignment**:
   * Upload documents - tenants assigned automatically
   * Manual assignment via document details
   * Bulk processing via Settings → Automation

---

## ⚙️ Processing Rules Engine

Create automated workflows for document processing:

1. **Access Rules Engine**:
   * Navigate to Processing → Rules
   * View existing rules and analytics

2. **Create Processing Rules**:
   * Click "Create New Rule"
   * Define conditions (sender, amount, content, etc.)
   * Set actions (assign tenant, add tags, set category)
   * Configure priority and activation

3. **Test and Monitor**:
   * Test rules against existing documents
   * Monitor rule effectiveness with analytics
   * Adjust conditions and actions as needed

---

## 🎯 Roadmap

See `docs/sprint-plan.md` for detailed feature timeline and progress tracking.

### Recent Major Updates (v0.92)
* ✅ **Multi-Tenant System** - Complete tenant management and document organization
* ✅ **Processing Rules Engine** - Visual rule builder with automated workflow execution  
* ✅ **Network Access Configuration** - Local network access from any device
* ✅ **Comprehensive Analytics** - Advanced financial and vendor analytics
* ✅ **Flight Check System** - 100+ diagnostic tests for platform health
* ✅ **AI Tenant Extraction** - Automated recipient detection and assignment
* ✅ **Enhanced Error Handling** - Robust error boundaries and recovery mechanisms

### Upcoming Features
* 🔄 **Advanced Search** - Enhanced filtering and faceted search
* 🔄 **Mobile App** - React Native mobile application
* 🔄 **API Integrations** - Third-party service connections
* 🔄 **Workflow Automation** - Advanced business process automation

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