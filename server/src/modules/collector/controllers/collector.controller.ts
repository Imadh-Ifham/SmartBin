import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { collectorService } from "../services/collector.service";

const assignRouteSchema = z.object({
  name: z.string().optional(),
  stops: z.array(z.object({ binId: z.string().min(1), sequence: z.number() })),
});

const issueSchema = z.object({ issue: z.string().min(3) });

export const sendError = (
  res: Response,
  code: number,
  message: string,
  details?: any
) => res.status(code).json({ error: message, details });

export const CollectorController = {
  startShift: async (req: Request, res: Response) => {
    try {
      const collectorId =
        (req as any).user?.id || req.body.collectorId || undefined;
      if (!collectorId) return sendError(res, 400, "collectorId required");
      const shift = await collectorService.startShift(collectorId);
      return res.status(201).json({ message: "Shift started", shift });
    } catch (e: any) {
      return sendError(res, 500, e.message || "Server error");
    }
  },

  endShift: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return sendError(res, 400, "Invalid id");
      const ended = await collectorService.endShift(id);
      if (!ended) return sendError(res, 404, "Shift not found");
      return res.json({ message: "Shift ended" });
    } catch (e: any) {
      return sendError(res, 500, e.message || "Server error");
    }
  },

  assignRoute: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return sendError(res, 400, "Invalid id");
      const payload = assignRouteSchema.parse(req.body);
      const updated = await collectorService.assignRoute(id, payload as any);
      if (!updated) return sendError(res, 404, "Shift not found");
      return res.json({ message: "Route assigned", shift: updated });
    } catch (e: any) {
      if (e instanceof z.ZodError)
        return sendError(res, 400, "Validation failed", e.issues);
      return sendError(res, 500, e.message || "Server error");
    }
  },

  markCollected: async (req: Request, res: Response) => {
    try {
      const { id } = req.params; // shift id
      const { binId } = req.body;
      if (!id || !binId)
        return sendError(res, 400, "shift id and binId are required");
      const updated = await collectorService.markCollected(
        id,
        binId,
        (req as any).user?.id
      );
      if (!updated) return sendError(res, 404, "Stop or shift not found");
      return res.json({ message: "Marked collected", shift: updated });
    } catch (e: any) {
      return sendError(res, 500, e.message || "Server error");
    }
  },

  skipBin: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { binId, reason } = req.body;
      if (!id || !binId)
        return sendError(res, 400, "shift id and binId are required");
      const updated = await collectorService.skipBin(id, binId, reason);
      if (!updated) return sendError(res, 404, "Stop or shift not found");
      return res.json({ message: "Marked skipped", shift: updated });
    } catch (e: any) {
      return sendError(res, 500, e.message || "Server error");
    }
  },

  reportIssue: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { binId } = req.body;
      if (!id || !binId)
        return sendError(res, 400, "shift id and binId are required");
      const { issue } = issueSchema.parse(req.body);
      const updated = await collectorService.reportIssue(
        id,
        binId,
        issue,
        (req as any).user?.id
      );
      if (!updated) return sendError(res, 404, "Shift not found");
      return res.json({ message: "Issue reported", shift: updated });
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
