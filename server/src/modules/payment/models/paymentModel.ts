import { Schema, model, Document } from "mongoose";

export interface IPayment extends Document {
  invoiceId: string;
  amount: number;
  method: "Card" | "Bank" | "eWallet";
  status: "Success" | "Failed";
  transactionId?: string;
  timestamp: Date;
}

const paymentSchema = new Schema<IPayment>({
  invoiceId: { type: String, required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ["Card", "Bank", "eWallet"], required: true },
  status: { type: String, enum: ["Success", "Failed"], default: "Success" },
  transactionId: { type: String },
  timestamp: { type: Date, default: Date.now },
});

export const PaymentModel = model<IPayment>("Payment", paymentSchema);
