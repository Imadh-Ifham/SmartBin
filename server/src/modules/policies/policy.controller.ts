import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { PolicyService } from "./policy.service";
import type { PolicyCreateDTO, PolicyUpdateDTO } from "./policy.service";
import { STAKEHOLDER_TYPES } from "./constants";
import { FeedbackRequest, IssueRequest, ServiceOptions } from "./types";

const ERROR_MESSAGES = {
  VALIDATION_FAILED: "Validation failed",
  SERVER_ERROR: "Server error",
  INVALID_ID: "Invalid id",
  POLICY_NOT_FOUND: "Policy not found",
};

<<<<<<< Updated upstream
=======
// Use Zod's refinement context for transform callbacks. We cast to any when
// calling addIssue to avoid tight coupling to Zod internal issue shapes.
>>>>>>> Stashed changes
export const feedbackDateSchema = z
  .union([z.string(), z.date()])
  .transform((value: string | Date, ctx: any) => {
    if (value instanceof Date) return value;
    const normalized = String(value ?? "").trim();
    if (!normalized) {
<<<<<<< Updated upstream
      (ctx.addIssue as any)({
        code: z.ZodIssueCode.custom,
        message: "Invalid date",
      });
=======
      // Zod expects a specific issue shape; cast to any to satisfy TS
      (ctx as any).addIssue?.({ code: z.ZodIssueCode.custom as any, message: "Invalid date" });
>>>>>>> Stashed changes
      return z.NEVER;
    }
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
<<<<<<< Updated upstream
      (ctx.addIssue as any)({
        code: z.ZodIssueCode.custom,
        message: "Invalid date",
      });
=======
      (ctx as any).addIssue?.({ code: z.ZodIssueCode.custom as any, message: "Invalid date" });
>>>>>>> Stashed changes
      return z.NEVER;
    }
    return parsed;
  });

export const feedbackSchema = z.object({
  stakeholderType: z.enum([
    STAKEHOLDER_TYPES.RESIDENT,
    STAKEHOLDER_TYPES.BUSINESS,
    STAKEHOLDER_TYPES.STAFF,
  ]),
  message: z.string().trim().min(1, "Feedback message is required").optional(),
  date: feedbackDateSchema.optional(),
});

/**
 * Schema Definitions
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
export const sendError = (
  res: Response,
  code: number,
  message: string,
  details?: any
) => res.status(code).json({ error: message, details });

export const extractUserId = (req: Request): string | undefined =>
  (req as any).user?.id || (req as any).user?._id || undefined;

export const buildServiceOptions = (
  userId: string | undefined
): ServiceOptions => ({
  ...(userId && { userId }),
});

/**
 * Policy Controller — handles HTTP layer
 */
export class PolicyControllerClass {
  /** Create new policy */
  public create = async (req: Request, res: Response) => {
    try {
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
      return sendError(res, 500, ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  /** Get a single policy by ID */
  public get = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (typeof id !== "string")
        return sendError(res, 400, ERROR_MESSAGES.INVALID_ID);

      const policy = await PolicyService.get(id);
      if (!policy) return sendError(res, 404, ERROR_MESSAGES.POLICY_NOT_FOUND);

      return res.json({ policy });
    } catch {
      return sendError(res, 500, ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  /** List versions for a policy */
  public versions = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (typeof id !== "string")
        return sendError(res, 400, ERROR_MESSAGES.INVALID_ID);

      const versions = await (PolicyService as any).versions?.(id);
      if (!versions)
        return sendError(res, 404, ERROR_MESSAGES.POLICY_NOT_FOUND);
      return res.json({ count: versions.length, versions });
    } catch {
      return sendError(res, 500, ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  /** Get audit trail for a policy */
  public audit = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (typeof id !== "string")
        return sendError(res, 400, ERROR_MESSAGES.INVALID_ID);

      const audit = await (PolicyService as any).audit?.(id);
      if (!audit) return sendError(res, 404, ERROR_MESSAGES.POLICY_NOT_FOUND);
      return res.json({ count: audit.length, audit });
    } catch {
      return sendError(res, 500, ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  /** List all policies (supports filters and search) */
  public list = async (req: Request, res: Response) => {
    try {
      const { q, category, ministry, status, complianceStatus } = req.query;
      const query: any = {};

      if (typeof q === "string") query.q = q;
      if (typeof category === "string") query.category = category;
      if (typeof ministry === "string") query.ministry = ministry;
      if (typeof status === "string") query.status = status;
      if (typeof complianceStatus === "string")
        query.complianceStatus = complianceStatus;

      const policies = await PolicyService.list(query);
      return res.json({ count: policies.length, policies });
    } catch {
      return sendError(res, 500, ERROR_MESSAGES.SERVER_ERROR);
    }
  };

  /** Update a policy by ID */
  public update = async (req: Request, res: Response) => {
    try {
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

  /** Approve a policy */
  public approve = async (req: Request, res: Response) => {
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

  /** Flag an issue on a policy */
  public flagIssue = async (req: Request, res: Response) => {
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

  /** Request stakeholder feedback for a policy */
  public requestFeedback = async (req: Request, res: Response) => {
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

  /** Delete a policy by ID */
  public remove = async (req: Request, res: Response) => {
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

  /** Revalidate compliance for a policy */
  public revalidateCompliance = async (req: Request, res: Response) => {
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
export const asyncHandler =
  (fn: any) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
