import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { PolicyService } from "./policy.service";
import type { PolicyCreateDTO, PolicyUpdateDTO } from "./policy.service";

export const feedbackDateSchema = z
  .union([z.string(), z.date()])
  .transform((value, ctx) => {
    if (value instanceof Date) return value;
    const normalized = value.trim();
    if (!normalized) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid date" });
      return z.NEVER;
    }
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid date" });
      return z.NEVER;
    }
    return parsed;
  });

export const feedbackSchema = z.object({
  stakeholderType: z.enum(["resident", "business", "staff"]),
  message: z.string().trim().min(1, "Feedback message is required").optional(),
  date: feedbackDateSchema.optional()
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
  status: z.enum(["Draft", "UnderReview", "Active", "Retired", "Archived"]).optional(),
  complianceStatus: z.enum(["Compliant", "NonCompliant", "Pending"]).optional(),
  lastReviewedBy: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, "lastReviewedBy must be a valid ObjectId")
    .optional(),
  feedback: z.array(feedbackSchema).optional(),
  issues: z.array(z.string().min(1)).optional()
});

export const createSchema = baseSchema;
export const updateSchema = baseSchema.partial();

/**
 * Utility for standardized error responses
 */
export const sendError = (res: Response, code: number, message: string, details?: any) =>
  res.status(code).json({ error: message, details });

export const extractUserId = (req: Request) =>
  (req as any).user?.id || (req as any).user?._id || undefined;

/**
 * Policy Controller — handles HTTP layer
 */
export class PolicyControllerClass {
  /** Create new policy */
  public create = async (req: Request, res: Response) => {
    try {
      const payload = createSchema.parse(req.body);
      const userId = extractUserId(req);
      const policy = await PolicyService.create(
        { ...(payload as PolicyCreateDTO) },
        { userId }
      );
      return res.status(201).json({ message: "Policy created successfully", policy });
    } catch (e: any) {
      if (e instanceof z.ZodError) return sendError(res, 400, "Validation failed", e.issues);
      return sendError(res, 500, "Server error");
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
      if (typeof complianceStatus === "string") query.complianceStatus = complianceStatus;

      const policies = await PolicyService.list(query);
      return res.json({ count: policies.length, policies });
    } catch {
      return sendError(res, 500, "Server error");
    }
  };

  /** Get a single policy by ID */
  public get = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (typeof id !== "string") return sendError(res, 400, "Invalid ID");

      const policy = await PolicyService.get(id);
      if (!policy) return sendError(res, 404, "Policy not found");

      return res.json({ policy });
    } catch {
      return sendError(res, 500, "Server error");
    }
  };

  /** List versions for a policy */
  public versions = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (typeof id !== "string") return sendError(res, 400, "Invalid ID");

      // PolicyService.versions should return an array of versions
      const versions = await (PolicyService as any).versions?.(id);
      if (!versions) return sendError(res, 404, "Policy not found");
      return res.json({ count: versions.length, versions });
    } catch {
      return sendError(res, 500, "Server error");
    }
  };

  /** Get audit trail for a policy */
  public audit = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (typeof id !== "string") return sendError(res, 400, "Invalid ID");

      const audit = await (PolicyService as any).audit?.(id);
      if (!audit) return sendError(res, 404, "Policy not found");
      return res.json({ count: audit.length, audit });
    } catch {
      return sendError(res, 500, "Server error");
    }
  };

  /** Update a policy by ID */
  public update = async (req: Request, res: Response) => {
    try {
      const payload = updateSchema.parse(req.body);
      const { id } = req.params;
      if (typeof id !== "string") return sendError(res, 400, "Invalid ID");

      const userId = extractUserId(req);
      const updated = await PolicyService.update(
        id,
        payload as PolicyUpdateDTO,
        { userId }
      );
      if (!updated) return sendError(res, 404, "Policy not found");

      return res.json({ message: "Policy updated successfully", policy: updated });
    } catch (e: any) {
      if (e instanceof z.ZodError) return sendError(res, 400, "Validation failed", e.issues);
      return sendError(res, 500, "Server error");
    }
  };

  /** Approve a policy */
  public approve = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (typeof id !== "string") return sendError(res, 400, "Invalid ID");

      const userId = extractUserId(req);
      const approved = await PolicyService.approve(id, { userId });
      if (!approved) return sendError(res, 404, "Policy not found");

      return res.json({ message: "Policy approved successfully", policy: approved });
    } catch {
      return sendError(res, 500, "Server error");
    }
  };

  /** Flag an issue on a policy */
  public flagIssue = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { issue } = z
        .object({ issue: z.string().min(3, "Issue description required") })
        .parse(req.body);

      if (typeof id !== "string") return sendError(res, 400, "Invalid ID");

      const userId = extractUserId(req);
      const updated = await PolicyService.markIssue(id, issue, { userId });
      if (!updated) return sendError(res, 404, "Policy not found");

      return res.json({ message: "Issue recorded successfully", policy: updated });
    } catch (e: any) {
      if (e instanceof z.ZodError) return sendError(res, 400, "Validation failed", e.issues);
      return sendError(res, 500, "Server error");
    }
  };

  /** Request stakeholder feedback for a policy */
  public requestFeedback = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { stakeholderGroups, message } = req.body as any;
      if (typeof id !== "string") return sendError(res, 400, "Invalid ID");

      const userId = extractUserId(req);
      const result = await (PolicyService as any).requestFeedback?.(id, { stakeholderGroups, message }, { userId });
      if (!result) return sendError(res, 404, "Policy not found");
      return res.json({ message: "Feedback requested", result });
    } catch (e: any) {
      return sendError(res, 500, "Server error");
    }
  };

  /** Delete a policy by ID */
  public remove = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (typeof id !== "string") return sendError(res, 400, "Invalid ID");

      const deleted = await PolicyService.remove(id);
      if (!deleted) return sendError(res, 404, "Policy not found");

      return res.json({ message: "Policy deleted successfully" });
    } catch {
      return sendError(res, 500, "Server error");
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
