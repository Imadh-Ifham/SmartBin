import { Request, Response } from "express";
import { InvoiceService } from "../services/invoice.service";

const service = new InvoiceService();

export const generateInvoice = async (req: Request, res: Response) => {
  try {
    const dto = (req as any).validatedBody;
    const actorId = (req as any).user?.id || "system";
    const invoice = await service.createInvoice({ ...dto, actorId });
    // DEV NOTE: Log the invoice result in console for local debugging/demo purposes
    try {
      console.info("[INVOICE_CREATED]", {
        invoiceId: (invoice as any)?._id?.toString?.() ?? (invoice as any)?._id,
        userId: (invoice as any)?.userId?.toString?.() ?? (invoice as any)?.userId,
        amount: invoice.amount,
        reason: invoice.reason,
        status: invoice.status,
        createdAt: invoice.createdAt,
      });
    } catch (_e) {
      // ignore logging errors
    }
    return res.status(201).json({
      invoiceId: invoice._id,
      userId: invoice.userId,
      amount: invoice.amount,
      reason: invoice.reason,
      status: invoice.status,
      createdAt: invoice.createdAt,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

export const getUnpaidStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const summary = await service.getUnpaidSummary(userId);
    return res.json(summary);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};
