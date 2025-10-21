import { Schema, model, Document, Types } from "mongoose";

export type InvoiceStatus = "Pending" | "Paid" | "Partially Paid" | "Refunded";

export interface IInvoice extends Document {
  userId: Types.ObjectId;
  amount: number;
  reason: string;
  status: InvoiceStatus;
  paidToDate?: number;
  outstanding?: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    reason: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["Pending", "Paid", "Partially Paid", "Refunded"],
      default: "Pending",
      index: true,
    },
    paidToDate: { type: Number, default: 0 },
    outstanding: { type: Number },
    metadata: { type: Schema.Types.Mixed },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

InvoiceSchema.index({ userId: 1, reason: 1, status: 1, createdAt: -1 });

export const InvoiceModel = model<IInvoice>("Invoice", InvoiceSchema);
