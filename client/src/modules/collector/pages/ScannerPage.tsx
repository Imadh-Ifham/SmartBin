import React, { useEffect } from "react";
import ManualScanner from "../components/ManualScanner";
import ScanDetails from "../components/ScanDetails";
import { QrCode, Keyboard } from "lucide-react";
import { useAppDispatch } from "../../../app/hooks";
import { fetchBinTypes } from "../slices/collectorThunk";

const ScannerPage: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const fetchData = async () => {
      await dispatch(fetchBinTypes());
    };
    fetchData();
  }, [dispatch]);

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Left Section — Scanners */}
      <div className="w-full md:w-1/2 bg-white rounded-2xl shadow-lg border border-gray-100 p-5 flex flex-col">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4">
          <QrCode className="text-green-600" size={24} /> Scan Bin
        </h2>

        {/* Video Scanner */}
        <div className="relative mb-4">{/* <VideoScanner /> */}</div>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-gray-300" />
          <span className="px-3 text-gray-500 text-sm font-medium">OR</span>
          <div className="flex-1 border-t border-gray-300" />
        </div>

        {/* Manual Scanner */}
        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Keyboard size={18} className="text-blue-600" /> Enter Manually
          </h3>
          <ManualScanner />
        </div>
      </div>

      {/* Right Section — Scan Details */}
      <div className="w-full md:w-1/2">
        <ScanDetails />
      </div>
    </div>
  );
};

export default ScannerPage;
