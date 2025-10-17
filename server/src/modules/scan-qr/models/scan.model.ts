import { Schema, model, Document, Types } from "mongoose";

export interface IScanEvent extends Document {
  raw: string;
  parsed?: any;
  source: string; // e.g., 'camera', 'manual', 'file'
  detectedAt: Date;
  createdAt: Date;
}

const ScanSchema = new Schema<IScanEvent>(
  {
    raw: { type: String, required: true, index: true },
    parsed: { type: Schema.Types.Mixed },
    source: { type: String, default: "camera" },
    detectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ScanEvent = model<IScanEvent>("ScanEvent", ScanSchema);
