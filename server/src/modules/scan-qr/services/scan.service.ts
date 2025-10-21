import { qrCodeService } from "../../smart-bin/services/qr-code.service";
import { scanRepository } from "../repositories/scan.repository";

/**
 * Payload structure for a QR scan.
 */
export interface IScanPayload {
  /** The scanned QR code string */
  code: string;

  /** Source of the scan, e.g., 'mobile', 'kiosk' */
  source: string;

  /** Optional user ID of the person scanning */
  userId?: string;
}

/**
 * Service layer for handling QR code scans.
 *
 * Responsibilities:
 * - Validates scan payloads
 * - Retrieves QR code details
 * - Checks QR subscription status
 * - Records scans (fire-and-forget)
 */
export class ScanService {
  constructor(
    private qrService = qrCodeService,
    private repo = scanRepository
  ) {}

  /**
   * Handles a QR scan.
   *
   * Flow:
   * 1. Validates that `code` is provided.
   * 2. Records the scan asynchronously.
   * 3. Retrieves QR code data from the QR service.
   * 4. Checks if the QR subscription is active.
   *
   * @param payload - Scan details including code, source, and optional userId
   * @returns QR code data if found and active
   * @throws {Error} If code is missing
   * @throws {Object} If QR code not found or subscription inactive
   */
  async handleScan(payload: IScanPayload) {
    if (!payload.code) {
      throw new Error("Scan code is required");
    }

    this.recordScan(payload); // Fire and forget

    const qrData = await this.qrService.getByCode(payload.code);
    if (!qrData) throw { status: 404, message: "QR Code not found" };

    const isActive = await this.qrService.checkSubscription(qrData.qr.status);
    if (!isActive)
      throw { status: 400, message: "QR Code subscription inactive" };

    return qrData;
  }

  /**
   * Records the scan in the database asynchronously.
   *
   * @param payload - Scan details
   */
  async recordScan(payload: IScanPayload) {
    this.repo.save(payload); // Fire and forget
  }
}

/** Singleton instance of the ScanService */
export const scanService = new ScanService();
