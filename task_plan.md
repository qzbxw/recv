# Task Plan: Align Public Landing Pages and Documentation with Actual Project Features

## Goal
Update all landing pages, translation files, and developer documentation in the public frontend (`frontend-public`) to exactly match the actual capabilities, API request parameters, webhook signatures, and network configurations implemented in the Go/Gin backend.

## Current Phase
Complete

## Phases

### Phase 1: Requirements & Discovery
- [x] Analyze Go backend implementation (invoices, API keys, watchers, plans, webhooks).
- [x] Identify mismatches between actual implementation and marketing/doc files (done: USDC vs USDT, invoice request fields, webhook signatures, rate limits).
- [x] Document specific findings in `findings.md`.
- **Status:** complete

### Phase 2: Refactoring Marketing Translation Files
- [x] Edit `frontend-public/src/i18n/en.ts` and `ru.ts` to remove USDC references and fix marketing features.
- [x] Edit `frontend-public/src/i18n/plans.en.ts` and `plans.ru.ts` to correct supported networks and FAQs.
- [x] Edit `frontend-public/src/components/ProductPageClient.tsx` to fix JS code snippet for invoice creation.
- **Status:** complete

### Phase 3: Updating Developer Documentation (MDX files)
- [x] Edit `frontend-public/content/docs/en/invoices.mdx` and `ru/invoices.mdx` (fix parameter lists, examples, response keys).
- [x] Edit `frontend-public/content/docs/en/webhooks.mdx` and `ru/webhooks.mdx` (fix HMAC verification signature format, headers, payload json).
- [x] Edit `frontend-public/content/docs/en/errors.mdx` and `ru/errors.mdx` (fix error json shape, correct rate limits and retries per plan).
- **Status:** complete

### Phase 4: Testing & Verification
- [x] Validate changes via Next.js dev or build command.
- [x] Run typescript checks if configured.
- **Status:** complete


## Key Questions
1. Do we support any USDC or is it strictly USDT? (Resolved: strictly USDT and native TON).
2. What are the exact request body fields for `/v1/invoices`? (Resolved: `title`, `base_amount_usd`, `payable_network`, `expires_in_minutes`).
3. How is the webhook signature generated and validated? (Resolved: `v1=` prepended to HMAC-SHA256 of `timestamp + "." + rawBody`).

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Remove USDC support mentions | Backend stablecoin specs only map to USDT contracts across EVM, BSC, Arbitrum, Base, Solana, TON. |
| Align invoice code examples | Backend uses `base_amount_usd` and `payable_network`, not `amount` and `asset`/`network`. |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
|       |         |            |
