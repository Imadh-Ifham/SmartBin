import type { Invoice, Payment, PaymentMethod } from "../types/payment";

export default class PaymentService {
  formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
    }).format(amount);
  }

  simulatePayment(
    invoice: Invoice,
    method: PaymentMethod
  ): { success: boolean; payment?: Payment; failureReason?: string } {
    const isSuccess = Math.random() > 0.3;
    if (isSuccess) {
      const payment: Payment = {
        id: `PAY-${Date.now()}`,
        invoiceId: invoice.id,
        amount: invoice.amount + (invoice.lateFee || 0),
        method,
        timestamp: new Date().toISOString(),
        status: "success",
      };
      return { success: true, payment };
    }
    const reasons = [
      "Payment declined by your bank. Please check your card details and try again.",
      "Insufficient funds. Please ensure you have sufficient balance and retry.",
      "Card expired. Please use a different payment method.",
      "Payment timeout. The transaction took too long to process.",
      "Payment gateway error. Please try again or use a different payment method.",
    ];
    const failureReason = reasons[Math.floor(Math.random() * reasons.length)];
    return { success: false, failureReason };
  }
}
