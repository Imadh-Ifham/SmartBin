## Stage 3 — Payment Processing (Stripe + Idempotency + Receipts)

This document summarizes all of the work completed to implement the full invoice payment flow, end-to-end. It follows the same narrative style as earlier phases (invoice work), covering phases, files created/edited, APIs, examples, and frontend integration.

---

### High‑level goals achieved

- Residents can pay invoices via POST `/api/payments/pay`.
- Identity, invoice ownership, and payment amounts validated server-side.
- Payments processed using Stripe Payment Intents (Card), with a Strategy/Gateway adapter abstraction (ready for Bank/eWallet).
- Idempotency protection using `Idempotency-Key` header and an Idempotency collection to avoid double charges.
- MongoDB transactions ensure atomic creation of a Payment record and invoice status updates.
- Receipts generated and persisted (JSON), with a simple receipt fetch endpoint.
- Webhook handler for Stripe to reconcile asynchronous events.
- Tests cover integration for `/pay` with mocked Stripe and in-memory Mongo.
- Clean architecture: DTOs + validation, thin controllers, orchestration service, repositories, isolated gateway adapter.

---

## Phase A — DTOs & Validation

Files:

- Added: `server/src/modules/payment/types/pay.dto.ts`

What changed:

- Introduced Zod schema for the payment request payload, including invoiceId, method, amount, optional paymentDetails, and optional idempotencyKey.

Snippet (reference):

- `ProcessPaymentSchema`: validates
  - `invoiceId` as a 24-char hex string
  - `method` ∈ {Card, Bank, eWallet}
  - `amount` > 0
  - optional `paymentDetails` and `idempotencyKey`

---

## Phase B — Models

Files:

- Updated: `server/src/modules/payment/models/payment.model.ts`
- Added: `server/src/modules/payment/models/idempotency.model.ts`
- Added: `server/src/modules/payment/models/receipt.model.ts`

What changed:

- Payment model now supports:
  - `invoiceId` (ObjectId ref), `amount`, `method`, `status` (Processing | Success | Failed), `gateway` (e.g., stripe), `transactionId`, `metadata`, and timestamps.
- Idempotency model:
  - `{ key, status: processing|completed|failed, response?, error?, timestamps }`.
- Receipt model:
  - `{ invoiceId, paymentId, userId, amount, data, createdAt }` for simple JSON receipts.

---

## Phase C — Repositories (DB access)

Files:

- Updated: `server/src/modules/payment/repositories/payment.repository.ts`
- Added: `server/src/modules/payment/repositories/idempotency.repository.ts`
- Added: `server/src/modules/payment/repositories/receipt.repository.ts`
- Updated: `server/src/modules/payment/repositories/invoice.repository.ts` (now accepts `{ session? }` options for `updateStatus`)

What changed:

- Payment repo supports `create` with session, `findByInvoice` (sorted), `findByTransactionId`, and `updateStatus`.
- Idempotency repo supports `createProcessing`, `find`, `complete`, and `fail`.
- Receipt repo supports `create`, `findByPaymentId`, and `findById`.
- Invoice repo’s `updateStatus` can take an optional session for transactional updates.

---

## Phase D — Gateway Adapter (Stripe)

Files:

- Updated: `server/src/modules/payment/services/stripe.service.ts`

What changed:

- Added a lazy initialization of the Stripe client to avoid import-time crashes when `STRIPE_SECRET_KEY` is missing.
- Implemented methods:
  - `createPaymentIntent(amount, currency, description, idempotencyKey?)`
  - `retrievePaymentIntent(paymentIntentId)`
  - `refund(paymentIntentId, amount?)`
  - `verifyWebhookSignature(payload, signature)`

Notes:

- Uses Stripe Payment Intents (recommended) and passes the idempotency key to Stripe to avoid gateway-level duplicates.
- Webhook signature is verified using `STRIPE_WEBHOOK_SECRET`.

---

## Phase E — Core Orchestration (PaymentService)

Files:

- Updated: `server/src/modules/payment/services/payment.service.ts`

What changed:

