import mongoose from "mongoose";
import { InvoiceService } from "../../services/invoice.service";

// We will mock mongoose.startSession to avoid real transactions
jest.spyOn(mongoose, "startSession").mockImplementation(async () => {
  return {
    async withTransaction(fn: any) {
      return fn();
    },
    async endSession() {
      /* no-op */
    },
  } as any;
});

describe("InvoiceService unit tests", () => {
  let service: InvoiceService;
  const mockRepo = {
    create: jest.fn(),
    findPendingByUser: jest.fn(),
    findRecentPendingByUserAndReason: jest.fn(),
    findAllByUser: jest.fn(),
  } as any;
  const mockUserRepo = {
    findById: jest.fn(),
  } as any;
  const mockAudit = {
    log: jest.fn(),
  } as any;

  beforeEach(() => {
    service = new InvoiceService();
    // inject test doubles
    (service as any).repo = mockRepo;
    (service as any).userRepo = mockUserRepo;
    (service as any).audit = mockAudit;
    jest.clearAllMocks();
  });

  describe("createInvoice", () => {
    const actorId = "admin-actor";
    const baseDto = {
      userId: "64b7c54a12c3d451efab89d7",
      amount: 1250,
      reason: "Overweight bin (15kg / 10kg limit)",
      metadata: { note: "first" },
    } as any;

    it("creates invoice and audits on success", async () => {
      mockUserRepo.findById.mockResolvedValue({ _id: baseDto.userId });
      mockRepo.findRecentPendingByUserAndReason.mockResolvedValue(null);
      const created = {
        _id: "inv-1",
        userId: baseDto.userId,
        amount: baseDto.amount,
        reason: baseDto.reason,
        status: "Pending",
        createdAt: new Date(),
      };
      mockRepo.create.mockResolvedValue(created);

      const result = await service.createInvoice({ ...baseDto, actorId });
      expect(result).toEqual(created);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: "INVOICE_CREATED", actorId })
      );
    });

    it("throws when user not found", async () => {
      mockUserRepo.findById.mockResolvedValue(null);
      await expect(
        service.createInvoice({ ...baseDto, actorId })
      ).rejects.toThrow("User not found");
    });

    it("throws on duplicate within 5 minutes", async () => {
      mockUserRepo.findById.mockResolvedValue({ _id: baseDto.userId });
      mockRepo.findRecentPendingByUserAndReason.mockResolvedValue({
        _id: "dup",
      });
      await expect(
        service.createInvoice({ ...baseDto, actorId })
      ).rejects.toThrow("Duplicate invoice detected");
    });
  });

  describe("getUnpaidSummary", () => {
    it("returns count and total from pending invoices", async () => {
      mockRepo.findPendingByUser.mockResolvedValue([
        { amount: 500 },
        { amount: 700 },
      ]);
      const out = await service.getUnpaidSummary("user-1");
      expect(out).toEqual({ count: 2, total: 1200 });
    });
  });

  describe("getInvoicesByUserId", () => {
    it("returns list of invoices mapped with id", async () => {
      const mockInvoices = [
        {
          _id: "inv1",
          amount: 100,
          reason: "Overweight",
          status: "Pending",
          createdAt: new Date(),
        },
        {
          _id: "inv2",
          amount: 200,
          reason: "Subscription",
          status: "Paid",
          createdAt: new Date(),
        },
      ];
      mockRepo.findAllByUser.mockResolvedValue(mockInvoices);

      const result = await (service as any).getInvoicesByUserId("user123");
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty("id", "inv1");
      expect(result[0]).toEqual(
        expect.objectContaining({
          amount: 100,
          reason: "Overweight",
          status: "Pending",
        })
      );
    });
  });

  describe("helpers", () => {
    it("calculateOverweight returns excess and fee", async () => {
      const res = await service.calculateOverweight(15, 10);
      expect(res).toEqual({ excessKg: 5, fee: 5 * 250 });
    });

    it("applyDiscount clamps and computes totals", async () => {
      const res = await service.applyDiscount(1000, 10);
      expect(res).toEqual({
        original: 1000,
        discountPercent: 10,
        discountValue: 100,
        total: 900,
      });
    });
  });
});

// Consolidated from invoice.service.overweight.test.ts
describe("InvoiceService.createOverweightInvoice", () => {
  let service: InvoiceService;
  const mockRepo = {
    create: jest.fn(),
    findRecentPendingByUserAndReason: jest.fn(),
  } as any;
  const mockUserRepo = { findById: jest.fn() } as any;
  const mockAudit = { log: jest.fn() } as any;

  beforeEach(() => {
    service = new InvoiceService();
    (service as any).repo = mockRepo;
    (service as any).userRepo = mockUserRepo;
    (service as any).audit = mockAudit;
    jest.clearAllMocks();
  });

  const base = {
    userId: "64b7c54a12c3d451efab89d7",
    actualWeight: 15,
    allowedWeight: 10,
    actorId: "admin-1",
  } as any;

  it("creates invoice with calculated fee and metadata", async () => {
    mockUserRepo.findById.mockResolvedValue({ _id: base.userId });
    mockRepo.findRecentPendingByUserAndReason.mockResolvedValue(null);
    const created = {
      _id: "inv-ow-1",
      userId: base.userId,
      amount: 5 * 250,
      reason: "Overweight bin (15kg / 10kg limit)",
      status: "Pending",
      createdAt: new Date(),
    };
    mockRepo.create.mockResolvedValue(created);

    const out = await (service as any).createOverweightInvoice(base);
    expect(out).toEqual(created);
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1250, outstanding: 1250 })
    );
    expect(mockAudit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "INVOICE_CREATED", actorId: "admin-1" })
    );
  });

  it("supports rate override", async () => {
    mockUserRepo.findById.mockResolvedValue({ _id: base.userId });
    mockRepo.findRecentPendingByUserAndReason.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue({ _id: "x" });
    await (service as any).createOverweightInvoice({ ...base, ratePerKg: 300 });
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 5 * 300 })
    );
  });

  it("throws when user not found", async () => {
    mockUserRepo.findById.mockResolvedValue(null);
    await expect(
      (service as any).createOverweightInvoice(base)
    ).rejects.toThrow("User not found");
  });

  it("throws when within allowed weight (zero fee)", async () => {
    mockUserRepo.findById.mockResolvedValue({ _id: base.userId });
    mockRepo.findRecentPendingByUserAndReason.mockResolvedValue(null);
    await expect(
      (service as any).createOverweightInvoice({
        ...base,
        actualWeight: 9,
        allowedWeight: 10,
      })
    ).rejects.toThrow(/No overweight fee/);
  });

  it("throws on duplicate", async () => {
    mockUserRepo.findById.mockResolvedValue({ _id: base.userId });
    mockRepo.findRecentPendingByUserAndReason.mockResolvedValue({ _id: "dup" });
    await expect(
      (service as any).createOverweightInvoice(base)
    ).rejects.toThrow(/Duplicate invoice detected/);
  });
});
