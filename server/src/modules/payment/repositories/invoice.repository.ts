import { Types } from "mongoose";
import { InvoiceModel, IInvoice, InvoiceStatus } from "../models/invoice.model";

export class InvoiceRepository {
  async create(
    data: Partial<Omit<IInvoice, "userId">> & {
      userId: string | Types.ObjectId;
    }
  ) {
    const payload: any = { ...data };
    if (payload.userId && typeof payload.userId === "string") {
      payload.userId = new Types.ObjectId(payload.userId);
    }
    return await InvoiceModel.create(payload);
  }

  async findPendingByUser(userId: string) {
    return await InvoiceModel.find({
      userId: new Types.ObjectId(userId),
      status: "Pending",
    }).exec();
  }

  async findById(id: string) {
    return await InvoiceModel.findById(id).exec();
  }

  async updateStatus(id: string, status: InvoiceStatus) {
    return await InvoiceModel.findByIdAndUpdate(id, { status }, { new: true });
  }

  async findRecentPendingByUserAndReason(
    userId: string,
    reason: string,
    windowMs: number
  ) {
    const since = new Date(Date.now() - windowMs);
    return await InvoiceModel.findOne({
      userId: new Types.ObjectId(userId),
      reason,
      status: "Pending",
      createdAt: { $gte: since },
    }).exec();
  }
}
