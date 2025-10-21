import { ReceiptModel } from "../models/receipt.model";

export class ReceiptRepository {
  async create(data: any) {
    return await ReceiptModel.create(data);
  }
  async findByPaymentId(paymentId: string) {
    return await ReceiptModel.findOne({ paymentId }).exec();
  }
  async findById(id: string) {
    return await ReceiptModel.findById(id).exec();
  }
}
