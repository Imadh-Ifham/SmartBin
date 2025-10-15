import { Schema, model, Document, Types } from "mongoose";

export type PolicyStatus = "Draft" | "UnderReview" | "Active" | "Retired" | "Archived";
export type PolicyComplianceStatus = "Compliant" | "NonCompliant" | "Pending";
export type PolicyStakeholderType = "resident" | "business" | "staff";

export interface PolicyFeedback {
  stakeholderType: PolicyStakeholderType;
  message?: string;
  date: Date;
}

export interface PolicyAuditEntry {
  action: string;
  date: Date;
  user?: Types.ObjectId;
}

export interface IPolicy extends Document {
  title: string;
  description: string;
  category?: string;
  ministry?: string;
  effectiveDate: Date;
  status: PolicyStatus;
  complianceStatus: PolicyComplianceStatus;
  version: number;
  lastReviewedBy?: Types.ObjectId;
  feedback: PolicyFeedback[];
  auditTrail: PolicyAuditEntry[];
  issues: string[];
  updatedAt: Date; // renamed to match frontend expectation
  createdAt: Date;
}

const FeedbackSchema = new Schema<PolicyFeedback>(
  {
    stakeholderType: {
      type: String,
      enum: ["resident", "business", "staff"],
      required: true
    },
    message: { type: String, trim: true },
    date: { type: Date, default: Date.now }
  },
  { _id: false }
);

const AuditTrailSchema = new Schema<PolicyAuditEntry>(
  {
    action: { type: String, required: true, trim: true },
    date: { type: Date, default: Date.now },
    user: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { _id: false }
);

const PolicySchema = new Schema<IPolicy>(
  {
    title: { type: String, required: true, trim: true, minlength: 3 },
    description: { type: String, required: true, minlength: 10 },
    category: { type: String, index: true },
    ministry: { type: String, index: true },
    effectiveDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Draft", "UnderReview", "Active", "Retired", "Archived"],
      default: "Draft",
      index: true
    },
    complianceStatus: {
      type: String,
      enum: ["Compliant", "NonCompliant", "Pending"],
      default: "Compliant",
      index: true
    },
    version: { type: Number, default: 1 },
    lastReviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    feedback: { type: [FeedbackSchema], default: [] },
    auditTrail: { type: [AuditTrailSchema], default: [] },
  issues: { type: [String], default: [] },
  updatedAt: { type: Date, default: Date.now }
  },
  {
    // Use updatedAt so frontend and API consumers get `updatedAt` (ISO) field
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false
  }
);

PolicySchema.index({ title: "text", description: "text", ministry: "text" });

export const Policy = model<IPolicy>("Policy", PolicySchema);
