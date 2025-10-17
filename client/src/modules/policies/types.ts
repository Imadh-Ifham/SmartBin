export type PolicyStatus = "Draft" | "UnderReview" | "Active" | "Retired" | "Archived";
export type PolicyComplianceStatus = "Compliant" | "NonCompliant" | "Pending";
export type PolicyStakeholderType = "resident" | "business" | "staff";

export interface PolicyFeedback {
  stakeholderType: PolicyStakeholderType;
  message?: string;
  date?: string;
}

export interface PolicyAuditEntry {
  action: string;
  date: string;
  user?: string;
}

export interface Policy {
  _id?: string;
  title: string;
  description: string;
  category?: string;
  ministry?: string;
  effectiveDate: string; // ISO date
  status?: PolicyStatus;
  complianceStatus?: "Compliant" | "NonCompliant" | "Pending";
  version?: number;
  lastReviewedBy?: string;
  feedback?: PolicyFeedback[];
  auditTrail?: PolicyAuditEntry[];
  issues?: string[];
  updatedAt?: string;
  createdAt?: string;
}
