import { Request, Response } from "express";
import { InvoiceService } from "../services/invoice.service";

const service = new InvoiceService();

export const generateInvoice = async (req: Request, res: Response) => {
  try {
    const dto = (req as any).validatedBody;
    const actorId = (req as any).user?.id || "system";
    const invoice = await service.createInvoice({ ...dto, actorId });
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
