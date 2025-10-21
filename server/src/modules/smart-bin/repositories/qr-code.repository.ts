import { QRCode, IQRCode } from "../models/qr-code.model";
import { Types } from "mongoose";

export class QRCodeRepository {
  async create(doc: Partial<IQRCode>) {
    const q = new QRCode(doc as any);
    return q.save();
  }

  async findByCode(code: string) {
    return QRCode.findOne({ code });
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return QRCode.findById(id);
  }

  async list(query: any = {}) {
    return QRCode.find(query).sort({ createdAt: -1 });
  }

  async update(qr: any) {
    return qr.save();
  }
}

export const qrCodeRepository = new QRCodeRepository();
