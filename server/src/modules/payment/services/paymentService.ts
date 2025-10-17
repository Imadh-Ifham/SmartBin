import { InvoiceRepository } from "../repositories/invoiceRepository";
import { PaymentRepository } from "../repositories/paymentRepository";
import { NotificationService } from "./notificationService";
import {
  PaymentStrategy,
  CardPayment,
  BankPayment,
  WalletPayment,
} from "../types/paymentTypes";

export class PaymentService {
  private invoiceRepo = new InvoiceRepository();
  private paymentRepo = new PaymentRepository();
  private notifier = new NotificationService();

  // Factory-like strategy selection
  private getStrategy(method: "Card" | "Bank" | "eWallet"): PaymentStrategy {
    switch (method) {
      case "Card":
        return new CardPayment();
      case "Bank":
        return new BankPayment();
      case "eWallet":
        return new WalletPayment();
      default:
        throw new Error("Unsupported payment method");
    }
  }

  async getInvoices(residentId: string) {
    return await this.invoiceRepo.findByResident(residentId);
  }

  async processPayment(
    invoiceId: string,
    method: "Card" | "Bank" | "eWallet",
    amount: number
  ) {
    const invoice = await this.invoiceRepo.findById(invoiceId);
    if (!invoice) throw new Error("Invoice not found");

    const strategy = this.getStrategy(method);
    const result = await strategy.authorize(amount);

    if (result.success) {
      await this.invoiceRepo.updateStatus(invoiceId, "Paid");
      const payload: any = {
        invoiceId,
        amount,
        method,
        status: "Success" as const,
      };
      if (result.transactionId) payload.transactionId = result.transactionId;
      const payment = await this.paymentRepo.create(payload);
      await this.notifier.notifyPaymentSuccess(payment);
      return payment;
    } else {
      await this.paymentRepo.create({
        invoiceId,
        amount,
        method,
        status: "Failed",
      });
      await this.notifier.notifyPaymentFailure(invoiceId);
      throw new Error("Payment failed");
    }
  }
}
