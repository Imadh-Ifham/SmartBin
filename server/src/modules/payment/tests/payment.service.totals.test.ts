import mongoose from "mongoose";
import { PaymentService } from "../services/payment.service";

describe("PaymentService totals updates", () => {
  const mkSession = () => {
    const session = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    } as any;
    jest.spyOn(mongoose, "startSession").mockResolvedValue(session);
    return session;
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("processPayment success updates totals (paidToDate/outstanding/status)", async () => {
    const session = mkSession();
    const svc = new PaymentService();
    const invoiceRepo = {
      findById: jest
        .fn()
        .mockResolvedValue({
          _id: "inv1",
          userId: { toString: () => "u1" },
          amount: 1000,
          status: "Pending",
          paidToDate: 200,
        }),
      updateTotals: jest.fn(),
      findPendingByUser: jest.fn(),
    };
    const paymentRepo = {
      findByInvoice: jest
        .fn()
        .mockResolvedValue([{ status: "Success", amount: 200 }]),
      create: jest
        .fn()
        .mockResolvedValue({
          _id: "p1",
          amount: 300,
          gateway: "stripe",
          transactionId: "pi_1",
        }),
    };
    (svc as any).invoiceRepo = invoiceRepo;
    (svc as any).paymentRepo = paymentRepo;
    (svc as any).idempotencyRepo = {
      find: jest.fn(),
      createProcessing: jest.fn(),
      complete: jest.fn(),
      fail: jest.fn(),
    };
    (svc as any).stripe = {
      createPaymentIntent: jest
        .fn()
        .mockResolvedValue({
          id: "pi_1",
          status: "succeeded",
          clientSecret: "sec",
        }),
    };
    (svc as any).receiptSvc = { generate: jest.fn().mockResolvedValue({}) };
    (svc as any).notifier = { notifyPaymentSuccess: jest.fn() };

    await svc.processPayment({
      payerId: "u1",
      invoiceId: "inv1",
      method: "Card",
      amount: 300,
    });
    // newPaid = min(1000, 200 + 300) = 500, outstanding = 500, status = Partially Paid
    expect(invoiceRepo.updateTotals).toHaveBeenCalledWith(
      "inv1",
      { paidToDate: 500, outstanding: 500, status: "Partially Paid" },
      { session }
    );
  });

  it("handleGatewaySucceeded recomputes totals and updates invoice", async () => {
    const svc = new PaymentService();
    const payment = {
      _id: "pay_1",
      status: "Processing",
      invoiceId: { toString: () => "inv_1" },
    } as any;
    const paymentRepo = {
      findByTransactionId: jest.fn().mockResolvedValue(payment),
      updateStatus: jest.fn().mockResolvedValue(undefined),
      findByInvoice: jest.fn().mockResolvedValue([
        { status: "Success", amount: 400 },
        { status: "Processing", amount: 100 },
      ]),
    };
    const invoiceRepo = {
      findById: jest.fn().mockResolvedValue({ _id: "inv_1", amount: 700 }),
      updateTotals: jest.fn().mockResolvedValue(undefined),
    };
    (svc as any).paymentRepo = paymentRepo;
    (svc as any).invoiceRepo = invoiceRepo;

    await svc.handleGatewaySucceeded("tx_1");
    // totalPaid = 400 => outstanding = 300 => Partially Paid
    expect(invoiceRepo.updateTotals).toHaveBeenCalledWith("inv_1", {
      paidToDate: 400,
      outstanding: 300,
      status: "Partially Paid",
    });
    expect(paymentRepo.updateStatus).toHaveBeenCalledWith("pay_1", "Success");
  });
});
