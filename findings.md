# Findings & Decisions

## Requirements
Update landing pages and docs to match the actual Go backend implementation:
1. Supported networks/tokens: Only USDT (across EVM, Base, Arbitrum, BSC, Solana, TON Jetton) and native TON. No USDC is supported by watchers.
2. Invoices API (`POST /v1/invoices`):
   - Request JSON body:
     - `title`: string (required)
     - `base_amount_usd`: string (required, positive decimal)
     - `payable_network`: string (optional/required, e.g., "TON", "TRON", "SOLANA", "EVM", "BASE", "ARBITRUM", "BSC")
     - `expires_in_minutes`: integer (optional, defaults to 30)
   - Response JSON body (publicInvoiceResponse):
     - `id`: int64
     - `public_id`: string
     - `title`: string
     - `kind`: string ("merchant" or "subscription")
     - `subscription_days`: int
     - `plan_code`: string
     - `checkout_badge`: string
     - `base_amount_usd`: string
     - `payable_amount`: string
     - `payable_network`: string
     - `destination_address`: string
     - `payment_comment`: string
     - `status`: string ("draft", "awaiting_payment", "paid", "expired", "underpaid", "overpaid", "manual_review")
     - `environment`: string ("test" or "live")
     - `mode`: string ("test" or "live")
     - `expires_at`: string (timestamp)
     - `created_at`: string (timestamp)
     - `tx_hash`: string/null
     - `received_amount`: string
     - `review_reason`: string/null
     - `finalized_at`: string/null
     - `checkout_url`: string (e.g. `"/app/checkout/" + public_id`)
     - `payment_uri`: string
3. Webhook signature (`X-Reqst-Signature`):
   - Format: `v1=<hex_hmac>`
   - Hash formula: `HMAC-SHA256(secret, timestamp + "." + rawBody)`
   - Headers sent:
     - `X-Reqst-Event`: event name (e.g. `invoice.paid`, `invoice.underpaid`, `invoice.expired`, `subscription.activated`)
     - `X-Reqst-Timestamp`: Unix epoch string (seconds)
     - `X-Reqst-Signature`: `v1=<hex>`
     - `Content-Type`: `application/json`
     - `User-Agent`: `reqst-webhooks/1.0`
4. Webhook Payload:
   - Invoice payload structure:
     ```json
     {
       "created_at": "2026-05-31T20:55:03Z",
       "transition_id": 123,
       "event": "invoice.paid",
       "classification": "manual_mark_paid",
       "observed_amount": "100.000000",
       "invoice": {
         "id": 123,
         "public_id": "pub_abc123",
         "kind": "merchant",
         "plan_code": "developer",
         "title": "Order #99",
         "status": "paid",
         "payable_amount": "100.000000",
         "payable_network": "TON",
         "destination_address": "EQD...",
         "payment_comment": "",
         "tx_hash": "tx_hash_or_empty",
         "paid_at": "2026-05-31T20:55:00Z"
       },
       "sent_at": "2026-05-31T20:55:03Z"
     }
     ```
   - Subscription payload structure:
     ```json
     {
       "event": "subscription.activated",
       "plan": {
         "code": "developer",
         "name": "Developer",
         "billing_days": 30
       },
       "invoice_public_id": "pub_abc123",
       "sent_at": "2026-05-31T20:55:03Z"
     }
     ```
5. Rate Limits & Quotas per Plan:
   - Developer: 90 requests/min (up to 50k requests/mo), 3 webhook retries, 3 active webhook endpoints.
   - Business: 300 requests/min (up to 200k requests/mo), 5 webhook retries, 10 active webhook endpoints.
   - Enterprise: 1200 requests/min (up to 1M+ requests/mo), 8 webhook retries, 50 active webhook endpoints.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Replace all references of USDC with USDT in docs/marketing | Keep implementation truth: only USDT and native TON are watched. |
| Use correct webhook signature code snippet | Documentation showed invalid signature verify implementation. |
| Correct the Invoices API fields | Prevent integration errors due to wrong parameters (`amount`, `asset`, `currency`). |
