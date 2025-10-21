import { Schema, model, Document, Types } from "mongoose";
import { POLICY_STATUS, COMPLIANCE_STATUS, STAKEHOLDER_TYPES } from "./constants";

/**
 * Policy model types and Mongoose schema
 *
 * This file defines TypeScript interfaces that represent the data shapes used by the
 * PolicyService and the Mongoose schemas that persist them. Keeping types and schema
 * definitions colocated helps ensure the TypeScript types reflect the stored data.
 *
 * Important types:
 * - PolicyFeedback: a feedback entry provided/requested from stakeholders
 * - PolicyAuditEntry: audit trail entries (action, date, optional user who triggered it)
 * - IPolicy: main document interface used across services/controllers
 *
 * Design notes:
 * - The schema uses subdocuments for feedback and auditTrail to keep related data
 *   embedded with the policy document (good for read-heavy operations and atomic updates).
 * - A text index is created for title/description/ministry to allow simple search via
 *   the `q` filter in queries (used in PolicyService.list).
 */

export type PolicyStatus = typeof POLICY_STATUS[keyof typeof POLICY_STATUS];
export type PolicyComplianceStatus = typeof COMPLIANCE_STATUS[keyof typeof COMPLIANCE_STATUS];
export type PolicyStakeholderType = typeof STAKEHOLDER_TYPES[keyof typeof STAKEHOLDER_TYPES];

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
  updatedAt: Date;
  createdAt: Date;
}

const FeedbackSchema = new Schema<PolicyFeedback>(
  {
    stakeholderType: {
      type: String,
      enum: Object.values(STAKEHOLDER_TYPES),
      required: true,
    },
    message: { type: String, trim: true },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AuditTrailSchema = new Schema<PolicyAuditEntry>(
  {
    action: { type: String, required: true, trim: true },
    date: { type: Date, default: Date.now },
    user: { type: Schema.Types.ObjectId, ref: "User" },
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
      enum: Object.values(POLICY_STATUS),
      default: POLICY_STATUS.DRAFT,
      index: true,
    },
    complianceStatus: {
      type: String,
      enum: Object.values(COMPLIANCE_STATUS),
      default: COMPLIANCE_STATUS.COMPLIANT,
      index: true,
    },
    version: { type: Number, default: 1 },
    lastReviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    feedback: { type: [FeedbackSchema], default: [] },
    auditTrail: { type: [AuditTrailSchema], default: [] },
    issues: { type: [String], default: [] },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  }
);

// Text index to support simple q-based search in PolicyService.list
PolicySchema.index({ title: "text", description: "text", ministry: "text" });

export const Policy = model<IPolicy>("Policy", PolicySchema);
