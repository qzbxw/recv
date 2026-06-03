import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createHmac, timingSafeEqual } from "node:crypto";

const API_BASE_URL = process.env.RECV_API_URL || "https://recv.money/v1";
const API_KEY = process.env.RECV_API_KEY || "";
const ACCESS_TOKEN = process.env.RECV_ACCESS_TOKEN || "";
const WEBHOOK_SECRET = process.env.RECV_WEBHOOK_SECRET || "";
const DOCS_BASE_URL = process.env.RECV_DOCS_URL || "https://recv.money/en/docs";
const APP_BASE_URL = process.env.RECV_APP_URL || deriveAppBaseUrl(API_BASE_URL);

const server = new Server(
  {
    name: "recv-agent-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

/**
 * Resources: Provide static or dynamic documentation to the agent.
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "recv://docs/auth",
        name: "Authentication Guide",
        mimeType: "text/markdown",
        description: "How to authenticate with the recv API.",
      },
      {
        uri: "recv://docs/invoices",
        name: "Invoices API Guide",
        mimeType: "text/markdown",
        description: "How to create and manage payment invoices.",
      },
      {
        uri: "recv://docs/webhooks",
        name: "Webhook Integration Guide",
        mimeType: "text/markdown",
        description: "How to receive and verify webhooks from recv.",
      },
      {
        uri: "recv://docs/errors",
        name: "Error Handling and Rate Limits",
        mimeType: "text/markdown",
        description: "recv API error codes and rate limit policies.",
      },
      {
        uri: "recv://docs/mcp",
        name: "MCP Agent Guide",
        mimeType: "text/markdown",
        description: "How AI agents onboard, buy a plan, and use recv through MCP.",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  const slug = uri.replace("recv://docs/", "");
  
  try {
    const response = await fetch(`${DOCS_BASE_URL}/raw/${slug}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch doc: ${response.status}`);
    }
    const text = await response.text();
    
    return {
      contents: [
        {
          uri,
          mimeType: "text/markdown",
          text,
        },
      ],
    };
  } catch (error) {
    console.error(`Resource ${uri} failed:`, error);
    throw new Error(`Resource not found or unavailable: ${uri}`);
  }
});

/**
 * Tools: Actionable capabilities for the agent.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_invoice",
        description: "Create a new payment invoice in recv. The amount is always priced in USD and converted to the payable crypto network.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Human-readable title shown to the payer (e.g. 'Order #1290')" },
            base_amount_usd: { type: "string", description: "Amount in USD as a decimal string (e.g. '10.50')" },
            payable_network: {
              type: "string",
              description: "Network the customer pays on. One of: TON, TON_USDT, TRON, BASE, BSC.",
              enum: ["TON", "TON_USDT", "TRON", "BASE", "BSC"],
            },
            expires_in_minutes: { type: "number", description: "Optional invoice lifetime in minutes (default 30)" },
          },
          required: ["title", "base_amount_usd", "payable_network"],
        },
      },
      {
        name: "get_account",
        description: "Return the authenticated recv console account, workspace, active plan, and available paid plans. Requires RECV_ACCESS_TOKEN.",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "bootstrap_agent_workspace",
        description: "Create a new recv trial workspace for an autonomous agent and return a console access token. Use the returned token as RECV_ACCESS_TOKEN, then buy a Developer or Business subscription.",
        inputSchema: {
          type: "object",
          properties: {
            workspace_name: { type: "string", description: "Optional short workspace label used in the generated workspace slug" },
            contact_email: { type: "string", description: "Optional owner/contact email for receipts and support" },
          },
        },
      },
      {
        name: "create_subscription_checkout",
        description: "Create a recv plan checkout for this workspace. Use this for self-service onboarding or upgrades before API keys exist. Requires RECV_ACCESS_TOKEN. For AI agents that need to accept payments, choose developer or business because merchant does not include API keys.",
        inputSchema: {
          type: "object",
          properties: {
            plan_code: {
              type: "string",
              description: "Plan to buy. merchant is checkout-only; developer and business include API keys and webhooks.",
              enum: ["merchant", "developer", "business"],
            },
            payable_network: {
              type: "string",
              description: "Network used to pay recv for the subscription. One of: TON, TON_USDT, TRON, BASE, BSC.",
              enum: ["TON", "TON_USDT", "TRON", "BASE", "BSC"],
            },
          },
          required: ["plan_code", "payable_network"],
        },
      },
      {
        name: "get_checkout_invoice",
        description: "Read any public recv checkout invoice by public_id. Useful for polling a subscription checkout until it becomes paid.",
        inputSchema: {
          type: "object",
          properties: {
            public_id: { type: "string", description: "Public checkout invoice ID, for example RQST-9N2QK7" },
          },
          required: ["public_id"],
        },
      },
      {
        name: "create_api_key",
        description: "Create a developer API key for the authenticated workspace after a Developer or Business subscription is active. Requires RECV_ACCESS_TOKEN.",
        inputSchema: {
          type: "object",
          properties: {
            label: { type: "string", description: "Human-readable key label" },
            environment: { type: "string", description: "Key environment", enum: ["live", "test"] },
            scopes: {
              type: "array",
              items: { type: "string", enum: ["invoices:read", "invoices:write"] },
              description: "Optional scopes. Defaults to invoices:read and invoices:write.",
            },
          },
        },
      },
      {
        name: "create_webhook_endpoint",
        description: "Create a webhook endpoint for invoice and subscription events. Requires RECV_ACCESS_TOKEN and an active plan with webhooks.",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "HTTPS webhook URL that receives recv events" },
            label: { type: "string", description: "Human-readable endpoint label" },
            environment: { type: "string", description: "Endpoint environment", enum: ["live", "test"] },
          },
          required: ["url"],
        },
      },
      {
        name: "get_invoice",
        description: "Retrieve status and details of an existing recv invoice.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "The unique invoice ID" },
          },
          required: ["id"],
        },
      },
      {
        name: "list_invoices",
        description: "List recent invoices with pagination.",
        inputSchema: {
          type: "object",
          properties: {
            page: { type: "number", description: "Page number (default 1)" },
            page_size: { type: "number", description: "Page size (default 20, max 100)" },
          },
        },
      },
      {
        name: "simulate_payment",
        description: "Simulate a payment for an invoice (Test Mode only).",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "The unique invoice ID" },
          },
          required: ["id"],
        },
      },
      {
        name: "verify_webhook",
        description: "Verify a recv webhook signature. Pass the RAW request body string exactly as received (do not re-serialize), the X-recv-Timestamp header, and the X-recv-Signature header.",
        inputSchema: {
          type: "object",
          properties: {
            raw_body: { type: "string", description: "The raw, unparsed request body string exactly as received" },
            timestamp: { type: "string", description: "The value of the X-recv-Timestamp header" },
            signature: { type: "string", description: "The value of the X-recv-Signature header (e.g. 'v1=abc...')" },
          },
          required: ["raw_body", "timestamp", "signature"],
        },
      },
      {
        name: "list_supported_networks",
        description: "List blockchain networks and assets currently supported by recv.",
        inputSchema: { type: "object", properties: {} },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json",
  };
  const consoleHeaders = {
    "Authorization": `Bearer ${ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };

  try {
    switch (name) {
      case "list_supported_networks": {
        return {
          content: [{ 
            type: "text", 
            text: "recv supports the following payable_network values:\n- TON — native TON\n- TON_USDT — USDT on TON\n- TRON — USDT TRC-20\n- BASE — USDC/USDT on Base\n- BSC — USDT on BNB Smart Chain"
          }],
        };
      }
      case "verify_webhook": {
        if (!WEBHOOK_SECRET) {
          return {
            content: [{ type: "text", text: "Error: RECV_WEBHOOK_SECRET is not set. Verification cannot be performed." }],
            isError: true,
          };
        }
        const { raw_body, timestamp, signature } = args as { raw_body: string; timestamp: string; signature: string };
        // recv signs: "v1=" + HMAC_SHA256(secret, `${timestamp}.${rawBody}`)
        const hmac = createHmac("sha256", WEBHOOK_SECRET.trim());
        hmac.update(timestamp);
        hmac.update(".");
        hmac.update(raw_body);
        const expected = "v1=" + hmac.digest("hex");

        const provided = String(signature || "");
        const isValid =
          provided.length === expected.length &&
          timingSafeEqual(Buffer.from(provided), Buffer.from(expected));

        return {
          content: [{ type: "text", text: isValid ? "Signature is VALID" : "Signature is INVALID" }],
        };
      }
      case "create_invoice": {
        if (!API_KEY) throw new Error("API_KEY not set");
        const { title, base_amount_usd, payable_network, expires_in_minutes } = (args as any) || {};
        const body: Record<string, unknown> = {
          title,
          base_amount_usd,
          payable_network: String(payable_network || "").toUpperCase(),
        };
        if (expires_in_minutes != null) body.expires_in_minutes = expires_in_minutes;
        const response = await fetch(`${API_BASE_URL}/invoices`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        const data = await response.json();
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          isError: !response.ok,
        };
      }
      case "get_account": {
        if (!ACCESS_TOKEN) throw new Error("RECV_ACCESS_TOKEN not set");
        const response = await fetch(appApiUrl("/api/me"), { headers: consoleHeaders });
        const data = await response.json();
        return jsonToolResult(data, response.ok);
      }
      case "bootstrap_agent_workspace": {
        const { workspace_name = "", contact_email = "" } = (args as any) || {};
        const response = await fetch(appApiUrl("/api/auth/agent/bootstrap"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspace_name, contact_email }),
        });
        const data = await response.json();
        return jsonToolResult(data, response.ok);
      }
      case "create_subscription_checkout": {
        if (!ACCESS_TOKEN) throw new Error("RECV_ACCESS_TOKEN not set");
        const { plan_code = "developer", payable_network = "TRON" } = (args as any) || {};
        const response = await fetch(appApiUrl("/api/billing/checkout"), {
          method: "POST",
          headers: consoleHeaders,
          body: JSON.stringify({
            plan_code: String(plan_code || "developer").toLowerCase(),
            payable_network: String(payable_network || "TRON").toUpperCase(),
          }),
        });
        const data: any = await response.json();
        if (data && typeof data.checkout_url === "string" && data.checkout_url.startsWith("/")) {
          data.checkout_url = `${APP_BASE_URL}${data.checkout_url}`;
        }
        return jsonToolResult(data, response.ok);
      }
      case "get_checkout_invoice": {
        const { public_id } = args as { public_id: string };
        const response = await fetch(appApiUrl(`/api/public/invoices/${encodeURIComponent(public_id)}`));
        const data: any = await response.json();
        if (data && typeof data.checkout_url === "string" && data.checkout_url.startsWith("/")) {
          data.checkout_url = `${APP_BASE_URL}${data.checkout_url}`;
        }
        return jsonToolResult(data, response.ok);
      }
      case "create_api_key": {
        if (!ACCESS_TOKEN) throw new Error("RECV_ACCESS_TOKEN not set");
        const { label = "recv MCP agent", environment = "live", scopes } = (args as any) || {};
        const response = await fetch(appApiUrl("/api/developer/api-keys"), {
          method: "POST",
          headers: consoleHeaders,
          body: JSON.stringify({
            label,
            environment,
            scopes: Array.isArray(scopes) && scopes.length > 0 ? scopes : ["invoices:read", "invoices:write"],
          }),
        });
        const data = await response.json();
        return jsonToolResult(data, response.ok);
      }
      case "create_webhook_endpoint": {
        if (!ACCESS_TOKEN) throw new Error("RECV_ACCESS_TOKEN not set");
        const { url, label = "recv MCP webhook", environment = "live" } = (args as any) || {};
        const response = await fetch(appApiUrl("/api/developer/webhooks"), {
          method: "POST",
          headers: consoleHeaders,
          body: JSON.stringify({ url, label, environment }),
        });
        const data = await response.json();
        return jsonToolResult(data, response.ok);
      }
      case "get_invoice": {
        if (!API_KEY) throw new Error("API_KEY not set");
        const { id } = args as { id: string };
        const response = await fetch(`${API_BASE_URL}/invoices/${id}`, { headers });
        const data = await response.json();
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          isError: !response.ok,
        };
      }
      case "list_invoices": {
        if (!API_KEY) throw new Error("API_KEY not set");
        const { page = 1, page_size = 20 } = (args as any) || {};
        const response = await fetch(`${API_BASE_URL}/invoices?page=${page}&page_size=${page_size}`, { headers });
        const data = await response.json();
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          isError: !response.ok,
        };
      }
      case "simulate_payment": {
        if (!API_KEY) throw new Error("API_KEY not set");
        const { id } = args as { id: string };
        const response = await fetch(`${API_BASE_URL}/test/invoices/${id}/simulate-payment`, {
          method: "POST",
          headers,
        });
        const data = await response.json();
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          isError: !response.ok,
        };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Action failed: ${error.message}` }],
      isError: true,
    };
  }
});

function deriveAppBaseUrl(apiBaseUrl: string) {
  const trimmed = apiBaseUrl.replace(/\/+$/, "");
  if (trimmed.endsWith("/v1")) {
    return trimmed.slice(0, -3);
  }
  return trimmed;
}

function appApiUrl(path: string) {
  return `${APP_BASE_URL}${path}`;
}

function jsonToolResult(data: unknown, ok: boolean) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    isError: !ok,
  };
}

/**
 * Start the server using stdio transport.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("recv MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
