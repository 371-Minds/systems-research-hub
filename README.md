# Systems Scientist Research Hub & Electrobun Metasystem

A unified cybernetic workbench combining **Electrobun's ultra-lightweight desktop runtime** with a **Metasystemic Research Ingestion Engine**. Seamlessly federates across **multiple Google Drive accounts** and external data providers via the **Model Context Protocol (MCP)**, providing feedback loop modeling and 1-click frictionless deployment pipelines for non-technical users.

---

## 🌟 Core Architecture & Capabilities

### 1. Multi-Drive Federated Ingestion
- **Multi-Tenant Authentication:** Connect multiple Google Drive accounts simultaneously (Personal, Research Lab, Enterprise).
- **In-Memory Token Lifecycle:** Client-side OAuth with ephemeral memory storage. Zero credential persistence or server-side leakage.
- **Universal Search & Filtering:** Filter across all connected drives by mime types (Google Docs, PDFs, Sheets, Code, Ontologies).
- **Document Inspector & Ontology Extractor:** Deep document content inspection with instant extraction of causal relationships and cybernetic feedback dynamics.

### 2. Model Context Protocol (MCP) Gateway
- **Standardized Resource Addressing:** Exposes documents and files as canonical MCP URIs (`mcp://google-drive/<account>/<fileId>`).
- **Pre-Configured MCP Connectors:**
  - **Google Drive MCP Gateway:** Resource streams across authenticated accounts.
  - **Electrobun Desktop Host MCP:** Bridges windowing, micro-runtime bundles, and native cross-platform IPC.
  - **ArXiv Systems Science MCP:** Ingests systems dynamics, cybernetics, and complex adaptive systems preprints.
  - **GitHub Metasystem Bridge:** Tracks repository states, releases, and workflow automations.
- **Custom MCP Server Integration:** Dynamic SSE / WebSocket connector for attaching custom team MCP servers (Notion, Obsidian, PostgreSQL, microservices).

### 3. Cybernetic Causal Loop Simulation Engine
- **Stafford Beer's Viable System Model (VSM):** System 1 through System 5 layered architecture.
- **Balancing (B1) & Reinforcing (R1) Loops:** Dynamic tracking of cognitive load damping versus adoption rate acceleration.
- **Real-Time Interactive Canvas:** HTML5 Canvas particle simulation with live parameter adjustment:
  - *UI Abstraction Level* (Zero-CLI factor)
  - *Feedback Velocity*
  - *Cognitive Friction Damping Factor*
- **Continuous Metrics Charting:** Real-time Euler integration plots tracking Adoption Rate, Systemic Coherence, and Cognitive Load.

### 4. Zero-Friction Non-Tech Deployment
- **1-Click HTML Bundle Exporter:** Generates self-contained, zero-dependency interactive bundles runnable in any browser without installation or CLI configuration.
- **Autonomous Deployment Manifests:** Generates standardized `metasystem-mcp-deploy.json` configurations ready for automated CI/CD.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+) or Bun runtime
- Modern web browser (Chrome, Edge, Safari, Firefox)

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/371-minds/systems-scientist-hub.git
cd systems-scientist-hub

# Install workspace dependencies
npm install

# Start local development server on port 3000
npm run dev
```

Visit `http://localhost:3000` or navigate directly to the workbench at `/systems-research-hub/`.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | [Astro](https://astro.build/) & [Starlight](https://starlight.astro.build/) |
| **Desktop Runtime** | [Electrobun](https://framework.blackboard.sh/electrobun/) (Cottontail & System WebViews) |
| **Authentication** | Google Workspace OAuth 2.0 (Client-side ephemeral) & Firebase Auth |
| **Protocol** | Model Context Protocol (MCP) JSON-RPC 2.0 Schema |
| **Visual Simulation** | HTML5 Canvas 2D Dynamic Physics Engine |
| **Language** | TypeScript |

---

## 📁 Repository Structure

```
├── docs/
│   ├── src/
│   │   ├── components/
│   │   │   └── SystemsResearchHub.astro   # Main research hub & simulation workbench
│   │   ├── lib/
│   │   │   ├── driveAuth.ts               # Multi-Drive ephemeral OAuth manager
│   │   │   ├── driveApi.ts                # Federated Google Drive v3 client
│   │   │   └── mcpRegistry.ts             # Model Context Protocol registry & gateway
│   │   └── content/docs/
│   │       ├── systems-research-hub.mdx   # Standalone Research Hub route
│   │       ├── index.mdx                  # Landing page & integrated hub
│   │       └── electrobun/                # Electrobun desktop runtime guides & APIs
│   ├── astro.config.mjs                   # Astro & Starlight configuration
│   └── package.json                       # Documentation workspace packages
├── package.json                           # Root monorepo workspace manifest
├── AGENTS.md                              # AI Agent & Metasystemic architectural directives
└── README.md                              # Project documentation
```

---

## 📄 License
MIT License. Built for seamless research ingestion and zero-friction adoption across technical and non-technical stakeholders.

---

## 371-OS Iteration History

This build is the AI-Studio-developed Systems Research Hub, adopted into 371-OS.
Iteration receipts (verification tables per session) live in `docs/iterations/` —
P1: Adaptive Cognitive UI (CognitiveStateEngine, 5 modes, consent-gated) · P2–P4:
subsequent supercharge passes. License: Apache-2.0. Maintained under the
[371-Minds](https://github.com/371-Minds) org.
