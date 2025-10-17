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

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      videoEl.srcObject = this.stream;
      await videoEl.play();
      onScanning?.(true);

      // Use BarcodeDetector if available
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
              onDetected?.(res[0].rawValue);
            }
          } catch (e) {
            // ignore detection errors
          }
          this.raf = requestAnimationFrame(tick);
        };
        this.raf = requestAnimationFrame(tick);
      } else {
        // Fallback: draw to an offscreen canvas so UI component doesn't need one
        this.offscreenCanvas = document.createElement("canvas");
        const tick = () => {
          if (!this.videoEl || !this.offscreenCanvas) {
            this.raf = requestAnimationFrame(tick);
            return;
          }
          const v = this.videoEl;
          const c = this.offscreenCanvas as HTMLCanvasElement;
          const ctx = c.getContext("2d");
          if (!ctx) return;
          c.width = v.videoWidth || 640;
          c.height = v.videoHeight || 480;
          try {
            ctx.drawImage(v, 0, 0, c.width, c.height);
          } catch (e) {}
          // No decoding here (no jsQR). Keep rendering so callers can later decode if desired.
          this.raf = requestAnimationFrame(tick);
        };
        this.raf = requestAnimationFrame(tick);
      }
    } catch (err: any) {
      console.error(err);
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
      } catch (e) {}
      this.videoEl = null;
    }
    this.detector = null;
    this.offscreenCanvas = null;
  }
}
