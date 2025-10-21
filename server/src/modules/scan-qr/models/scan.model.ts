import { Schema, model, Document, Types } from "mongoose";

export interface IScanEvent extends Document {
  userId?: Types.ObjectId;
  code: string;
  source: string; // e.g., 'camera', 'manual', 'file'
  detectedAt: Date;
}

const ScanSchema = new Schema<IScanEvent>(
  {
    code: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    source: { type: String, default: "camera" },
    detectedAt: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false }
);

export const ScanEvent = model<IScanEvent>("ScanEvent", ScanSchema);
