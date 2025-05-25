## 137Docs – Local-First LLM Integration Strategy

### 🌐 Vision

Create a modular, scalable LLM integration pipeline for 137Docs that:

* Works **100% locally by default** (via Ollama or LiteLLM)
* Enables document classification, tagging, enrichment, and analytics via LLMs
* Can scale into a **Pro version** for companies with support for advanced agents
* Supports API-driven cloud models (e.g., OpenAI) as an optional user-configurable backend

---

## 🧵 Architecture Overview

### Core Tasks Using LLMs

| Task Type         | Purpose                                     | Suggested Model Class       |
| ----------------- | ------------------------------------------- | --------------------------- |
| Tagging           | Tag document type, detect fields            | Small (Phi-3, LLaMA 3 8B)   |
| Field Completion  | Fill missing fields, complete contacts      | Mid-size (Mixtral)          |
| Entity Matching   | Classify document to a known company/entity | Small + rules               |
| Analytics Summary | Monthly totals, KPIs, trend summaries       | Mid-size                    |
| Legal Response    | Generate replies, summaries, reminders      | Large model (Claude, GPT-4) |

---

## 🤖 Design Philosophy

* **ColVision remains the primary extractor** (OCR fallback only)
* LLMs operate on extracted structured data and context
* LLMs never modify original files — they return JSON-based augmentations (e.g., `tags`, `summary`, `entity_id`)
* Each LLM task is stateless and versioned
* LLM interaction is optional; 137Docs runs without it if models are offline

---

## 🏠 LLM Integration Options

137Docs will support:

### 1. Local via LiteLLM

* Default setup
* Route tasks to `localhost:4000` or `host.docker.internal:4000`
* Use virtual keys: `sk-local-123456`
* LiteLLM handles:

  * Routing to Ollama models (e.g., llama3, phi3)
  * Token usage logging
  * Basic fallback logic

### 2. API-Based (Remote)

* OpenAI, Anthropic, Together, Groq, etc.
* Users can enter:

  * Provider type
  * API key (e.g., `sk-abc123`)
  * Preferred model per task (e.g., `gpt-4`, `claude-3-sonnet`)

---

## 🔧 Settings Page Changes

* Add new section: **"LLM Configuration"**

Fields:

```json
{
  "llm_provider": "local" | "openai" | "anthropic",
  "llm_api_key": "sk-local-xyz" | "sk-openai-xyz",
  "model_preferences": {
    "tagger": "phi3",
    "enricher": "mixtral",
    "analytics": "gpt-4",
    "responder": "claude-3"
  }
}
```

* Optional: UI dropdowns for provider + input for API key
* Include a test button to verify LLM connectivity

---

## ✅ Phase Approach

### **Phase 1: Core Invoice Intelligence (Personal Version)**

* LLM: Tagging, entity classification, field enrichment
* Settings: LLM config with local support only
* Usage cap: 500 documents
* Fully offline experience

### **Phase 2: DocAI + Company Support (Pro Version)**

* Enable reply generation for formal letters
* Add entity-level filtering and classification
* Unlock unlimited document processing
* Allow use of cloud models via API keys
* Introduce queue + agent-style modular LLM runners

---

## 🤖 Agent/Task System (Future-ready)

Every LLM call becomes a modular task:

```ts
interface LLMTask {
  type: 'tagger' | 'responder' | 'analytics';
  input: any;
  model: string;
  outputSchema: 'tags' | 'summary' | 'json';
  storeLocation: string;
  requestedBy: string;
}
```

---

## ✉ Outcome

This strategy gives 137Docs:

* Private-by-default AI augmentation
* Clean separation of Pro features (response, multi-entity)
* Multi-LLM flexibility via a single interface
* Modular growth into analytics, summarization, auto-reply

---

## ❓ Implementation Questions & Clarifications

### Technical Architecture Questions

