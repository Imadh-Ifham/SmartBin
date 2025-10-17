import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../../app/store";
import { selectBins, markCollected, skipBin } from "../slices/collectorSlice";
import VideoScanner from "../components/VideoScanner";
import ScanControls from "../components/ScanControls";
import ScanDetails from "../components/ScanDetails";
import ScanService from "../services/ScanService";

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

  const scanService = new ScanService();

  const handleDetected = (raw: string) => {
    setLastScan(raw);
    const id = scanService.parseId(raw);
    if (id !== null) {
      const found = scanService.findBin(raw, bins);
      if (!found) setError("Bin not found in local data");
      else setError(null);
    }
  };

  const onUpload = (data: string) => handleDetected(data);

  const foundBin = lastScan ? scanService.findBin(lastScan, bins) : undefined;

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
        />

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>} */}
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
