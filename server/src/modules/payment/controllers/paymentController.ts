import { Request, Response } from "express";
import { PaymentService } from "../services/paymentService";
import { InvoiceService } from "../services/invoiceService";

const paymentService = new PaymentService();
const invoiceService = new InvoiceService();

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const residentId = req.params.residentId as string | undefined;
    if (!residentId)
      return res.status(400).json({ message: "residentId is required" });
    const invoices = await paymentService.getInvoices(residentId);
    res.status(200).json(invoices);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const processPayment = async (req: Request, res: Response) => {
  try {
    const { invoiceId, method, amount } = req.body as {
      invoiceId: string;
      method: "Card" | "Bank" | "eWallet";
      amount: number;
    };
    const payment = await paymentService.processPayment(
      invoiceId,
      method,
      amount
    );
    res.status(200).json(payment);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const calculateOverweight = async (req: Request, res: Response) => {
  try {
    const { actualWeight, allowedWeight } = req.body as {
      actualWeight: number;
      allowedWeight: number;
    };
    const result = await invoiceService.calculateOverweight(
      actualWeight,
      allowedWeight
    );
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const applyDiscount = async (req: Request, res: Response) => {
  try {
    const { amount, discountPercent } = req.body as {
      amount: number;
      discountPercent: number;
    };
    const result = await invoiceService.applyDiscount(amount, discountPercent);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const generateInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.generateInvoice(req.body);
    res.status(201).json(invoice);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// stub for refund/report to be implemented later
export const refund = async (_req: Request, res: Response) => {
  res.status(501).json({ message: "Refund endpoint not implemented yet" });
};

export const adminReports = async (_req: Request, res: Response) => {
  res.status(501).json({ message: "Reports endpoint not implemented yet" });
};
