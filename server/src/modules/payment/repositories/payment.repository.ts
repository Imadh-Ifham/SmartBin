import { PaymentModel, IPayment } from "../models/payment.model";
import { Types } from "mongoose";

export class PaymentRepository {
  async create(data: Partial<IPayment>, opts: { session?: any } = {}) {
    if (data.invoiceId && typeof (data.invoiceId as any) === "string") {
      (data as any).invoiceId = new Types.ObjectId(data.invoiceId as any);
    }
    if (opts.session) {
      const [doc] = await PaymentModel.create([data], {
        session: opts.session,
      });
      return doc;
    }
    return await PaymentModel.create(data);
  }

  async findByInvoice(invoiceId: string) {
    return await PaymentModel.find({ invoiceId: new Types.ObjectId(invoiceId) })
      .sort({ timestamp: -1 })
      .exec();
  }

  async findByTransactionId(txId: string) {
    return await PaymentModel.findOne({ transactionId: txId }).exec();
  }

  async updateStatus(id: string, status: IPayment["status"], session?: any) {
    return await PaymentModel.findByIdAndUpdate(
      id,
      { status },
      { new: true, session }
    ).exec();
  }

  async sumSuccessByInvoiceIds(invoiceIds: string[]) {
    if (!invoiceIds.length) return new Map<string, number>();
    const valid = invoiceIds.filter((id) => /^[a-f\d]{24}$/i.test(String(id)));
    if (!valid.length) return new Map<string, number>();
    const ids = valid.map((id) => new Types.ObjectId(id));
    const rows = await PaymentModel.aggregate([
      { $match: { invoiceId: { $in: ids }, status: "Success" } },
      { $group: { _id: "$invoiceId", total: { $sum: "$amount" } } },
    ]);
    const map = new Map<string, number>();
    for (const r of rows) map.set(String(r._id), r.total || 0);
    return map;
  }
}
