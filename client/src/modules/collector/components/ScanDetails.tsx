import React from "react";
import { Trash2, MapPin, User, CheckCircle, XCircle } from "lucide-react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  selectScanBins,
  selectScanQR,
  selectScanLoading,
  selectScanError,
  clearCurrentScan,
} from "../slices/scanSlice";
import { markBinsCollected } from "../slices/scanThunk";
import BinCard from "./BinCard";
import { useAppDispatch } from "../../../app/hooks";

const ScanDetails: React.FC = () => {
  const dispatch = useAppDispatch();
  const bins = useSelector(selectScanBins);
  const qr = useSelector(selectScanQR);
  const loading = useSelector(selectScanLoading);
  const error = useSelector(selectScanError);

  const handleSkip = () => {
    dispatch(clearCurrentScan());
  };

  const handleMarkCollected = async () => {
    if (!qr?.code) return;

    try {
      await dispatch(markBinsCollected(qr.code)).unwrap();
      // Success - show toast notification
      toast.success(`Bins collected successfully! (${qr.code})`, {
        duration: 3000,
        position: "top-center",
        icon: "✅",
      });
      // State will be cleared automatically by the reducer
    } catch (error) {
      // Error will be shown in the UI via selectScanError
      toast.error("Failed to mark bins as collected", {
        duration: 4000,
        position: "top-center",
      });
      console.error("Failed to mark bins as collected:", error);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 border border-gray-100 text-center text-gray-500">
        Loading scan data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 border border-gray-100 text-center">
        <div className="text-red-600 font-semibold mb-2">Error</div>
        <div className="text-gray-600">{error}</div>
      </div>
    );
  }

  if (!qr || !bins || bins.length === 0) {
    return (
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 border border-gray-100 text-center text-gray-500">
        No bin data available. Scan a QR code to get started.
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
        {/* QR Code */}
        <div className="flex items-center gap-2">
          <User className="text-gray-500" />
          <span className="font-semibold">Code: {qr.code}</span>
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

        {/* Bins List */}
        <div className="mt-4">
          <h4 className="font-semibold text-gray-800 mb-2">
            Bins ({bins.length})
          </h4>
          <div className="space-y-2">
            {bins.map((bin) => (
              <BinCard bin={bin} key={bin._id} />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={handleMarkCollected}
            disabled={loading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            <CheckCircle size={18} />
            {loading ? "Processing..." : "Mark Collected"}
          </button>
          <button
            onClick={handleSkip}
            disabled={loading}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            <XCircle size={18} /> Skip
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanDetails;
