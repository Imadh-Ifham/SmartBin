# Collector Module

This module models the workflows and responsibilities of waste collectors and their shifts.

Design principles

- SOLID and HCL applied similarly to `smart-bin` module: controllers are thin, services hold business logic, repositories encapsulate DB access.

Key responsibilities

- Manage collector shifts (start/end).
- Assign collection routes to a shift (ordered stops referencing bins).
- Mark stops as collected or skipped.
- Report issues encountered during collection.

Files

- `models/collector.model.ts` — Mongoose model `CollectorShift` with an embedded `route.stops` array.
- `repositories/collector.repository.ts` — `CollectorRepository` DAO with helpers to assign routes and update stop status.
- `services/collector.service.ts` — `CollectorService` class with workflows: `startShift`, `endShift`, `assignRoute`, `markCollected`, `skipBin`, `reportIssue`.
- `controllers/collector.controller.ts` — Functional HTTP handlers using `zod` for validation.
- `routes/collector.routes.ts` — Express routes wired with `authenticate` and `verifyAuthority` middleware.

Collector workflows — brief

- startShift(collectorId)

  - Ends any prior active shift for the collector (defensive) and creates a new `CollectorShift`.

- assignRoute(shiftId, route)

  - Sets `route.stops` with sequence and initial `Pending` status.

- markCollected(shiftId, binId)

  - Marks a stop `Collected` with timestamp and attempts to reset bin weight via `smartBinService.reportWeight(..., 0)`.

- skipBin(shiftId, binId, reason)

  - Marks a stop `Skipped` and records skip metadata for the shift.

- reportIssue(shiftId, binId, issue)
  - Appends issue to shift metadata for audit and follow-up.

Patterns implemented

- Layered Architecture (Controller → Service → Repository → Model)
- Repository / DAO pattern (`CollectorRepository`)
- Service Layer / Domain Service (`CollectorService` class)
- Controllers as HTTP Adapters (thin, functional)
- Dependency Injection via constructor parameters in services

Endpoints (examples)

- POST /api/collector/start — start shift
- POST /api/collector/:id/end — end shift
- POST /api/collector/:id/assign-route — assign route
- POST /api/collector/:id/collect — mark collected
- POST /api/collector/:id/skip — skip stop
- POST /api/collector/:id/report-issue — report issue
