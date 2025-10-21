import mongoose from "mongoose";
import { PaymentService } from "../../services/payment.service";

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
      updateTotals: jest.fn().mockResolvedValue(undefined),
      findPendingByUser: jest.fn(),
    };
    const paymentRepo = {
      findByInvoice: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({
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
      generate: jest.fn().mockResolvedValue({
        id: "rcpt_1",
        url: "/api/payments/receipts/rcpt_1",
      }),
    };
    const stripe = {
      createPaymentIntent: jest.fn().mockResolvedValue({
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
    expect(invoiceRepo.updateTotals).toHaveBeenCalledWith(
      "inv_1",
      { paidToDate: 1500, outstanding: 0, status: "Paid" },
      { session }
    );
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

  it("handleGatewaySucceeded updates payment and invoice totals when needed", async () => {
    const svc = mkService();
    const payment = {
      _id: "pay_1",
      status: "Processing",
      invoiceId: "inv_1",
    } as any;
    const paymentRepo = {
      findByTransactionId: jest.fn().mockResolvedValue(payment),
      updateStatus: jest.fn().mockResolvedValue(undefined),
      findByInvoice: jest
        .fn()
        .mockResolvedValue([{ status: "Success", amount: 1500 }]),
    };
    const invoiceRepo = {
      findById: jest.fn().mockResolvedValue({ _id: "inv_1", amount: 1500 }),
      updateTotals: jest.fn().mockResolvedValue(undefined),
    };

    (svc as any).paymentRepo = paymentRepo;
    (svc as any).invoiceRepo = invoiceRepo;

    const res = await svc.handleGatewaySucceeded("pi_1");
    expect(res).toBe(payment);
    expect(paymentRepo.updateStatus).toHaveBeenCalledWith("pay_1", "Success");
    expect(invoiceRepo.updateTotals).toHaveBeenCalledWith("inv_1", {
      paidToDate: 1500,
      outstanding: 0,
      status: "Paid",
    });
  });

  it("handleGatewaySucceeded returns null if payment not found", async () => {
    const svc = mkService();
    (svc as any).paymentRepo = {
      findByTransactionId: jest.fn().mockResolvedValue(null),
    };
    const res = await svc.handleGatewaySucceeded("pi_1");
    expect(res).toBeNull();
  });

  it("handleGatewaySucceeded is no-op when already Success", async () => {
    const svc = mkService();
    const payment = { _id: "pay_1", status: "Success", invoiceId: "inv_1" };
    const paymentRepo = {
      findByTransactionId: jest.fn().mockResolvedValue(payment),
      updateStatus: jest.fn(),
    };
    const invoiceRepo = { updateStatus: jest.fn() };
    (svc as any).paymentRepo = paymentRepo;
    (svc as any).invoiceRepo = invoiceRepo;
    const res = await svc.handleGatewaySucceeded("pi_1");
    expect(res).toBe(payment);
    expect(paymentRepo.updateStatus).not.toHaveBeenCalled();
    expect(invoiceRepo.updateStatus).not.toHaveBeenCalled();
  });

  it("processPayment success for non-Card method (Bank)", async () => {
    const session = mkSession();
    const svc = mkService();
    (svc as any).invoiceRepo = {
      findById: jest.fn().mockResolvedValue(baseInvoice()),
      updateTotals: jest.fn(),
    };
    (svc as any).paymentRepo = {
      findByInvoice: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({
        _id: "p",
        amount: 500,
        gateway: "mock",
        transactionId: "MOCK-1",
      }),
    };
    (svc as any).idempotencyRepo = {
      find: jest.fn().mockResolvedValue(null),
      createProcessing: jest.fn(),
      complete: jest.fn(),
      fail: jest.fn(),
    };
    (svc as any).receiptSvc = {
      generate: jest.fn().mockResolvedValue({ id: "r", url: "/u" }),
    };
    (svc as any).stripe = { createPaymentIntent: jest.fn() };
    (svc as any).notifier = { notifyPaymentSuccess: jest.fn() };

    const res = await svc.processPayment({
      payerId: "user_1",
      invoiceId: "inv_1",
      method: "Bank",
      amount: 500,
    });
    expect(res.payment.gateway).toBe("mock");
    expect((svc as any).invoiceRepo.updateTotals).toHaveBeenCalledWith(
      "inv_1",
      { paidToDate: 500, outstanding: 1000, status: "Partially Paid" },
      { session }
    );
  });

  it("amount equals outstanding boundary", async () => {
    mkSession();
    const svc = mkService();
    (svc as any).invoiceRepo = {
      findById: jest.fn().mockResolvedValue(baseInvoice({ amount: 1000 })),
      updateTotals: jest.fn(),
    };
    (svc as any).paymentRepo = {
      findByInvoice: jest
        .fn()
        .mockResolvedValue([{ status: "Success", amount: 300 }]),
      create: jest.fn().mockResolvedValue({
        _id: "p",
        amount: 700,
        gateway: "stripe",
        transactionId: "pi",
      }),
    };
    (svc as any).idempotencyRepo = {
      find: jest.fn().mockResolvedValue(null),
      createProcessing: jest.fn(),
      complete: jest.fn(),
      fail: jest.fn(),
    };
    (svc as any).stripe = {
      createPaymentIntent: jest.fn().mockResolvedValue({
        id: "pi",
        status: "succeeded",
        clientSecret: "sec",
      }),
    };
    (svc as any).receiptSvc = { generate: jest.fn().mockResolvedValue({}) };
    (svc as any).invoiceRepo.updateTotals = jest.fn();

    const res = await svc.processPayment({
      payerId: "user_1",
      invoiceId: "inv_1",
      method: "Card",
      amount: 700,
    });
    expect(res.clientSecret).toBe("sec");
  });

  it("missing Idempotency-Key path (no dedupe)", async () => {
    mkSession();
    const svc = mkService();
    (svc as any).invoiceRepo = {
      findById: jest.fn().mockResolvedValue(baseInvoice()),
      updateTotals: jest.fn(),
    };
    (svc as any).paymentRepo = {
      findByInvoice: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ _id: "p", amount: 1000 }),
    };
    (svc as any).idempotencyRepo = {
      find: jest.fn(),
      createProcessing: jest.fn(),
      complete: jest.fn(),
      fail: jest.fn(),
    };
    (svc as any).stripe = {
      createPaymentIntent: jest.fn().mockResolvedValue({
        id: "pi",
        status: "succeeded",
        clientSecret: "sec",
      }),
    };
    (svc as any).receiptSvc = { generate: jest.fn().mockResolvedValue({}) };

    const res = await svc.processPayment({
      payerId: "user_1",
      invoiceId: "inv_1",
      method: "Card",
      amount: 1000,
    });
    expect(res.clientSecret).toBe("sec");
    expect((svc as any).idempotencyRepo.find).not.toHaveBeenCalled();
  });

  it("getInvoices proxies to repository", async () => {
    const svc = mkService();
    const invoices = [{ _id: "i1" }];
    (svc as any).invoiceRepo = {
      findPendingByUser: jest.fn().mockResolvedValue(invoices),
    };
    const res = await svc.getInvoices("user_1");
    expect((svc as any).invoiceRepo.findPendingByUser).toHaveBeenCalledWith(
      "user_1"
    );
    expect(res).toBe(invoices);
  });

  it("handles error in transactional section and marks idempotency failed", async () => {
    const session = mkSession();
    const svc = mkService();
    (svc as any).invoiceRepo = {
      findById: jest.fn().mockResolvedValue(baseInvoice()),
      updateTotals: jest.fn(),
    };
    (svc as any).paymentRepo = {
      findByInvoice: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockRejectedValue(new Error("db write failed")),
    };
    (svc as any).idempotencyRepo = {
      find: jest.fn().mockResolvedValue(null),
      createProcessing: jest.fn(),
      complete: jest.fn(),
      fail: jest.fn(),
    };
    (svc as any).stripe = {
      createPaymentIntent: jest.fn().mockResolvedValue({
        id: "pi",
        status: "succeeded",
        clientSecret: "sec",
      }),
    };

    await expect(
      svc.processPayment({
        payerId: "user_1",
        invoiceId: "inv_1",
        method: "Card",
        amount: 1000,
        idempotencyKey: "idem",
      })
    ).rejects.toThrow("db write failed");
    expect(session.abortTransaction).toHaveBeenCalled();
    expect((svc as any).idempotencyRepo.fail).toHaveBeenCalledWith(
      "idem",
      expect.any(Object)
    );
  });
});

// Consolidated from payment.service.totals.test.ts
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
      findById: jest.fn().mockResolvedValue({
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
      create: jest.fn().mockResolvedValue({
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
      createPaymentIntent: jest.fn().mockResolvedValue({
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

// Consolidated from payment.service.branches.test.ts
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
      findById: jest.fn().mockResolvedValue({
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
      findById: jest.fn().mockResolvedValue({
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
      findById: jest.fn().mockResolvedValue({
        _id: "inv1",
        userId: { toString: () => "u1" },
        amount: 1000,
      }),
      updateTotals: jest.fn(),
    };
    (svc as any).paymentRepo = {
      findByInvoice: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({
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
      createPaymentIntent: jest.fn().mockResolvedValue({
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
      findByTransactionId: jest.fn().mockResolvedValue({
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
