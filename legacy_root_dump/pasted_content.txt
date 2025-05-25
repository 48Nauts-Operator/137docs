# MVP Scope: Local Document Management System with OCR, API Access, and LLM Integration

## 🎯 Goal

To build a **local-first Document Management System (DMS)** that:
- Monitors an "Inbox" folder for new scanned documents
- Performs OCR and extracts key metadata
- Classifies and tags documents
- Displays documents in a clean dashboard interface
- Enables timeline and relationship views between documents
- Tracks invoice payment status and due dates
- Provides a local API for programmatic access and mobile integration
- Includes a lightweight, local LLM for smart tagging, Q&A, and task assistance

---

## 🧩 Core Components

### 1. 📂 Document Ingestion
- Monitor a specified local folder (e.g. `~/Documents/Inbox`)
- Accepts PDFs, images (JPG, PNG), optionally email formats
- Moves processed files into an `Archive` folder
- API push-enabled (see section 7)

**Tech Recommendations:**
- File watcher: `watchdog` (Python)
- Polling alternative: cron job

---

### 2. 🔍 OCR & Metadata Extraction
- Automatic OCR upon detection of new documents
- Extracts:
  - Title, sender
  - Dates and due dates
  - Invoice amounts
  - Document type (e.g., invoice, reminder)

**Tech Recommendations:**
- `Tesseract` (easy, local, stable)
- `PaddleOCR` for higher accuracy if needed
- `pdfplumber` / `PyMuPDF` for PDF parsing

---

### 3. 🧠 Local LLM Integration (NEW)
- Integrates **Ollama** to run a local LLM (e.g. `llama3`, `mistral`, or `phi`)
- Core uses:
  - Smart tagging and classification
  - Document summarization
  - Q&A about documents
  - Task generation (e.g., "Remind me to pay invoice #123")

**Tech Recommendations:**
- [Ollama](https://ollama.com/) for LLM container
- Model examples: `mistral`, `llama3`, `phi`, `gemma`
- Interaction layer: HTTP request from backend → Ollama

---

### 4. 🗂️ Tagging & Categorization
- Basic keyword and rule-based classification
- Enhanced by LLM suggestions for document types
- User-editable tags in UI

**Optional future**: Multi-label classification via embeddings

---

### 5. 🖥️ Dashboard UI
- Local web dashboard with sidebar navigation
- Views: Inbox, Invoices, Due Soon, Overdue, Paid, Archived
- Table or card layout
- Metadata-rich preview panel per document
- Filters for date, status, amount, type

**Tech Recommendations:**
- React + Tailwind / SvelteKit / Next.js
- Backend: FastAPI / Flask / Express.js

---

### 6. ⏳ Timeline & Relationships
- Document timeline view showing connected events:
  - Original invoice → reminder → payment
- Related documents linked via:
  - Invoice numbers
  - Sender identity
  - Similar subject or dates

**Storage:** Use SQLite for metadata + relationships

---

### 7. 🌐 Local API Access (NEW)
- API endpoint for pushing documents from other apps/devices
  - E.g., `POST /api/upload` with PDF or image
- Fetch metadata, status, and timeline
- Optional: Simple mobile app that snaps/forwards photos of receipts

**Tech Recommendations:**
- REST API with FastAPI or Flask
- Authentication (local key or token-based)
- Multipart file uploads and JSON endpoints

---

### 8. ✅ Status Tracking & Task Engine
- Paid / unpaid toggle
- Auto-highlight overdue invoices
- Future-due view (e.g., due within 30 days)
- Timeline + LLM task hints
- Optional: Export reminders to calendar (iCal, .ics)

---

## 🧠 Optional (Next Phase): Vector DB

Add a vector database later to enable:
- Deep semantic document search
- LLM memory
- Enhanced linking of related docs

**Tech Recommendations:**
- Qdrant, Weaviate, Chroma
- OpenAI / Instructor embeddings or local BGE-small

---

## 🗃️ Storage & Architecture

- Document files stored locally (organized by folder)
- Metadata in SQLite
- LLM running via Ollama
- Optional: config file to set paths and preferences

---

## 🧪 MVP Milestones

1. Folder monitoring + OCR
2. Metadata parsing and tagging
3. Local dashboard (Inbox, Invoice view)
4. Paid/unpaid tracking with filters
5. Timeline linking logic
6. Ollama LLM integration for tagging and task hints
7. REST API for uploads and external access

---

## 📦 Deployment

- Local app via:
  - Python + React frontend
  - Or full Electron app
  - Or Docker for local system services
- Local only (offline-first)
- No cloud dependency

---

## 🔐 Privacy & Security

- Local processing only
- No external API calls
- Optional: Encrypted metadata store

---

## 🧭 Summary

This MVP delivers a **smart, self-contained DMS** that:
- Understands scanned documents
- Tracks obligations like invoices and payments
- Supports LLM-powered assistance
- Interfaces with external sources via an API
- Operates fully offline and respects privacy

It lays the foundation for advanced features like semantic search, analytics, multi-user support, and financial planning in future iterations.