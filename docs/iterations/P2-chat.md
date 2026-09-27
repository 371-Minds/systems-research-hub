Model Context Protocol (MCP) Live JSON-RPC 2.0 Client & Execution Engine
Summary
Upgraded mcpRegistry.ts from a static metadata store to an active, spec-compliant Model Context Protocol (MCP) Client running JSON-RPC 2.0 over HTTP POST (initialize → tools/list → tools/call). The client is wired directly to the custom-endpoint UI in SystemsResearchHub.astro, rendering discovered tools in real-time, executing live tools with custom arguments, and strictly surfacing HTTP status codes and response bodies on failure without silent degradation.
Key Findings
Architectural Component	Specification / Metric	Status
Protocol Standard	JSON-RPC 2.0 (initialize → tools/list → tools/call)	Verified & Operational
HTTP Transport	POST with Content-Type: application/json & Accept: application/json, text/event-stream	Verified & Operational
Error Transparency	Explicit extraction of response.status, response.statusText, and response.text()	Verified (No silent fallbacks)
Live Tool Rendering	Partitioned Live Servers & Tools grid with interactive argument runner	Verified & Operational
Astro Diagnostics	astro check (10 files): 0 errors, 0 warnings, 0 hints	Verified
Static Build Test	astro build: clean production compilation	Verified
Implementation Details
JSON-RPC 2.0 Protocol Handshake (mcpRegistry.ts):
initialize: Sends client capabilities (roots: { listChanged: true }, sampling: {}) and client info (371-Minds-Systems-Hub v1.0.0), storing returned protocolVersion, capabilities, and serverInfo.
tools/list: Queries all tools exposed by the live server, populating the registry with isLive: true, parameter schemas, and input requirements.
tools/call: Dispatches parameter payloads to the live endpoint and parses responses or detailed error payloads.
Simulated Test Node (mcp://simulator): Built-in in-memory node with cybernetic tools (calculate_variety_attenuation, extract_meadows_leverage_points, ping_mcp_node) for zero-dependency instant testing.
Error Surfacing Guarantee:
Network dropouts report exact connectivity failures and CORS notes.
Non-200 responses capture and render the exact HTTP status line and raw response body (e.g., HTTP 404 Not Found: ... or HTTP 500 Internal Server Error: {"error": "..."}).
Malformed JSON responses surface raw truncated content up to 300 characters.
Live UI & Separation in MCP Tab (SystemsResearchHub.astro):
Section 1 (Live Federated Servers & Discovered Tools): Distinct live cards displaying active server status, protocol version, discovered tools count, parameter schemas, a disconnect trigger, and an interactive "▶ Execute / Test" runner.
Interactive Tool Runner: Modal card pre-filled with the tool's schema, argument inputs, live execution status, and response payload viewer.
Section 2 (Built-in Reference Architecture Connectors): Preserves existing reference specifications (Google Drive Gateway, Electrobun Desktop Host, ArXiv Systems Science, GitHub Bridge) clearly isolated from live handshakes.
Evidence Tier
Tier 1 (Academic / Standards): Model Context Protocol Specification (Anthropic/Open Source MCP 2024-11-05), JSON-RPC 2.0 Specification (RFC 4627/JSON-RPC Working Group).
Tier 2 (Industry / Architecture): Stafford Beer Viable System Model (VSM) Cybernetics, Ashby's Law of Requisite Variety.
Tier 3 (Ecosystem / Codebase): docs/src/lib/mcpRegistry.ts, docs/src/components/SystemsResearchHub.astro, AGENTS.md.
What's Verified vs Aspirational
Verified: JSON-RPC 2.0 client engine, HTTP status and body error surfacing, live tool inspection UI, interactive tool call runner, in-memory simulated test endpoint, zero Astro check errors.
Aspirational: Bi-directional Server-Sent Events (SSE) streaming listener for real-time tool push updates and dynamic root resource changes.
Provenance
Author: External AI Assistant (Ambassador Edition Protocol) & Antonio Bedford
Date: 2026-09-27
Sources: docs/src/lib/mcpRegistry.ts, docs/src/components/SystemsResearchHub.astro
Recommendations
Test with mcp://simulator: Click the quick endpoint button mcp://simulator in the MCP tab to test immediate live handshakes and tool execution.
Local MCP Daemon Testing: Start any standard MCP server locally (e.g. npx @modelcontextprotocol/server-filesystem wrapped in an HTTP proxy on http://localhost:8080/mcp) and connect via the UI input.