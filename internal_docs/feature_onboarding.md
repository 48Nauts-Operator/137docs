You're thinking about this exactly the right way — the onboarding is not just a first-time setup, it's a context-aware module activator. To proceed efficiently, we can structure the implementation into 3 coordinated modules that interact cleanly and allow for expansion:

⸻

🧩 Modular Plan for Entity-Aware Onboarding & Multi-Company Support

🔧 Overview of What We Need to Build

Component	Purpose
onboarding	Gathers user intent (personal vs business) and guides setup
entity module	Stores and manages companies (and private profile)
license/module router	Activates/deactivates UI features based on setup or marketplace actions


⸻

✅ Phase 1: Onboarding Module

🔨 Create: modules/onboarding/

Includes:
	•	Wizard-style UI (Steps 1–3)
	•	State: user.intent = 'personal' | 'business' | 'mixed'
	•	Logic to pre-activate:
	•	entity module if business or mixed
	•	Store initial personal entity automatically

📌 Questions to Ask:
	1.	Are you using 137Docs for:
	•	( ) Personal
	•	( ) Business
	•	( ) Both
	2.	Want to add a business now?
	•	Yes → go to business entity setup
	•	No → load dashboard with personal entity

### 📜 Mandatory Licence Agreement (new Step 0)
Before the intent selection, display a scrollable Licence Agreement and a checkbox:
- **Self-Hosted** – user maintains infra, no SLA.
- **No Support / No Warranty** – software provided *as-is* (MIT-style clause).
- **LLM Usage Costs** – any API usage (OpenAI, Anthropic, etc.) billed directly to the user's own key.
- **Non-Commercial Restriction** – this community edition may not be resold or offered as a hosted service.

User must tick "I have read and accept" → enables **Continue**.  Store `tosAcceptedAt` timestamp in settings so wizard is skipped on subsequent logins.

Back-end guard: every authenticated request checks `settings.tosAcceptedAt` → otherwise HTTP 451.

➡️ Upon completion, write config:

{
  "plan": "personal",
  "entities": [{ id: "personal", name: "Private", type: "individual" }],
  "enabledModules": ["core", "analytics", "calendar", "entity"]
}


⸻

✅ Phase 2: Entity Management Module

🔨 Create: modules/entity/
	•	Handles:
	•	Entity switching logic
	•	Filtering of documents by entity_id
	•	Adding/editing companies
	•	Tags/keywords/VAT alias mapping
	•	Integrates with:
	•	Analytics
	•	Calendar
	•	Document ingest/metadata tagging

This module is conditionally enabled by onboarding or via Marketplace.

⸻

✅ Phase 3: Marketplace Module Integration

🧩 Add: "Add Company" Tile
	•	When clicked, trigger onboarding step subset
	•	"Let's set up your company..."
	•	Capture: name, address, VAT, IBAN
	•	Append to entities list and refresh filters

If onboarding was skipped initially, this retroactively enables the entity module and transforms the UI from personal-only → multi-entity.

⸻

✅ Phase 4: Routing & Settings Awareness
	•	Add logic to:
	•	Read onboarding state from settings on startup
	•	Inject modules accordingly
	•	Sidebar, dashboard filters, analytics will auto-adapt if:
	•	entities.length > 1
	•	or plan !== 'personal'

⸻

✅ Phase 5: (Optional) Entity Activation from Classifier

You could later detect documents that match business-style invoices and prompt:

"👀 This looks like a company invoice. Want to add Technopark AG as a business entity?"

Then trigger entity setup from within document context — high-trust upgrade path.

⸻

🗂️ Suggested Folder Structure

src/
  core/
  modules/
    onboarding/
      index.tsx
      Step1Intent.tsx
      Step2BusinessDetails.tsx
      utils/onboardingState.ts
    entity/
      index.tsx
      EntitySwitcher.tsx
      EntityEditor.tsx
      hooks/useEntityFilter.ts
    marketplace/
      AddCompanyCard.tsx


⸻

🛠️ Development Steps
	1.	Scaffold onboarding flow (3 steps)
	2.	Hook onboarding result into user config / plan
	3.	Build entity schema + management UI
	4.	Add dashboard filter logic based on active entity
	5.	Enable entity addition via marketplace tile

⸻

