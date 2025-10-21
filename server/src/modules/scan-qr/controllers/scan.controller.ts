import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { scanService } from "../services/scan.service";

const scanSchema = z.object({
  code: z.string().min(1, "Scan code is required"),
  source: z.string().optional(),
  userId: z.string().optional(),
});

export const sendError = (
  res: Response,
  code: number,
  message: string,
  details?: any
) => res.status(code).json({ error: message, details });

export const ScanController = {
  scan: async (req: Request, res: Response) => {
    try {
      const { code, source, userId } = scanSchema.parse(req.body);
      const payload = {
        code: code,
        source: source || "camera",
        userId: userId || "",
      };
      const result = await scanService.handleScan(payload);
      return res.json({ result });
    } catch (e: any) {
      if (e instanceof z.ZodError)
        return sendError(res, 400, "Validation failed", e.issues);
      if (e && typeof e === "object" && e.status && e.message)
        return sendError(res, e.status, e.message);
      return sendError(res, 500, e.message || "Server error");
    }
  },
};

export const asyncHandler =
  (fn: any) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
