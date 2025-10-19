import mongoose from "mongoose";
import { InvoiceRepository } from "../repositories/invoice.repository";
import { CreateInvoiceDto } from "../types/invoice.dto";
import { AuditService } from "../services/audit.service";
import { UserRepository } from "../../auth/repositories/user.repository";

export class InvoiceService {
  private repo = new InvoiceRepository();
  private audit = new AuditService();
  private userRepo = new UserRepository();

  async calculateOverweight(actualWeight: number, allowedWeight: number) {
    const excess = Math.max(0, actualWeight - allowedWeight);
    const ratePerKg = 250; // LKR per kg (example)
    return { excessKg: excess, fee: excess * ratePerKg };
  }

  async applyDiscount(amount: number, discountPercent: number) {
    const discount = Math.max(0, Math.min(100, discountPercent));
    const discountValue = (amount * discount) / 100;
    return {
      original: amount,
      discountPercent: discount,
      discountValue,
      total: amount - discountValue,
    };
  }

  private async isDuplicate(userId: string, reason: string) {
    const recent = await this.repo.findRecentPendingByUserAndReason(
      userId,
      reason,
      5 * 60 * 1000
    );
    return !!recent;
  }

  async createInvoice(input: CreateInvoiceDto & { actorId: string }) {
    // 1. verify user exists
    const user = await this.userRepo.findById(input.userId);
    if (!user) throw new Error("User not found");

    // 2. dedupe
    if (await this.isDuplicate(input.userId, input.reason)) {
      throw new Error("Duplicate invoice detected");
    }

    // 3. transaction pattern (optional now)
    const session = await mongoose.startSession();
    try {
      let invoice;
      await session.withTransaction(async () => {
        invoice = await this.repo.create({
          userId: input.userId,
          amount: input.amount,
          reason: input.reason,
          metadata: input.metadata,
          status: "Pending",
        });

        await this.audit.log({
          actorId: input.actorId,
          action: "INVOICE_CREATED",
          entityType: "Invoice",
          entityId: (invoice as any)._id.toString(),
          details: { amount: input.amount, reason: input.reason },
        });
      });
      return invoice!;
    } finally {
      await session.endSession();
    }
  }

  async getUnpaidSummary(userId: string) {
    const pending = await this.repo.findPendingByUser(userId);
    const total = pending.reduce((s, p) => s + p.amount, 0);
    return { count: pending.length, total };
  }

  async getInvoicesByUserId(
    userId: string,
    status?: import("../models/invoice.model").InvoiceStatus
  ) {
    const invoices = await this.repo.findAllByUser(userId, status);
    return invoices.map((inv: any) => ({
      id: inv._id?.toString?.() ?? inv._id,
      amount: inv.amount,
      reason: inv.reason,
      status: inv.status,
      createdAt: inv.createdAt,
      dueDate: inv.dueDate,
    }));
  }
}
