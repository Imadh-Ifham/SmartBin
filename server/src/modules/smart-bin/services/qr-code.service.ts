import { qrCodeRepository } from "../repositories/qr-code.repository";
import type { IQRCode } from "../models/qr-code.model";
import imagekit from "../../../config/imagekit";
import { smartBinService } from "./smartBin.service";

export interface UploadResult {
  url: string;
}

export class QRCodeService {
  constructor(
    private repo = qrCodeRepository,
    private qrGenerator?: { toDataURL: (text: string) => Promise<string> },
    private provinceMap: Record<string, string> = {
      "Western Province": "WP",
      "Central Province": "CP",
      "Southern Province": "SP",
      "Northern Province": "NP",
      "Eastern Province": "EP",
      "North Western Province": "NWP",
      "North Central Province": "NCP",
      "Uva Province": "UP",
      "Sabaragamuwa Province": "SGP",
    },
    private binService = smartBinService
  ) {}

  private async generateDataUrl(text: string) {
    if (this.qrGenerator) return this.qrGenerator.toDataURL(text);
    const qrcode = require("qrcode");
    return qrcode.toDataURL(text);
  }

  private async uploadToImageKit(dataUrl: string): Promise<UploadResult> {
    const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!matches || !matches[2]) throw new Error("Invalid data URL");

    const base64Data = matches[2];

    const uploadResponse = await imagekit.upload({
      file: base64Data,
      fileName: `qr_${Date.now()}.png`,
      folder: "/smartbin/qrcodes",
    });

    return { url: uploadResponse.url };
  }

  private generateHumanReadableCode(province: string, city: string): string {
    const cityCode = city?.[0]?.toUpperCase() || "X";
    const provinceCode = this.provinceMap[province] || "XX";
    const randomDigits = Math.floor(10000 + Math.random() * 90000);

    return `${provinceCode}-${randomDigits}-${cityCode}`;
  }

  async create(payload: Partial<IQRCode>) {
    if (!payload.userId) throw new Error("userId is required");
    if (!payload.address) throw new Error("address is required");
    if (!payload.province) throw new Error("province is required");
    if (!payload.city) throw new Error("city is required");

    let code: string | null = null;
    let attempt = 0;
    const maxAttempts = 5;

    while (attempt < maxAttempts) {
      attempt++;
      const generated = this.generateHumanReadableCode(
        payload.province,
        payload.city
      );
      const existing = await this.repo.findByCode(generated);

      if (!existing) {
        code = generated;
        break;
      }
      console.log(
        `Attempt ${attempt}: Code ${generated} already exists, retrying...`
      );
    }

    if (!code) {
      throw new Error(
        `Failed to generate a unique QR code after ${maxAttempts} attempts.`
      );
    }

    const dataUrl = await this.generateDataUrl(code);
    const upload = await this.uploadToImageKit(dataUrl);

    const doc: Partial<IQRCode> = {
      code,
      qrUrl: upload.url,
      userId: payload.userId!,
      address: payload.address!,
      province: payload.province,
      city: payload.city,
      location: payload.location as any,
      status: (payload.status as any) || "Active",
      description: payload.description as any,
    };

    return this.repo.create(doc);
  }

  async getByCode(code: string) {
    const qr = await this.repo.findByCode(code);
    if (!qr) return null;
    // ask the bin service to find a bin by this qr code
    const bins = await this.binService.getBin(undefined, qr._id.toString());
    return { qr, bins };
  }
}

export const qrCodeService = new QRCodeService();
