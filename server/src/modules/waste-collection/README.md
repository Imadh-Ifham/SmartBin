# Waste Collection Module

This module manages the collection of waste from bins, tracking the type and weight of waste collected for each bin, along with collection status and timestamps.

## Model: WasteCollection

**File:** `models/waste-collection.model.ts`

Represents a waste collection event for a bin.

- `code` (`string`): The bin code (unique identifier for the bin).
- `wasteTypes` (`Array<{ type: string, weight: number, timestamp: Date }>`): Array of waste type entries for this collection event.
  - `type`: Type of waste (e.g., Plastic, Organic).
  - `weight`: Weight of this waste type.
  - `timestamp`: When this weight was recorded (defaults to now).
- `collected` (`boolean`): Whether the bin has been collected (default: false).
- Timestamps: `createdAt`, `updatedAt` (managed by Mongoose).

## Repository: WasteCollectionRepository

**File:** `repositories/waste-collection.repository.ts`

Handles database operations for waste collection records.

- `create(data)`: Creates a new waste collection record in the database.

## Service: WasteCollectionService

**File:** `services/waste-collection.service.ts`

Business logic for waste collection.

- `create(data)`: Validates and creates a new waste collection record via the repository.

## Controller: WasteCollectionController

**File:** `controllers/waste-collection.controller.ts`

Handles HTTP requests for waste collection.

- `createWasteCollection(req, res)`: Validates input and creates a new waste collection record. Returns the created document or a validation error.

### Validation Rules

- `code`: Required, non-empty string.
- `wasteTypes`: Required, non-empty array.
  - Each entry must be an object with:
    - `type`: Required, non-empty string.
    - `weight`: Required, number.
    - `timestamp`: Optional, must be a valid date string if provided.
- `collected`: Optional, must be boolean if provided.

## Routes

**File:** `routes/waste-collection.routes.ts`

- `POST /api/waste-collections`: Create a new waste collection record.
  - Body: `{ code: string, wasteTypes: [{ type, weight, timestamp }], collected?: boolean }`
  - Response: `{ message: string, item: WasteCollectionDoc }` on success, or `{ message: string }` on error.

## Example Request

```json
POST /api/waste-collections
{
	"code": "BIN-001",
	"wasteTypes": [
		{ "type": "Plastic", "weight": 12.5, "timestamp": "2025-10-21T10:00:00Z" },
		{ "type": "Organic", "weight": 8.2 }
	],
	"collected": true
}
```

## Design Notes

- Follows SOLID and separation of concerns: model, repository, service, controller, and routes are separated.
- Only the create operation is supported for now.
- All input is validated in the controller before creating a record.
