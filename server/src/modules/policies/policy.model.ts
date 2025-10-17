import { Schema, model, Document, Types } from "mongoose";
import { POLICY_STATUS, COMPLIANCE_STATUS, STAKEHOLDER_TYPES } from "./constants";

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

PolicySchema.index({ title: "text", description: "text", ministry: "text" });

export const Policy = model<IPolicy>("Policy", PolicySchema);
