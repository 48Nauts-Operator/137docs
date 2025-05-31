# 137Docs – Modularised Architecture v2

*Last updated: 2025-05-19 (rev-a)*

---

## 1  Purpose & Vision

137Docs should evolve from a monolithic **app** into an extensible **platform**.  By shipping self-contained feature modules and a licensing layer we can:

*  Ship new value faster without bloating the free core.
*  Monetise advanced capabilities behind a paywall.
*  Let self-hosters pick & choose only the modules they need.
*  Keep the local-first, privacy-centric philosophy intact.

## 2  Principles

1. **Modularity** – code, data, UI and APIs for each feature live in `/modules/<name>`.
2. **Isolation** – a module can be compiled / enabled / disabled without touching others.
3. **Discoverability** – locked modules are still visible in the UI (with 🔒) to drive upsell.
4. **Thin Core** – `/core` only contains authentication, shared UI kit, storage & sync, settings, and the plugin registry.
5. **Config-Driven** – activation controlled by a `plan.json` or remote license check.

## 3  Proposed Repository Layout

```
src/
  core/
    auth/          · JWT, license validation, Stripe hooks
    ui/            · ShadCN design-system, Navbar, Sidebar
    db/            · Shared models & migrations
    utils/         · i18n, logging, feature-flags
  modules/
    invoices/
    analytics/
    calendar/
    address_book/
    respond/       ← premium AI reply & legal automation
    billing/       ← paywall screens, Stripe portal
    agents/        ← future task-agent plug-ins (see §11)
```

Each `modules/<m>/index.ts` (frontend) or `__init__.py` (backend) exports a `ModuleManifest`:

```ts
export const manifest = {
  id:        'respond',           // unique key
  version:   '0.1.0',
  routes:    ['/respond', '/respond/settings'],
  sidebar:   {label: 'Respond', icon: MessageSquareWarning, premium: true},
  dbMigrations: [/* Alembic revision ids */],
  hooks:     { registerNotifications, extendTimeline },
};
```

## 4  Activation & Licensing Flow

| Step | Component | Detail |
|------|-----------|--------|
| 1 | **Login / licence check** | `core/auth` validates JWT + optional license key (Stripe Customer Portal, Paddle, etc.). |
| 2 | **Plan resolver** | Returns `{ plan: 'pro', enabledModules: ['analytics','calendar'] }`. |
| 3 | **Module registry** | Shell imports manifests, filters by `enabledModules`. |
| 4 | **UI gating** | `<RequireModuleAccess id="respond">›…` shows either content _or_ `<UpgradePrompt feature="respond" />`. |
| 5 | **Backend guard** | FastAPI dependency `require_module('respond')` raises `403` for unauthorised API calls. |
| 6 | **Node-lock enforcement** | Licence is tied to the host machine (MAC / HW token) with a 7-day offline grace period. |
| 7 | **Edge-cache** | Managed-cloud flavour caches licence look-ups at CDN edge (1-5 min TTL) for sub-100 ms gating. |

### Billing options

* **Add-On** – base _Pro_ plan + `respond` add-on; easiest with Stripe Prices & metered usage.
* **Tiered** – plans `Free / Pro / Pro+Legal` where the last includes the premium modules.
* **Seat-Based** – each module can limit seats or request an additional fee per active user.

## 5  Database & Migration Strategy

**Relational store – move to PostgreSQL**

* PostgreSQL (asyncpg driver) becomes the default backend; we ship a Docker compose for local dev.
* Migration: enable `pgvector` extension in the same container (`CREATE EXTENSION IF NOT EXISTS pgvector`).
* Alembic remains the migration tool – one version history across core + active modules.

**Vector store – pgvector or external**

* Premium **AI/Respond** module depends on vector similarity search.
* Default: use the same Postgres DB with `pgvector` column on `documents` for embeddings (`embedding vector(1536)`).
* Enterprise / heavy-load installs can switch to Qdrant / Weaviate by implementing `VectorStore` interface.

Other notes:
* Modules place extra migrations under `modules/<m>/migrations`; registry stitches them into Alembic env.
* SQLite remains available for hobby use (feature-flag disables AI + vector-search when running on SQLite).

## 6  Key Challenges & Mitigations

| Area | Challenge | Mitigation |
|------|-----------|-----------|
| **Data coupling** | Modules querying each other's tables. | Use repository pattern & published TypeScript/SQLAlchemy interfaces only. |
| **Runtime size** | Bundle grows with unused premium code. | Code-split per module; dynamic `import()` only when enabled. |
| **Licence spoofing** | Self-hosters may patch JS to unlock modules. | Critical premium features (_Respond_) also require server-side licence check before executing AI calls. |
| **Migration ordering** | Circular dependencies between module schemas. | Enforce topological order via `manifest.dependsOn`. |
| **Vector DB bloat** | Storing large embeddings in core DB increases size. | Allow pluggable `VectorStore` – switch to external Qdrant for >10k docs. |
| **UI clutter** | Too many locked menu items. | Show up to 3 locked features, hide the rest under "Marketplace". |
| **Module dependency hell** | Missing or cyclic `dependsOn` chains. | Registry runs `toposort` at boot; fails fast with readable error. |