1. **LiteLLM Integration**:
   - Should we bundle LiteLLM as a separate Docker service in `docker-compose.yml` or expect users to run it externally?
   - What's the preferred LiteLLM configuration for routing between multiple local models (Ollama + potential future local models)?
   - How should we handle LiteLLM service discovery and health checks?

2. **Model Management**:
   - Should 137Docs auto-download recommended models (phi3, mixtral) on first run, or require manual Ollama setup?
   - What's the fallback strategy when preferred models aren't available locally?
   - How do we handle model version compatibility and updates?

3. **Task Queue Architecture**:
   - Should LLM tasks be processed synchronously during document ingestion or queued for background processing?
   - Do we need a Redis/Celery setup for LLM task queuing, or can we use simple async processing?
   - How should we handle LLM task failures and retries?

### Data Flow Questions

4. **ColVision Integration**:
   - At what point in the pipeline do LLM tasks trigger? After ColVision embedding but before document persistence?
   - Should LLM enrichment be optional per document, or always attempted?
   - How do we handle cases where ColVision succeeds but LLM tasks fail?

5. **Entity Classification**:
   - Should entity matching use the existing `Entity.aliases` array or a separate LLM-specific matching system?
   - How do we handle confidence scores for LLM-suggested entity matches?
   - Should users be able to approve/reject LLM entity suggestions?

### Settings & Configuration

6. **LLM Configuration Storage**:
   - Should LLM settings be stored in the existing `settings` table or a new `llm_config` table?
   - How do we securely store API keys (encryption at rest)?
   - Should model preferences be per-user or system-wide?

7. **Usage Tracking**:
   - Do we need to track token usage for cost estimation, even for local models?
   - Should there be usage limits/quotas for different user roles?
   - How do we handle rate limiting for cloud API providers?

### User Experience

8. **Settings UI**:
   - Should the LLM configuration be a separate page or integrated into existing Settings?
   - How do we guide users through local model setup (Ollama installation, model downloads)?
   - What level of technical detail should be exposed to end users?

9. **Error Handling**:
   - How should we communicate LLM failures to users (silent fallback vs. notifications)?
   - Should documents still be processed and stored if LLM enrichment fails?
   - What retry mechanisms should be in place for transient LLM failures?

### Performance & Scaling

10. **Resource Management**:
    - How do we prevent LLM tasks from blocking document ingestion?
    - Should there be configurable concurrency limits for LLM operations?
    - How do we handle memory/GPU constraints when running local models?

11. **Caching Strategy**:
    - Should we cache LLM responses for similar documents to reduce processing time?
    - How do we invalidate caches when model preferences change?
    - Should entity classification results be cached separately from other LLM tasks?

### Migration & Compatibility

12. **Existing Data**:
    - How do we handle existing documents when LLM features are enabled?
    - Should there be a bulk re-processing option for historical documents?
    - How do we maintain backward compatibility with documents processed before LLM integration?

13. **Demo Mode Integration**:
    - Should demo users have access to LLM features, or should they be restricted?
    - How do we generate realistic LLM-enhanced demo data (tags, summaries, entity matches)?
    - Should demo mode use pre-computed LLM responses to avoid model dependencies?

---

## ✅ Implementation Decisions & Plan

Based on the clarifications above, here are the confirmed implementation decisions:

### 🏗️ Architecture Decisions

#### LiteLLM Integration
- **Bundle as optional module**: Add LiteLLM as Docker service when LLM module is enabled
- **Fallback option**: Allow users to provide external LiteLLM endpoint URL
- **Model discovery**: Auto-detect available models from connected LiteLLM/Ollama instance
- **Health checks**: Container health for bundled, ping/heartbeat for external

#### Model Management
- **User responsibility**: Require users to run Ollama if they want local LLM features
- **Optional auto-setup**: Add module to download Ollama automatically
- **External fallback**: Provide hosted LiteLLM with rate-limiting for users who don't want local setup
- **Model compatibility**: Let Ollama handle model versioning and updates

