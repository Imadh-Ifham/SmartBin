# Scan-QR Module

This module processes QR scan payloads from camera/manual/file sources, deduplicates rapid repeats, persists scan events and attempts to resolve them to known bins via `smartBinService`.

Design principles

- Follows SOLID/HCL: controllers are thin, services are class-oriented (EventEmitter), repositories manage persistence.
- Deduplicate: short time-window dedupe to avoid repeated detection noise from camera feeds.
- Event-driven: `ScanService` emits `scan:detected` events with the saved scan and resolved bin for downstream processing (notifications, metrics).

Files

- `models/scan.model.ts` — `ScanEvent` persisted model for each scan.
- `repositories/scan.repository.ts` — `ScanRepository` for save and recent lookup.
- `services/scan.service.ts` — `ScanService` (extends EventEmitter) handling parse, dedupe, save and bin resolution via `smartBinService`.
- `controllers/scan.controller.ts` — HTTP controller with `zod` validation.
- `routes/scan.routes.ts` — router exposing POST /api/scan-qr/ (authenticated).

Usage

- POST /api/scan-qr/ { raw: string, source?: 'camera'|'manual'|'file' }
  - Returns the saved scan and resolved bin (if found) or a `deduped: true` flag when the same raw value was recently processed.

Integration tips

- Subscribe to `scanService.on('scan:detected', handler)` to perform side-effects: create collection requests, notify collectors, track metrics.
- If you need stronger dedupe semantics across app instances, replace the in-process time-window check with a distributed dedupe store (Redis with TTL).
