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

/**
 * PolicyService
 * Core business logic for managing policies: create, update, approve, list, audit, compliance, feedback, and versioning.
 * All methods are static and operate on DTOs and Mongoose models.
 */
/**
 * PolicyService
 *
 * Service layer responsible for business rules around policies. Controllers call
 * these static methods to perform domain operations. The class delegates persistence
 * to `policyRepository` and uses other services (reportService, feedbackService,
 * complianceService, notificationService) to keep responsibilities separated.
 *
 * Design/architecture notes:
 * - Service Layer Pattern: encapsulates business logic and orchestration of multiple
 *   lower-level components (repositories, external services).
 * - Dependency Inversion: the service depends on higher-level abstractions exported
 *   from modules (e.g., `policyRepository`) rather than inlining Mongoose queries.
 * - Single Responsibility: each method performs a single domain operation (create,
 *   update, approve, etc.) and coordinates collaborators.
 * - Testability: because side-effecting dependencies are imported modules, tests
 *   mock these modules (e.g., jest.spyOn(notificationService, 'createAndSend'))
 *   to assert behavior without touching external systems.
 */
export class PolicyService {
  /**
   * Create a new policy
   * @param {PolicyCreateDTO} data - Policy creation data
   * @param {ServiceOptions} [options] - Service options (e.g., userId)
   * @returns {Promise<IPolicy>} The created policy document
   */
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

    // persist the new policy through repository (data-access)
    const saved = await policyRepository.create(policy);

    // notify stakeholders asynchronously; failures should not block creation.
    // This is an example of a best-effort side-effect: we log warnings on failure
    // but still return the created policy to the caller.
    try {
      await notificationService.createAndSend(NOTIFICATION_EVENTS.POLICY_APPROVED, ["stakeholders@local"], { policyId: saved._id, version: saved.version });
    } catch (err) {
      logger.warn("Failed to send policy creation notification", { policyId: saved._id, error: err instanceof Error ? err.message : String(err) });
    }

