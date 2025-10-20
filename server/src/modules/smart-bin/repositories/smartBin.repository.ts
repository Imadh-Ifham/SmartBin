import { Bin, IBin } from "../models/smartBin.model";
import { Types } from "mongoose";

export class SmartBinRepository {
  async find(query: any = {}) {
    return Bin.find(query).sort({ createdAt: -1 }).lean();
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return Bin.findById(id);
  }

  async findByCode(qrCode: string) {
    return Bin.find({ qrCode });
  }

  async create(doc: Partial<IBin>) {
    const b = new Bin(doc as any);
    return b.save();
  }

  async update(bin: any) {
    return bin.save();
  }

  async deleteById(id: string) {
    return Bin.findByIdAndDelete(id);
  }
}

export const smartBinRepository = new SmartBinRepository();
