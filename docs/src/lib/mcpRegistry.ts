/**
 * Model Context Protocol (MCP) Client & Virtual Registry Engine
 *
 * Implements the standard JSON-RPC 2.0 / MCP schema for connecting
 * multiple external resources, tools, and context servers (Google Drive, GitHub,
 * Notion, ArXiv, Postgres, Custom Microservices).
 */

export interface McpServerInfo {
  name: string;
  version?: string;
}

export interface McpServerConfig {
  id: string;
  name: string;
  type: "google-drive" | "github" | "filesystem" | "arxiv" | "custom";
  status: "connected" | "connecting" | "disconnected" | "error";
  endpointUrl?: string;
  icon: string;
  description: string;
  resourcesCount: number;
  toolsCount: number;
  promptsCount: number;
  isLive?: boolean;
  serverInfo?: McpServerInfo;
  protocolVersion?: string;
  lastHandshakeTime?: string;
  lastError?: string;
}

export interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  serverId: string;
  metadata?: Record<string, any>;
}

export interface McpTool {
  name: string;
  description: string;
  serverId: string;
  isLive?: boolean;
  inputSchema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

export interface McpPrompt {
  name: string;
  description: string;
  serverId: string;
  arguments?: Array<{ name: string; description?: string; required?: boolean }>;
}

export interface McpInitializeResult {
  protocolVersion: string;
  capabilities: Record<string, any>;
  serverInfo: McpServerInfo;
  instructions?: string;
}

export interface McpToolsListResult {
  tools: Array<{
    name: string;
    description?: string;
    inputSchema: {
      type: string;
      properties?: Record<string, any>;
      required?: string[];
    };
  }>;
  nextCursor?: string;
}

export interface McpToolCallResult {
  content: Array<{
    type: string;
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

/**
 * Standard JSON-RPC 2.0 client for Model Context Protocol over HTTP POST
 */
export class McpClient {
  public readonly endpointUrl: string;
  private requestId = 1;

  constructor(endpointUrl: string) {
    this.endpointUrl = endpointUrl;
  }

  public async request<T = any>(method: string, params: Record<string, any> = {}): Promise<T> {
    // Check for simulated local lab endpoint for instant test without external servers
    if (this.endpointUrl === "mcp://simulator" || this.endpointUrl === "local://systems-lab") {
      return this.handleSimulatedRpc<T>(method, params);
    }

    const id = this.requestId++;
    const payload = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    let response: Response;
    try {
      response = await fetch(this.endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
        },
        body: JSON.stringify(payload),
      });
    } catch (networkErr: any) {
      const errMsg = networkErr?.message || String(networkErr);
      throw new Error(
        `Network failure connecting to "${this.endpointUrl}": ${errMsg}. (Verify the endpoint is reachable and CORS headers permit client-side POST requests).`
      );
    }

    // Surface actual HTTP status and response body on failure
    if (!response.ok) {
      const bodyText = await response.text().catch(() => "");
      const trimmedBody = bodyText.trim();
      throw new Error(
        `HTTP ${response.status} ${response.statusText || ""}: ${trimmedBody || "(empty response body)"}`
      );
    }

    const rawText = await response.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      // Check for Server-Sent Events data: lines
      const dataLine = rawText.split("\n").find((l) => l.trim().startsWith("data:"));
      if (dataLine) {
        try {
          data = JSON.parse(dataLine.replace(/^data:\s*/, ""));
        } catch {
          throw new Error(`HTTP 200 OK but invalid JSON response body: ${rawText.slice(0, 300)}`);
        }
      } else {
        throw new Error(`HTTP 200 OK but invalid JSON response body: ${rawText.slice(0, 300)}`);
      }
    }

    if (data.error) {
      const details = data.error.data
        ? ` — ${typeof data.error.data === "object" ? JSON.stringify(data.error.data) : data.error.data}`
        : "";
      throw new Error(`JSON-RPC Error [code ${data.error.code}]: ${data.error.message}${details}`);
    }

    return data.result as T;
  }

