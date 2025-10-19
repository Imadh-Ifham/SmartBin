import { Schema, model, Document, Types } from "mongoose";

export interface IBin extends Document {
  _id: Types.ObjectId;
  qrCode: Types.ObjectId; // reference to a QR code
  type: Types.ObjectId; // reference to a bin type (keeps coupling low)
  currentWeight: number;
  limit: number;
  createdAt: Date;
  updatedAt: Date;
}

const BinSchema = new Schema<IBin>(
  {
    qrCode: {
      type: Schema.Types.ObjectId,
      ref: "QRCode",
      required: true,
      index: true,
    },
    type: {
      type: Schema.Types.ObjectId,
      ref: "BinType",
      required: true,
      index: true,
    },
    currentWeight: { type: Number, default: 0 },
    limit: { type: Number, default: 10 },
  },
  { timestamps: true, versionKey: false }
);

BinSchema.index({ code: 1 });

export const Bin = model<IBin>("Bin", BinSchema);
