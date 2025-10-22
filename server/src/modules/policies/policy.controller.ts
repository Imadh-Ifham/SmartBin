import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { PolicyService } from "./policy.service";
import type { PolicyCreateDTO, PolicyUpdateDTO } from "./policy.service";
import { STAKEHOLDER_TYPES } from "./constants";
import { FeedbackRequest, IssueRequest, ServiceOptions } from "./types";

/**
 * Standardized error messages used across controller responses. Keeping these in a
 * single object makes it easier to maintain consistent API error replies and helps
 * during the viva to explain error handling conventions.
 */
const ERROR_MESSAGES = {
  VALIDATION_FAILED: "Validation failed",
  SERVER_ERROR: "Server error",
  INVALID_ID: "Invalid id",
  POLICY_NOT_FOUND: "Policy not found"
};

/**
 * Zod schema for feedback date
 * Accepts string or Date, transforms to Date, validates format
 * Uses Zod transform context to report issues for invalid values.
 */
export const feedbackDateSchema = z
  .union([z.string(), z.date()])
  .transform((value: string | Date, ctx: any) => {
    if (value instanceof Date) return value;
    const normalized = String(value ?? "").trim();
    if (!normalized) {
      // Zod expects a specific issue shape; cast to any to satisfy TS
      (ctx as any).addIssue?.({ code: z.ZodIssueCode.custom as any, message: "Invalid date" });
      return z.NEVER;
    }
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      // If date parsing fails we add a Zod custom issue so the controller can
      // return a 400/validation error with useful details. This demonstrates
      // input validation at the controller boundary (Validation responsibility).
      (ctx as any).addIssue?.({ code: z.ZodIssueCode.custom as any, message: "Invalid date" });
      return z.NEVER;
    }
    return parsed;
  });

/**
 * Zod schema for feedback object
 * Validates stakeholderType, message, and date
 */
export const feedbackSchema = z.object({
  stakeholderType: z.enum([
    STAKEHOLDER_TYPES.RESIDENT,
    STAKEHOLDER_TYPES.BUSINESS,
    STAKEHOLDER_TYPES.STAFF,
  ]),
  // `message` is optional but if present it must contain text (min length 1)
  message: z.string().trim().min(1, "Feedback message is required").optional(),
  // `date` accepts string or Date via feedbackDateSchema which normalizes/validates
  date: feedbackDateSchema.optional(),
});

/**
 * Schema Definitions
 */
/**
 * Zod schema for base policy fields
 * Used for create and update validation
 */
export const baseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().trim().optional(),
  ministry: z.string().trim().optional(),
  effectiveDate: z.preprocess(
    (v) => (typeof v === "string" || v instanceof Date ? new Date(v) : v),
    z.date()
  ),
  status: z
    .enum(["Draft", "UnderReview", "Active", "Retired", "Archived"])
    .optional(),
  complianceStatus: z.enum(["Compliant", "NonCompliant", "Pending"]).optional(),
  lastReviewedBy: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, "lastReviewedBy must be a valid ObjectId")
    .optional(),
  feedback: z.array(feedbackSchema).optional(),
  issues: z.array(z.string().min(1)).optional(),
});

export const createSchema = baseSchema;
export const updateSchema = baseSchema.partial();

/**
 * Utility for standardized error responses
 */
/**
 * Utility for standardized error responses
 * @param {Response} res - Express response object
 * @param {number} code - HTTP status code
 * @param {string} message - Error message
 * @param {any} [details] - Optional error details
 * @returns {Response} Express response
 */
export const sendError = (
  res: Response,
  code: number,
  message: string,
  details?: any
) => res.status(code).json({ error: message, details });

/**
 * Extract userId from Express request
 * @param {Request} req - Express request
 * @returns {string|undefined} userId if present
 */
export const extractUserId = (req: Request): string | undefined =>
  (req as any).user?.id || (req as any).user?._id || undefined;

/**
 * Build ServiceOptions object from userId
 * @param {string|undefined} userId
 * @returns {ServiceOptions} options object
 */
export const buildServiceOptions = (
  userId: string | undefined
): ServiceOptions => ({
  ...(userId && { userId }),
});

/**
 * Policy Controller — handles HTTP layer
 */
/**
 * PolicyControllerClass
 * Express controller for policy endpoints: create, get, update, approve, list, audit, versions, flagIssue, requestFeedback, remove, revalidateCompliance
 */