  public async initialize(): Promise<McpInitializeResult> {
    const result = await this.request<McpInitializeResult>("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {
        roots: { listChanged: true },
        sampling: {},
      },
      clientInfo: {
        name: "371-Minds-Systems-Hub",
        version: "1.0.0",
      },
    });

    // Optional notification acknowledging initialization
    try {
      if (!this.endpointUrl.startsWith("mcp://") && !this.endpointUrl.startsWith("local://")) {
        await fetch(this.endpointUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "notifications/initialized",
            params: {},
          }),
        }).catch(() => {});
      }
    } catch {
      // notifications do not require response
    }

    return result;
  }

  public async listTools(): Promise<McpToolsListResult> {
    return await this.request<McpToolsListResult>("tools/list", {});
  }

  public async callTool(name: string, args: Record<string, any> = {}): Promise<McpToolCallResult> {
    return await this.request<McpToolCallResult>("tools/call", {
      name,
      arguments: args,
    });
  }

  private async handleSimulatedRpc<T>(method: string, params: Record<string, any>): Promise<T> {
    await new Promise((r) => setTimeout(r, 120)); // slight latency simulation
    if (method === "initialize") {
      return {
        protocolVersion: "2024-11-05",
        capabilities: { tools: { listChanged: true } },
        serverInfo: {
          name: "Cybernetics Systemic Lab MCP",
          version: "2.4.0",
        },
        instructions: "Simulated in-memory Model Context Protocol node for testing systems research tools.",
      } as T;
    }

    if (method === "tools/list") {
      return {
        tools: [
          {
            name: "calculate_variety_attenuation",
            description: "Applies Ashby's Law of Requisite Variety to calculate system regulatory capacity and balance feedback loops.",
            inputSchema: {
              type: "object",
              properties: {
                operationalVariety: { type: "number", description: "Number of operational states (e.g. 100)" },
                regulatoryVariety: { type: "number", description: "Number of regulator responses (e.g. 85)" },
              },
              required: ["operationalVariety", "regulatoryVariety"],
            },
          },
          {
            name: "extract_meadows_leverage_points",
            description: "Identifies system intervention points ordered by increasing systemic leverage (1 to 12).",
            inputSchema: {
              type: "object",
              properties: {
                systemContext: { type: "string", description: "Description of the system or organization" },
                targetLoop: { type: "string", description: "Balancing (B1) or reinforcing (R1) loop ID" },
              },
              required: ["systemContext"],
            },
          },
          {
            name: "ping_mcp_node",
            description: "Performs diagnostic latency and heartbeat probe against active cybernetic node.",
            inputSchema: {
              type: "object",
              properties: {
                nonce: { type: "string", description: "Arbitrary diagnostic token" },
              },
            },
          },
        ],
      } as T;
    }

    if (method === "tools/call") {
      const toolName = params.name;
      const args = params.arguments || {};
      if (toolName === "calculate_variety_attenuation") {
        const op = Number(args.operationalVariety || 100);
        const reg = Number(args.regulatoryVariety || 10);
        const ratio = (reg / op).toFixed(2);
        const balanced = reg >= op;
        return {
          content: [
            {
              type: "text",
              text: `Ashby's Law Variety Analysis:\n- Operational Variety (Vo): ${op}\n- Regulatory Variety (Vr): ${reg}\n- Attenuation Ratio (Vr/Vo): ${ratio}\n- State: ${balanced ? "Equilibrium Achieved (Requisite Variety Present)" : "Variety Deficit — System Subject to External Overload & Cognitive Friction"}`,
            },
          ],
        } as T;
      }

      if (toolName === "extract_meadows_leverage_points") {
        return {
          content: [
            {
              type: "text",
              text: `Identified Meadows Leverage Points for "${args.systemContext || "Metasystem"}":\n- #12: Parameters & buffer sizes (Low leverage)\n- #6: Structure of information flows (High leverage: Non-tech zero-CLI)\n- #3: Goals of the system (Critical: Sovereign, non-extractive access)\n- #1: Mindset/paradigm out of which the system arises (Supreme leverage point)`,
            },
          ],
        } as T;
      }

      return {
        content: [
          {
            type: "text",
            text: `Pong from ${toolName}! Arguments received: ${JSON.stringify(args)} at ${new Date().toISOString()}`,
          },
        ],
      } as T;
    }

    throw new Error(`Method "${method}" not implemented on simulated endpoint`);
  }
}

export class McpRegistry {
  private servers: Map<string, McpServerConfig> = new Map();
  private resources: Map<string, McpResource> = new Map();
  private tools: Map<string, McpTool> = new Map();
  private prompts: Map<string, McpPrompt> = new Map();
  private clients: Map<string, McpClient> = new Map();

  constructor() {
    this.seedDefaultMcpConnectors();
  }

