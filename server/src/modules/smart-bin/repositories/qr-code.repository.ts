import { QRCode, IQRCode } from "../models/qr-code.model";
import { Types } from "mongoose";

export class QRCodeRepository {
  async create(doc: Partial<IQRCode>) {
    const q = new QRCode(doc as any);
    return q.save();
  }

  async findByCode(code: string) {
    if (!code?.trim()) throw new Error("QR code is required");
    return QRCode.findOne({ code }, { createdAt: 0, updatedAt: 0 });
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
