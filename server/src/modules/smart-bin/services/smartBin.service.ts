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

  async getBin(idOrCode: string) {
    if (Types.ObjectId.isValid(idOrCode)) return this.repo.findById(idOrCode);
    return this.repo.findByCode(idOrCode);
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

  async reportWeight(codeOrId: string, weight: number) {
    const bin: any = await this.getBin(codeOrId);
    if (!bin) throw new Error("Bin not found");
    bin.currentWeight = weight;
    // optional threshold event: switch status to InMaintenance if over limit
    if (bin.limit && bin.currentWeight > bin.limit) {
      bin.status = "InMaintenance";
    }
    return this.repo.update(bin);
  }
}

export const smartBinService = new SmartBinService();
