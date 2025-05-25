# Sprint Plan

> *Last updated: 2025-05-19 (scheduler)*
> *Last updated: 2025-05-19 (relationship warnings fix)*
> *Last updated: 2025-05-22 (ColPali integration)*

| # | User Story | Priority | Owner | Status |
|---|------------|----------|-------|--------|
| 1 | As a user, I can drop a PDF into the Inbox and see it listed in the UI within 10 s | P0 | backend | ✅ done |
| 2 | As a user, I can filter documents by *unpaid invoices* | P1 | frontend | ✅ done |
| 3 | As a user, I can view document due dates in a calendar and subscribe via ICS | P1 | full-stack | ✅ done |
| 4 | As a user, I receive a notification 3 days before an invoice is overdue | P2 | notifications | ✅ done |
| 5 | Backend starts without errors after dependency & code fixes | P0 | backend | ✅ done |
| 6 | Repository initialised on GitHub with comprehensive README | P0 | devops | ✅ done |
| 7 | As a developer, I want Badge component to support "success" variant to solve type errors | P1 | frontend | ✅ done |
| 8 | Wire FinanceAnalyticsPage to Analytics route & sidebar | P1 | frontend | ✅ done |
| 9 | Install Radix Tabs/Popover/Select & react-day-picker dependencies to fix build | P0 | frontend | ✅ done |
| 10 | Remove extra bottom whitespace by adjusting main-content height | P2 | frontend | ✅ done |
| 11 | Rebrand sidebar logo to 137docs and ensure full-height body to eliminate bottom stripe | P1 | frontend | ✅ done |
| 12 | Build responsive ShadCN Dashboard overview and bump version to v0.04 | P1 | frontend | ✅ done |
| 13 | Install @radix-ui/react-scroll-area dependency for Dashboard activity feed | P0 | frontend | ✅ done |
| 14 | Enable 'Review Invoices' button to open invoices filtered by due date | P1 | frontend | ✅ done |
| 15 | Add sortable columns & column visibility toggle to Invoice table | P1 | frontend | ✅ done |
| 16 | Modern ShadCN calendar page with upcoming payments & KPIs, version bump v0.05 | P1 | frontend | ✅ done |
| 17 | Rewired Export .ics button to backend ICS endpoint; added toast notifications | P1 | frontend | ✅ done |
| 18 | Add manifest dependency checker in module registry | P2 | platform | ⏳ backlog |
| 19 | Fine-grained permission schema & RequirePermission wrapper | P2 | platform | ⏳ backlog |
| 20 | Edge-licence cache layer for managed cloud | P3 | devops | ⏳ backlog |
| 21 | Scaffold agents plugin layer & base interface | P3 | backend | ⏳ backlog |
| 22 | Backend switched to Postgres + pgvector with auto Alembic baseline | P0 | backend | ✅ done |
| 23 | Suppress SQLAlchemy SAWarnings for Tag/Document relationship & eager-load tags | P0 | backend | ✅ done |
| 24 | Convert async SQLAlchemy URL to sync in Alembic helper to avoid await_only warnings | P0 | backend | ✅ done |
| 25 | React auth flow (login page, JWT persistence, Axios interceptor, protected routes) | P1 | frontend | ✅ done |
| 26 | Navbar user menu (username, logout dropdown, dark-mode) & hide notifications when logged out | P1 | frontend | ✅ done |
| 27 | Auto-logout on JWT expiry + remember last route across refresh/login | P1 | frontend | ✅ done |
| 28 | Friendly login failure feedback (backend message + shake animation) | P1 | frontend | ✅ done |
| 29 | Password change endpoint & MVP UI hook | P1 | full-stack | ✅ done |
| 30 | Protect admin-only routes with RequirePermission | P1 | frontend | ✅ done |
| 31 | Login page dev role selector buttons (admin / viewer presets) | P2 | frontend | ✅ done |
| 32 | Offline cache sync on reconnect & stale deletion | P2 | frontend | ✅ done |
| 33 | As an admin, I can manage users (CRUD, reset pwd) via Users page (v0.08) | P1 | full-stack | ✅ done |
| 34 | Integrate ColPali embedder & dependency installation | P0 | backend | ✅ done |
| 35 | Add Qdrant vector DB service to docker-compose and backend env | P0 | devops | ✅ done |
| 36 | Alembic migration: create Vectors table (doc_id,page,vector_ids) | P1 | backend | ✅ done |
| 37 | `/api/search/vision` late-interaction endpoint using Qdrant | P1 | backend | ✅ done |
| 38 | Front-end vision search bar with thumbnails | P2 | frontend | ⏳ backlog |
| 39 | Add "Documents" menu under Invoices & switch Inbox icon to Inbox | P1 | frontend | ✅ done |
| 40 | Remove legacy Columns dropdown from Invoices page (single picker eliminated) | P1 | frontend | ✅ done |
| 41 | Create `future-checkpoints.md` living doc for non-functional constraints | P2 | product | ✅ done |
| 42 | Backend: /api/settings/validate-folders endpoint | P0 | backend | ✅ done |
| 43 | Implement FolderWatcher hot-reload when inbox_path changes | P0 | backend | ✅ done |
| 44 | Backend: migrate-storage async endpoint + status | P0 | backend | ✅ done |
| 45 | Frontend: Settings UI folder configuration, validation & migration | P0 | frontend | ✅ done |
| 46 | Frontend: Folder browse button with FS-API + webkitdirectory fallback | P1 | frontend | ✅ done |
| 47 | Backend: `/api/fs` directory listing endpoint (RW, pagination, metadata) | P0 | backend | ✅ done |
| 48 | Frontend: File Browser page + fsApi integration | P1 | frontend | ✅ done |
| 49 | UI: Color-coded "Due In" logic in InvoiceTable (blue>30, yellow 14-30, red <14/overdue, neutral paid) | P2 | frontend | ✅ done |
| 50 | Update Implementation Guide with HOSTFS_MOUNT persistence options & pros/cons | P1 | docs | ✅ done |
| 51 | Update Architecture Overview to include ColVision embedder stage | P1 | docs | ✅ done |
| 52 | Create comprehensive demo user implementation guide | P2 | docs | ✅ done |

