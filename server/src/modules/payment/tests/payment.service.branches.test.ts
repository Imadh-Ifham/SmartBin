import mongoose from "mongoose";
import { PaymentService } from "../services/payment.service";

describe("PaymentService branch coverage", () => {
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
    process.env.PAYMENT_CURRENCY = "lkr";
  });

  it("retries on transient lock and succeeds on third attempt", async () => {
    const session = mkSession();
    const svc = new PaymentService();
    let attempt = 0;

    (svc as any).invoiceRepo = {
      findById: jest
        .fn()
        .mockResolvedValue({
          _id: "inv1",
          userId: { toString: () => "u1" },
          amount: 600,
        }),
      updateTotals: jest.fn(),
      findPendingByUser: jest.fn(),
    };
    (svc as any).paymentRepo = {
      findByInvoice: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation(async () => {
        attempt++;
        if (attempt < 3) throw new Error("Unable to acquire IX lock");
        return {
          _id: "p1",
          amount: 200,
          gateway: "mock",
          transactionId: "MOCK-1",
        };
      }),
    };
    (svc as any).idempotencyRepo = {
      find: jest.fn(),
      createProcessing: jest.fn(),
      complete: jest.fn(),
      fail: jest.fn(),
    };
    (svc as any).stripe = { createPaymentIntent: jest.fn() };
    (svc as any).receiptSvc = { generate: jest.fn().mockResolvedValue({}) };
    (svc as any).notifier = { notifyPaymentSuccess: jest.fn() };

    const res = await svc.processPayment({
      payerId: "u1",
      invoiceId: "inv1",
      method: "Bank",
      amount: 200,
      idempotencyKey: "idem",
    });
    expect(res.payment._id).toBe("p1");
    expect((svc as any).invoiceRepo.updateTotals).toHaveBeenCalledWith(
      "inv1",
      { paidToDate: 200, outstanding: 400, status: "Partially Paid" },
      { session }
    );
    // ensure we retried exactly twice before success
    expect((svc as any).paymentRepo.create).toHaveBeenCalledTimes(3);
  });

  it("exhausts retries and marks idempotency failed then throws", async () => {
    mkSession();
    const svc = new PaymentService();
    (svc as any).invoiceRepo = {
      findById: jest
        .fn()
        .mockResolvedValue({
          _id: "inv1",
          userId: { toString: () => "u1" },
          amount: 100,
        }),
    };
    (svc as any).paymentRepo = {
      findByInvoice: jest.fn().mockResolvedValue([]),
      create: jest
        .fn()
        .mockRejectedValue(new Error("Unable to acquire IX lock")),
    };
    const idem = {
      find: jest.fn(),
      createProcessing: jest.fn(),
      complete: jest.fn(),
      fail: jest.fn(),
    };
    (svc as any).idempotencyRepo = idem;
    (svc as any).stripe = { createPaymentIntent: jest.fn() };

    await expect(
      svc.processPayment({
        payerId: "u1",
        invoiceId: "inv1",
        method: "Bank",
        amount: 50,
        idempotencyKey: "idem",
      })
    ).rejects.toThrow(/Unable to acquire IX lock/);
    // ensure final fail is called after exhausting
    expect(idem.fail).toHaveBeenCalledWith("idem", expect.any(Object));
  });

  it("Card path with requires_action returns Processing and clientSecret", async () => {
    mkSession();
    const svc = new PaymentService();
    (svc as any).invoiceRepo = {
      findById: jest
        .fn()
        .mockResolvedValue({
          _id: "inv1",
          userId: { toString: () => "u1" },
          amount: 1000,
        }),
      updateTotals: jest.fn(),
    };
    (svc as any).paymentRepo = {
      findByInvoice: jest.fn().mockResolvedValue([]),
      create: jest
        .fn()
        .mockResolvedValue({
          _id: "p1",
          amount: 100,
          gateway: "stripe",
          transactionId: "pi_1",
          status: "Processing",
        }),
    };
    (svc as any).idempotencyRepo = {
      find: jest.fn(),
      createProcessing: jest.fn(),
      complete: jest.fn(),
    };
    (svc as any).stripe = {
      createPaymentIntent: jest
        .fn()
        .mockResolvedValue({
          id: "pi_1",
          status: "requires_action",
          clientSecret: "sec_123",
          raw: {},
        }),
    };
    (svc as any).receiptSvc = { generate: jest.fn().mockResolvedValue({}) };
    (svc as any).notifier = { notifyPaymentSuccess: jest.fn() };

    const res = await svc.processPayment({
      payerId: "u1",
      invoiceId: "inv1",
      method: "Card",
      amount: 100,
    });
    expect(res.clientSecret).toBe("sec_123");
    // No totals update on Processing
    expect((svc as any).invoiceRepo.updateTotals).not.toHaveBeenCalled();
  });

  it("handleGatewaySucceeded: invoice missing branch", async () => {
    const svc = new PaymentService();
    (svc as any).paymentRepo = {
      findByTransactionId: jest
        .fn()
        .mockResolvedValue({
          _id: "p1",
          status: "Processing",
          invoiceId: { toString: () => "inv1" },
        }),
      updateStatus: jest.fn(),
      findByInvoice: jest
        .fn()
        .mockResolvedValue([{ status: "Success", amount: 100 }]),
    };
    (svc as any).invoiceRepo = {
      findById: jest.fn().mockResolvedValue(null),
      updateTotals: jest.fn(),
    };

    await svc.handleGatewaySucceeded("pi_1");
    expect((svc as any).invoiceRepo.updateTotals).not.toHaveBeenCalled();
  });
});
