import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { scanService } from "../services/scan.service";

const scanSchema = z.object({
  raw: z.string().min(1),
  source: z.string().optional(),
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
      const { raw, source } = scanSchema.parse(req.body);
      const result = await scanService.handleScan(raw, source || "camera");
      return res.json({ result });
    } catch (e: any) {
      if (e instanceof z.ZodError)
        return sendError(res, 400, "Validation failed", e.issues);
      return sendError(res, 500, e.message || "Server error");
    }
  },
};

export const asyncHandler =
  (fn: any) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
