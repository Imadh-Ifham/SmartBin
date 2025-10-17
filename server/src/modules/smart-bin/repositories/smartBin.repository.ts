import { Bin, BinType, IBin } from "../models/smartBin.model";
import mongoose, { Types } from "mongoose";

export class SmartBinRepository {
  async find(query: any = {}) {
    return Bin.find(query).sort({ createdAt: -1 }).lean();
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return Bin.findById(id);
  }

  async findByCode(code: string) {
    return Bin.findOne({ code });
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

  async findNearby(lng: number, lat: number, radiusMeters: number = 500) {
    return Bin.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: radiusMeters,
        },
      },
    }).limit(100);
  }

  async upsertType(name: string, description?: string) {
    return BinType.findOneAndUpdate(
      { name },
      { name, description },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}

export const smartBinRepository = new SmartBinRepository();
