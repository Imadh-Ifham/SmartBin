# Smart-Bin Module

This module implements maintenance and management for digital smart-bins.

Design principles

- SOLID: Single Responsibility (controllers handle HTTP, services handle business rules, repositories handle DB access), Dependency Inversion via constructor injection for services, Open/Closed for adding new bin types without modifying existing logic.
- HCL (High Cohesion, Low Coupling): models are simple, repositories encapsulate database details, services expose behavior-focused APIs, controllers are thin HTTP adapters.
- Controllers are functional/HTTP-oriented; Services are class-oriented (OOP) to allow stateful dependencies and testing; Repositories are DAOs for MongoDB.

Files added

- `models/smartBin.model.ts` — Mongoose models: `Bin` and `BinType`.
- `repositories/smartBin.repository.ts` — `SmartBinRepository` DAO with CRUD and spatial queries.
- `services/smartBin.service.ts` — `SmartBinService` class with maintenance lifecycle and business logic.
- `controllers/smartBin.controller.ts` — Functional HTTP handlers using `zod` for validation.
- `routes/smartBin.routes.ts` — Express router wiring endpoints and auth/authority middleware.

Contracts

- Bin (returned JSON):

```
{
  _id: string,
  code: string,
  type: string,
  currentWeight: number,
  limit: number,
  location?: { type: 'Point', coordinates: [lng, lat] },
  status: 'Active' | 'InMaintenance' | 'Decommissioned',
  metadata: object,
  createdAt: string,
  updatedAt: string
}
```

Example endpoints

- GET /api/smart-bin/ — list bins
- GET /api/smart-bin/:id — get bin by id or code
- POST /api/smart-bin/ — create bin (requires authority)
- PUT /api/smart-bin/:id — update bin (requires authority)
- DELETE /api/smart-bin/:id — delete bin (requires authority)
- POST /api/smart-bin/:id/report-weight — report current weight (authenticated)
- POST /api/smart-bin/:id/start-maintenance — mark maintenance started (authority)
- POST /api/smart-bin/:id/finish-maintenance — finish maintenance (authority)

Notes

- Add tests for `SmartBinService` and `SmartBinRepository` to ensure correctness around upserts and geospatial queries.
- Consider adding event publishing (e.g., notificationService) when a bin becomes full or enters maintenance.
- For heavy read patterns, consider creating a read-model (denormalized) to speed up dashboard queries.

Design patterns implemented

The module intentionally uses several well-known design patterns so contributors can quickly understand responsibilities and extension points.

- Layered Architecture (Controller → Service → Repository → Model)

  - Files: `controllers/smartBin.controller.ts`, `services/smartBin.service.ts`, `repositories/smartBin.repository.ts`, `models/smartBin.model.ts`
  - Purpose: separates concerns, improves testability and follows SRP.

- Repository / DAO pattern

  - Files: `repositories/smartBin.repository.ts` (class `SmartBinRepository`)
  - Purpose: encapsulates all MongoDB access (CRUD, geo queries, upserts) and makes the persistence layer swappable.

- Service Layer / Domain Service (class-oriented)

  - Files: `services/smartBin.service.ts` (class `SmartBinService`)
  - Purpose: holds business logic and lifecycle operations (weight reporting, maintenance), and accepts repositories via constructor (DI) for testability.

- Controllers as HTTP Adapters (thin, functional)

  - Files: `controllers/smartBin.controller.ts`
  - Purpose: validate HTTP requests (using `zod`), call the service, and format HTTP responses.

- Dependency Injection (constructor injection)

  - Files: `services/smartBin.service.ts` (constructor signature)
  - Purpose: decouples service from concrete repository implementation for easier testing and replacement.

- Active Record (Mongoose) wrapped by DAO

  - Files: `models/smartBin.model.ts`, used by `smartBin.repository.ts`
  - Purpose: keep schema/index definitions in models while avoiding leaking Mongoose into higher layers.

- Validation as Boundary Contract

  - Files: `controllers/smartBin.controller.ts` (zod schemas)
  - Purpose: enforce clear runtime contracts at the HTTP boundary.

- Async Handler / Higher-order middleware
  - Files: `controllers/smartBin.controller.ts` (exports `asyncHandler`) and `routes/smartBin.routes.ts`
  - Purpose: consistent async error handling and clean route wiring.

Quick suggestions for future enhancements

- Add an `ISmartBinRepository` TypeScript interface to make DI purely interface-driven (small refactor).
- Publish domain events (Observer) when a bin crosses thresholds so notification and metrics systems can subscribe without coupling.
- Implement Strategy pattern for different maintenance workflows if behaviors diverge by bin type.
- Add unit tests for `SmartBinService` (happy path + edge cases) and repository (geo queries).
