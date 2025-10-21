# Policy Module Documentation

## Overview

The Policy module manages the lifecycle, compliance, feedback, and audit trail of policies within the SmartBin system. It provides services for creating, updating, approving, listing, auditing, and validating policies, as well as handling stakeholder feedback and notifications.

## SOLID Principles & Design Patterns

- **Single Responsibility Principle (SRP):** Each service (PolicyService, NotificationService, etc.) is responsible for a distinct domain concern.
- **Open/Closed Principle (OCP):** Services are designed to be extended (e.g., compliance strategies) without modifying core logic.
- **Liskov Substitution Principle (LSP):** Service interfaces and DTOs allow for substitutable implementations.
- **Interface Segregation Principle (ISP):** DTOs and service interfaces are specific to their use cases.
- **Dependency Inversion Principle (DIP):** Services depend on abstractions (repositories, helpers) rather than concrete implementations.
- **Patterns Used:**
  - **Repository Pattern:** Data access is abstracted via `policyRepository`.
  - **Service Layer:** Business logic is encapsulated in service classes.
  - **Strategy Pattern:** Compliance logic can be swapped via `complianceService`.
  - **Factory Pattern:** DTOs and models are constructed via factory methods.
  - **Error Handling:** Centralized error responses and logging.

## Coding Standards

- TypeScript with strict typing
- JSDoc comments for all exported functions/classes
- Consistent naming conventions (camelCase for variables/functions, PascalCase for classes)
- Use of async/await for asynchronous operations
- Error handling via try/catch and standardized error responses
- Separation of concerns: controllers handle HTTP, services handle business logic, repositories handle data access

## Main Functions & Services

- **PolicyService**: Core business logic for policies
  - `create`, `update`, `approve`, `list`, `get`, `audit`, `versions`, `markIssue`, `revalidateCompliance`, `remove`
- **PolicyController**: HTTP layer for policy endpoints
- **policyRepository**: Data access for policies and versions
- **complianceService**: Compliance checking logic
- **notificationService**: Notification creation and sending
- **reportService**: Policy performance and violation reporting
- **feedbackService**: Stakeholder feedback management

## Architecture

- Express controllers route requests to service methods
- Services interact with repositories and helpers
- Mongoose models represent data entities
- Zod schemas validate and transform request payloads
- Audit trail and versioning are maintained for policy changes

## How to Use

- Import and use `PolicyService` for business logic
- Use `PolicyController` for HTTP endpoints
- Extend compliance or notification logic via respective services

## Example

```typescript
import { PolicyService } from "./policy.service";

const newPolicy = await PolicyService.create({
  title: "Waste Management Policy",
  description: "Details about waste management...",
  effectiveDate: new Date(),
  ministry: "Environment",
});
```

---

For further details, see the JSDoc comments in each file and function.

## Endpoint Reference

This is a quick reference of available HTTP endpoints exposed by the policy module.

- GET /policies/ — list policies. Supports query params: q, category, ministry, status, complianceStatus
- GET /policies/:id — get a single policy by id
- GET /policies/:id/versions — get historical versions for a policy (PolicyVersion records)
- GET /policies/:id/audit — get the audit trail for a policy
- POST /policies/ — create a policy (requires authority)
- PUT /policies/:id — update a policy (requires authority)
- POST /policies/:id/approve — approve a policy (requires authority)
- POST /policies/:id/issue — flag an issue on a policy (requires authority)
- POST /policies/:id/feedbackRequest — request stakeholder feedback (requires authority)
- POST /policies/:id/revalidateCompliance — re-run compliance check and notify if changed (requires authority)
- DELETE /policies/:id — delete a policy (requires authority)

## DTO / Data shapes (examples)

CreatePolicy (PolicyCreateDTO):

{
"title": "Waste Management Policy",
"description": "Detailed description...",
"effectiveDate": "2025-10-01",
"ministry": "Environment",
"category": "Waste",
"feedback": [{ "stakeholderType": "Resident", "message": "Please review" }]
}

UpdatePolicy (PolicyUpdateDTO): partial fields allowed, e.g.:

{ "title": "Updated title" }

FeedbackRequest:

{ "stakeholderGroups": ["resident","business"], "message": "Please review this policy" }

## How to run tests (module-only)

Run Jest from the `server` project root but target the policies module to ensure project transforms are used and avoid cross-package haste-map issues:

```powershell
cd c:\Users\lenovo\Desktop\SmartBin\SmartBin\server
npx jest src/modules/policies --runInBand --coverage --no-cache
```

Notes:

- Use `--runInBand` when debugging or when jest haste-map memory issues arise.

## Design notes points

- Separation of concerns: controllers validate and map HTTP requests; services implement business rules and orchestrate collaborators; repositories encapsulate data access.
- Patterns used:
  - Controller pattern: thin HTTP handlers delegating to services.
  - Service Layer: business logic (PolicyService) coordinates multiple helper services.
  - Repository Pattern: `policyRepository` isolates database operations and improves testability.
  - Strategy-like extensibility: `complianceService` is pluggable so compliance logic can be swapped.
- Error handling strategy:
  - Controllers return 400 for validation issues, 404 for not found, and 500 for server errors.
  - Services perform best-effort side-effects (notifications) and log warnings rather than failing the whole operation.
- Testing approach:
  - Unit tests mock external collaborators (notificationService, complianceService, policyRepository) to exercise service logic and edge cases.
  - Integration tests (Supertest) exercise routes and middleware.
