import mongoose from "mongoose";
import { InvoiceService } from "../services/invoice.service";

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
