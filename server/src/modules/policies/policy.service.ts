import { Policy, IPolicy, PolicyComplianceStatus, PolicyStakeholderType } from "./policy.model";
import { PolicyVersion } from "./policy.version.model";
import { complianceService } from "./compliance.service";
import mongoose, { Types, FilterQuery } from "mongoose";
import { reportService } from "./report.service";
import { feedbackService } from "./feedback.service";
import { policyRepository } from "./policy.repository";
import { notificationService } from "./notification.service";
import { POLICY_STATUS, COMPLIANCE_STATUS } from "./constants";
import { logger } from "./logger";
import { ServiceOptions } from "./types";

const ERROR_MESSAGES = {
  POLICY_NOT_COMPLIANT: "Policy does not meet compliance requirements."
};

const NOTIFICATION_EVENTS = {
  POLICY_APPROVED: "POLICY_APPROVED",
  FEEDBACK_REQUEST: "FEEDBACK_REQUEST"
};

export interface PolicyFeedbackDTO {
  stakeholderType: PolicyStakeholderType;
  message?: string;
  date?: Date;
}

export interface PolicyBaseDTO {
  title: string;
  description: string;
  category?: string;
  ministry?: string;
  effectiveDate: Date;
  status?: "Draft" | "UnderReview" | "Active" | "Retired" | "Archived";
  complianceStatus?: PolicyComplianceStatus;
  lastReviewedBy?: string;
}

export interface PolicyCreateDTO extends PolicyBaseDTO {
  feedback?: PolicyFeedbackDTO[];
  issues?: string[];
}

export interface PolicyUpdateDTO extends Partial<PolicyBaseDTO> {
  feedback?: PolicyFeedbackDTO[];
  issues?: string[];
}

export interface PolicyQuery {
  q?: string;
  category?: string;
  ministry?: string;
  status?: string;
  complianceStatus?: string;
}

const toObjectId = (id?: string) =>
  id && Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : undefined;

export class PolicyService {
  static async create(data: PolicyCreateDTO, options: ServiceOptions = {}): Promise<IPolicy> {
    const reviewerId = toObjectId(data.lastReviewedBy) || toObjectId(options.userId);
    const feedback = (data.feedback ?? []).map(({ stakeholderType, message }) => ({
      stakeholderType,
      message
    }));

    const policy = new Policy({
      ...data,
      complianceStatus: data.complianceStatus ?? COMPLIANCE_STATUS.COMPLIANT,
      status: data.status ?? POLICY_STATUS.DRAFT,
      lastReviewedBy: reviewerId,
      feedback,
      issues: data.issues ?? []
    });

    const auditEntry: any = { action: "Created Policy", date: new Date() };
    const auditUser = toObjectId(options.userId);
    if (auditUser) auditEntry.user = auditUser;
    policy.auditTrail.push(auditEntry);

    const saved = await policyRepository.create(policy);

    // notify stakeholders
    try {
      await notificationService.createAndSend(NOTIFICATION_EVENTS.POLICY_APPROVED, ["stakeholders@local"], { policyId: saved._id, version: saved.version });
    } catch (err) {
      logger.warn("Failed to send policy creation notification", { policyId: saved._id, error: err instanceof Error ? err.message : String(err) });
    }

    return saved;
  }

  static async requestFeedback(id: string, payload: { stakeholderGroups?: string[]; message?: string }, options: ServiceOptions = {}) {
    if (!Types.ObjectId.isValid(id)) return null;
    const policy = await policyRepository.findById(id);
    if (!policy) return null;

    const groups = payload.stakeholderGroups ?? ["resident"];
    const message = payload.message ?? "Please review the policy and provide feedback.";

    // record feedback request
    try {
      await feedbackService.addFeedback(String(policy._id), { stakeholderType: groups[0] ?? POLICY_STATUS.DRAFT, message, date: new Date().toISOString() });
    } catch (err) {
      logger.warn("Failed to record feedback request", { policyId: policy._id, error: err instanceof Error ? err.message : String(err) });
    }

    // notify stakeholders
    try {
      await notificationService.createAndSend(NOTIFICATION_EVENTS.FEEDBACK_REQUEST, groups.map(g => `${g}@local`), { policyId: policy._id, message });
    } catch (err) {
      logger.warn("Failed to send feedback request notification", { policyId: policy._id, error: err instanceof Error ? err.message : String(err) });
    }

    return { policyId: policy._id, requestedTo: groups, message };
  }

