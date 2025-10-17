import { Schema, model, Document, Types } from "mongoose";

export type BinStatus = "Active" | "InMaintenance" | "Decommissioned";

export interface IBinType {
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBinTypeDoc extends IBinType, Document {}

export interface IBin extends Document {
  code: string; // human readable / QR code
  type: string; // reference to a bin type name (keeps coupling low)
  currentWeight: number;
  limit: number;
  location?: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  status: BinStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const BinTypeSchema = new Schema<IBinType>(
  {
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

const GeoSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], index: "2dsphere" },
  },
  { _id: false }
);

const BinSchema = new Schema<IBin>(
  {
    code: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true, index: true },
    currentWeight: { type: Number, default: 0 },
    limit: { type: Number, default: 10 },
    location: { type: GeoSchema },
    status: {
      type: String,
      enum: ["Active", "InMaintenance", "Decommissioned"],
      default: "Active",
      index: true,
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, versionKey: false }
);

BinSchema.index({ code: 1 });

export const Bin = model<IBin>("Bin", BinSchema);
// keep BinType without strict generic to avoid exactOptionalPropertyTypes mismatch in this project
export const BinType = model("BinType", BinTypeSchema);
