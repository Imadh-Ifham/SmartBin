import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

/**
 * Request validation middleware using Zod
 * Validates request body, query parameters, and params against schemas
 */
export function validateRequest(schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate body
      if (schema.body) {
        const parsed = await schema.body.parseAsync(req.body);
        (req as any).validatedBody = parsed;
      }

      // Validate query
      if (schema.query) {
        const parsed = await schema.query.parseAsync(req.query);
        (req as any).validatedQuery = parsed;
      }

      // Validate params
      if (schema.params) {
        const parsed = await schema.params.parseAsync(req.params);
        (req as any).validatedParams = parsed;
      }

      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map((issue: any) => ({
          field: issue.path.join("."),
          message: issue.message
        }));
        return res.status(400).json({
          error: "Validation Error",
          details: messages
        });
      }

      res.status(400).json({
        error: "Request validation failed",
        details: error.message
      });
    }
  };
}

/**
 * Common validation schemas for policies
 */
export const policySchemas = {
  create: z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(200),
    description: z.string().min(10, "Description must be at least 10 characters"),
    category: z.string().optional(),
    ministry: z.string().optional(),
    effectiveDate: z.string().datetime().optional(),
    status: z.enum(["Draft", "UnderReview", "Active", "Retired", "Archived"]).optional(),
    complianceStatus: z.enum(["Compliant", "NonCompliant", "Pending"]).optional(),
  }),

  update: z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().min(10).optional(),
    category: z.string().optional(),
    ministry: z.string().optional(),
    effectiveDate: z.string().datetime().optional(),
    status: z.enum(["Draft", "UnderReview", "Active", "Retired", "Archived"]).optional(),
    complianceStatus: z.enum(["Compliant", "NonCompliant", "Pending"]).optional(),
  }),

  list: z.object({
    q: z.string().optional(),
    category: z.string().optional(),
    ministry: z.string().optional(),
    status: z.string().optional(),
    complianceStatus: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),

  feedback: z.object({
    stakeholderGroups: z.array(z.string()).optional(),
    message: z.string().max(1000).optional(),
  }),

  id: z.object({
    id: z.string().regex(/^[0-9a-f]{24}$/, "Invalid MongoDB ID"),
  }),
};

/**
 * Auth validation schemas
 */
export const authSchemas = {
  login: z.object({
    username: z.string().min(1, "Username is required").max(50),
    password: z.string().min(1, "Password is required").max(100),
  }),

  register: z.object({
    username: z.string().min(3, "Username must be at least 3 characters").max(50),
    password: z.string().min(6, "Password must be at least 6 characters").max(100),
    role: z.enum(["user", "authority", "admin"]).optional(),
  }),
};

export default { validateRequest, policySchemas, authSchemas };
