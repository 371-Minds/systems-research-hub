# AGENTS.md — Metasystemic Agent Guidelines & Directives

This document defines the architectural laws, operating protocols, and execution boundaries for autonomous agents, human engineers, and AI coding systems interacting with this codebase.

---

## 🏛️ Prime Directive: The Metasystemic Invariant

> **"Every complex systems model, research paper, or technical payload must be abstracted into a frictionless, 1-click execution pattern accessible to non-technical users."**

Technical elegance is invalid if it produces cognitive friction, environment dependency barriers, or command-line prerequisites for non-technical stakeholders.

---

## 🧭 Core Architectural Guidelines

### 1. Cybernetic Layering (Viable System Model / VSM)
When designing or extending modules, assign responsibilities according to the 5 VSM tiers:

| System | Role | Implementation in Hub |
|---|---|---|
| **System 1 (Operations)** | Primary execution & data ingest | Google Drive v3 file streams, Electrobun runtime views, file previews. |
| **System 2 (Coordination)** | Anti-oscillation & synchronization | `mcpRegistry.ts`, JSON-RPC router, multi-account token state sync, debounced search. |
| **System 3 (Operational Control)** | Real-time homeostasis & feedback loops | Causal loop simulator, Balancing Loop (B1) damping, variety attenuation metrics. |
| **System 4 (Forecasting & Strategy)** | External environment & futures modeling | ArXiv MCP feed, ontology extractor, Reinforcing Loop (R1) knowledge compounding. |
| **System 5 (Policy & Identity)** | Fundamental constitution & values | Zero-leakage privacy, 100% non-tech accessibility, zero CLI barriers. |

---

## 🔐 Security & Identity Directives

1. **Client-Side Ephemeral OAuth Only:**
   - Google Drive access tokens must remain strictly in-memory.
   - **NEVER** persist access tokens to `localStorage`, cookies, or remote databases.
   - All multi-account authentications must use popup dialogs (`select_account`) and clear on session termination or manual disconnection.
2. **Read-Only Scope Discipline:**
   - Enforce least-privilege scope: `https://www.googleapis.com/auth/drive.readonly`.
   - Never request write, delete, or management scopes unless explicitly instructed with an interactive confirmation tool.

---

## 🌐 Model Context Protocol (MCP) Standards

1. **Uniform Resource Addressing:**
   - All external assets must be represented as canonical MCP URIs:
     - Google Drive: `mcp://google-drive/<accountId>/<fileId>`
     - GitHub: `mcp://github/<owner>/<repo>/<ref>`
     - ArXiv: `mcp://arxiv/<paperId>`
     - Local Runtime: `mcp://electrobun/<schemaPath>`
2. **Tool Contract Integrity:**
   - When introducing new capabilities, register them as MCP tools in `docs/src/lib/mcpRegistry.ts`.
   - All tools must define strict JSON Schema inputs and descriptive docstrings for agent auto-discovery.
3. **Federation Over Duplication:**
   - Do not write point-to-point bespoke adapters for third-party databases. Extend via standard MCP Server endpoints (HTTP SSE or WebSocket).

---

## 🖥️ Non-Technical Frictionless UX Rules

1. **Zero CLI Requirement:**
   - End users must never be told to run terminal commands (`npm run`, `python script.py`, `curl`) to view output.
   - Provide visual UI action cards, automatic previews, or downloadable single-file HTML bundles (`exportStandaloneBundle`).
2. **Self-Describing Interfaces:**
   - Data visualizers must translate technical fields into human-readable ontology cards (Entities, Balancing Feedback, Reinforcing Leverage).
3. **Instant Preview & Fallback Archetypes:**
   - Offline or unauthenticated sessions must always provide interactive presets (e.g., Cybernetics VSM, 12 Leverage Points, Electrobun Architecture) so non-technical users can test immediate functionality without setup.

---

## 🧪 Verification & Tool Discipline

- Before committing changes:
  1. Validate types and syntax via `lint_applet` (`astro check`).
  2. Verify static build compilation via `compile_applet` (`astro build`).
  3. Ensure local dev server remains active on port 3000.
- Respect monorepo structure: Workspace packages reside in `/docs` while root orchestrates workspaces.
