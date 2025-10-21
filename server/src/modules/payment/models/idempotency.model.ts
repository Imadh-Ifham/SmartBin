import { Schema, model, Document } from "mongoose";

export interface IIdempotency extends Document {
  key: string;
  status: "processing" | "completed" | "failed";
  response?: any;
  error?: any;
  createdAt: Date;
  updatedAt: Date;
}

const IdempotencySchema = new Schema<IIdempotency>(
  {
    key: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      required: true,
    },
    response: { type: Schema.Types.Mixed },
    error: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const IdempotencyModel = model<IIdempotency>(
  "Idempotency",
  IdempotencySchema
);
