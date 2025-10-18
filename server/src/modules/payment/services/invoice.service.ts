import { InvoiceRepository } from "../repositories/invoice.repository";

export class InvoiceService {
  private repo = new InvoiceRepository();

  async calculateOverweight(actualWeight: number, allowedWeight: number) {
    const excess = Math.max(0, actualWeight - allowedWeight);
    const ratePerKg = 250; // LKR per kg (example)
    return { excessKg: excess, fee: excess * ratePerKg };
  }

  async applyDiscount(amount: number, discountPercent: number) {
    const discount = Math.max(0, Math.min(100, discountPercent));
    const discountValue = (amount * discount) / 100;
    return {
      original: amount,
      discountPercent: discount,
      discountValue,
      total: amount - discountValue,
    };
  }

  async generateInvoice(input: {
    residentId: string;
    amount: number;
    reason: string;
    dueDate?: Date;
    origin?: string;
  }) {
    const { residentId, amount, reason, dueDate, origin } = input;
    return this.repo.create({
      residentId,
      amount,
      reason,
      dueDate,
      origin,
      status: "Pending",
    } as any);
  }
}
