import React from "react";
import RouteMap from "../components/RouteMap";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../../app/store";
import { markCollected, skipBin, selectBins } from "../slices/collectorSlice";

interface Bin {
  id: number;
  lat: number;
  lng: number;
  status: "pending" | "collected" | "skipped";
  name?: string;
}

const TrackerPage: React.FC = () => {
  const dispatch = useDispatch();
  const bins = useSelector((state: RootState) =>
    selectBins(state as any)
  ) as Bin[];

  const totalBins = bins.length;
  const collectedBins = bins.filter(
    (b: any) => b.status === "collected"
  ).length;

  const onMarkCollected = (id: number) => dispatch(markCollected(id));
  const onSkipBin = (id: number) => dispatch(skipBin(id));

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Map Section */}
      <div className="w-full md:w-2/3 h-[70vh] rounded-lg shadow-md overflow-hidden relative">
        <RouteMap
          bins={bins}
          onMarkCollected={onMarkCollected}
          onSkipBin={onSkipBin}
        />

        {/* Floating Action Buttons */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition">
            Scan QR
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition"
            onClick={() => {
              // mark first pending as collected for quick action in UI
              const firstPending = bins.find(
                (b: any) => b.status === "pending"
              );
              if (firstPending) onMarkCollected(firstPending.id);
            }}
          >
            Mark Collected
          </button>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition"
            onClick={() => {
              const firstPending = bins.find(
                (b: any) => b.status === "pending"
              );
              if (firstPending) onSkipBin(firstPending.id);
            }}
          >
            Skip
          </button>
        </div>
      </div>

      {/* Side Panel / Stats for desktop */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        {/* Progress */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="font-semibold text-gray-700 mb-2">Daily Progress</h2>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full"
              style={{ width: `${(collectedBins / totalBins) * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {collectedBins} of {totalBins} bins collected
          </p>
        </div>

        {/* Next Bins */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="font-semibold text-gray-700 mb-2">Next Bins</h2>
          <ul className="space-y-2">
            {bins
              .filter((b: Bin) => b.status === "pending")
              .slice(0, 3)
              .map((b: Bin) => (
                <li key={b.id} className="flex justify-between items-center">
                  <span>{b.name}</span>
                  <span className="text-sm text-gray-500">
                    {b.lat.toFixed(4)}, {b.lng.toFixed(4)}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TrackerPage;
