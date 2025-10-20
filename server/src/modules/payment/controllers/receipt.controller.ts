import { Request, Response } from "express";
import { ReceiptRepository } from "../repositories/receipt.repository";

const repo = new ReceiptRepository();

export const getReceipt = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const receipt =
      (await repo.findById(id)) || (await repo.findByPaymentId(id));
    if (!receipt) return res.status(404).json({ message: "Receipt not found" });

    return res.json({
      id: receipt._id,
      invoiceId: receipt.invoiceId,
      paymentId: receipt.paymentId,
      userId: receipt.userId,
      amount: receipt.amount,
      data: receipt.data,
      createdAt: receipt.createdAt,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