  private static async enrichPolicy(policy: any): Promise<any> {
    try {
      const [perf, violations, feedbackSummary, compliance] = await Promise.all([
        reportService.getPerformanceForPolicy(String(policy._id)),
        reportService.getViolationsForPolicy(String(policy._id)),
        feedbackService.getSummary(String(policy._id)),
        complianceService.check(policy, policy.ministry || undefined)
      ]);

      return {
        ...policy,
        performanceReport: perf,
        violations,
        complianceStatus: compliance.compliant ? COMPLIANCE_STATUS.COMPLIANT : COMPLIANCE_STATUS.NON_COMPLIANT,
        feedbackSummary
      };
    } catch (err) {
      logger.debug("Failed to enrich policy", { policyId: policy._id, error: err instanceof Error ? err.message : String(err) });
      return { ...policy };
    }
  }

  static async list(filters: PolicyQuery): Promise<IPolicy[]> {
    const query: FilterQuery<IPolicy> = {};
    if (filters.q) {
      const regex = new RegExp(filters.q, "i");
      query.$or = [{ title: regex }, { description: regex }, { ministry: regex }];
    }
    if (filters.category) query.category = filters.category;
    if (filters.ministry) query.ministry = filters.ministry;
    if (filters.status) query.status = filters.status as any;
    if (filters.complianceStatus) query.complianceStatus = filters.complianceStatus as any;

    const policies: any[] = (await policyRepository.find(query)) as any[];
    return Promise.all(policies.map(p => this.enrichPolicy(p)));
  }

  static async get(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return policyRepository.findById(id);
  }

  static async update(id: string, update: PolicyUpdateDTO, options: ServiceOptions = {}) {
    if (!Types.ObjectId.isValid(id)) return null;
    const policy = await policyRepository.findById(id);
    if (!policy) return null;

    // persist current snapshot as version
    try {
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        const snapshot = typeof (policy as any).toObject === "function" ? (policy as any).toObject() : policy;
        await policyRepository.saveVersion(policy._id, policy.version ?? 1, snapshot, toObjectId(options.userId));
      }
    } catch (err) {
      logger.warn("Failed to save version during update", { policyId: id, error: err instanceof Error ? err.message : String(err) });
    }

    if (update.title !== undefined) policy.title = update.title;
    if (update.description !== undefined) policy.description = update.description;
    if (update.category !== undefined) policy.category = update.category;
    if (update.ministry !== undefined) policy.ministry = update.ministry;
    if (update.effectiveDate !== undefined) policy.effectiveDate = update.effectiveDate;
    if (update.status !== undefined) policy.status = update.status;
    if (update.complianceStatus !== undefined) policy.complianceStatus = update.complianceStatus;

    const reviewerId = toObjectId(update.lastReviewedBy) || toObjectId(options.userId);
    if (reviewerId) policy.lastReviewedBy = reviewerId;

    if (update.feedback?.length) {
      const newFeedback = update.feedback.map(({ stakeholderType, message }) => ({
        stakeholderType,
        message: message ?? "",
        date: new Date()
      }));
      policy.feedback.push(...newFeedback);
    }

    if (update.issues) {
      policy.issues = update.issues;
    }

    const shouldCheck = !!policy.ministry || options.enforceCompliance === true;
    if (shouldCheck) {
      const complianceSnapshot = typeof (policy as any).toObject === "function" ? (policy as any).toObject() : policy;
      const compliance = await complianceService.check(complianceSnapshot, policy.ministry || undefined);
      if (!compliance.compliant) {
        const err: any = new Error(ERROR_MESSAGES.POLICY_NOT_COMPLIANT);
        err.status = 409;
        err.details = compliance.issues;
        throw err;
      }
    }

    policy.version = (policy.version ?? 1) + 1;
    const auditEntry: any = { action: "Updated Policy", date: new Date() };
    if (reviewerId) auditEntry.user = reviewerId;
    policy.auditTrail.push(auditEntry);