export class PolicyControllerClass {
  /**
   * Create new policy
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   * @returns {Promise<Response>} HTTP response with created policy or error
   */
  public create = async (req: Request, res: Response): Promise<Response> => {
    try {
      // Validate incoming payload at the controller boundary. Using Zod keeps
      // validation declarative and consistent; controller only proceeds when
      // parsed payload conforms to DTO shape.
      const payload = createSchema.parse(req.body);
      const userId = extractUserId(req);
      const options = buildServiceOptions(userId);
      const policy = await PolicyService.create(
        { ...(payload as PolicyCreateDTO) },
        options
      );
      return res
        .status(201)
        .json({ message: "Policy created successfully", policy });
    } catch (e: any) {
      if (e instanceof z.ZodError)
        return sendError(res, 400, ERROR_MESSAGES.VALIDATION_FAILED, e.issues);
      // Service can throw domain errors with a status (e.g., 409 for compliance failures).
      if (e && typeof e.status === 'number') {
        const status = e.status === 409 ? 409 : 500;
        return sendError(res, status, e.message || ERROR_MESSAGES.SERVER_ERROR, e.details);
      }
      // Unexpected error: log full error for debugging before returning generic 500
      console.error('Unexpected error in PolicyController.update:', e && (e.stack || e.message || e));
      return sendError(res, 500, ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  /**
   * Get a single policy by ID
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   * @returns {Promise<Response>} HTTP response with policy or error
   */
  public get = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      if (typeof id !== "string")
        return sendError(res, 400, ERROR_MESSAGES.INVALID_ID);

      const policy = await PolicyService.get(id);
      if (!policy) return sendError(res, 404, ERROR_MESSAGES.POLICY_NOT_FOUND);

      return res.json({ policy });
    } catch (e: any) {
      // Surface domain errors (e.g., compliance failures) as their intended status code
      if (e && typeof e.status === 'number') {
        const status = e.status === 409 ? 409 : 500;
        return sendError(res, status, e.message || ERROR_MESSAGES.SERVER_ERROR, e.details);
      }
      // Unexpected error: log full error for debugging before returning generic 500
      console.error('Unexpected error in PolicyController.approve:', e && (e.stack || e.message || e));
      return sendError(res, 500, ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  /**
   * List versions for a policy
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   * @returns {Promise<Response>} HTTP response with versions or error
   */
  public versions = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      if (typeof id !== "string")
        return sendError(res, 400, ERROR_MESSAGES.INVALID_ID);

      // Controller calls the service (business logic). The service returns
      // version documents (PolicyVersion); controller wraps them in a simple
      // response shape with a count for convenience.
      const versions = await (PolicyService as any).versions?.(id);
      if (!versions)
        return sendError(res, 404, ERROR_MESSAGES.POLICY_NOT_FOUND);
      return res.json({ count: versions.length, versions });
    } catch {
      return sendError(res, 500, ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  /**
   * Get audit trail for a policy
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   * @returns {Promise<Response>} HTTP response with audit trail or error
   */
  public audit = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      if (typeof id !== "string")
        return sendError(res, 400, ERROR_MESSAGES.INVALID_ID);

      // Audit trail is a small array of entries stored on the policy document.
      // Controller returns the array and a count; audit entries include action,
      // date and optional user who performed the action.
      const audit = await (PolicyService as any).audit?.(id);
      if (!audit) return sendError(res, 404, ERROR_MESSAGES.POLICY_NOT_FOUND);
      return res.json({ count: audit.length, audit });
    } catch {
      return sendError(res, 500, ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  /**
   * List all policies (supports filters and search)
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   * @returns {Promise<Response>} HTTP response with policies or error
   */
  public list = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { q, category, ministry, status, complianceStatus } = req.query;
      const query: any = {};

      if (typeof q === "string") query.q = q;
      if (typeof category === "string") query.category = category;
      if (typeof ministry === "string") query.ministry = ministry;
      if (typeof status === "string") query.status = status;
      if (typeof complianceStatus === "string")
        query.complianceStatus = complianceStatus;

      // List delegates searching and enrichment to the service. Enrichment will
      // attach performanceReport, violations, feedbackSummary and complianceStatus
      // for each returned policy. This keeps the controller thin and focused on
      // HTTP concerns only.
      const policies = await PolicyService.list(query);
      return res.json({ count: policies.length, policies });
    } catch {
      return sendError(res, 500, ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  /**
   * Update a policy by ID
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   * @returns {Promise<Response>} HTTP response with updated policy or error
   */
  public update = async (req: Request, res: Response): Promise<Response> => {
    try {
      // Validate update payload; updateSchema is partial so callers can send
      // only fields they wish to change.
      const payload = updateSchema.parse(req.body);
      const { id } = req.params;
      if (typeof id !== "string")
        return sendError(res, 400, ERROR_MESSAGES.INVALID_ID);

      const userId = extractUserId(req);
      const options = buildServiceOptions(userId);
      const updated = await PolicyService.update(
        id,
        payload as PolicyUpdateDTO,
        options
      );
      if (!updated) return sendError(res, 404, ERROR_MESSAGES.POLICY_NOT_FOUND);

      return res.json({
        message: "Policy updated successfully",
        policy: updated,
      });
    } catch (e: any) {
      if (e instanceof z.ZodError)
        return sendError(res, 400, ERROR_MESSAGES.VALIDATION_FAILED, e.issues);
      return sendError(res, 500, ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  /**
   * Approve a policy
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   * @returns {Promise<Response>} HTTP response with approved policy or error
   */
  public approve = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      if (typeof id !== "string")
        return sendError(res, 400, ERROR_MESSAGES.INVALID_ID);

      const userId = extractUserId(req);
      const options = buildServiceOptions(userId);
      const approved = await PolicyService.approve(id, options);
      if (!approved)
        return sendError(res, 404, ERROR_MESSAGES.POLICY_NOT_FOUND);

      return res.json({
        message: "Policy approved successfully",
        policy: approved,
      });
    } catch {
      return sendError(res, 500, ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  /**
   * Flag an issue on a policy
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   * @returns {Promise<Response>} HTTP response with updated policy or error
   */
  public flagIssue = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const { issue } = z
        .object({ issue: z.string().min(3, "Issue description required") })
        .parse(req.body);

      if (typeof id !== "string")
        return sendError(res, 400, ERROR_MESSAGES.INVALID_ID);

      const userId = extractUserId(req);
      const options = buildServiceOptions(userId);
      const updated = await PolicyService.markIssue(id, issue, options);
      if (!updated) return sendError(res, 404, ERROR_MESSAGES.POLICY_NOT_FOUND);

      return res.json({
        message: "Issue recorded successfully",
        policy: updated,
      });
    } catch (e: any) {
      if (e instanceof z.ZodError)
        return sendError(res, 400, ERROR_MESSAGES.VALIDATION_FAILED, e.issues);
      return sendError(res, 500, ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  /**
   * Request stakeholder feedback for a policy
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   * @returns {Promise<Response>} HTTP response with feedback request result or error
   */
  public requestFeedback = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const { stakeholderGroups, message } = req.body as FeedbackRequest;
      if (typeof id !== "string")
        return sendError(res, 400, ERROR_MESSAGES.INVALID_ID);

      const userId = extractUserId(req);
      const options = buildServiceOptions(userId);
      const result = await (PolicyService as any).requestFeedback?.(
        id,
        { stakeholderGroups, message },
        options
      );
      if (!result) return sendError(res, 404, ERROR_MESSAGES.POLICY_NOT_FOUND);
      return res.json({ message: "Feedback requested", result });
    } catch (e: any) {
      return sendError(res, 500, ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  /**
   * Delete a policy by ID
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   * @returns {Promise<Response>} HTTP response with deletion result or error
   */
  public remove = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      if (typeof id !== "string")
        return sendError(res, 400, ERROR_MESSAGES.INVALID_ID);

      const deleted = await PolicyService.remove(id);
      if (!deleted) return sendError(res, 404, ERROR_MESSAGES.POLICY_NOT_FOUND);

      return res.json({ message: "Policy deleted successfully" });
    } catch {
      return sendError(res, 500, ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  /**
   * Revalidate compliance for a policy
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   * @returns {Promise<Response>} HTTP response with compliance result or error
   */
  public revalidateCompliance = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      if (typeof id !== "string")
        return sendError(res, 400, ERROR_MESSAGES.INVALID_ID);

      const userId = extractUserId(req);
      const options = buildServiceOptions(userId);
      const result = await (PolicyService as any).revalidateCompliance(
        id,
        options
      );
      if (!result) return sendError(res, 404, ERROR_MESSAGES.POLICY_NOT_FOUND);

      return res.json({
        message: "Compliance revalidated successfully",
        policy: result.policy,
        complianceResult: result.complianceResult,
        statusChanged: result.statusChanged,
      });
    } catch (e: any) {
      return sendError(res, 500, ERROR_MESSAGES.SERVER_ERROR);
    }
  };
}

export const PolicyController = new PolicyControllerClass();

/**
 * Async handler (optional for cleaner routes)
 */
/**
 * Async handler for Express routes
 * Wraps async functions and forwards errors to next()
 * @param {Function} fn - Async route handler
 * @returns {Function} Express middleware
 */
export const asyncHandler =
  (fn: any) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