  private seedDefaultMcpConnectors() {
    // Built-in MCP Hub Connectors (Reference Architecture)
    this.registerServer({
      id: "mcp-drive-primary",
      name: "Google Drive MCP Gateway",
      type: "google-drive",
      status: "connected",
      icon: "📁",
      description: "MCP Server providing resource URIs and document streaming from connected Google Drive accounts.",
      resourcesCount: 0,
      toolsCount: 2,
      promptsCount: 2,
      isLive: false,
    });

    this.registerServer({
      id: "mcp-electrobun-runtime",
      name: "Electrobun Desktop Host MCP",
      type: "filesystem",
      status: "connected",
      icon: "⚡",
      description: "Direct RPC bridge for native windowing, Cottontail micro-runtime bundles, and cross-platform desktop integration.",
      resourcesCount: 14,
      toolsCount: 2,
      promptsCount: 4,
      isLive: false,
    });

    this.registerServer({
      id: "mcp-arxiv-openaccess",
      name: "ArXiv Systems Science MCP",
      type: "arxiv",
      status: "connected",
      icon: "📚",
      description: "Queries open-access systems theory papers, cybernetic preprints, and complex systems literature.",
      resourcesCount: 3500,
      toolsCount: 1,
      promptsCount: 3,
      isLive: false,
    });

    this.registerServer({
      id: "mcp-github-integration",
      name: "GitHub Metasystem Bridge",
      type: "github",
      status: "connected",
      icon: "🐙",
      description: "Bi-directional repository sync, commit logs, release artifacts, and automated workflow triggers.",
      resourcesCount: 24,
      toolsCount: 1,
      promptsCount: 2,
      isLive: false,
    });

    // Register reference built-in tools
    this.registerTool({
      serverId: "mcp-drive-primary",
      name: "drive_read_resource",
      description: "Fetch and normalize content from any authenticated Google Drive URI (mcp://google-drive/<account>/<fileId>)",
      isLive: false,
      inputSchema: {
        type: "object",
        properties: {
          uri: { type: "string", description: "The canonical MCP resource URI" },
        },
        required: ["uri"],
      },
    });

    this.registerTool({
      serverId: "mcp-drive-primary",
      name: "drive_search_files",
      description: "Queries metadata and contents across connected Google Drive repositories",
      isLive: false,
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query string" },
        },
        required: ["query"],
      },
    });

    this.registerTool({
      serverId: "mcp-electrobun-runtime",
      name: "package_frictionless_bundle",
      description: "Compiles active systems models and drive research into an autonomous zero-CLI desktop/web package",
      isLive: false,
      inputSchema: {
        type: "object",
        properties: {
          target: { type: "string", enum: ["html-single", "electrobun-macos", "electrobun-windows", "electrobun-linux"] },
          modelPayload: { type: "object" },
        },
        required: ["target"],
      },
    });

    this.registerTool({
      serverId: "mcp-electrobun-runtime",
      name: "create_native_window",
      description: "Instructs host Electrobun runtime to instantiate an isolated native window view",
      isLive: false,
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          width: { type: "number" },
          height: { type: "number" },
        },
        required: ["title"],
      },
    });

    this.registerTool({
      serverId: "mcp-arxiv-openaccess",
      name: "query_systems_papers",
      description: "Semantic search across systems theory, Ashby's Law, cybernetics, and causal loop models",
      isLive: false,
      inputSchema: {
        type: "object",
        properties: {
          topic: { type: "string" },
        },
        required: ["topic"],
      },
    });

    this.registerTool({
      serverId: "mcp-github-integration",
      name: "fetch_repo_manifest",
      description: "Retrieves repository manifests, release builds, and workflow configurations",
      isLive: false,
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
        },
        required: ["owner", "repo"],
      },
    });
  }

  /**
   * Connects to a real MCP server endpoint via HTTP POST JSON-RPC 2.0
   * Protocol sequence: initialize -> tools/list
   */
  public async connect(endpointUrl: string): Promise<{
    server: McpServerConfig;
    tools: McpTool[];
    serverInfo: McpServerInfo;
  }> {
    const trimmedUrl = endpointUrl.trim();
    if (!trimmedUrl) {
      throw new Error("Endpoint URL is required");
    }

    if (
      !trimmedUrl.startsWith("http://") &&
      !trimmedUrl.startsWith("https://") &&
      !trimmedUrl.startsWith("mcp://") &&
      !trimmedUrl.startsWith("local://")
    ) {
      throw new Error(`Invalid URL scheme for "${trimmedUrl}". Must begin with http://, https://, or mcp://`);
    }

    const client = new McpClient(trimmedUrl);

    // 1. Handshake: initialize
    const initResult = await client.initialize();
    const serverInfo: McpServerInfo = initResult.serverInfo || {
      name: trimmedUrl,
      version: "1.0.0",
    };

    let hostDisplay = trimmedUrl;
    try {
      hostDisplay = new URL(trimmedUrl).hostname || trimmedUrl;
    } catch {
      // url fallback
    }

    const serverId = `mcp-live-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 2. Discover tools: tools/list
    let liveTools: McpTool[] = [];
    try {
      const toolsResult = await client.listTools();
      if (toolsResult && Array.isArray(toolsResult.tools)) {
        liveTools = toolsResult.tools.map((t) => ({
          name: t.name,
          description: t.description || "No description provided",
          serverId,
          isLive: true,
          inputSchema: t.inputSchema || { type: "object", properties: {} },
        }));
      }
    } catch (toolListErr: any) {
      throw new Error(`tools/list failed after initialize: ${toolListErr.message || String(toolListErr)}`);
    }

    const serverConfig: McpServerConfig = {
      id: serverId,
      name: serverInfo.name || `Live MCP (${hostDisplay})`,
      type: "custom",
      status: "connected",
      endpointUrl: trimmedUrl,
      icon: "🔌",
      description: `Live MCP Server (${serverInfo.name} v${serverInfo.version || "1.0"}) connected via JSON-RPC 2.0 at ${trimmedUrl}`,
      resourcesCount: 0,
      toolsCount: liveTools.length,
      promptsCount: 0,
      isLive: true,
      serverInfo,
      protocolVersion: initResult.protocolVersion || "2024-11-05",
      lastHandshakeTime: new Date().toLocaleTimeString(),
    };

    this.registerServer(serverConfig);
    this.clients.set(serverId, client);
    liveTools.forEach((t) => this.registerTool(t));

    return { server: serverConfig, tools: liveTools, serverInfo };
  }

  /**
   * Calls a live tool on a registered server using real JSON-RPC 2.0 tools/call
   */
  public async callTool(serverId: string, toolName: string, args: Record<string, any> = {}): Promise<McpToolCallResult> {
    const client = this.clients.get(serverId);
    if (!client) {
      throw new Error(`No active live MCP client session found for server "${serverId}". (Built-in placeholders cannot be called over HTTP).`);
    }
    return await client.callTool(toolName, args);
  }

  public disconnect(serverId: string): boolean {
    const server = this.servers.get(serverId);
    if (!server) return false;

    this.servers.delete(serverId);
    this.clients.delete(serverId);

    // Remove tools associated with this server
    for (const [key, tool] of this.tools.entries()) {
      if (tool.serverId === serverId) {
        this.tools.delete(key);
      }
    }

    return true;
  }

  public registerServer(config: McpServerConfig) {
    this.servers.set(config.id, config);
  }

  public registerResource(resource: McpResource) {
    this.resources.set(resource.uri, resource);
    const server = this.servers.get(resource.serverId);
    if (server) server.resourcesCount = this.getResourcesByServer(resource.serverId).length;
  }

  public registerTool(tool: McpTool) {
    this.tools.set(`${tool.serverId}:${tool.name}`, tool);
    const server = this.servers.get(tool.serverId);
    if (server) server.toolsCount = this.getToolsByServer(tool.serverId).length;
  }

  public getServers(): McpServerConfig[] {
    return Array.from(this.servers.values());
  }

  public getLiveServers(): McpServerConfig[] {
    return Array.from(this.servers.values()).filter((s) => s.isLive);
  }

  public getBuiltInServers(): McpServerConfig[] {
    return Array.from(this.servers.values()).filter((s) => !s.isLive);
  }

  public getResources(): McpResource[] {
    return Array.from(this.resources.values());
  }

  public getResourcesByServer(serverId: string): McpResource[] {
    return Array.from(this.resources.values()).filter((r) => r.serverId === serverId);
  }

  public getTools(): McpTool[] {
    return Array.from(this.tools.values());
  }

  public getToolsByServer(serverId: string): McpTool[] {
    return Array.from(this.tools.values()).filter((t) => t.serverId === serverId);
  }

  public getLiveTools(): McpTool[] {
    return Array.from(this.tools.values()).filter((t) => t.isLive);
  }

  public getBuiltInTools(): McpTool[] {
    return Array.from(this.tools.values()).filter((t) => !t.isLive);
  }

  public registerPrompt(prompt: McpPrompt) {
    this.prompts.set(`${prompt.serverId}:${prompt.name}`, prompt);
    const server = this.servers.get(prompt.serverId);
    if (server) server.promptsCount = this.getPromptsByServer(prompt.serverId).length;
  }

  public getPrompts(): McpPrompt[] {
    return Array.from(this.prompts.values());
  }

  public getPromptsByServer(serverId: string): McpPrompt[] {
    return Array.from(this.prompts.values()).filter((p) => p.serverId === serverId);
  }

  /**
   * Translates Google Drive files into universal MCP standard resource representations
   */
  public syncDriveFilesToMcp(files: any[], accountLabel: string, accountId: string) {
    files.forEach((f) => {
      const uri = `mcp://google-drive/${encodeURIComponent(accountId)}/${f.id}`;
      this.registerResource({
        uri,
        name: f.name,
        description: `Ingested from ${accountLabel} (${f.sourceAccountEmail || "Google Drive"})`,
        mimeType: f.mimeType,
        serverId: "mcp-drive-primary",
        metadata: {
          fileId: f.id,
          webViewLink: f.webViewLink,
          modifiedTime: f.modifiedTime,
          sourceAccountLabel: accountLabel,
        },
      });
    });
  }
}

export const mcpRegistry = new McpRegistry();

