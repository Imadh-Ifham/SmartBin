import mongoose from "mongoose";
import { InvoiceRepository } from "../repositories/invoice.repository";
import { PaymentRepository } from "../repositories/payment.repository";
import { IdempotencyRepository } from "../repositories/idempotency.repository";
import { ReceiptService } from "./receipt.service";
import { StripeService } from "./stripe.service";
import { NotificationService } from "./notification.service";

export class PaymentService {
  private invoiceRepo = new InvoiceRepository();
  private paymentRepo = new PaymentRepository();
  private idempotencyRepo = new IdempotencyRepository();
  private receiptSvc = new ReceiptService();
  private stripe = new StripeService();
  private notifier = new NotificationService();

  async getInvoices(userId: string) {
    return await this.invoiceRepo.findPendingByUser(userId);
  }

  async processPayment(params: {
    payerId: string;
    invoiceId: string;
    method: "Card" | "Bank" | "eWallet";
    amount: number;
    paymentDetails?: any;
    idempotencyKey?: string;
  }) {
    const { payerId, invoiceId, method, amount, idempotencyKey } = params;

    // Idempotency check
    if (idempotencyKey) {
      const existing = await this.idempotencyRepo.find(idempotencyKey);
      if (existing) {
        if (existing.status === "completed") return existing.response;
        if (existing.status === "processing")
          throw Object.assign(new Error("Payment already processing"), {
            statusCode: 409,
          });
      } else {
        await this.idempotencyRepo.createProcessing(idempotencyKey, {
          payerId,
          invoiceId,
        });
      }
    }

    // Validate invoice and ownership
    const invoice = await this.invoiceRepo.findById(invoiceId);
    if (!invoice) {
      if (idempotencyKey)
        await this.idempotencyRepo.fail(idempotencyKey, {
          error: "Invoice not found",
        });
      throw Object.assign(new Error("Invoice not found"), { statusCode: 404 });
    }
    if (invoice.userId.toString() !== payerId) {
      if (idempotencyKey)
        await this.idempotencyRepo.fail(idempotencyKey, {
          error: "Not invoice owner",
        });
      throw Object.assign(new Error("Unauthorized"), { statusCode: 403 });
    }

    // Compute outstanding as invoice.amount - sum(success payments.amount)
    const payments = await this.paymentRepo.findByInvoice(invoiceId);
    const paid = (payments || []).reduce(
      (s, p: any) => s + (p.status === "Success" ? p.amount : 0),
      0
    );
    const outstanding = invoice.amount - paid;
    if (amount > outstanding) {
      if (idempotencyKey)
        await this.idempotencyRepo.fail(idempotencyKey, {
          error: "Amount exceeds outstanding",
        });
      throw Object.assign(new Error("Amount exceeds outstanding"), {
        statusCode: 400,
      });
    }

    // Gateway interaction (Card -> Stripe payment intent)
    let gatewayResult: any = { success: false };
    try {
      if (method === "Card") {
        gatewayResult = await this.stripe.createPaymentIntent(
          amount,
          process.env.PAYMENT_CURRENCY || "lkr",
          `Invoice ${invoiceId}`,
          idempotencyKey
        );
      } else {
        // For Bank/eWallet, assume success in dev (replace with real gateway)
        gatewayResult = {
          id: `MOCK-${Date.now()}`,
          status: "succeeded",
          clientSecret: undefined,
          raw: {},
          success: true,
        };
      }
    } catch (err: any) {
      if (idempotencyKey)
        await this.idempotencyRepo.fail(idempotencyKey, {
          error: err?.message || String(err),
        });
      throw Object.assign(new Error("Payment gateway error: " + err.message), {
        statusCode: 502,
      });
    }

    // Record payment and update invoice within a transaction, with small retry for transient lock errors
    const isTransientLock = (e: any) =>
      String(e?.message || e).includes("Unable to acquire IX lock");
    let lastErr: any;
    for (let attempt = 0; attempt < 3; attempt++) {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const paymentDoc = await this.paymentRepo.create(
          {
            invoiceId,
            amount,
            method,
            status:
              gatewayResult.status === "succeeded" || gatewayResult.success
                ? "Success"
                : "Processing",
            gateway: method === "Card" ? "stripe" : "mock",
            transactionId: gatewayResult.id,
            metadata: gatewayResult.raw || {},
          },
          { session }
        );

        // If succeeded, update invoice totals and status based on remaining balance
        if (gatewayResult.status === "succeeded" || gatewayResult.success) {
          const currentPaid =
            typeof (invoice as any).paidToDate === "number"
              ? (invoice as any).paidToDate
              : paid;
          const newPaid = Math.min(invoice.amount, currentPaid + amount);
          const newOutstanding = Math.max(0, invoice.amount - newPaid);
          const newStatus = newOutstanding === 0 ? "Paid" : "Partially Paid";
          await this.invoiceRepo.updateTotals(
            invoiceId,
            {
              paidToDate: newPaid,
              outstanding: newOutstanding,
              status: newStatus,
            },
            { session }
          );
        }

        await session.commitTransaction();
        session.endSession();

        // Create receipt record (simple JSON)
        const receipt = await this.receiptSvc.generate({
          invoiceId: invoiceId.toString(),
          paymentId: (paymentDoc as any)._id.toString(),
          userId: invoice.userId.toString(),
          amount: (paymentDoc as any).amount,
          data: {
            gateway: (paymentDoc as any).gateway,
            transactionId: (paymentDoc as any).transactionId,
          },
        });

        // Notify success
        await this.notifier.notifyPaymentSuccess({
          invoiceId: invoiceId.toString(),
          amount: (paymentDoc as any).amount,
        });

        const response = {
          payment: paymentDoc,
          clientSecret: gatewayResult.clientSecret,
          receipt,
        };

        if (idempotencyKey)
          await this.idempotencyRepo.complete(idempotencyKey, response);

        return response;
      } catch (err) {
        lastErr = err;
        await session.abortTransaction();
        session.endSession();
        if (isTransientLock(err) && attempt < 2) {
          // brief backoff then retry
          await new Promise((r) => setTimeout(r, 25 * (attempt + 1)));
          continue;
        }
        if (idempotencyKey)
          await this.idempotencyRepo.fail(idempotencyKey, {
            error: (err as any)?.message || String(err),
          });
        throw err;
      }
    }
    // If we exhausted retries, mark failed and throw
    if (idempotencyKey)
      await this.idempotencyRepo.fail(idempotencyKey, {
        error: (lastErr as any)?.message || String(lastErr),
      });
    throw lastErr;
  }

  async handleGatewaySucceeded(transactionId: string) {
    const payment = await this.paymentRepo.findByTransactionId(transactionId);
    if (!payment) return null;
    if (payment.status !== "Success") {
      await this.paymentRepo.updateStatus(payment._id.toString(), "Success");
      // Recalculate totals for the invoice after this success
      const invoiceId = (payment.invoiceId as any).toString();
      const all = await this.paymentRepo.findByInvoice(invoiceId);
      const totalPaid = (all || []).reduce(
        (s, p: any) => s + (p.status === "Success" ? p.amount : 0),
        0
      );
      // Fetch invoice amount to compute outstanding
      const invoice = await this.invoiceRepo.findById(invoiceId);
      if (invoice) {
        const newPaid = Math.min(invoice.amount, totalPaid);
        const newOutstanding = Math.max(0, invoice.amount - newPaid);
        const newStatus = newOutstanding === 0 ? "Paid" : "Partially Paid";
        await this.invoiceRepo.updateTotals(invoiceId, {
          paidToDate: newPaid,
          outstanding: newOutstanding,
          status: newStatus,
        });
      }
    }
    return payment;
  }
}
