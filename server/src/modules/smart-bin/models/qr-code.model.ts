import { Schema, Types, model } from "mongoose";

export type BinStatus = "Active" | "InMaintenance" | "Decommissioned";

export interface IQRCode {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  code: string;
  qrUrl: string;
  address: string;
  province: string;
  city: string;
  location?: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  status: BinStatus;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GeoSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], index: "2dsphere" },
  },
  { _id: false }
);

const QRCodeSchema = new Schema<IQRCode>(
  {
    code: { type: String, required: true, unique: true, index: true },
    qrUrl: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    address: { type: String, default: "" },
    province: { type: String },
    city: { type: String },
    location: { type: GeoSchema },
    status: {
      type: String,
      enum: ["Active", "InMaintenance", "Decommissioned"],
      default: "Active",
      index: true,
    },
    description: { type: String },
  },
  { timestamps: true, versionKey: false }
);

export const QRCode = model<IQRCode>("QRCode", QRCodeSchema);