✅ Outcome
	•	Seamless onboarding with future-proofed entity logic
	•	Modular system: personal-only remains lean, business mode expands UX
	•	Licensing model naturally attached to complexity (1 entity = free, >1 = tiered)

⸻

## 🏗️ Proposed Technical Architecture (v0.1 Draft)

### 1. Domain Model (Postgres)
| Table | Core fields | Notes |
|-------|-------------|-------|
| `entity` | id (UUID), name, type (individual\|company), address_json, vat_id, iban, created_at | One row per business or the implicit *personal* profile |
| `user_entity` | user_id  → **users**.id, entity_id → **entity**.id, role (owner\|member) | Allows later multi-user multi-entity setups |
| `document` | **add** `entity_id` FK nullable | All existing queries join on this id when entity module is active |
| `setting` | scope (global\|user), key, json_value | Onboarding wizard writes `plan`, `enabledModules`, `lastCompletedStep` here |

Migration strategy: new columns are nullable → deploy without downtime, back-fill `entity_id = personal` for existing docs.

### 2. Backend Services
1. **OnboardingService**  (`/services/onboarding.py`)
   • CRUD helpers for reading/writing onboarding state in `setting` table.
2. **EntityService** (`/services/entity.py`)
   • CRUD for entities, validate VAT/IBAN, derive slug.
3. **MarketplaceService** (already stub) – can reuse to enable modules.

Expose REST endpoints:
```
GET  /api/entities                → list (filtered by current user)
POST /api/entities                → create entity
PUT  /api/entities/{id}           → update
POST /api/onboarding/complete     → payload { plan, entities: [...] }
GET  /api/onboarding/status       → returns wizard state
```

### 3. Frontend Modules
```
modules/
  onboarding/
    Wizard.tsx            – orchestrates steps, writes tmp state to context
    steps/
      Intent.tsx          – radio selection personal / business / both
      BusinessInfo.tsx    – company form, validates VAT/IBAN
      Review.tsx          – summary + Finish button
    hooks/useOnboarding.ts

  entity/
    EntityProvider.tsx    – React Context with active entity + list
    EntitySwitcher.tsx    – Small dropdown in navbar when >1 entity
    useEntityFilter.ts    – wrap API calls to inject ?entity_id=…
```
Routing:
* `App.tsx` mounts `OnboardingGuard` high-up. If `onboarding.status!=='done'` ⇒ redirect to `/onboarding` wizard.

### 4. UI/UX Contracts
* Wizard uses **ShadCN** `Tabs` style; progress stored in `localStorage` so refresh doesn't lose data.
* After completion, it triggers `/onboarding/complete` then reloads the whole SPA so module router can re-hydrate with new config.
* Marketplace "Add Company" re-uses BusinessInfo step in a modal; on save posts to `/entities` and refreshes EntityProvider.

### 5. Module Router
Simple util that reads `settings.enabledModules` at startup and lazy-loads corresponding micro-frontends (split-chunks) so unused code isn't shipped to personal-only users.

---

## ❓ Open Questions
1. **Licensing tiers** –  do we enforce entity count limits in backend or just hide the UI until a licence key is present?
2. **Permissions** – for now single-user per workspace. Should we still model `user_entity` for future multi-user?
3. **Cross-entity search** – default filter to active entity, but allow "All entities" in advanced search?
4. **Document re-assignment** – need UI to move docs between entities?
5. **Email / Inbox segregation** – will each entity get its own watched folder or share `/Inbox`?
6. **LLM context** – include `entity_id` in embeddings namespace to avoid cross-polluting RAG answers?
7. **Analytics history** – after enabling entity module mid-way, should old docs be auto-classified to entities via heuristic (sender VAT match)?

---

## 💡 Implementation Thoughts & Next Steps
1. Ship DB migrations and EntityService first – nothing breaks, even if frontend isn't ready.
2. Build onboarding wizard with mocked service → iterate quickly.
3. Integrate EntityProvider into existing pages (InvoiceTable etc.) to pass `entity_id` param.
4. Only after that wire Marketplace "Add Company".
5. Write Cypress tests: onboarding flow; entity switcher filters docs; module router hides entity UI when disabled.

---

*Please review the open questions and confirm/adjust data-model choices before we start coding migrations.*

