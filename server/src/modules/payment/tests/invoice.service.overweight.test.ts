import mongoose from "mongoose";
import { InvoiceService } from "../services/invoice.service";

// Mock session to avoid real transactions
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