#### Task Processing
- **Hybrid approach**:
  - **Invoices**: Queued batch processing with notifications when complete
  - **Documents**: Synchronous processing (unless bulk upload detected)
  - **Bulk operations**: Automatic queue switching for multiple documents
- **Queue system**: Use Redis/Celery for reliable task processing
- **Retry logic**: 3 attempts → 5min wait → 3 more attempts → switch to backup LLM

### 🔄 Data Flow Integration

#### ColVision + LLM Pipeline
- **Quality validation**: Review where ColVision quality declines and LLM can improve
- **Backup LLM**: Implement fallback LLM when primary fails validation
- **Optional enrichment**: External data enrichment as user-configurable setting
- **Confidence scoring**: Develop validation system for LLM outputs

#### Entity Classification
- **Enhanced alias matching**: Expand current `Entity.aliases` with hybrid fuzzy + LLM approach
  ```json
  {
    "aliases": ["Visana AG", "Visana Insurance"],
    "match_keywords": ["Visana", "Technopark"],
    "LLM_name_variants": ["Visana Health", "Visana Krankenversicherung"]
  }
  ```
- **Structured confidence scoring**: Return detailed match confidence with explanations
  ```json
  {
    "entity_id": "dat-ag",
    "confidence": 0.83,
    "explanation": "Matched based on sender address and VAT"
  }
  ```
- **User approval workflow**: Allow users to approve/reject/regenerate LLM suggestions, especially for business-critical matches

### ⚙️ Configuration & Storage

#### Settings Management
- **Separate table**: Create new `llm_config` table for LLM-specific settings
- **Security**: Use best local encryption practices (user responsibility for local systems)
- **Settings UI**: Integrate as new sub-menu in existing Settings page
- **Documentation**: Point users to setup docs, offer integration support packages

#### Error Handling & Reliability
- **Dual notification**: Show user notification + automatic backup action
- **Manual override**: Allow users to manually switch back from backup
- **Failure LLM**: Introduce dedicated failure-handling LLM
- **Validation thresholds**: Set percentage-based validity checks

### 🚀 Performance & Caching

#### Resource Management
- **Queue separation**: Use different LLMs and queue systems to prevent blocking
- **Advanced concurrency**: Make concurrency limits an advanced feature
- **Ollama delegation**: Let Ollama handle GPU/memory constraints

#### Caching Strategy
- **Qdrant integration**: Use existing Qdrant DB for LLM response caching
- **Document grouping**: Group similar documents for faster processing
- **Cache invalidation**: TBD - needs further research on best practices
- **Entity caching**: Evaluate advantages/disadvantages of separate entity classification caching

### 📊 Migration & Data Handling

#### Existing Data
- **Alpha flexibility**: All current data can be wiped (test data only)
- **Bulk re-processing**: Implement comprehensive re-processing for historical documents
- **Long-term storage**: Plan for future long-term document storage integration
- **No backward compatibility**: Not required for Alpha phase

#### Demo Mode
- **Showcase only**: Demo mode purely for demonstration with pre-made dummy data
- **No user demo**: No user-accessible demo system (privacy-first approach)
- **Pre-computed responses**: Use static LLM responses to avoid model dependencies
- **Low priority**: Demo mode implementation deferred to later phases

---

## 🎯 Next Steps

### Phase 1 Implementation Order
1. **LLM Config Table**: Create `llm_config` schema and migration
2. **Settings UI**: Add LLM configuration sub-menu
3. **LiteLLM Module**: Implement optional Docker service
4. **Basic Integration**: Connect document processing to LLM pipeline
5. **Queue System**: Implement Redis/Celery for task processing
6. **Error Handling**: Add retry logic and backup LLM system
7. **Caching**: Integrate with Qdrant for response caching

### Future Phases
- **Advanced Features**: Concurrency controls, external enrichment
- **Pro Features**: Multi-entity support, advanced analytics
- **Cloud Integration**: Hosted LiteLLM service with rate limiting
