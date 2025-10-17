import { Schema, model, Document, Types } from "mongoose";

export interface IPolicyVersion extends Document {
  policyId: Types.ObjectId;
  version: number;
  snapshot: any;
  changedBy?: Types.ObjectId;
  changeReason?: string;
  createdAt: Date;
}

const PolicyVersionSchema = new Schema<IPolicyVersion>(
  {
    policyId: { type: Schema.Types.ObjectId, ref: "Policy", required: true, index: true },
    version: { type: Number, required: true },
    snapshot: { type: Schema.Types.Mixed, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: "User" },
    changeReason: { type: String, trim: true }
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

export const PolicyVersion = model<IPolicyVersion>("PolicyVersion", PolicyVersionSchema);