- Added end-to-end payment processing flow with idempotency and Mongo transactions:
  1.  Idempotency check: if `Idempotency-Key` exists and status is `completed`, return stored response; if `processing`, return 409; else mark as `processing`.
  2.  Validate invoice: must exist, belong to payer, and not exceed outstanding.
  3.  Gateway call: for `Card`, create a Stripe PaymentIntent (returns `clientSecret`); for other methods, a mock success placeholder (can be upgraded later).
  4.  Transaction: create Payment record (Processing/Success) and update Invoice to Paid on immediate success.
  5.  After commit: generate a receipt (JSON), notify (stubbed), mark idempotency completed, and return `{ payment, clientSecret?, receipt }`.
  6.  Webhook reconciliation: `handleGatewaySucceeded(transactionId)` updates Payment and Invoice if not already set.

---

## Phase F — Controllers

Files:

- Updated: `server/src/modules/payment/controllers/payment.Controller.ts`
- Added: `server/src/modules/payment/controllers/webhook.controller.ts`
- Added: `server/src/modules/payment/controllers/receipt.controller.ts`

What changed:

- `processPayment` (thin controller):
  - Uses validation middleware, extracts `Idempotency-Key`, uses `req.user.id` as `payerId`, calls `paymentService.processPayment`, and returns JSON.
- `handleStripeWebhook`:
  - Uses `stripeService.verifyWebhookSignature` and reconciles `payment_intent.succeeded` events.
- `getReceipt`:
  - Returns receipt JSON by `:id` (receipt id or payment id lookup).

---

## Phase G — Routes & App Mounting

Files:

- Updated: `server/src/modules/payment/routes/payment.routes.ts`
- Kept: `server/src/modules/payment/routes/invoice.routes.ts`
- Added: `server/src/modules/payment/routes/webhook.raw.routes.ts`
- Updated: `server/src/app.ts`

What changed:

- `payment.routes.ts` exposes:
  - `POST /api/payments/pay` (auth + validation)
  - `GET /api/payments/receipts/:id` (auth)
- `invoice.routes.ts` remains for Phase 1/2 endpoints (generate invoice, status, my invoices, etc.).
- `webhook.raw.routes.ts` mounts `/stripe/webhook` with `express.raw({ type: 'application/json' })` — critical for Stripe signature verification.
- `app.ts` mounts routes:
  - Webhook router first (raw body), then `express.json`, then `/api/payments` routers (invoice + payment), and other modules.

---

## Phase H — Tests

Files:

- Added: `server/src/modules/payment/tests/payment.pay.int.test.ts`

What changed:

- Integration test for `POST /api/payments/pay`:
  - Mocks StripeService to avoid network calls.
  - Seeds a resident + invoice, makes a payment with idempotency key, asserts invoice becomes `Paid`, and ensures a second request with the same idempotency key does not create duplicates.
  - Uses `mongodb-memory-server` with EPERM guard for Windows.

---

## Frontend Integration (Stage 3)

Files:

- Added: `client/src/api/payment/pay.api.ts`
- Updated: `client/src/main.tsx` (Stripe Elements wrapper)
- Updated: `client/src/modules/payment/components/PaymentCheckout.tsx` (Stripe CardElement)
- Updated: `client/src/modules/payment/pages/ManagePayment.tsx` (screen flow integration)
- Kept: `client/src/api/payment/invoice.api.ts`, `BillingDashboard.tsx` (Phase 2)

What changed:

- API client to call `POST /api/payments/pay` with optional `Idempotency-Key` header.
- Wrapped the app with Stripe Elements using `VITE_STRIPE_PUBLISHABLE_KEY`.
- Checkout now:
  1.  Calls `/api/payments/pay` with `{ invoiceId, method: "Card", amount }`.
  2.  Receives `{ clientSecret, payment, receipt }`.
  3.  Calls `stripe.confirmCardPayment(clientSecret, { payment_method: { card: CardElement } })`.
  4.  On success, transitions to success page; webhook (or immediate success) ensures the invoice is `Paid` in backend.

Environment:

- Client `.env` must include `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...`.
- Server `.env` must include `STRIPE_SECRET_KEY=sk_test_...`, `STRIPE_WEBHOOK_SECRET=whsec_...`, `PAYMENT_CURRENCY=lkr` (optional).

---

## API Endpoints (New/Updated)

1. Pay invoice

- Method: `POST /api/payments/pay`
- Auth: `Authorization: Bearer <residentJWT>`
- Headers: `Idempotency-Key: <uuid>` (recommended)
- Body:

```json
{
  "invoiceId": "<24-hex>",
  "method": "Card",
  "amount": 1500
}
```

- Response (example):

