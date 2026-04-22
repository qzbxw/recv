# Reqst MCP Server

Model Context Protocol (MCP) server for integrating Reqst Payment Gateway into AI agents (Claude, Cursor, etc.).

## Features

### Tools
- `create_invoice`: Create payment requests.
- `get_invoice`: Check payment status.
- `list_invoices`: View recent activity.
- `verify_webhook`: Securely validate incoming notifications.
- `list_supported_networks`: Check supported blockchains.
- `simulate_payment`: Test payments in Sandbox.

### Resources
- `reqst://docs/auth`: Authentication guide.
- `reqst://docs/invoices`: API usage.
- `reqst://docs/webhooks`: Integration guide.
- `reqst://docs/errors`: Error codes and limits.

## Configuration

The server requires the following environment variables:

- `REQST_API_KEY`: Your Reqst API key.
- `REQST_WEBHOOK_SECRET`: Your webhook signing secret (for verification).
- `REQST_API_URL`: (Optional) Base URL for the API (default: https://reqst.xyz/v1).
- `REQST_DOCS_URL`: (Optional) Base URL for raw docs (default: https://reqst.xyz/en/docs).

## Usage with Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "reqst": {
      "command": "npx",
      "args": ["-y", "tsx", "/path/to/reqst/mcp-server/src/index.ts"],
      "env": {
        "REQST_API_KEY": "your_api_key_here",
        "REQST_WEBHOOK_SECRET": "your_secret_here"
      }
    }
  }
}
```

## Development

```bash
cd mcp-server
npm install
npm run dev
```
