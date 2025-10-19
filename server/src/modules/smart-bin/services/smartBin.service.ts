import { smartBinRepository } from "../repositories/smartBin.repository";
import type { IBin } from "../models/smartBin.model";
import { Types } from "mongoose";

export class SmartBinService {
  constructor(private repo = smartBinRepository) {}

  async createBin(payload: Partial<IBin>) {
    // enforce uniqueness of code
    if (!payload.code) throw new Error("Bin code is required");
    const existing = await this.repo.findByCode(payload.code);
    if (existing) throw new Error("Bin with this code already exists");
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
