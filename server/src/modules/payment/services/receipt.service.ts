import { ReceiptRepository } from "../repositories/receipt.repository";

export class ReceiptService {
  private repo = new ReceiptRepository();

  async generate(payload: {
    invoiceId: string;
    paymentId: string;
    userId: string;
    amount: number;
    data?: any;
  }) {
    const doc = await this.repo.create({
      invoiceId: payload.invoiceId,
      paymentId: payload.paymentId,
      userId: payload.userId,
      amount: payload.amount,
      data: payload.data || {},
    });

    return {
      id: doc._id.toString(),
      url: `/api/payments/receipts/${doc._id.toString()}`,
      data: doc,
    };
  }
}
