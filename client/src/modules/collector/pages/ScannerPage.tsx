import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../../app/store";
import { selectBins, markCollected, skipBin } from "../slices/collectorSlice";

interface Bin {
  id: number;
  lat: number;
  lng: number;
  status: "pending" | "collected" | "skipped";
  name?: string;
}

const ScannerPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bins = useSelector((s: RootState) => selectBins(s as any)) as Bin[];
  const dispatch = useDispatch();

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let detector: any = null;

    const start = async () => {
      setError(null);
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setScanning(true);

        // Use BarcodeDetector when available
        if ((window as any).BarcodeDetector) {
          detector = new (window as any).BarcodeDetector({
            formats: ["qr_code"],
          });
          const tick = async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) {
              raf = requestAnimationFrame(tick);
              return;
            }

            try {
              const result = await detector.detect(videoRef.current);
              if (result && result.length) {
                const raw = result[0].rawValue;
                handleScanned(raw);
              }
            } catch (e) {
              // ignore detection errors
            }

            raf = requestAnimationFrame(tick);
          };

          raf = requestAnimationFrame(tick);
        } else {
          // Fallback: basic canvas frame scanning + try to decode via external lib later
          const tick = () => {
            if (!videoRef.current || !canvasRef.current) {
              raf = requestAnimationFrame(tick);
              return;
            }
            const v = videoRef.current;
            const c = canvasRef.current;
            const ctx = c.getContext("2d");
            if (!ctx) return;
            c.width = v.videoWidth;
            c.height = v.videoHeight;
            ctx.drawImage(v, 0, 0, c.width, c.height);
            // no decoding here — show camera and allow manual photo upload if needed
            raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        }
      } catch (err: any) {
        console.error(err);
        setError("Camera access denied or not available.");
        setScanning(false);
      }
    };

    start();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, []);

  const handleScanned = (raw: string) => {
    if (!raw) return;
    setLastScan(raw);
    // assume payload is either numeric id or JSON { id }
    let id: number | null = null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) id = Number(parsed.id);
    } catch (_) {
      // not JSON
      const n = Number(raw);
      if (!Number.isNaN(n)) id = n;
    }

    if (id !== null) {
      // optionally fetch bin details from backend — for now read from store
      const found = bins.find((b) => b.id === id);
      if (!found) setError("Bin not found in local data");
      else setError(null);
    }
  };

  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      handleScanned(data);
    };
    reader.readAsText(f);
  };

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
      {/* Scanner / video */}
      <div className="w-full md:w-1/2 bg-white rounded-lg shadow-md p-2">
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full h-[60vh] object-cover rounded-md bg-black"
            muted
            playsInline
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-sm">
            {scanning ? "Scanning..." : "Camera inactive"}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <input
            type="file"
            accept="*/*"
            onChange={onFilePicked}
            className="hidden"
            id="scan-file"
          />
          <label
            htmlFor="scan-file"
            className="bg-gray-100 px-3 py-2 rounded-md cursor-pointer"
          >
            Upload (fallback)
          </label>
          <button
            className="bg-green-600 text-white px-3 py-2 rounded-md"
            onClick={() => {
              if (foundBin) dispatch(markCollected(foundBin.id));
            }}
            disabled={!foundBin}
          >
            Mark Collected
          </button>
          <button
            className="bg-red-600 text-white px-3 py-2 rounded-md"
            onClick={() => {
              if (foundBin) dispatch(skipBin(foundBin.id));
            }}
            disabled={!foundBin}
          >
            Skip
          </button>
        </div>

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        {lastScan && (
          <div className="mt-2 text-sm text-gray-700">
            Last scan: {lastScan}
          </div>
        )}
      </div>

      {/* Details panel: shows side-by-side on desktop, stacked on mobile */}
      <div className="w-full md:w-1/2 bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold">Scanned Bin Details</h3>
        {!lastScan && (
          <p className="text-sm text-gray-500 mt-2">
            Scan a bin QR to view details.
          </p>
        )}

        {foundBin ? (
          <div className="mt-3 space-y-2">
            <div>
              <strong>Name:</strong> {foundBin.name}
            </div>
            <div>
              <strong>ID:</strong> {foundBin.id}
            </div>
            <div>
              <strong>Coordinates:</strong> {foundBin.lat.toFixed(5)},{" "}
              {foundBin.lng.toFixed(5)}
            </div>
            <div>
              <strong>Status:</strong>{" "}
              <span
                className={
                  foundBin.status === "collected"
                    ? "text-green-600"
                    : foundBin.status === "skipped"
                    ? "text-red-600"
                    : "text-yellow-600"
                }
              >
                {foundBin.status}
              </span>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                className="bg-green-600 text-white px-3 py-2 rounded-md"
                onClick={() => dispatch(markCollected(foundBin.id))}
              >
                Mark Collected
              </button>
              <button
                className="bg-red-600 text-white px-3 py-2 rounded-md"
                onClick={() => dispatch(skipBin(foundBin.id))}
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
      </div>
    </div>
  );
};

export default ScannerPage;
