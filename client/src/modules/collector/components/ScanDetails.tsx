import React from "react";
import { Trash2, MapPin, User, CheckCircle, XCircle } from "lucide-react";
import { useSelector } from "react-redux";
import { selectBins, selectQR } from "../../smart-bin/slices/binSlice";
import BinCard from "./BinCard";

const ScanDetails: React.FC = () => {
  // Use the first bin as an example; replace with logic to select the scanned bin as needed
  const bins = useSelector(selectBins);
  const qr = useSelector(selectQR);
  const bin = bins && bins.length > 0 ? bins[0] : null;

  if (!bin || !qr) {
    return (
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 border border-gray-100 text-center text-gray-500">
        No bin data available.
      </div>
    );
  }

  // Use QR for owner/address, bin for type/weight/limit
  return (
    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Trash2 className="text-green-600" /> Bin Details
        </h3>
        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700">
          ACTIVE
        </span>
      </div>

      <div className="mt-5 space-y-4 text-gray-700">
        {/* Owner Info */}
        <div className="flex items-center gap-2">
          <User className="text-gray-500" />
          <span className="font-semibold">{qr.ownerName || "-"}</span>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2">
          <MapPin className="text-gray-500 mt-1" />
          <div>
            <div>{qr.address || "-"}</div>
            <div className="text-sm text-gray-500">
              {qr.province}, {qr.city}
            </div>
          </div>
        </div>

        {/* Bin Code */}
        <div>
          <span className="font-semibold text-gray-800">Bin Code:</span>{" "}
          <span className="text-gray-600">{bin._id}</span>
        </div>

        {/* Waste Type Details (for this bin) */}

        <div className="mt-4" key={bin._id}>
          <h4 className="font-semibold text-gray-800 mb-2">Bin Details</h4>
          <div className="space-y-2">
            {bins.map((bin) => (
              <BinCard bin={bin} key={bin._id} />
            ))}
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
