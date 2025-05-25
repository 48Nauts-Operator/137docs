# 137Docs – Intelligent Document Management System

137Docs is a full-stack, AI-powered document management system built for small teams and freelancers that need **OCR**, **semantic search**, **analytics**, and **calendar-driven reminders** without the enterprise price tag.

---

## ✨ Key Features

* **Drag-&-drop inbox** – drop PDFs or images into `data/inbox/` or upload through the UI; they are auto-indexed via OCR and an LLM metadata extractor.
* **Powerful search** – combine full-text, faceted, and semantic search to locate any document in seconds.
* **Invoice intelligence** – due-date detection, currency normalisation, recurring-invoice grouping, payment-status tracking.
* **Calendar integration** – colour-coded events in the UI plus a personal ICS feed that you can subscribe to from Google / Apple Calendar.
* **Address book** – central contact store shared between documents and invoices.
* **Notification centre** – email / in-app reminders before invoices become overdue.
* **Analytics dashboard** – document-type distribution, monthly invoice totals, payment-status breakdown.
* **Dark-mode first** – Tailwind & Radix-UI powered interface with a focus on accessibility.

---

## 🏗 Architecture Overview

| Layer          | Tech                                                     | Purpose |
| -------------- | -------------------------------------------------------- | ------- |
| Frontend (SPA) | React 18 + React-Router + TailwindCSS + Radix UI        | User interface, data-table views, calendar, analytics visuals |
| API            | FastAPI, Uvicorn, SQLAlchemy Async                      | REST CRUD, authentication, notifications, calendar export |
| AI Services    | Tesseract / EasyOCR, Ollama (LLM), LangChain            | OCR & metadata extraction |
| Database       | SQLite (dev) / PostgreSQL (prod)                        | Persistent storage |
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

* Python ≥ 3.11  (see `requirements.txt`)
* Node ≥ 18      (see `src/frontend/package.json`)
* An [Ollama](https://github.com/jmorganca/ollama) instance for local LLM inference (or point `LLM_API_URL` to OpenAI etc.)

### Backend

```bash
cd src/backend
uvicorn app.main:app --reload --port 8000
```

Environment variables (defaults set in `docker-compose.yml`):
* `WATCH_FOLDER` – directory watched for new files (default `./data/inbox`)
* `ARCHIVE_FOLDER` – where processed files are moved
* `DATABASE_URL` – SQLAlchemy URL, e.g. `sqlite:///./documents.db`
* `LLM_MODEL`, `LLM_API_URL` – LLM config used by `app.llm`

### Frontend

```bash
cd src/frontend
npm install      # first run only
npm start        # CRA dev-server on :3000
```

The proxy is pre-configured to forward `/api` calls to the backend.

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