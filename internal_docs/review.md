# Project Review – May 2025

This document summarises the root causes that prevented the **Document Management System (DMS)** from starting and the steps taken to resolve them.

## 1. Python backend issues

| Category | Problem | Fix |
|----------|---------|-----|
| Dependency versions | Pydantic v2 broke `BaseSettings`; FastAPI ≥0.104 depends on Pydantic v2 | Pinned **pydantic==1.10.13** and downgraded **fastapi==0.103.2** in both `requirements.txt` files |
| Missing runtime dep. | `greenlet` required by SQLAlchemy async engine | Added **greenlet==3.0.3** |
| Auth stack | JWT & password hashing libs absent | Added **python-jose==3.3.0**, **passlib[bcrypt]==1.7.4**, pinned **bcrypt==3.2.2** |
| Calendar export | `ics` library not installed | Added **ics==0.7.2** |
| Module aliases | `CalendarExportService` & `LLMProcessor` referenced but classes were renamed | Added lightweight alias classes inheriting from the new names |
| DB engine import | `app.main` expected `engine` symbol; file exposed `async_engine` only | Added alias `engine = async_engine` in `app.database` |
| Service singletons | Search / Analytics / Calendar services instantiated without DB session | Refactored FastAPI routes to create services **per request** with the active `AsyncSession` |
| StaticFiles | Starlette raised `Directory 'static' does not exist` | Added runtime check + `os.makedirs`; mount now uses absolute path `src/backend/static` |

## 2. TypeScript / React frontend issues (brief)

* Added missing `index.tsx`, Tailwind entry, `tsconfig.json` and Router skeleton.
* Resolved duplicate identifiers and missing path aliases.
* Created stub `api.ts` service layer so TS build passes while backend API evolves.

## 3. Documentation & housekeeping

* Created `/docs` artefacts: `concept.md`, `DMS-summary.md`, `README.md`, `links.md`, `sprint-plan.md`.
* Added this `review.md` to capture the troubleshooting log.

## 4. Outcome

Running commands:

```bash
# backend
cd src/backend
uvicorn app.main:app --reload

# frontend
cd src/frontend
npm run build
```

The application now starts without runtime errors; API docs accessible at `http://localhost:8000/docs`. 