    return saved;
  }

  /**
   * Request feedback from stakeholders for a policy
   * @param {string} id - Policy ObjectId string
   * @param {{ stakeholderGroups?: string[]; message?: string }} payload - Feedback request details
   * @param {ServiceOptions} [options] - Service options
   * @returns {Promise<{ policyId: string; requestedTo: string[]; message: string } | null>} Feedback request result or null if not found
   */
  static async requestFeedback(id: string, payload: { stakeholderGroups?: string[]; message?: string }, options: ServiceOptions = {}) {
    if (!Types.ObjectId.isValid(id)) return null;
    const policy = await policyRepository.findById(id);
    if (!policy) return null;

    const groups = payload.stakeholderGroups ?? ["resident"];
    const message = payload.message ?? "Please review the policy and provide feedback.";

    // record feedback request in feedbackService. If feedback persistence fails
    // (e.g., DB unavailable), the feedbackService implementation will fallback to
    // an in-memory store — we log warning but do not fail the whole operation.
    try {
      await feedbackService.addFeedback(String(policy._id), { stakeholderType: groups[0] ?? POLICY_STATUS.DRAFT, message, date: new Date().toISOString() });
    } catch (err) {
      logger.warn("Failed to record feedback request", { policyId: policy._id, error: err instanceof Error ? err.message : String(err) });
    }

    // notify stakeholders; best-effort as well (don't fail on notify errors)
    try {
      await notificationService.createAndSend(NOTIFICATION_EVENTS.FEEDBACK_REQUEST, groups.map(g => `${g}@local`), { policyId: policy._id, message });
    } catch (err) {
      logger.warn("Failed to send feedback request notification", { policyId: policy._id, error: err instanceof Error ? err.message : String(err) });
    }

    return { policyId: policy._id, requestedTo: groups, message };
  }

  /**
   * Enrich a policy with performance, violations, feedback summary, and compliance status
   * @param {any} policy - Policy object
   * @returns {Promise<any>} Enriched policy object
   */
  private static async enrichPolicy(policy: any): Promise<any> {
    // Enrichment aggregates data from reporting, feedback and compliance services.
    // It runs in parallel (Promise.all) for speed. If any enrichment fails we
    // return the base policy (graceful degradation) and log the error for debugging.
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
      // Fail-safe: enrichment is not critical for the API consumer; log and return the
      // original policy so callers can still use the result.
      logger.debug("Failed to enrich policy", { policyId: policy._id, error: err instanceof Error ? err.message : String(err) });
      return { ...policy };
    }
  }

  /**
   * List policies matching filters, with enrichment
   * @param {PolicyQuery} filters - Query filters (q, category, ministry, status, complianceStatus)
   * @returns {Promise<IPolicy[]>} Array of enriched policy documents
   */
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

    // Query is delegated to repository; we then enrich each result. Returning
    // Promise.all(...) yields an array of enriched policies.
    const policies: any[] = (await policyRepository.find(query)) as any[];
    return Promise.all(policies.map(p => this.enrichPolicy(p)));
  }

  /**
   * Get a single policy by ObjectId
   * @param {string} id - Policy ObjectId string
   * @returns {Promise<IPolicy|null>} Policy document or null if not found/invalid
   */
  static async get(id: string): Promise<IPolicy|null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return policyRepository.findById(id);
  }

  /**
   * Update a policy by ObjectId
   * @param {string} id - Policy ObjectId string
   * @param {PolicyUpdateDTO} update - Update data
   * @param {ServiceOptions} [options] - Service options
   * @returns {Promise<IPolicy|null>} Updated policy document or null if not found/invalid
   * @throws {Error} If compliance check fails (409)
   */
  static async update(id: string, update: PolicyUpdateDTO, options: ServiceOptions = {}): Promise<IPolicy|null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const policy = await policyRepository.findById(id);
    if (!policy) return null;

    // Persist current snapshot as a version (if DB connected). This is used for
    // audit/rollback. We attempt to save a version but don't fail the update if
    // the saveVersion operation throws — we log a warning instead.
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

    // Optionally run compliance checks when a ministry is present or enforcement is requested.
    // If compliance fails we throw a 409-styled Error so controllers can map this to
    // an appropriate HTTP response. This enforces domain rules before persisting changes.
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

    // Finalize version increment and audit trail, then persist update
    policy.version = (policy.version ?? 1) + 1;
    const auditEntry: any = { action: "Updated Policy", date: new Date() };
    if (reviewerId) auditEntry.user = reviewerId;
    policy.auditTrail.push(auditEntry);

    return policyRepository.update(policy);
  }

  /**
   * Approve a policy, activating it and notifying stakeholders
   * @param {string} id - Policy ObjectId string
   * @param {ServiceOptions} [options] - Service options
   * @returns {Promise<IPolicy|null>} Approved policy document or null if not found/invalid
   * @throws {Error} If compliance check fails (409)
   */
  static async approve(id: string, options: ServiceOptions = {}): Promise<IPolicy|null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const policy = await policyRepository.findById(id);
    if (!policy) return null;

    const reviewerId = toObjectId(options.userId);
    if (reviewerId) policy.lastReviewedBy = reviewerId;

    // Approve-time compliance check (similar to update). If compliance fails we
    // throw so controllers can translate into a 409 response. `options.enforceCompliance`
    // can be used to force the check even when ministry is not set.
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

    // Save a version snapshot before changing the active state. As with update,
    // failures in the saveVersion operation are logged but do not abort approval.
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

    // Persist changes and then attempt to notify stakeholders if present. The
    // notification is best-effort and is guarded with try/catch to avoid aborting
    // the approval flow on notification failures.
    const updatedPolicy = await policyRepository.update(policy);

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

  /**
   * Get all versions for a policy
   * @param {string} id - Policy ObjectId string
   * @returns {Promise<any[]|null>} Array of PolicyVersion documents or null if invalid id
   */
  static async versions(id: string): Promise<any[]|null> {
    if (!Types.ObjectId.isValid(id)) return null;
    // return stored PolicyVersion entries for the given policy id
    const pid = new Types.ObjectId(id);
    return PolicyVersion.find({ policyId: pid }).sort({ createdAt: -1 }).lean();
  }

  /**
   * Get audit trail for a policy
   * @param {string} id - Policy ObjectId string
   * @returns {Promise<any[]|null>} Array of audit entries or null if not found/invalid
   */
  static async audit(id: string): Promise<any[]|null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const policy = await policyRepository.findById(id);
    if (!policy) return null;
    return policy.auditTrail || [];
  }

  /**
   * Flag an issue on a policy
   * @param {string} id - Policy ObjectId string
   * @param {string} issue - Issue description
   * @param {ServiceOptions} [options] - Service options
   * @returns {Promise<any|null>} Updated policy document or null if not found/invalid
   */
  static async markIssue(
    id: string,
    issue: string,
    options: ServiceOptions = {}
  ): Promise<any|null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const policy = await Policy.findById(id);
    if (!policy) return null;

    // Append an issue to the policy, update version and audit trail, and persist.
    policy.issues = [...(policy.issues ?? []), issue];

    const reviewerId = toObjectId(options.userId);
    if (reviewerId) policy.lastReviewedBy = reviewerId;

    policy.version = (policy.version ?? 1) + 1;

    const auditEntry: any = { action: `Flagged Issue: ${issue}`, date: new Date() };
    if (reviewerId) auditEntry.user = reviewerId;
    policy.auditTrail.push(auditEntry);

    return policy.save();
  }

  /**
   * Revalidate compliance for a policy, updating status and notifying stakeholders if changed
   * @param {string} id - Policy ObjectId string
   * @param {ServiceOptions} [options] - Service options
   * @returns {Promise<{ policy: IPolicy, complianceResult: any, statusChanged: boolean }|null>} Result object or null if not found/invalid
   */
  static async revalidateCompliance(id: string, options: ServiceOptions = {}): Promise<{ policy: IPolicy, complianceResult: any, statusChanged: boolean }|null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const policy = await policyRepository.findById(id);
    if (!policy) return null;

    // Run compliance check and update policy complianceStatus. Create an audit
    // entry for the revalidation and persist the change. If the status changed
    // from previousStatus to newStatus, attempt to notify stakeholders.
    // Notification failures are logged but do not revert the change.
    const complianceSnapshot = typeof (policy as any).toObject === "function" ? (policy as any).toObject() : policy;
    const complianceResult = await complianceService.check(complianceSnapshot, policy.ministry || undefined);

    const newStatus = complianceResult.compliant ? COMPLIANCE_STATUS.COMPLIANT : COMPLIANCE_STATUS.NON_COMPLIANT;
    const previousStatus = policy.complianceStatus;
    policy.complianceStatus = newStatus as PolicyComplianceStatus;

    const reviewerId = toObjectId(options.userId);
    if (reviewerId) policy.lastReviewedBy = reviewerId;

    const auditEntry: any = {
      action: `Compliance Revalidation: ${previousStatus} → ${newStatus}`,
      date: new Date()
    };
    if (reviewerId) auditEntry.user = reviewerId;
    policy.auditTrail.push(auditEntry);

    const updatedPolicy = await policyRepository.update(policy);

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

  /**
   * Remove (delete) a policy by ObjectId
   * @param {string} id - Policy ObjectId string
   * @returns {Promise<any|null>} Result of deletion or null if invalid id
   */
  static async remove(id: string): Promise<any|null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return policyRepository.deleteById(id);
  }
}
