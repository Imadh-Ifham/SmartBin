# Payment Invoices — Testing Guide (Unit + Integration)

This guide explains what we test for the Payment Invoice flow, how to run tests from the terminal, what output to expect, and which files/modules are involved.

## What we test (scope)

- Unit tests focus on business logic inside the service layer (no real DB):

  - Create invoice happy path (user exists, no duplicate, audit logs)
  - User not found → throws
  - Duplicate within 5 minutes → throws
  - Unpaid summary calculation
  - Helpers: overweight fee calculation and discount application

- Integration tests cover the API routes end-to-end (Express + middleware + Mongoose + in‑memory Mongo):
  - POST `/api/payments/generateInvoice`:
    - With authority/collector/admin token → 201
    - With resident token → 403
    - With invalid userId → 400
    - Duplicate within 5 minutes → 400
  - GET `/api/payments/status/:userId` → returns `{ count, total }`
  - GET `/api/payments/me/invoices` → returns list of invoices for the logged-in resident

## Where the tests live

- Unit: `server/src/modules/payment/tests/invoice.service.test.ts`
- Integration: `server/src/modules/payment/tests/invoice.routes.int.test.ts`

## Related source files (mapping)

- Routes: `server/src/modules/payment/routes/invoice.routes.ts`
- Controller: `server/src/modules/payment/controllers/invoice.controller.ts`
- Service: `server/src/modules/payment/services/invoice.service.ts`
- Repository: `server/src/modules/payment/repositories/invoice.repository.ts`
- Model: `server/src/modules/payment/models/invoice.model.ts`
- Middleware: `server/src/middleware/authenticate.ts`, `server/src/middleware/verifyAuthority.ts`, `server/src/middleware/validateRequest.ts`, `server/src/middleware/metricsMiddleware.ts`
- App mount: `server/src/app.ts` → `app.use("/api/payments", paymentsRouter)`

## How to run tests (PowerShell)

Run only the unit tests (fast):

```powershell
npx jest src/modules/payment/tests/invoice.service.test.ts
```

Run only the integration tests:

```powershell
npx jest src/modules/payment/tests/invoice.routes.int.test.ts --runInBand
```

Run all payment tests:

```powershell
npx jest src/modules/payment --runInBand
```

Watch mode (interactive):

```powershell
npm run test:watch -- src/modules/payment
```

Tips in watch mode:

- Press `p` to filter by filename (e.g., `invoice.service`)
- Press `t` to filter by test name (e.g., `createInvoice`)
- Press `a` to run all tests
- Press `f` to toggle only-failed tests

## Expected outputs

### Unit test highlights

- You should see something like:

```
PASS  src/modules/payment/tests/invoice.service.test.ts
	InvoiceService unit tests
		createInvoice
			✓ creates invoice and audits on success
			✓ throws when user not found
			✓ throws on duplicate within 5 minutes
		getUnpaidSummary
			✓ returns count and total from pending invoices
		helpers
			✓ calculateOverweight returns excess and fee
			✓ applyDiscount clamps and computes totals
		getInvoicesByUserId
			✓ returns list of invoices mapped with id
```

- Coverage usually shows `invoice.service.ts` at or near 100%.

### Integration test highlights

- With `mongodb-memory-server` and `supertest`, you’ll see audit and controller logs for 201s, and metrics warnings for 400/403 (expected for negative cases):

```
[AUDIT] {... INVOICE_CREATED ...}
[INVOICE_CREATED] { invoiceId, userId, amount, reason, status: 'Pending', createdAt }
[400] POST /generateInvoice
[403] POST /generateInvoice
```

- The summary should end like:

```
PASS  src/modules/payment/tests/invoice.routes.int.test.ts
	/api/payments (integration)
		✓ POST /generateInvoice with authority token => 201
		✓ POST /generateInvoice duplicate within 5 minutes => 400
		✓ POST /generateInvoice with resident token => 403
		✓ POST /generateInvoice with invalid userId => 400
		✓ GET /status/:userId returns unpaid summary => 200
		✓ GET /me/invoices returns invoices for logged-in resident => 200
```

## One-time setup notes

- Integration tests use an in-memory Mongo, so the first run may take longer as `mongodb-memory-server` downloads a binary.
- Ensure `DEV_AUTH` is not set (or is `false`) during integration tests so that real tokens and role checks are exercised.
- We sign JWTs inside the integration tests with `process.env.JWT_SECRET = "test-secret"`; this aligns with `authenticate.ts`.

## Troubleshooting

- 401 Unauthorized: Missing or malformed `Authorization: Bearer <JWT>`, or mismatched `JWT_SECRET`. In tests, the secret is set in code.
- 403 Forbidden: You used a `resident` token on POST `/generateInvoice`. Use `authority`/`collector`/`admin`.
- 400 Bad Request: Zod validation failed (e.g., invalid `userId`, negative `amount`, too-short `reason`).
- Windows EPERM on shutdown: We catch and ignore the `mongodb-memory-server` EPERM kill on Windows in `invoice.routes.int.test.ts` to keep tests green.
- “Cannot find module 'supertest'”: Install dev deps in the server folder:

```powershell
npm i -D supertest @types/supertest
```

## Manual parity checks (Postman)

- POST `/api/payments/generateInvoice` with an `authority` token and valid JSON body:
  - `{ "userId": "<residentId>", "amount": 1250, "reason": "Overweight ..." }`
  - Expect `201` with `{ invoiceId, userId, amount, reason, status: "Pending", createdAt }`
- POST again with same `userId+reason` within 5 minutes → expect `400 Duplicate invoice detected`.
- POST with `resident` token → expect `403`.
- GET `/api/payments/status/<residentId>` with `authority` token → expect `{ count, total }`.
- GET `/api/payments/me/invoices` with `resident` token → expect an array of invoices with
  `{ id, amount, reason, status: "Pending|Paid|Partially Paid|Refunded", createdAt, dueDate? }`.

## Why this design

- Unit tests keep the core business rules reliable and fast.
- Integration tests validate the entire stack (middleware → controller → service → repository → model) against a real Mongo engine (in-memory), catching wiring or schema issues that unit tests can’t see.
