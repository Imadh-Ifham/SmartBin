import React, { useEffect } from "react";
import BinCard from "../components/BinCard";
import QRPanel from "../components/QRPanel";
import WeightForm from "../components/WeightForm";
import { useAppDispatch } from "../../../app/hooks";
import {
  selectBins,
  selectBinsError,
  selectBinsLoading,
} from "../slices/binSlice";
import { useSelector } from "react-redux";
import { fetchBinTypes, fetchQRWithBins } from "../slices/binThunk";

const SmartBin: React.FC = () => {
  const binCode = "WP-81582-K"; // fixed shared code
  const dispatch = useAppDispatch();

  // Selectors for bin state
  const bins = useSelector(selectBins);
  const loading = useSelector(selectBinsLoading);
  const error = useSelector(selectBinsError);

  useEffect(() => {
    const fetchData = async () => {
      await dispatch(fetchQRWithBins(binCode));
      await dispatch(fetchBinTypes());
    };
    fetchData();
  }, [dispatch, binCode]);

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center">
      {/* --- TOP SECTION --- */}
      <div className="w-full flex flex-col md:flex-row h-auto md:h-[80vh] px-6 md:px-12 py-8 md:py-12 gap-8">
        {/* LEFT: BIN GRID */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {loading && <div>Loading bins...</div>}
          {error && <div className="text-red-500">{error}</div>}
          {bins?.map((bin) => (
            <BinCard bin={bin} key={bin._id} />
          ))}
        </div>

        {/* RIGHT: QR + BIN CODE */}
        <div className="w-full md:w-1/3 flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-lg">
          <QRPanel code={binCode} />
        </div>
      </div>

      {/* --- SCROLL FORM SECTION --- */}
      <div className="w-full flex justify-center px-6 md:px-12 pb-12">
        <WeightForm />
      </div>
    </div>
  );
};

export default SmartBin;
