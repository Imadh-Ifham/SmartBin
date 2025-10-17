import React from "react";
import {
  Trash2,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  Scale,
} from "lucide-react";

interface WasteType {
  type: string;
  allowedWeight: number;
  currentWeight: number;
}

interface Bin {
  id: string;
  ownerName: string;
  address: string;
  lat: number;
  lng: number;
  wasteTypes: WasteType[];
  status: "pending" | "collected" | "skipped";
}

const ScanDetails: React.FC = () => {
  // Dummy bin data
  const bin: Bin = {
    id: "BIN-0021",
    ownerName: "Ameer Rahman",
    address: "42, Beach Road, Colombo 03",
    lat: 6.9271,
    lng: 79.8612,
    wasteTypes: [
      { type: "Plastic", allowedWeight: 25, currentWeight: 28 },
      { type: "Organic", allowedWeight: 15, currentWeight: 12 },
      { type: "Metal", allowedWeight: 10, currentWeight: 3 },
    ],
    status: "pending",
  };

  return (
    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Trash2 className="text-green-600" /> Bin Details
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            bin.status === "collected"
              ? "bg-green-100 text-green-700"
              : bin.status === "skipped"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {bin.status.toUpperCase()}
        </span>
      </div>

      <div className="mt-5 space-y-4 text-gray-700">
        {/* Owner Info */}
        <div className="flex items-center gap-2">
          <User className="text-gray-500" />
          <span className="font-semibold">{bin.ownerName}</span>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2">
          <MapPin className="text-gray-500 mt-1" />
          <div>
            <div>{bin.address}</div>
            <div className="text-sm text-gray-500">
              ({bin.lat.toFixed(4)}, {bin.lng.toFixed(4)})
            </div>
          </div>
        </div>

        {/* Bin Code */}
        <div>
          <span className="font-semibold text-gray-800">Bin Code:</span>{" "}
          <span className="text-gray-600">{bin.id}</span>
        </div>

        {/* Waste Type Details */}
        <div className="mt-4">
          <h4 className="font-semibold text-gray-800 mb-2">
            Waste Type Details
          </h4>
          <div className="space-y-2">
            {bin.wasteTypes.map((w, idx) => {
              const exceeded = w.currentWeight > w.allowedWeight;
              const percentage = Math.min(
                (w.currentWeight / w.allowedWeight) * 100,
                100
              );
              const exceededBy = exceeded
                ? (w.currentWeight - w.allowedWeight).toFixed(1)
                : null;

              return (
                <div
                  key={idx}
                  className="bg-gray-50 rounded-lg p-3 flex justify-between items-center border border-gray-100"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Scale size={16} className="text-gray-500" />
                      <span className="font-medium">{w.type}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Allowed: {w.allowedWeight} unit
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-semibold ${
                        exceeded
                          ? "text-red-600"
                          : w.currentWeight >= w.allowedWeight * 0.9
                          ? "text-orange-600"
                          : "text-green-600"
                      }`}
                    >
                      {w.currentWeight} unit
                    </span>
                    {exceeded && (
                      <div className="text-xs text-red-600 mt-0.5">
                        Exceeded by {exceededBy} unit
                      </div>
                    )}
                    <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                      <div
                        className={`h-2 rounded-full ${
                          exceeded
                            ? "bg-red-600"
                            : w.currentWeight >= w.allowedWeight * 0.9
                            ? "bg-orange-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition">
            <CheckCircle size={18} /> Mark Collected
          </button>
          <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition">
            <XCircle size={18} /> Skip
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanDetails;
