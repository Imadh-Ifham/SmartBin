import { PaymentModel, IPayment } from "../models/paymentModel";

export class PaymentRepository {
  async create(data: Partial<IPayment>) {
    return await PaymentModel.create(data);
  }

  async findByInvoice(invoiceId: string) {
    return await PaymentModel.findOne({ invoiceId }).exec();
  }
}
