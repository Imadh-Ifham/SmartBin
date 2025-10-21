import { Schema, model, Document, Types } from "mongoose";

export interface IPayment extends Document {
  invoiceId: Types.ObjectId | string;
  amount: number;
  method: "Card" | "Bank" | "eWallet";
  status: "Processing" | "Success" | "Failed";
  gateway?: string; // e.g., stripe
  transactionId?: string;
  timestamp: Date;
  metadata?: any;
}

const paymentSchema = new Schema<IPayment>({
  invoiceId: {
    type: Schema.Types.ObjectId,
    ref: "Invoice",
    required: true,
    index: true,
  },
  amount: { type: Number, required: true },
  method: { type: String, enum: ["Card", "Bank", "eWallet"], required: true },
  status: {
    type: String,
    enum: ["Processing", "Success", "Failed"],
    default: "Processing",
    index: true,
  },
  gateway: { type: String, default: "stripe" },
  transactionId: { type: String, index: true },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: Schema.Types.Mixed },
});

export const PaymentModel = model<IPayment>("Payment", paymentSchema);
