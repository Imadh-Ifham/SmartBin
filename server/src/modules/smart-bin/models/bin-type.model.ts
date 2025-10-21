import { Schema, model, Document, Types } from "mongoose";

export interface IBinType extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const BinTypeSchema = new Schema<IBinType>(
  {
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

// keep BinType without strict generic to avoid exactOptionalPropertyTypes mismatch in this project
export const BinType = model("BinType", BinTypeSchema);
