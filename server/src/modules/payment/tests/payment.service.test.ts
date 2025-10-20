import mongoose from "mongoose";
import { PaymentService } from "../services/payment.service";

describe("PaymentService (unit)", () => {
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

  const baseInvoice = (overrides: Partial<any> = {}) => ({
    _id: "inv_1",
    userId: { toString: () => "user_1" },
    amount: 1500,
    status: "Pending",
    ...overrides,
  });

  const mkService = () => new PaymentService();

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.PAYMENT_CURRENCY = "lkr";
  });

  it("processPayment success (Card) with idempotency", async () => {
    const session = mkSession();
    const svc = mkService();

    // Patch internals
    const invoiceRepo = {
      findById: jest.fn().mockResolvedValue(baseInvoice()),
      updateStatus: jest.fn().mockResolvedValue(undefined),
      findPendingByUser: jest.fn(),
    };
    const paymentRepo = {
      findByInvoice: jest.fn().mockResolvedValue([]),
      create: jest
        .fn()
        .mockResolvedValue({
          _id: "pay_1",
          amount: 1500,
          gateway: "stripe",
          transactionId: "pi_1",
        }),
      updateStatus: jest.fn(),
      findByTransactionId: jest.fn(),
    };
    const idemRepo = {
      find: jest.fn().mockResolvedValue(null),
      createProcessing: jest.fn().mockResolvedValue(undefined),
      complete: jest.fn().mockResolvedValue(undefined),
      fail: jest.fn(),
    };
    const receiptSvc = {
      generate: jest
        .fn()
        .mockResolvedValue({
          id: "rcpt_1",
          url: "/api/payments/receipts/rcpt_1",
        }),
    };
    const stripe = {
      createPaymentIntent: jest
        .fn()
        .mockResolvedValue({
          id: "pi_1",
          status: "succeeded",
          clientSecret: "sec_1",
          raw: { ok: true },
        }),
    };
    const notifier = {
      notifyPaymentSuccess: jest.fn().mockResolvedValue(undefined),
    };

    (svc as any).invoiceRepo = invoiceRepo;
    (svc as any).paymentRepo = paymentRepo;
    (svc as any).idempotencyRepo = idemRepo;
    (svc as any).receiptSvc = receiptSvc;
    (svc as any).stripe = stripe;
    (svc as any).notifier = notifier;

    const res = await svc.processPayment({
      payerId: "user_1",
      invoiceId: "inv_1",
      method: "Card",
      amount: 1500,
      idempotencyKey: "idem_1",
    });

    expect(stripe.createPaymentIntent).toHaveBeenCalledWith(
      1500,
      "lkr",
      expect.stringContaining("Invoice inv_1"),
      "idem_1"
    );
    expect(session.startTransaction).toHaveBeenCalled();
    expect(paymentRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceId: "inv_1",
        amount: 1500,
        status: "Success",
        transactionId: "pi_1",
      }),
      { session }
    );
    expect(invoiceRepo.updateStatus).toHaveBeenCalledWith("inv_1", "Paid", {
      session,
    });
    expect(session.commitTransaction).toHaveBeenCalled();
    expect((res as any).clientSecret).toBe("sec_1");
    expect(idemRepo.complete).toHaveBeenCalledWith(
      "idem_1",
      expect.any(Object)
    );
  });

  it("throws 404 when invoice not found", async () => {
    mkSession();
    const svc = mkService();
    (svc as any).invoiceRepo = { findById: jest.fn().mockResolvedValue(null) };
    (svc as any).idempotencyRepo = {
      find: jest.fn().mockResolvedValue(null),
      createProcessing: jest.fn(),
      fail: jest.fn(),
    };

    await expect(
      svc.processPayment({
        payerId: "user_1",
        invoiceId: "x",
        method: "Card",
        amount: 100,
        idempotencyKey: "idem",
      })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect((svc as any).idempotencyRepo.fail).toHaveBeenCalled();
  });

  it("throws 403 when payer is not invoice owner", async () => {
    mkSession();
    const svc = mkService();
    (svc as any).invoiceRepo = {
      findById: jest
        .fn()
        .mockResolvedValue(
          baseInvoice({ userId: { toString: () => "other" } })
        ),
    };
    (svc as any).idempotencyRepo = {
      find: jest.fn().mockResolvedValue(null),
      createProcessing: jest.fn(),
      fail: jest.fn(),
    };

    await expect(
      svc.processPayment({
        payerId: "user_1",
        invoiceId: "x",
        method: "Card",
        amount: 100,
        idempotencyKey: "idem",
      })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect((svc as any).idempotencyRepo.fail).toHaveBeenCalled();
  });

  it("throws 400 when amount exceeds outstanding", async () => {
    mkSession();
    const svc = mkService();
    (svc as any).invoiceRepo = {
      findById: jest.fn().mockResolvedValue(baseInvoice({ amount: 1000 })),
    };
    (svc as any).paymentRepo = {
      findByInvoice: jest
        .fn()
        .mockResolvedValue([{ status: "Success", amount: 800 }]),
    };
    (svc as any).idempotencyRepo = {
      find: jest.fn().mockResolvedValue(null),
      createProcessing: jest.fn(),
      fail: jest.fn(),
    };

    await expect(
      svc.processPayment({
        payerId: "user_1",
        invoiceId: "x",
        method: "Card",
        amount: 300,
        idempotencyKey: "idem",
      })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect((svc as any).idempotencyRepo.fail).toHaveBeenCalled();
  });

  it("resolves immediately for idempotency completed", async () => {
    mkSession();
    const svc = mkService();
    const response = { ok: true };
    (svc as any).idempotencyRepo = {
      find: jest.fn().mockResolvedValue({ status: "completed", response }),
    };

    const res = await svc.processPayment({
      payerId: "u",
      invoiceId: "i",
      method: "Card",
      amount: 1,
      idempotencyKey: "idem",
    });
    expect(res).toBe(response);
  });

  it("throws 409 for idempotency processing", async () => {
    mkSession();
    const svc = mkService();
    (svc as any).idempotencyRepo = {
      find: jest.fn().mockResolvedValue({ status: "processing" }),
    };
    await expect(
      svc.processPayment({
        payerId: "u",
        invoiceId: "i",
        method: "Card",
        amount: 1,
        idempotencyKey: "idem",
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("maps gateway error to 502 and marks idempotency failed", async () => {
    mkSession();
    const svc = mkService();
    (svc as any).invoiceRepo = {
      findById: jest.fn().mockResolvedValue(baseInvoice()),
    };
    (svc as any).paymentRepo = {
      findByInvoice: jest.fn().mockResolvedValue([]),
    };
    (svc as any).idempotencyRepo = {
      find: jest.fn().mockResolvedValue(null),
      createProcessing: jest.fn(),
      fail: jest.fn(),
    };
    (svc as any).stripe = {
      createPaymentIntent: jest
        .fn()
        .mockRejectedValue(new Error("stripe down")),
    };

    await expect(
      svc.processPayment({
        payerId: "user_1",
        invoiceId: "inv_1",
        method: "Card",
        amount: 1500,
        idempotencyKey: "idem",
      })
    ).rejects.toMatchObject({ statusCode: 502 });
    expect((svc as any).idempotencyRepo.fail).toHaveBeenCalled();
  });

  it("handleGatewaySucceeded updates status and invoice when needed", async () => {
    const svc = mkService();
    const payment = { _id: "pay_1", status: "Processing", invoiceId: "inv_1" };
    const paymentRepo = {
      findByTransactionId: jest.fn().mockResolvedValue(payment),
      updateStatus: jest.fn().mockResolvedValue(undefined),
    };
    const invoiceRepo = {
      updateStatus: jest.fn().mockResolvedValue(undefined),
    };

    (svc as any).paymentRepo = paymentRepo;
    (svc as any).invoiceRepo = invoiceRepo;

    const res = await svc.handleGatewaySucceeded("pi_1");
    expect(res).toBe(payment);
    expect(paymentRepo.updateStatus).toHaveBeenCalledWith("pay_1", "Success");
    expect(invoiceRepo.updateStatus).toHaveBeenCalledWith("inv_1", "Paid");
  });

  it("handleGatewaySucceeded returns null if payment not found", async () => {
    const svc = mkService();
    (svc as any).paymentRepo = {
      findByTransactionId: jest.fn().mockResolvedValue(null),
    };
    const res = await svc.handleGatewaySucceeded("pi_1");
    expect(res).toBeNull();
  });
});
