import { Request, Response } from "express";
import { InvoiceService } from "../services/invoice.service";
import { CreateOverweightInvoiceSchema } from "../types/invoice.dto";

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
        userId:
          (invoice as any)?.userId?.toString?.() ?? (invoice as any)?.userId,
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

export const getMyInvoices = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const status = req.query.status as string | undefined as any;
    const invoices = await service.getInvoicesByUserId(userId, status);
    return res.status(200).json(invoices);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const getInvoicesByUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const status = req.query.status as string | undefined as any;
    const invoices = await service.getInvoicesByUserId(userId, status);
    return res.status(200).json(invoices);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const generateOverweightInvoice = async (
  req: Request,
  res: Response
) => {
  try {
    // The route uses validateRequest with CreateOverweightInvoiceSchema
    const dto = (req as any).validatedBody || req.body;
    const actorId = (req as any).user?.id || "system";
    const invoice = await service.createOverweightInvoice({ ...dto, actorId });
    return res.status(201).json({
      invoiceId: (invoice as any)._id,
      userId: (invoice as any).userId,
      amount: invoice.amount,
      reason: invoice.reason,
      status: invoice.status,
      createdAt: invoice.createdAt,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};
