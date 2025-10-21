export class NotificationService {
  async notifyPaymentSuccess(payment: any) {
    console.log(
      `✅ Payment Success: Invoice ${payment.invoiceId} | Amount: ${payment.amount}`
    );
  }

  async notifyPaymentFailure(invoiceId: string) {
    console.log(`⚠️ Payment Failure for Invoice ${invoiceId}`);
  }
}
