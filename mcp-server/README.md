# recv MCP Server

Model Context Protocol (MCP) server for integrating recv Payment Gateway into AI agents (Claude, Cursor, etc.).

## Features

### Tools
- `get_account`: Check the current console workspace, plan, and available plans.
- `bootstrap_agent_workspace`: Create a new trial workspace for a fully autonomous agent.
- `create_subscription_checkout`: Create a recv billing checkout for Merchant, Developer, or Business.
- `get_checkout_invoice`: Poll a public checkout invoice until payment is detected.
- `create_api_key`: Create a developer API key after an API-capable plan is active.
- `create_webhook_endpoint`: Register a webhook endpoint for payment events.
- `create_invoice`: Create payment requests.
- `get_invoice`: Check payment status.
- `list_invoices`: View recent activity.
- `verify_webhook`: Securely validate incoming notifications.
- `list_supported_networks`: Check supported blockchains.
- `simulate_payment`: Test payments in Sandbox.

### Resources
- `recv://docs/auth`: Authentication guide.
- `recv://docs/invoices`: API usage.
- `recv://docs/webhooks`: Integration guide.
- `recv://docs/errors`: Error codes and limits.
- `recv://docs/mcp`: Agent onboarding guide.

## Configuration

The server can run in two modes.

Console/self-service mode lets an agent buy or upgrade the recv workspace plan and create API credentials:

- `RECV_ACCESS_TOKEN`: recv app bearer token from `/api/auth/*`. If the agent does not have one yet, call `bootstrap_agent_workspace` first and persist the returned token.
- `RECV_APP_URL`: (Optional) App/API origin for console endpoints (default is derived from `RECV_API_URL`, e.g. `https://recv.money`).

Developer API mode lets an agent create and manage payment invoices:

- `RECV_API_KEY`: Your recv API key.
- `RECV_WEBHOOK_SECRET`: Your webhook signing secret (for verification).
- `RECV_API_URL`: (Optional) Base URL for the API (default: https://recv.money/v1).
- `RECV_DOCS_URL`: (Optional) Base URL for raw docs (default: https://recv.money/en/docs).

## Agent onboarding flow

Use the existing Merchant plan for checkout-only merchants. Do not create a separate AI plan by default: AI agents that need API access should buy `developer` or `business`, because those plans already include API keys, webhooks, limits, and subscription billing.

1. If there is no console token, call `bootstrap_agent_workspace` and persist the returned `token`/`access_token` as `RECV_ACCESS_TOKEN`.
2. Call `get_account` to inspect the active workspace and plan.
3. If the plan does not include API access, call `create_subscription_checkout` with `plan_code: "developer"` and a payable network.
4. Send the returned `checkout_url` to the payer, or open it in the host app.
5. Poll `get_checkout_invoice` with the returned `public_id` until `status` is `paid`.
6. Call `create_api_key`, then store the returned `secret` as `RECV_API_KEY`.
7. Optionally call `create_webhook_endpoint` and store the returned `webhook.secret` as `RECV_WEBHOOK_SECRET`.
8. Use `create_invoice`, `get_invoice`, and `list_invoices` for customer payments.

## Usage with Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "recv": {
      "command": "npx",
      "args": ["-y", "tsx", "/path/to/recv/mcp-server/src/index.ts"],
      "env": {
        "RECV_ACCESS_TOKEN": "your_recv_console_token_here",
        "RECV_API_KEY": "your_api_key_here",
        "RECV_WEBHOOK_SECRET": "your_secret_here"
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
