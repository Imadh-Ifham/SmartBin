import mongoose from "mongoose";
import { InvoiceRepository } from "../repositories/invoice.repository";
import { PaymentRepository } from "../repositories/payment.repository";
import {
  CreateInvoiceDto,
  CreateOverweightInvoiceDto,
} from "../types/invoice.dto";
import { AuditService } from "../services/audit.service";
import { UserRepository } from "../../auth/repositories/user.repository";
import {
  getDiscountBounds,
  getDuplicateWindowMs,
  getOverweightRateLkr,
} from "../../../config/pricing";

export class InvoiceService {
  private repo = new InvoiceRepository();
  private audit = new AuditService();
  private userRepo = new UserRepository();
  private payments = new PaymentRepository();

  async calculateOverweight(actualWeight: number, allowedWeight: number) {
    const excess = Math.max(0, actualWeight - allowedWeight);
    const ratePerKg = getOverweightRateLkr();
    return { excessKg: excess, fee: excess * ratePerKg };
  }

  async applyDiscount(amount: number, discountPercent: number) {
    const { min, max } = getDiscountBounds();
    const discount = Math.max(min, Math.min(max, discountPercent));
    const discountValue = (amount * discount) / 100;
    return {
      original: amount,
      discountPercent: discount,
      discountValue,
      total: amount - discountValue,
    };
  }

  async createOverweightInvoice(
    input: CreateOverweightInvoiceDto & { actorId: string }
  ) {
    // 1. verify user exists
    const user = await this.userRepo.findById(input.userId);
    if (!user) throw new Error("User not found");

    // 2. compute fee from weights
    const { excessKg, fee } = await this.calculateOverweight(
      input.actualWeight,
      input.allowedWeight
    );
    const defaultRate = getOverweightRateLkr();
    const rate =
      input.ratePerKg && input.ratePerKg > 0 ? input.ratePerKg : defaultRate;
    const finalFee = input.ratePerKg ? excessKg * rate : fee; // allow overriding rate

    if (finalFee <= 0) {
      throw new Error("No overweight fee (within allowed weight)");
    }

    // 3. build reason and metadata
    const reason =
      input.reason?.trim() && input.reason.trim().length >= 3
        ? input.reason.trim()
        : `Overweight bin (${input.actualWeight}kg / ${input.allowedWeight}kg limit)`;
    const metadata = {
      ...(input.metadata || {}),
      actualWeight: input.actualWeight,
      allowedWeight: input.allowedWeight,
      excessKg,
      ratePerKg: rate,
      calculatedFee: finalFee,
    };

    // 4. dedupe by reason (same as normal invoice flow)
    if (await this.isDuplicate(input.userId, reason)) {
      throw new Error("Duplicate invoice detected");
    }

    // 5. create invoice in a transaction
    const session = await mongoose.startSession();
    try {
      let invoice;
      await session.withTransaction(async () => {
        invoice = await this.repo.create({
          userId: input.userId,
          amount: finalFee,
          reason,
          metadata,
          status: "Pending",
          paidToDate: 0,
          outstanding: finalFee,
        });

        await this.audit.log({
          actorId: input.actorId,
          action: "INVOICE_CREATED",
          entityType: "Invoice",
          entityId: (invoice as any)._id.toString(),
          details: { amount: finalFee, reason },
        });
      });
      return invoice!;
    } finally {
      await session.endSession();
    }
  }

  private async isDuplicate(userId: string, reason: string) {
    const recent = await this.repo.findRecentPendingByUserAndReason(
      userId,
      reason,
      getDuplicateWindowMs()
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
          paidToDate: 0,
          outstanding: input.amount,
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
    const ids = invoices.map((i: any) => i._id?.toString?.() ?? i._id);
    const sums = await this.payments.sumSuccessByInvoiceIds(ids);
    return invoices.map((inv: any) => {
      const id = inv._id?.toString?.() ?? inv._id;
      const paidToDate = sums.get(String(id)) || 0;
      const outstanding = Math.max(0, (inv.amount || 0) - paidToDate);
      return {
        id,
        amount: inv.amount,
        reason: inv.reason,
        status: inv.status,
        createdAt: inv.createdAt,
        dueDate: inv.dueDate,
        paidToDate,
        outstanding,
      };
    });
  }
}
