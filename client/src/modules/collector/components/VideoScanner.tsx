import React, { useEffect, useRef } from "react";

interface Props {
  onDetected: (raw: string) => void;
  onError?: (msg: string) => void;
  setScanning: (s: boolean) => void;
}

const VideoScanner: React.FC<Props> = ({
  onDetected,
  onError,
  setScanning,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let detector: any = null;

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setScanning(true);

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
              const res = await detector.detect(videoRef.current);
              if (res && res.length) onDetected(res[0].rawValue);
            } catch (e) {}
            raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        } else {
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
            raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        }
      } catch (err: any) {
        onError?.("Camera access denied or not available.");
        setScanning(false);
      }
    };

    start();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [onDetected, onError, setScanning]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        className="w-full h-[60vh] object-cover rounded-md bg-black"
        muted
        playsInline
      />
      <canvas ref={canvasRef} className="hidden" />
      <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded-md text-sm">
        Scanning...
      </div>
    </div>
  );
};

export default VideoScanner;
