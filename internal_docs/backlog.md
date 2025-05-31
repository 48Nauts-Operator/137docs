# Backlog

> These are ideas & TODOs that are **not** scheduled for the current sprint but worth revisiting.  Keep this list pruned so it stays actionable.

| # | Task | Rationale / Notes | Effort | Priority |
|---|------|------------------|--------|----------|
| 1 | Consolidate duplicate backend modules at repo root vs. `src/backend`  (remove legacy copies, after making a `.bak` archive) | Prevent confusion & import ambiguity; shrinks image size | M | P1 |
| 2 | Unify `requirements.txt` files and pin versions via `pip-tools` or Poetry | Avoid drift between root & backend and ease dependabot upgrades | M | P1 |
| 3 | Add automated tests (pytest + async fixtures) and coverage gating (≥80 %) | We currently have *zero* tests; confidence in refactors is low | H | P1 |
| 4 | Setup GitHub Actions CI: lint (ruff), type-check (mypy), tests, Docker build | Ensure every PR keeps the build green | M | P1 |
| 5 | Integrate semantic search endpoint into React search bar with typeahead | Outstanding "Part 2" item; big UX win | M | P2 |
| 6 | Implement manifest dependency checker module as per `modulized_architecture_v2.md` | Detect unsupported plugins on startup | H | P2 |
| 7 | Design & apply fine-grained permission model; add `<RequirePermission>` wrapper in frontend | Needed for upcoming multi-tenant features | H | P2 |
| 8 | Edge licence cache layer for cloud edition (redis or Cloudflare KV) | Cuts round-trip latency on licence validation | H | P3 |
| 9 | Agent SDK scaffolding & example plugin | Allows third-party automation/AI agents | H | P3 |
| 10 | Switch to `sqlalchemy[asyncio]` declarative 2.x style models (remove mix of sync) | Clean-up prior to serious migrations | M | P3 |
| 11 | Add OpenTelemetry tracing & Prometheus metrics endpoints | Observability | M | P3 |
| 12 | Implement deterministic snapshot backups & restore tool for Postgres volume | Safety: honour *database backup* policy | M | P3 |
| 13 | Implement 2FA | 2Factor Authentication | M | P1 |



_Keep this markdown updated whenever we defer a feature._ 