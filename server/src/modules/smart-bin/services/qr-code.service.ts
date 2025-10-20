import { qrCodeRepository } from "../repositories/qr-code.repository";
import type { IQRCode } from "../models/qr-code.model";
import { Readable } from "stream";
import cloudinary from "../../../config/cloudinary";

export interface UploadResult {
  url: string;
  secure_url?: string;
}

export class QRCodeService {
  constructor(
    private repo = qrCodeRepository,
    // optional injected helpers for easier testing
    private qrGenerator?: { toDataURL: (text: string) => Promise<string> }
  ) {}

  private async generateDataUrl(text: string) {
    if (this.qrGenerator) return this.qrGenerator.toDataURL(text);
    // lazy require to avoid failing when package not installed during tests
    const qrcode = require("qrcode");
    return qrcode.toDataURL(text);
  }

  private async uploadToCloudinary(dataUrl: string): Promise<UploadResult> {
    // Convert data URL to buffer
    const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!matches || !matches[2]) throw new Error("Invalid data URL");

    const buffer = Buffer.from(matches[2], "base64");

    return new Promise<UploadResult>((resolve, reject) => {
      try {
        const readable = new Readable();
        readable.push(buffer);
        readable.push(null);

        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "smartbin/qrcodes" },
          (err, result) => {
            if (err) return reject(err);
            resolve(result as UploadResult);
          }
        );

        readable.pipe(uploadStream);
      } catch (error) {
        reject(error);
      }
    });
  }

  private generateHumanReadableCode(province: string, city: string): string {
    const provinceMap: Record<string, string> = {
      "Western Province": "WP",
      "Central Province": "CP",
      "Southern Province": "SP",
      "Northern Province": "NP",
      "Eastern Province": "EP",
      "North Western Province": "NWP",
      "North Central Province": "NCP",
      "Uva Province": "UP",
      "Sabaragamuwa Province": "SGP",
    };

    // Take only first uppercase letter of city name (e.g., Kalutara -> K)
    const cityCode = city?.[0]?.toUpperCase() || "X";

    // Get province short code or fallback
    const provinceCode = provinceMap[province] || "XX";

    // Generate random 5-digit number
    const randomDigits = Math.floor(10000 + Math.random() * 90000);

    return `${provinceCode}-${randomDigits}-${cityCode}`;
  }

  async create(payload: Partial<IQRCode>) {
    // payload must include userId and address
    if (!payload.userId) throw new Error("userId is required");
    if (!payload.address) throw new Error("address is required");
    if (!payload.province) throw new Error("province is required");
    if (!payload.city) throw new Error("city is required");

    let code: string | null = null;
    let attempt = 0;
    const maxAttempts = 5;

    // 🔁 Try up to 5 times to generate a unique code
    while (attempt < maxAttempts) {
      attempt++;
      const generated = this.generateHumanReadableCode(
        payload.province,
        payload.city
      );
      const existing = await this.repo.findByCode(generated);

      if (!existing) {
        code = generated;
        break; // success
      }

      console.log(
        `Attempt ${attempt}: Code ${generated} already exists, retrying...`
      );
    }

    // ❌ If after 5 tries still not unique
    if (!code) {
      throw new Error(
        `Failed to generate a unique QR code after ${maxAttempts} attempts.`
      );
    }

    // generate QR image (data URL)
    const dataUrl = await this.generateDataUrl(code);

    // upload to cloud
    const upload = await this.uploadToCloudinary(dataUrl);

    const doc: Partial<IQRCode> = {
      code,
      qrUrl: (upload.secure_url || upload.url) as string,
      userId: payload.userId!,
      address: payload.address!,
      province: payload.province, // <--- add this
      city: payload.city, // <--- add this
      location: (payload.location as any) || undefined,
      status: (payload.status as any) || ("Active" as any),
      description: payload.description as any,
    };

    return this.repo.create(doc);
  }
}

export const qrCodeService = new QRCodeService();
