import { WasteCollectionRepository } from "../repositories/waste-collection.repository";
import { WasteCollectionDoc } from "../models/waste-collection.model";
import { qrCodeService } from "../../smart-bin/services/qr-code.service";
import { smartBinService } from "../../smart-bin/services/smartBin.service";
import { Types } from "mongoose";

/**
 * Service layer for waste collection.
 * Contains business logic and interacts with the repository.
 */
export class WasteCollectionService {
  private repo: WasteCollectionRepository;

  constructor(repo?: WasteCollectionRepository) {
    this.repo = repo || new WasteCollectionRepository();
  }

  /**
   * Creates a new waste collection record by code.
   * 1. Fetch bins/qr by code using QRCodeService.getByCode
   * 2. Filter bins with currentWeight > 0
   * 3. Convert to wasteTypes array (type, weight, timestamp)
   * 4. Create waste-collection record
   * 5. Reset all bins' currentWeight to zero using SmartBinService.reportWeight
   *
   * @param code - The QR/bin code
   * @returns The created WasteCollection document
   */
  async createByCode(code: string): Promise<WasteCollectionDoc> {
    if (!code || typeof code !== "string" || !code.trim()) {
      throw new Error("'code' is required and must be a non-empty string.");
    }

    // 1. Fetch bins and qr by code
    const result = await qrCodeService.getByCode(code);
    if (!result || !result.qr || !Array.isArray(result.bins)) {
      throw new Error("QR or bins not found for code.");
    }
    const { qr, bins } = result;

    // 2. Filter bins with currentWeight > 0
    const nonZeroBins = (bins || []).filter(
      (b: any) => b.currentWeight && b.currentWeight > 0
    );
    if (nonZeroBins.length === 0) {
      throw new Error("No bins with non-zero weight to collect.");
    }

    // 3. Convert to wasteTypes array (type, weight, timestamp)
    const now = new Date();
    const wasteTypes = nonZeroBins
      .map((b: any) => ({
        type: Types.ObjectId.isValid(b.type) ? b.type : undefined,
        weight: b.currentWeight,
        timestamp: now,
      }))
      .filter((w: any) => w.type);
    if (wasteTypes.length === 0) {
      throw new Error("No valid bin types found for collection.");
    }

    // 4. Create waste-collection record
    const doc = await this.repo.create({ code, wasteTypes, collected: true });

    // 5. Reset all bins' currentWeight to zero
    await Promise.all(
      nonZeroBins.map((b: any) =>
        smartBinService.reportWeight(b._id.toString(), 0)
      )
    );

    return doc;
  }
}