## 7  Implementation Phases

1. **Δ Refactor** core to load modules via manifest registry.
2. **Δ CLI** `yarn module:create` scaffolds a new module with manifest & tests.
3. **Δ Licence Service** – FastAPI endpoints `POST /api/license/activate`, `GET /api/me/modules`.
4. **Δ Billing Module**
   * Stripe Checkout & portal
   * Webhook → `plan` table update
5. **Δ Respond Module (MVP)**
   * UI: AI-draft pane, usage counter
   * Backend: `/api/respond/draft` with licence guard
6. **Δ Analytics & Metrics** for module adoption (can be opt-in telemetry).
7. **Δ Dependency Checker** – validate `dependsOn` and `conflictsWith` during shell bootstrap.
8. **Δ Fine-Grained Permissions** – introduce `permissions[]` array on manifest & `RequirePermission` wrapper.
9. **Δ Edge-Licence Cache** – Cloud deployment adds Cloudflare Worker / Fastly VCL.
10. **Δ Agent Plugin Layer** – scaffold `/modules/agents` with interface & POC `document_router` agent.

## 8  User Experience Guidelines

* Locked sidebar items display 🔒; tooltips explain benefit.
* Attempting to access a locked route shows paywall card with demo video, pricing, and **Upgrade** CTA.
* After successful checkout, client polls `/api/me/modules` and refreshes registry → module loads without reload.
* Anonymous telemetry is **opt-in** by default; events are stripped of PII and aggregated client-side before upload.

## 9  Open Questions

All addressed above.

---

## 10  Marketplace & Hosting Models

| Model | For whom | Characteristics |
|-------|----------|-----------------|
| **Self-hosted OSS** | Privacy-focused users | Full source, Docker-Compose incl. Postgres + optional Qdrant. All premium modules locked by default. |
| **Managed Cloud** | Teams without infra resources | We run Postgres + Ollama GPU pool, auto-scale vector store; monthly subscription per module. |
| **Marketplace** | Third-party devs | SDK (`137 sdk create-module`) publishes manifests + NPM package.  Validation pipeline scans for security issues before listing. |

Marketplace flow: dev uploads → automated tests → manual review → listing with revenue-share license keys handled by central billing service.

---

### ✅ Outcome

A modular, licence-aware architecture lets 137Docs:

* Ship premium AI features without alienating OSS users.
* Keep the core lightweight and auditable.
* Open the door to a future marketplace, positioning 137Docs as **the** extensible, local-first doc & invoice platform.
* Provide both **self-hosted** and **cloud** flavours, each benefiting from the same modular codebase.

## 10  Product Editions

| Edition | Target | Included | DB | Licensing |
|---------|--------|----------|----|-----------|
| **OSS Core** | Hobbyists / privacy advocates | Core + free modules | SQLite (default) / Postgres | MIT-style, no premium modules |
| **Managed Cloud** | Teams w/o infra | Core + any purchased modules | Postgres + pgvector, Qdrant optional | Subscription per module, node-lock N/A |
| **Enterprise Self-Hosted** | Regulated orgs | Core + premium modules + SSO/SCIM | Postgres cluster + external vector DB | Annual licence, node-lock to domain |

## 11  Module Dependencies & Permissions

```ts
export const manifest = {
  id: 'timeline',
  version: '0.3.0',
  dependsOn: ['invoices', 'analytics'],   // hard deps
  conflictsWith: ['legacy-timeline'],     // cannot coexist
  permissions: [                         // optional granularity
    'timeline.view',
    'timeline.write',
    'timeline.ai.generate',
  ],
};
```

*Shell* performs a topological sort of `dependsOn`; on failure it aborts with an error showing the cycle or missing module.  `RequirePermission("timeline.ai.generate")` guards granular actions.

## 12  Agent Plug-in Layer (Roadmap)

Directory `agents/` (peer to modules) will host autonomous workflows that orchestrate multi-step LLM tasks:

```
agents/
  document_router/    ← class routes new docs to correct inbox/tag
  respond_writer/     ← drafts legal responses using embeddings
  payment_checker/    ← cross-checks invoices vs bank feed
```

Each agent implements:

```py
class AgentBase:
    id: str
    required_modules: list[str]
    async def run(self, **kwargs): ...
```

Activation via licence + settings toggles; long-running agents scheduled by APScheduler or Celery.

---

* Provide both **self-hosted** and **cloud** flavours, each benefiting from the same modular codebase. 