    return policyRepository.update(policy);
  }

  static async approve(id: string, options: ServiceOptions = {}) {
    if (!Types.ObjectId.isValid(id)) return null;
    const policy = await policyRepository.findById(id);
    if (!policy) return null;

    const reviewerId = toObjectId(options.userId);
    if (reviewerId) policy.lastReviewedBy = reviewerId;

    const shouldCheckApprove = !!policy.ministry || options.enforceCompliance === true;
    if (shouldCheckApprove) {
      const complianceSnapshot = typeof (policy as any).toObject === "function" ? (policy as any).toObject() : policy;
      const compliance = await complianceService.check(complianceSnapshot, policy.ministry || undefined);
      if (!compliance.compliant) {
        const err: any = new Error(ERROR_MESSAGES.POLICY_NOT_COMPLIANT);
        err.status = 409;
        err.details = compliance.issues;
        throw err;
      }
    }

    // save current snapshot as version before approving
    try {
      if (mongoose.connection && mongoose.connection.readyState === 1) {
        const snapshot = typeof (policy as any).toObject === "function" ? (policy as any).toObject() : policy;
        await policyRepository.saveVersion(policy._id, policy.version ?? 1, snapshot, reviewerId);
      }
    } catch (err) {
      logger.warn("Failed to save version during approval", { policyId: id, error: err instanceof Error ? err.message : String(err) });
    }

    policy.status = POLICY_STATUS.ACTIVE;
    policy.version = (policy.version ?? 1) + 1;

    const auditEntry: any = { action: "Approved Policy", date: new Date() };
    if (reviewerId) auditEntry.user = reviewerId;
    policy.auditTrail.push(auditEntry);

    const updatedPolicy = await policyRepository.update(policy);

    // Send notification to stakeholders
    try {
      const policyData = policy as any;
      const stakeholders = policyData.stakeholders?.map((s: any) => s.email || s.name).filter(Boolean) || [];
      if (stakeholders.length > 0) {
        await notificationService.createAndSend(
          'PolicyApproved',
          stakeholders,
          {
            policyId: policy._id,
            policyTitle: policy.title,
            approvedBy: reviewerId,
            approvedAt: new Date(),
            message: `Policy "${policy.title}" has been approved and is now active.`
          }
        );
      }
    } catch (err) {
      logger.warn("Failed to send approval notification", { policyId: id, error: err instanceof Error ? err.message : String(err) });
    }

    return updatedPolicy;
  }

  static async versions(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    // return stored PolicyVersion entries for the given policy id
    const pid = new Types.ObjectId(id);
    return PolicyVersion.find({ policyId: pid }).sort({ createdAt: -1 }).lean();
  }

  static async audit(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    const policy = await policyRepository.findById(id);
    if (!policy) return null;
    return policy.auditTrail || [];
  }

  static async markIssue(
    id: string,
    issue: string,
    options: ServiceOptions = {}
  ) {
    if (!Types.ObjectId.isValid(id)) return null;
    const policy = await Policy.findById(id);
    if (!policy) return null;

    policy.issues = [...(policy.issues ?? []), issue];

    const reviewerId = toObjectId(options.userId);
    if (reviewerId) policy.lastReviewedBy = reviewerId;

    policy.version = (policy.version ?? 1) + 1;

    const auditEntry: any = { action: `Flagged Issue: ${issue}`, date: new Date() };
    if (reviewerId) auditEntry.user = reviewerId;
    policy.auditTrail.push(auditEntry);

    return policy.save();
  }

  static async revalidateCompliance(id: string, options: ServiceOptions = {}) {
    if (!Types.ObjectId.isValid(id)) return null;
    const policy = await policyRepository.findById(id);
    if (!policy) return null;

    // Run compliance check
    const complianceSnapshot = typeof (policy as any).toObject === "function" ? (policy as any).toObject() : policy;
    const complianceResult = await complianceService.check(complianceSnapshot, policy.ministry || undefined);

    // Update compliance status
    const newStatus = complianceResult.compliant ? COMPLIANCE_STATUS.COMPLIANT : COMPLIANCE_STATUS.NON_COMPLIANT;
    const previousStatus = policy.complianceStatus;
    policy.complianceStatus = newStatus as PolicyComplianceStatus;

    // Add audit trail
    const reviewerId = toObjectId(options.userId);
    if (reviewerId) policy.lastReviewedBy = reviewerId;

    const auditEntry: any = {
      action: `Compliance Revalidation: ${previousStatus} → ${newStatus}`,
      date: new Date()
    };
    if (reviewerId) auditEntry.user = reviewerId;
    policy.auditTrail.push(auditEntry);

    const updatedPolicy = await policyRepository.update(policy);

    // Send notification if compliance status changed
    try {
      if (previousStatus !== newStatus) {
        const policyData = policy as any;
        const stakeholders = policyData.stakeholders?.map((s: any) => s.email || s.name).filter(Boolean) || [];
        if (stakeholders.length > 0) {
          await notificationService.createAndSend(
            'ComplianceStatusChanged',
            stakeholders,
            {
              policyId: policy._id,
              policyTitle: policy.title,
              previousStatus,
              newStatus,
              issues: complianceResult.issues,
              revalidatedAt: new Date(),
              message: `Policy "${policy.title}" compliance status changed from ${previousStatus} to ${newStatus}.`
            }
          );
        }
      }
    } catch (err) {
      logger.warn("Failed to send compliance notification", { policyId: id, error: err instanceof Error ? err.message : String(err) });
    }

    return {
      policy: updatedPolicy,
      complianceResult,
      statusChanged: previousStatus !== newStatus
    };
  }

  static async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return policyRepository.deleteById(id);
  }
}
