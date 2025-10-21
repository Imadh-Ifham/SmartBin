// @ts-ignore
import jsQR from "jsqr";
export type DetectedCallback = (raw: string) => void;
export type ErrorCallback = (msg: string) => void;
export type ScanningCallback = (scanning: boolean) => void;

export default class VideoScannerService {
  private stream: MediaStream | null = null;
  private raf = 0;
  private detector: any = null;
  private videoEl: HTMLVideoElement | null = null;
  private offscreenCanvas: HTMLCanvasElement | null = null;

  async start(
    videoEl: HTMLVideoElement,
    {
      onDetected,
      onError,
      onScanning,
    }: {
      onDetected?: DetectedCallback;
      onError?: ErrorCallback;
      onScanning?: ScanningCallback;
    } = {}
  ) {
    this.videoEl = videoEl;
    onError?.("");

    console.log("🎥 Starting camera...");

    try {
      // ✅ Use environment mode if available, else fallback
      const constraints: MediaStreamConstraints = {
        video: { facingMode: "environment" },
      };

      try {
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        console.warn(
          "Environment camera not available, using default front camera."
        );
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
      }

      videoEl.srcObject = this.stream;
      await videoEl.play();

      // ✅ Wait until the video has dimensions (some devices take a moment)
      await new Promise<void>((resolve) => {
        const checkReady = () => {
          if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
            console.log(
              "✅ Video ready:",
              videoEl.videoWidth,
              "x",
              videoEl.videoHeight
            );
            resolve();
          } else {
            requestAnimationFrame(checkReady);
          }
        };
        checkReady();
      });

      onScanning?.(true);
      console.log(
        "🔍 BarcodeDetector available:",
        !!(window as any).BarcodeDetector
      );

      // ✅ Prefer BarcodeDetector if available
      if ((window as any).BarcodeDetector) {
        this.detector = new (window as any).BarcodeDetector({
          formats: ["qr_code"],
        });

        const tick = async () => {
          if (!this.videoEl || this.videoEl.readyState < 2) {
            this.raf = requestAnimationFrame(tick);
            return;
          }

          try {
            const res = await this.detector.detect(
              this.videoEl as HTMLVideoElement
            );
            if (res && res.length) {
              console.log("✅ Detected QR:", res[0].rawValue);
              onDetected?.(res[0].rawValue);
            }
          } catch (e) {
            // ignore
          }

          this.raf = requestAnimationFrame(tick);
        };
        this.raf = requestAnimationFrame(tick);
      } else {
        // ✅ Fallback to jsQR
        console.log("⚠️ Using jsQR fallback...");
        this.offscreenCanvas = document.createElement("canvas");

        const tick = () => {
          if (!this.videoEl || !this.offscreenCanvas) {
            this.raf = requestAnimationFrame(tick);
            return;
          }

          const v = this.videoEl;
          const c = this.offscreenCanvas;
          const ctx = c.getContext("2d");
          if (!ctx) {
            this.raf = requestAnimationFrame(tick);
            return;
          }

          c.width = v.videoWidth || 640;
          c.height = v.videoHeight || 480;
          ctx.drawImage(v, 0, 0, c.width, c.height);

          try {
            const imageData = ctx.getImageData(0, 0, c.width, c.height);
            const code = jsQR(imageData.data, c.width, c.height);
            if (code && code.data) {
              console.log("✅ Detected QR (jsQR):", code.data);
              onDetected?.(code.data);
            }
          } catch (e) {
            console.warn("Error reading frame:", e);
          }

          this.raf = requestAnimationFrame(tick);
        };
        this.raf = requestAnimationFrame(tick);
      }
    } catch (err: any) {
      console.error("❌ Camera startup failed:", err);
      onError?.("Camera access denied or not available.");
      onScanning?.(false);
      this.stop();
    }
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.videoEl) {
      try {
        (this.videoEl as HTMLVideoElement).srcObject = null;
      } catch {}
      this.videoEl = null;
    }
    this.detector = null;
    this.offscreenCanvas = null;
    console.log("🛑 Scanner stopped.");
  }
}
