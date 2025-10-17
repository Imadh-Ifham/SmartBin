import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../../app/store";
import { selectBins, markCollected, skipBin } from "../slices/collectorSlice";
import VideoScanner from "../components/VideoScanner";
import ScanControls from "../components/ScanControls";
import ScanDetails from "../components/ScanDetails";

interface Bin {
  id: number;
  lat: number;
  lng: number;
  status: "pending" | "collected" | "skipped";
  name?: string;
}

const ScannerPage: React.FC = () => {
  const [, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bins = useSelector((s: RootState) => selectBins(s as any)) as Bin[];
  const dispatch = useDispatch();

  const handleDetected = (raw: string) => {
    setLastScan(raw);
    // parse id same as before
    let id: number | null = null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) id = Number(parsed.id);
    } catch (_) {
      const n = Number(raw);
      if (!Number.isNaN(n)) id = n;
    }

    if (id !== null) {
      const found = bins.find((b) => b.id === id);
      if (!found) setError("Bin not found in local data");
      else setError(null);
    }
  };

  const onUpload = (data: string) => handleDetected(data);

  const foundBin = lastScan
    ? (() => {
        let id: number | null = null;
        try {
          const parsed = JSON.parse(lastScan);
          if (parsed && parsed.id) id = Number(parsed.id);
        } catch (_) {
          const n = Number(lastScan);
          if (!Number.isNaN(n)) id = n;
        }
        return id !== null ? bins.find((b) => b.id === id) : undefined;
      })()
    : undefined;

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="w-full md:w-1/2 bg-white rounded-lg shadow-md p-2">
        {/* <VideoScanner
          onDetected={handleDetected}
          onError={setError}
          setScanning={setScanning}
        />
        <ScanControls
          lastScan={lastScan}
          onUpload={onUpload}
          onMarkCollected={() =>
            foundBin && dispatch(markCollected(foundBin.id))
          }
          onSkip={() => foundBin && dispatch(skipBin(foundBin.id))}
          disabled={!foundBin}
        /> */}

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      </div>

      <ScanDetails
        bin={foundBin}
        lastScan={lastScan}
        onMarkCollected={() => foundBin && dispatch(markCollected(foundBin.id))}
        onSkip={() => foundBin && dispatch(skipBin(foundBin.id))}
        error={error}
      />
    </div>
  );
};

export default ScannerPage;
