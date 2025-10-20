## Payment Module — Tests Guide

This guide explains how to run and understand the tests for the Payment module, including unit tests for the orchestrator and an integration test for the `/api/payments/pay` endpoint. It also includes Windows-specific notes and environment setup.

---

### What’s covered

- Unit tests: `payment.service.test.ts`

  - Happy path (Card via Stripe)
  - Invoice not found (404)
  - Unauthorized payer (403)
  - Amount exceeds outstanding (400)
  - Idempotency already completed (returns cached response)
  - Idempotency processing (409)
  - Gateway error (maps to 502 and marks idempotency failed)
  - Webhook reconciliation via `handleGatewaySucceeded`

- Integration test: `payment.pay.int.test.ts`
  - Creates a resident and a pending invoice
  - Calls POST `/api/payments/pay` with Idempotency-Key
  - Verifies invoice becomes Paid and no duplicates on retry
  - Uses mongodb-memory-server and mocks Stripe service

---

### Project scripts

- Run all tests from the `server` folder:

```powershell
npm test
```

- Watch mode:

```powershell
npm run test:watch
```

Jest config: `server/jest.config.js` (ts-jest, Node env, coverage from models/repositories/services).

---

### Environment & prerequisites

- The integration test mocks Stripe, so no real Stripe keys are required for tests.
- For unit tests, we stub all external dependencies (Stripe, Mongo sessions, repos, receipt service, notifier).
- Ensure TypeScript dev deps are installed (`npm i` in `server` if needed).

Optional env for local dev (not required for tests):

- `STRIPE_SECRET_KEY=sk_test_...`
- `STRIPE_WEBHOOK_SECRET=whsec_...`
- `PAYMENT_CURRENCY=lkr`

---

### Files and purpose

- `tests/payment.service.test.ts` — Unit tests for `PaymentService` orchestration logic, idempotency, and webhook reconciliation.
- `tests/payment.pay.int.test.ts` — Integration test for the `/api/payments/pay` endpoint using supertest + mongodb-memory-server and a mocked Stripe service.

---

### Windows notes (mongodb-memory-server)

- On some Windows hosts, stopping the in-memory Mongo instance can throw `EPERM`. The integration test includes a guard to ignore this benign error on teardown.

---

### Focused runs

- Run only payment tests:

```powershell
npx jest src/modules/payment --coverage
```

- Run a single file:

```powershell
npx jest src/modules/payment/tests/payment.service.test.ts --watch
```

---

### Troubleshooting

- Type errors in Stripe service during builds:

  - We use a lazy Stripe initialization in runtime code; tests mock this surface or bypass initialization entirely.

- Failing idempotency cases:

  - Ensure the request header `Idempotency-Key` is passed from the client, and verify the idempotency repository logic executes.

- Coverage not counting controllers/routes:
  - The project’s Jest coverage collects from models/repositories/services. You can extend `jest.config.js` if you want controller coverage.

---

### Next ideas (optional)

- Add unit tests for repositories using an isolated Mongo memory server when needed.
- Add tests for webhook controller using a raw-body payload to validate signature handling pathways (with Stripe mocked).
