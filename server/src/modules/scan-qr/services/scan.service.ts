import { qrCodeService } from "../../smart-bin/services/qr-code.service";
import { scanRepository } from "../repositories/scan.repository";

export interface IScanPayload {
  code: string;
  source: string;
  userId?: string;
}

export class ScanService {
  constructor(
    private qrService = qrCodeService,
    private repo = scanRepository
  ) {}

  async handleScan(payload: IScanPayload) {
    if (!payload.code) {
      throw new Error("Scan code is required");
    }

    this.recordScan(payload); // No await, Fire and forget

    const qrData = await this.qrService.getByCode(payload.code);
    if (!qrData) throw { status: 404, message: "QR Code not found" };

    const isActive = await this.qrService.checkSubscription(qrData.qr.status);
    if (!isActive)
      throw { status: 400, message: "QR Code subscription inactive" };

    return qrData;
  }

  async recordScan(payload: IScanPayload) {
    this.repo.save(payload); // No await, fire and forget
  }
}

export const scanService = new ScanService();
