import { Schema, model, Document, Types } from "mongoose";

export interface IRouteStop {
  binId: Types.ObjectId;
  sequence: number;
  status: "Pending" | "Collected" | "Skipped";
  collectedAt?: Date;
}

export interface ICollectorShift extends Document {
  collectorId: Types.ObjectId;
  startedAt: Date;
  endedAt?: Date;
  route?: {
    name?: string;
    stops: IRouteStop[];
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const RouteStopSchema = new Schema<IRouteStop>(
  {
    binId: { type: Schema.Types.ObjectId, required: true, ref: "Bin" },
    sequence: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Collected", "Skipped"],
      default: "Pending",
    },
    collectedAt: { type: Date },
  },
  { _id: false }
);

const ShiftSchema = new Schema<ICollectorShift>(
  {
    collectorId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    route: {
      name: { type: String },
      stops: { type: [RouteStopSchema], default: [] },
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const CollectorShift = model<ICollectorShift>(
  "CollectorShift",
  ShiftSchema
);
