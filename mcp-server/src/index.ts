import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { crypto } from "node:crypto";

const API_BASE_URL = process.env.REQST_API_URL || "https://reqst.xyz/v1";
const API_KEY = process.env.REQST_API_KEY || "";
const WEBHOOK_SECRET = process.env.REQST_WEBHOOK_SECRET || "";
const DOCS_BASE_URL = process.env.REQST_DOCS_URL || "https://reqst.xyz/en/docs";

const server = new Server(
  {
    name: "reqst-agent-mcp",
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
        uri: "reqst://docs/auth",
        name: "Authentication Guide",
        mimeType: "text/markdown",
        description: "How to authenticate with the Reqst API.",
      },
      {
        uri: "reqst://docs/invoices",
        name: "Invoices API Guide",
        mimeType: "text/markdown",
        description: "How to create and manage payment invoices.",
      },
      {
        uri: "reqst://docs/webhooks",
        name: "Webhook Integration Guide",
        mimeType: "text/markdown",
        description: "How to receive and verify webhooks from Reqst.",
      },
      {
        uri: "reqst://docs/errors",
        name: "Error Handling and Rate Limits",
        mimeType: "text/markdown",
        description: "Reqst API error codes and rate limit policies.",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  const slug = uri.replace("reqst://docs/", "");
  
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
        description: "Create a new payment invoice in Reqst.",
        inputSchema: {
          type: "object",
          properties: {
            amount: { type: "string", description: "Amount in decimal format (e.g. '10.50')" },
            currency: { type: "string", description: "Currency code (e.g. 'USD', 'EUR')" },
            description: { type: "string", description: "Optional invoice description" },
            metadata: { type: "object", description: "Optional custom metadata to store with the invoice" },
          },
          required: ["amount", "currency"],
        },
      },
      {
        name: "get_invoice",
        description: "Retrieve status and details of an existing Reqst invoice.",
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
        description: "Verify a webhook signature received from Reqst.",
        inputSchema: {
          type: "object",
          properties: {
            payload: { type: "object", description: "The full JSON body of the webhook request" },
            signature: { type: "string", description: "The value of the X-Reqst-Signature header" },
          },
          required: ["payload", "signature"],
        },
      },
      {
        name: "list_supported_networks",
        description: "List blockchain networks and assets currently supported by Reqst.",
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

  try {
    switch (name) {
      case "list_supported_networks": {
        return {
          content: [{ 
            type: "text", 
            text: "Reqst supports the following networks:\n- TON (Mainnet)\n- TRON (USDT TRC-20)\n- Solana (USDC/USDT)\n- Base (EVM)\n- Arbitrum One (EVM)\n- BSC (Binance Smart Chain)\n- Ethereum (Mainnet)" 
          }],
        };
      }
      case "verify_webhook": {
        if (!WEBHOOK_SECRET) {
          return {
            content: [{ type: "text", text: "Error: REQST_WEBHOOK_SECRET is not set. Verification cannot be performed." }],
            isError: true,
          };
        }
        const { payload, signature } = args as { payload: any; signature: string };
        const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
        hmac.update(JSON.stringify(payload));
        const expected = hmac.digest("hex");
        
        const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
        
        return {
          content: [{ type: "text", text: isValid ? "Signature is VALID" : "Signature is INVALID" }],
        };
      }
      case "create_invoice": {
        if (!API_KEY) throw new Error("API_KEY not set");
        const response = await fetch(`${API_BASE_URL}/invoices`, {
          method: "POST",
          headers,
          body: JSON.stringify(args),
        });
        const data = await response.json();
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          isError: !response.ok,
        };
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

/**
 * Start the server using stdio transport.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Reqst MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
