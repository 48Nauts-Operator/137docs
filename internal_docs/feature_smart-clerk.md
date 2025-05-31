# DOCAI

We want to add a feature where documents (not invoices) can be handled and addressed intelligently. This includes tasks like reviewing NDAs, contracts, letters, fines, and generating responses or follow-ups. This is managed by a modular system of professional-grade AI agents under the name **SmartClerk**.

---

## 🖥️ Frontend

* **Left Panel**: Shows document history/versioning (e.g., NDA, insurance policy history).
* **Center Panel**: Chat interface

  * Chat window at the bottom
  * Conversation history above (Cursor-style interface)
* **Right Panel**: Document viewer/editor with tabbed layout

  * Tab 1: Original document
  * Tab 2: Generated response, draft, or memo

---

## ✨ Features

LLMs can be selected from a dropdown. Capabilities include:

* Read, understand, and process documents
* Advise on document content
* Draft responses to official letters
* Review and annotate contracts
* Research and suggest better offers
* Rewrite or suggest alternative clauses
* Create new documents from scratch

---

## 🧠 SmartClerk Agent Framework

A system of specialized AI agents that trigger based on document type and handle domain-specific actions.

### 1. 🛡 Insurance Agent

**Triggers on**: Insurance contracts, claims, renewals

* Extracts coverage details
* Searches for better offers
* Suggests termination/negotiation letters
* Adds renewal reminders

### 2. 🧾 Warranty Agent

**Triggers on**: Receipts, warranty documents

* Extracts and stores warranty metadata
* Retrieves relevant documents on request
* Drafts claim letters

### 3. ⚖️ Legal Agent

**Triggers on**: Fines, NDAs, legal letters, proposals

* Interprets legal language
* Suggests actions or dispute letters
* Drafts responses with legal references

### 4. 📁 General Purpose Agent

**Triggers on**: All other documents

* Summarizes and tags documents
* Suggests responses and actions
* Redirects to specialist agents if needed

---

## 🗂 Document History

* Display a searchable, filterable history box
* Clicking a document opens it in the DocAI panel

---

## 🦾 Agent Deployment

Users can deploy or manually trigger agents for:

* Tax prep (Tax Agent)
* Financial document review (Finance Agent)
* Insurance optimization (Insurance Agent)
* Legal review (Legal Agent)
* General purpose review (Default Agent)

---

## Future Extensions

* Smart reminders & scheduling
* Avatar-based chat for agent personas
* Agent escalation & collaboration
* Periodic document health checks and optimization tasks

---

This modular approach allows document processing, automation, and interaction to become dynamic, contextual, and smart—tailored to personal and business use cases alike.