---

> *Last updated: 2025-05-21 (user management v0.08)*
> *Last updated: 2025-05-22 (sidebar menu update)*
> *Last updated: 2025-05-24 (filesystem API)*
> *Last updated: 2025-05-24 (filesystem UI)*
> *Last updated: 2025-05-24 (invoice DueIn color)*
> *Last updated: 2025-05-25 (HOSTFS_MOUNT persistence docs)*
> *Last updated: 2025-05-25 (architecture doc ColVision update)*

Next sprint planning on **Tuesday 10:00 CET**. 

* Task #?? – Switched default LLM model to `llama3` (docker-compose change) – done 2025-05-22 

# Sprint Plan – Folder Selection Feature (Inbox & Storage Root)

## Goal
Allow users (via Settings page) to pick
1. Inbox folder (watched for new docs)
2. Storage **root** directory (137docs will auto-manage yearly/Archive sub-folders below it)

## Milestones & Tasks

### 0. Analysis / Design (done)
• Clarify browser-only limitations → use backend endpoint for real FS work.

### 1. Backend
1.1 DB / Config layer
   - [ ] Alembic migration: add `inbox_path`, `storage_root` columns to `settings` (varchar).
   - [ ] Seed defaults from current env vars on startup if NULL.

1.2 API
   - [ ] Extend existing `/api/settings` GET/PUT to include new fields.
   - [ ] POST `/api/settings/validate-folders` → returns RW status, auto-creates subfolders.
   - [ ] POST `/api/settings/migrate-storage` {new_root: str} → async background copy then switch.
   - [ ] Implement "lock": once paths set & validated, subsequent PUT requires `force=true` query param else 409.

1.3 FolderWatcher lifecycle
   - [ ] Refactor watcher to read path from DB (not env) on startup.
   - [ ] Provide `reload_watcher(new_path)` util when inbox_path changes.

1.4 Migration helper
   - [ ] Copy 2025,2024,2023,Archive dirs to new root (use `shutil.copy2` preserving mtimes) in a background task; progress logging.

### 2. Frontend – Settings page
2.1 UI components
   - [ ] Add "Folder Configuration" card.
   - [ ] For each path show text field (read-only) & "Browse…" button using `<input type="file" webkitdirectory>`.
   - [ ] Show validation state (✓ writable / ⚠️ error).

2.2 Workflow
   - [ ] On selection → POST validate → if ok save via PUT.
   - [ ] If already locked show banner with "Change…" button → opens confirm modal that warns about migration.
   - [ ] After user confirms, call `migrate-storage`, poll progress, show toast.

2.3 Column selector localStorage keys updated earlier – nothing here.

### 3. QA / Tests
   - [ ] Unit test validation endpoint with good / bad paths.
   - [ ] Integration: change paths, ensure watcher picks up doc in new inbox.
   - [ ] E2E Cypress: select folders, upload doc, verify appears in UI.

### 4. Docs
   - [ ] Update `docs/folder-select.md` with screenshots & API description once implemented.

## Timeline
| Day | Work |
| --- | ---- |
| 1 | Backend migration + API stubs |
| 2 | FolderWatcher refactor + validation logic |
| 3 | Frontend UI components |
| 4 | Migration flow, lock mechanism |
| 5 | Tests + polish |

## Risks / Mitigations
• FS permissions – capture errno, surface to UI.
• Large migration copies – run async with progress; user informed not to close browser.
• Browser directory picker limited – rely on backend for validation.

---
Owner: dev team
Updated: 2025-05-22 