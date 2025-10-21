## Payment Module — Tests Guide

This guide documents the current test coverage for the Payment module: what each test file validates, how it validates it, and why integration tests are essential. It also includes setup notes for Windows and focused run commands.

---

### What’s covered (by file)

Unit tests

- `tests/payment.service.test.ts`

  - Orchestration happy path (Card via Stripe): creates a session, mocks repositories and `StripeService` to return a succeeded PaymentIntent; verifies transaction boundaries, payment creation, invoice status update to Paid, receipt generation, notifier call, and idempotency completion.
  - Invoice not found → 404: mocks `InvoiceRepository.findById` to return null; asserts thrown `{statusCode:404}` and idempotency fail recorded.
  - Unauthorized payer → 403: invoice belongs to another user; asserts thrown `{statusCode:403}` and idempotency fail recorded.
  - Amount exceeds outstanding → 400: mocks existing successful payments to create an overpay condition; asserts thrown `{statusCode:400}` and idempotency fail recorded.
  - Idempotency already completed: `IdempotencyRepository.find` returns a completed record; service returns cached `response` without reprocessing.
  - Idempotency processing → 409: `find` returns `{status: 'processing'}`; asserts thrown `{statusCode:409}`.
  - Gateway error → 502: `StripeService.createPaymentIntent` rejects; asserts thrown `{statusCode:502}` and idempotency fail recorded.
  - Webhook reconciliation (`handleGatewaySucceeded`):
    - Updates payment and invoice when status not `Success`.
    - No-op when already `Success`.
  - Non-Card method success (Bank): skips Stripe, writes payment with `mock` gateway, sets invoice to Paid, and returns receipt.
  - Amount equals outstanding boundary: success when payment equals remaining outstanding.
  - Missing Idempotency-Key: ensures the idempotency repository is not touched and flow still succeeds.
  - getInvoices passthrough: ensures `findPendingByUser` is invoked with the provided user id.
  - Transactional error handling: simulates a failure in `paymentRepo.create`; ensures transaction is aborted and idempotency marked failed.

- `tests/stripe.service.test.ts`

  - createPaymentIntent: verifies amount×100, currency lower-casing, optional description, and that idempotencyKey is passed via request options; returns `clientSecret`/status/id mapping.
  - verifyWebhookSignature: ensures it calls `webhooks.constructEvent` with payload, signature header, and configured secret, and throws if signature header is missing.
  - Lazy init error: throws a clear message when `STRIPE_SECRET_KEY` is absent or bogus.
  - retrievePaymentIntent: proxies directly to Stripe SDK and returns the PaymentIntent object.
  - refund: supports optional `amount`—ensures cents conversion when provided and no amount field otherwise.

- `tests/receipt.service.test.ts`
  - generate receipt with optional `data`: defaults to `{}` when not provided; passes through supplied `data` when present; asserts returned id and receipt URL shape.

Repository tests (high-level; details are documented in their own files)

- `tests/invoice.repository.test.ts`: create with string/ObjectId, updateStatus with/without session, recent pending lookup with time window, and `findAllByUser` with optional status filter.
- `tests/payment.repository.test.ts`: create with/without session, `findByInvoice` order by latest first, `updateStatus` with session.
- `tests/receipt.repository.test.ts`: create; `findByPaymentId`; `findById`.
- `tests/idempotency.repository.test.ts`: createProcessing → find → complete → fail; ensures status and payload transitions.

Integration tests

- `tests/payment.pay.int.test.ts`
  - End-to-end POST `/api/payments/pay` with idempotency:
    - Seeds a resident and a pending invoice in an in-memory MongoDB replica set (transactions enabled).
    - Calls the API with Authorization header and Idempotency-Key; Stripe is mocked to avoid network calls and return a succeeded intent.
    - Verifies HTTP 200, a single payment record, receipt URL shape, and invoice status transitions to Paid.
    - Repeats the call with the same Idempotency-Key to assert no duplicate payments are created and the response is idempotent.
  - Why integration here: This test ensures the orchestration across Express route → authentication/authorization → validation → service → repositories → Mongoose transactions → response shaping works correctly as a system. It also validates that idempotency and database consistency behave correctly under realistic conditions (sessions/transactions), which unit tests alone can’t fully guarantee.

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

Jest config: `server/jest.config.js` (ts-jest, Node env, coverage targets models/repositories/services).

---

### Environment & prerequisites

- The integration test mocks Stripe, so no real Stripe keys are required for tests.
- For unit tests, all external boundaries (Stripe SDK, Mongo sessions, repositories, receipt/notifier) are mocked.
- Ensure TypeScript dev dependencies are installed (`npm i` in `server` if needed).

Optional env for local dev (not required for tests):

- `STRIPE_SECRET_KEY=sk_test_...`
- `STRIPE_WEBHOOK_SECRET=whsec_...`
- `PAYMENT_CURRENCY=lkr`

---

### Windows notes (mongodb-memory-server)

- On some Windows hosts, stopping the in-memory Mongo instance can throw `EPERM`. The integration test includes a guard to ignore this benign error on teardown.
- You may occasionally observe transient lock errors (e.g., "Unable to acquire IX lock…"). The service includes a tiny retry around the transaction to make tests and local runs robust on Windows replica sets.

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

- Stripe SDK initialization in tests:

  - Runtime code lazily initializes the Stripe client and caches it on `global` for test resets; the tests mock the `stripe` module to avoid real initialization.

- Idempotency not working:

  - Ensure the client supplies the `Idempotency-Key` header. Check repository transitions: `createProcessing` → `complete` or `fail`.

- Coverage not counting controllers/routes:
  - The project’s Jest coverage collects from models/repositories/services. You can extend `jest.config.js` if you want controller coverage.

---

### Next ideas (optional)

- Add tests for webhook controller using a raw-body payload to validate signature handling pathways (with Stripe mocked).
- Add controller-level tests for 401/403/400/502 mappings to raise coverage if you include controllers in the coverage target.
