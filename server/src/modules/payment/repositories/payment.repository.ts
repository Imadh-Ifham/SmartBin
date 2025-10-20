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
}
