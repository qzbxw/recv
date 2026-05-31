import { Link } from "react-router-dom";

const sections = [
  {
    title: "Quickstart",
    body: "Add a payout wallet, create an rqst_test_ key, create a test invoice, simulate a payment, then reuse the same integration with an rqst_live_ key once webhook verification passes. Base URL: https://reqst.xyz/v1.",
    code: `curl -X POST https://reqst.xyz/v1/invoices \\
  -H "X-API-Key: rqst_test_..." \\
  -H "Idempotency-Key: order-1001" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Order #1001","base_amount_usd":"49.00","payable_network":"TRON"}'`,
  },
  {
    title: "API Auth",
    body: "Send X-API-Key: <API_KEY> (or Authorization: Bearer <API_KEY>). Live keys start with rqst_live_; test keys start with rqst_test_ and create test-mode invoices that live blockchain watchers ignore. The API requires the Developer, Business, or Enterprise plan — Merchant and Trial have no API access. Keys carry invoices:read and/or invoices:write scopes (both by default).",
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
    body: "Reqst signs each delivery with headers X-Reqst-Event, X-Reqst-Timestamp, and X-Reqst-Signature. The signature is v1= + HMAC-SHA256(secret, timestamp + '.' + rawBody). Verify over the exact raw bytes before mutating order state; dedupe on transition_id.",
    code: `const expected = "v1=" + crypto
  .createHmac("sha256", webhookSecret.trim())
  .update(timestamp + "." + rawBody)
  .digest("hex");`,
  },
  {
    title: "Test Mode",
    body: "POST /v1/test/invoices/{id}/simulate-payment with an rqst_test_ key marks a test invoice as paid and fires webhooks without sending funds. Returns 403 for live keys or non-test invoices.",
  },
  {
    title: "Supported Networks",
    body: "payable_network accepts TON, TRON, SOLANA, EVM, BASE, ARBITRUM, BSC. EVM/BASE/ARBITRUM/BSC share one EVM payout-wallet bucket; TON, TRON, and SOLANA each use their own. You must have an active payout wallet in the matching bucket to invoice on a network.",
  },
  {
    title: "MCP / AI Agents",
    body: "The reqst-agent-mcp server exposes Reqst to AI agents (Claude Desktop, Cursor) over stdio. Tools: create_invoice, get_invoice, list_invoices, simulate_payment, verify_webhook, list_supported_networks. Env: REQST_API_KEY, REQST_WEBHOOK_SECRET, REQST_API_URL (default https://reqst.xyz/v1), REQST_DOCS_URL. Every tool calls the same /v1 API, so the same scopes and limits apply.",
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
            <strong>reqst</strong>
          </Link>
          <nav className="lend-nav">
            <Link to="/dev">Dev</Link>
            <Link to="/enterprise">Enterprise</Link>
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
