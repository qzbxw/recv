import { Link } from "react-router-dom";

const sections = [
  {
    title: "Quickstart",
    body: "Add a payout wallet, create a test_ key, create a test invoice, simulate a payment, then reuse the same integration with a live_ key once webhook verification passes. Base URL: https://recv.money/v1.",
    code: `curl -X POST https://recv.money/v1/invoices \\
  -H "X-API-Key: test_..." \\
  -H "Idempotency-Key: order-1001" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Order #1001","base_amount_usd":"49.00","payable_network":"TRON"}'`,
  },
  {
    title: "API Auth",
    body: "Send X-API-Key: <API_KEY> (or Authorization: Bearer <API_KEY>). Live keys start with live_; test keys start with test_ and create test-mode invoices that live blockchain watchers ignore. The API requires the Developer or Business plan. Merchant has payment links and Trial has limited live invoices. Keys carry invoices:read and/or invoices:write scopes (both by default).",
  },
  {
    title: "Invoices",
    body: "POST /v1/invoices (invoices:write), GET /v1/invoices, GET /v1/invoices/{id} (invoices:read), POST /v1/invoices/{id}/cancel (invoices:write). Body: title, base_amount_usd (decimal string), payable_network, optional expires_in_minutes (default 30). Responses include public_id, checkout_url, payable_amount (6 dp), payable_network, destination_address, payment_uri, status, and mode.",
  },
  {
    title: "Idempotency",
    body: "Send Idempotency-Key on POST /v1/invoices. The same key with the same JSON body returns the original response; the same key with a different body (or while still processing) returns 409 Conflict. Use your order ID as the key.",
  },
  {
    title: "Webhook Verification",
    body: "recv signs each delivery with headers X-recv-Event, X-recv-Timestamp, and X-recv-Signature. The signature is v1= + HMAC-SHA256(secret, timestamp + '.' + rawBody). Verify over the exact raw bytes before mutating order state; dedupe on transition_id.",
    code: `const expected = "v1=" + crypto
  .createHmac("sha256", webhookSecret.trim())
  .update(timestamp + "." + rawBody)
  .digest("hex");`,
  },
  {
    title: "Test Mode",
    body: "POST /v1/test/invoices/{id}/simulate-payment with a test_ key marks a test invoice as paid and fires webhooks without sending funds. Returns 403 for live keys or non-test invoices.",
  },
  {
    title: "Supported Networks",
    body: "payable_network accepts TON (GRAM), TON_USDT (USDT on TON), TRON, BASE, and BSC. BASE/BSC share one EVM payout-wallet bucket; TON and TON_USDT share a TON wallet; TRON uses its own wallet. You must have an active payout wallet in the matching bucket to invoice on a network.",
  },
  {
    title: "MCP / AI Agents",
    body: "The recv-agent-mcp server exposes recv to AI agents (Claude Desktop, Cursor) over stdio. Tools: create_invoice, get_invoice, list_invoices, simulate_payment, verify_webhook, list_supported_networks. Env: RECV_API_KEY, RECV_WEBHOOK_SECRET, RECV_API_URL (default https://recv.money/v1), RECV_DOCS_URL. Every tool calls the same /v1 API, so the same scopes and limits apply.",
  },
  {
    title: "Blockchain Edge Cases",
    body: "Exact payments become paid. Shortfalls become underpaid. Overpayments and payments after expiration move to manual_review. For memo/comment networks the required payment_comment must be included or the transfer may not match automatically.",
  },
  {
    title: "Error Codes",
    body: "400 invalid request, 401 invalid/missing API key, 403 missing plan/scope or live-key simulation, 404 missing resource, 409 idempotency conflict, 429 minute rate limit or monthly quota exceeded, 500 internal error. Rate-limit headers: X-RateLimit-Limit-Minute / -Remaining-Minute (and -Month where capped).",
  },
];

export function DeveloperDocsPage() {
  return (
    <main className="lend-page docs-page">
      <div className="lend-shell">
        <header className="lend-topbar">
          <Link to="/" className="topbar-brand topbar-brand--minimal">
            <strong>recv</strong>
          </Link>
          <nav className="lend-nav">
            <Link to="/dev">Dev</Link>
            <Link to="/auth">Console</Link>
            <Link to="/console">Console</Link>
          </nav>
        </header>

        <section className="docs-hero">
          <span className="section-kicker">API v1</span>
          <h1>Developer Docs</h1>
          <p>Production integration guide for invoices, idempotent retries, test mode, webhook verification, and blockchain payment edge cases.</p>
        </section>

        <section className="docs-grid" aria-label="Developer documentation">
          {sections.map((section) => (
            <article className="docs-card" key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
              {section.code ? <pre><code>{section.code}</code></pre> : null}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
