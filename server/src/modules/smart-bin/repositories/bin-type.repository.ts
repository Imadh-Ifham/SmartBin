import { BinType } from "../models/bin-type.model";
import { Types } from "mongoose";

export class BinTypeRepository {
  async list() {
    return BinType.find().sort({ createdAt: -1 });
  }

  async get(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return BinType.findById(id);
  }

  async create(payload: any) {
    const b = new BinType(payload);
    return b.save();
  }

  async update(id: string, payload: any) {
    if (!Types.ObjectId.isValid(id)) return null;
    return BinType.findByIdAndUpdate(id, payload, { new: true });
  }

  async delete(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return BinType.findByIdAndDelete(id);
  }
}

export const binTypeRepository = new BinTypeRepository();
