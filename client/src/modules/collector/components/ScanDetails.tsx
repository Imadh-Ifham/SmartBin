import React from "react";

interface Bin {
  id: number;
  lat: number;
  lng: number;
  status: "pending" | "collected" | "skipped";
  name?: string;
}

interface Props {
  bin?: Bin | undefined;
  lastScan?: string | null;
  onMarkCollected: () => void;
  onSkip: () => void;
  error?: string | null;
}

const ScanDetails: React.FC<Props> = ({
  bin,
  lastScan,
  onMarkCollected,
  onSkip,
  error,
}) => {
  return (
    <div className="w-full md:w-1/2 bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold">Scanned Bin Details</h3>
      {!lastScan && (
        <p className="text-sm text-gray-500 mt-2">
          Scan a bin QR to view details.
        </p>
      )}

      {bin ? (
        <div className="mt-3 space-y-2">
          <div>
            <strong>Name:</strong> {bin.name}
          </div>
          <div>
            <strong>ID:</strong> {bin.id}
          </div>
          <div>
            <strong>Coordinates:</strong> {bin.lat.toFixed(5)},{" "}
            {bin.lng.toFixed(5)}
          </div>
          <div>
            <strong>Status:</strong>{" "}
            <span
              className={
                bin.status === "collected"
                  ? "text-green-600"
                  : bin.status === "skipped"
                  ? "text-red-600"
                  : "text-yellow-600"
              }
            >
              {bin.status}
            </span>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              className="bg-green-600 text-white px-3 py-2 rounded-md"
              onClick={onMarkCollected}
            >
              Mark Collected
            </button>
            <button
              className="bg-red-600 text-white px-3 py-2 rounded-md"
              onClick={onSkip}
            >
              Skip
            </button>
          </div>
        </div>
      ) : (
        lastScan && (
          <div className="mt-3 text-sm text-gray-600">
            No local record for the scanned bin.
          </div>
        )
      )}

      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
    </div>
  );
};

export default ScanDetails;
