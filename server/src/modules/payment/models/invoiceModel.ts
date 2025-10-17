import { Schema, model, Document } from "mongoose";

export interface IInvoice extends Document {
  residentId: string;
  amount: number;
  reason: string;
  status: "Pending" | "Paid" | "Partially Paid" | "Refunded";
  createdAt: Date;
  dueDate: Date;
  origin: string; // e.g., "ScanBinQR"
}

const invoiceSchema = new Schema<IInvoice>({
  residentId: { type: String, required: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: ["Pending", "Paid", "Partially Paid", "Refunded"],
    default: "Pending",
  },
  createdAt: { type: Date, default: Date.now },
  dueDate: { type: Date },
  origin: { type: String },
});

export const InvoiceModel = model<IInvoice>("Invoice", invoiceSchema);
