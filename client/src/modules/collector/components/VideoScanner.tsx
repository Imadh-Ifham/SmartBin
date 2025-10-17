import React, { useEffect, useRef, useState } from "react";
import VideoScannerService from "../services/VideoScannerService";
import ScanService from "../services/ScanService";

const service = new VideoScannerService();

const VideoScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);

  const scanService = new ScanService();
  const COOLDOWN_TIME = 5; // seconds

  const handleDetected = (raw: string) => {
    const id = scanService.parseId(raw);
    if (id !== null) {
      const found = scanService.findBin(raw);
      if (!found) setError("Bin not found in local data");
      else setError(null);
    }
  };

  const startScanner = () => {
    if (!videoRef.current) return;

    service.start(videoRef.current, {
      onDetected: handleDetected,
      onError: (err) => {
        console.error("Scanner error:", err);
        setError("Camera access failed. Retrying soon...");
        startCooldown();
      },
      onScanning: setScanning,
    });
  };

  const startCooldown = () => {
    setCooldown(COOLDOWN_TIME);
    service.stop();

    let countdown = COOLDOWN_TIME;
    const interval = setInterval(() => {
      countdown -= 1;
      setCooldown(countdown);

      if (countdown <= 0) {
        clearInterval(interval);
        setError(null);
        startScanner(); // retry after cooldown
      }
    }, 1000);
  };

  useEffect(() => {
    startScanner();
    return () => service.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        className="w-full h-[60vh] object-cover rounded-md bg-black"
        muted
        playsInline
      />
      <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-sm">
        {cooldown > 0 ? `Retrying in ${cooldown}s...` : "Scanning..."}
      </div>

      {/* {error && (
        <div className="mt-3 text-sm text-red-600 transition-all">{error}</div>
      )} */}
    </div>
  );
};

export default VideoScanner;
