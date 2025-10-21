# Waste Collection Module

This module manages the collection of waste from bins, tracking the type and weight of waste collected for each bin, along with collection status and timestamps.

## Model: WasteCollection

**File:** `models/waste-collection.model.ts`

Represents a waste collection event for a bin or set of bins.

- `code` (`string`): The bin code (unique identifier for the bin/QR).
- `wasteTypes` (`Array<{ type: string, weight: number, timestamp: Date }>`): Array of waste type entries for this collection event, auto-generated from bins with non-zero weight at collection time.
  - `type`: Type of waste (ObjectId reference to bin type).
  - `weight`: Weight of this waste type (from bin's currentWeight).
  - `timestamp`: When this weight was recorded (set to collection time).
- `collected` (`boolean`): Always `true` for this operation.
- Timestamps: `createdAt`, `updatedAt` (managed by Mongoose).

## Repository: WasteCollectionRepository

**File:** `repositories/waste-collection.repository.ts`

Handles database operations for waste collection records.

- `create(data)`: Creates a new waste collection record in the database.

## Service: WasteCollectionService

**File:** `services/waste-collection.service.ts`

Business logic for waste collection.

- `createByCode(code: string)`: Accepts only a bin/QR code, fetches bins and QR via the QRCodeService, filters bins with non-zero weight, generates the wasteTypes array, creates the waste collection record, and resets all collected bins' currentWeight to zero.

## Controller: WasteCollectionController

**File:** `controllers/waste-collection.controller.ts`

Handles HTTP requests for waste collection.

- `createWasteCollection(req, res)`: Accepts only `{ code: string }` in the request body. All other logic (fetching bins, filtering, wasteTypes generation, collection, and bin weight reset) is handled internally by the service. Returns the created document or a validation error.

### Validation Rules

- `code`: Required, non-empty string.

## Routes

**File:** `routes/waste-collection.routes.ts`

- `POST /api/waste-collections`: Create a new waste collection record.
  - Body: `{ code: string }`
  - Response: `{ message: string, item: WasteCollectionDoc }` on success, or `{ message: string }` on error.

## Example Request

```json
POST /api/waste-collections
{
  "code": "BIN-001"
}
```

The backend will:

- Fetch the QR and bins for the code
- Filter bins with non-zero currentWeight
- Generate the wasteTypes array
- Create the waste collection record
- Reset all collected bins' currentWeight to zero

## Design Notes

- Follows SOLID and separation of concerns: model, repository, service, controller, and routes are separated.
- Only the create operation is supported for now.
- All input is validated in the controller before creating a record.
- The client only provides the code; all bin/QR lookup, wasteTypes generation, and bin weight reset are handled server-side for data integrity and security.
