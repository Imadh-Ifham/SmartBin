import mongoose, { Schema, Document, Types } from "mongoose";

/**
 * Represents a single waste type entry (e.g., Plastic, Organic, etc.)
 * within a bin’s collection record.
 */
export interface WasteTypeEntry {
  type: Types.ObjectId;
  weight: number;
  timestamp: Date;
}

/**
 * Full waste collection document for a specific bin or QR code.
 */
export interface WasteCollectionDoc extends Document {
  code: string;
  wasteTypes: WasteTypeEntry[];
  collected: boolean;
}

/** Schema for individual waste type entries */
const WasteTypeEntrySchema = new Schema<WasteTypeEntry>(
  {
    type: { type: Schema.Types.ObjectId, required: true },
    weight: { type: Number, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

/** Schema for the main waste collection record */
const WasteCollectionSchema = new Schema<WasteCollectionDoc>(
  {
    code: { type: String, required: true },
    wasteTypes: { type: [WasteTypeEntrySchema], required: true },
    collected: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

/**
 * WasteCollection Model
 * Stores data for each bin’s waste record including types and collection status.
 */
export default mongoose.model<WasteCollectionDoc>(
  "WasteCollection",
  WasteCollectionSchema
);