```json
{
  "payment": {
    "_id": "666...",
    "invoiceId": "665...",
    "amount": 1500,
    "method": "Card",
    "status": "Success",
    "transactionId": "pi_..."
  },
  "clientSecret": "pi_..._secret_...",
  "receipt": { "id": "rcpt_...", "url": "/api/payments/receipts/rcpt_..." }
}
```

2. Receipt JSON

- Method: `GET /api/payments/receipts/:id`
- Auth: `Authorization: Bearer <JWT>`
- Response (example):

```json
{
  "id": "rcpt_...",
  "invoiceId": "665...",
  "paymentId": "666...",
  "userId": "664...",
  "amount": 1500,
  "data": { "gateway": "stripe", "transactionId": "pi_..." },
  "createdAt": "2025-10-20T10:20:00.000Z"
}
```

3. Stripe webhook (server-only)

- Method: `POST /api/payments/stripe/webhook`
- Body: raw JSON (signature verified)
- Events handled: `payment_intent.succeeded` (can be extended)

Phase 1/2 endpoints retained:

- `POST /api/payments/generateInvoice` (authority/collector)
- `GET /api/payments/status/:userId` (authority/collector/admin)
- `GET /api/payments/me/invoices` (resident)
- `GET /api/payments/:userId/invoices` (authority/collector/admin)

---

## Try it (manual)

1. Backend

- Ensure `server/.env` has Stripe secrets and JWT secret.
- Start server.

2. Frontend

- Ensure `client/.env` has `VITE_STRIPE_PUBLISHABLE_KEY` and optional `VITE_API_URL`.
- Start client.

3. App flow

- Login as resident → Billing & Payments → Pay Now on a Pending invoice → Confirm & Pay.
- Use Stripe test card `4242 4242 4242 4242` with any future expiry and any CVC.
- Verify invoice becomes `Paid` and a payment record exists.

4. Webhook (optional local test)

- Install Stripe CLI and run:
  - `stripe listen --forward-to http://localhost:5000/api/payments/stripe/webhook`
  - `stripe trigger payment_intent.succeeded`

---

## Security & Operational Notes

- Do not store or log card details; only store gateway transaction ids and safe metadata.
- Use idempotency headers from the client; we also forward keys to Stripe.
- Stripe secret keys must only exist on the server; publishable keys are for the client.
- Mongo transactions require a replica set in production.
- Rate limit `/pay` and secure webhook with verified signatures.

---

## Files changed/added (summary)

Backend:

- Added: `types/pay.dto.ts`
- Added: `models/idempotency.model.ts`, `models/receipt.model.ts`
- Updated: `models/payment.model.ts`, `repositories/payment.repository.ts`, `repositories/invoice.repository.ts`
- Added: `repositories/idempotency.repository.ts`, `repositories/receipt.repository.ts`
- Updated: `services/stripe.service.ts`, `services/payment.service.ts`
- Added: `services/receipt.service.ts`
- Updated: `controllers/payment.Controller.ts`
- Added: `controllers/webhook.controller.ts`, `controllers/receipt.controller.ts`
- Updated: `routes/payment.routes.ts`, `routes/invoice.routes.ts`
- Added: `routes/webhook.raw.routes.ts`
- Updated: `app.ts` (mounts webhook with raw body, then routers)
- Added tests: `tests/payment.pay.int.test.ts`

Frontend:

- Added: `src/api/payment/pay.api.ts`
- Updated: `src/main.tsx` (Stripe Elements loader)
- Updated: `src/modules/payment/components/PaymentCheckout.tsx` (CardElement + confirm flow)
- Updated: `src/modules/payment/pages/ManagePayment.tsx` (screen integration)
- Kept: `src/api/payment/invoice.api.ts`, `BillingDashboard.tsx`

---

## Appendix — Common errors & fixes

- Error: `Neither apiKey nor config.authenticator provided`

  - Cause: Stripe was initialized at import time without `STRIPE_SECRET_KEY`.
  - Fix: Lazy-init Stripe client and ensure `.env` includes the key.

- Webhook signature invalid

  - Ensure the route uses `express.raw({ type: 'application/json' })` and the correct `STRIPE_WEBHOOK_SECRET`.

- Double charges / duplicate payments
  - Always send `Idempotency-Key` from client; we persist and dedupe by key.

---

This completes Stage 3 Payment Processing. The system now supports secure, idempotent Stripe payments with receipts, transactional integrity, and a working frontend checkout flow.
