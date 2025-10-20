import { Schema, model, Document } from "mongoose";

export interface IReceipt extends Document {
  invoiceId: string;
  paymentId: string;
  userId: string;
  amount: number;
  data?: any;
  createdAt: Date;
}

const ReceiptSchema = new Schema<IReceipt>(
  {
    invoiceId: { type: String, required: true, index: true },
    paymentId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    data: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ReceiptModel = model<IReceipt>("Receipt", ReceiptSchema);
