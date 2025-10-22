import { smartBinRepository } from "../repositories/smartBin.repository";
import type { IBin } from "../models/smartBin.model";
import { Types } from "mongoose";

export class SmartBinService {
  constructor(private repo = smartBinRepository) {}

  async createBin(payload: Partial<IBin>) {
    if (!payload.type) throw new Error("Bin type is required");
    if (!payload.qrCode) throw new Error("QR code is required");

    // Validate ObjectId-like fields when provided as strings
    if (
      typeof payload.type === "string" &&
      !Types.ObjectId.isValid(payload.type)
    )
      throw new Error("Invalid bin type id");
    if (
      payload.qrCode &&
      typeof payload.qrCode === "string" &&
      !Types.ObjectId.isValid(payload.qrCode)
    )
      throw new Error("Invalid qrCode id");

    // Validate optional numeric fields
    if (payload.limit !== undefined && typeof payload.limit !== "number")
      throw new Error("Limit must be a number");

    return this.repo.create(payload);
  }

  async getBin(id?: string, qrCode?: string) {
    if (id) {
      return this.repo.findById(id!);
    }
    if (qrCode) {
      return this.repo.findByCode(qrCode!);
    }
  }

  async list(query: any = {}) {
    return this.repo.find(query);
  }

  async updateBin(id: string, patch: Partial<IBin>) {
    const bin = await this.repo.findById(id);
    if (!bin) return null;
    Object.assign(bin, patch);
    return this.repo.update(bin);
  }

  async deleteBin(id: string) {
    return this.repo.deleteById(id);
  }

  async reportWeight(id: string, weight: number) {
    const bin: any = await this.getBin(id);
    if (!bin) throw new Error("Bin not found");
    bin.currentWeight = weight;

    return this.repo.update(bin);
  }

  /**
   * Checks if any bins under a QR code are overweight
   * @param qrCode - QR code ID to check bins for
   * @returns Object with hasOverweight flag and list of overweight bins
   */
  async checkOverweightBins(qrCode: string) {
    const bins = await this.repo.findByCode(qrCode);

    if (!bins || bins.length === 0) {
      return { hasOverweight: false, overweightBins: [] };
    }

    const overweightBins = bins.filter(
      (bin: any) => bin.currentWeight > bin.limit
    );

    return {
      hasOverweight: overweightBins.length > 0,
      overweightBins: overweightBins.map((bin: any) => ({
        id: bin._id,
        type: bin.type,
        currentWeight: bin.currentWeight,
        limit: bin.limit,
        exceededBy: bin.currentWeight - bin.limit,
      })),
    };
  }
}

export const smartBinService = new SmartBinService();
