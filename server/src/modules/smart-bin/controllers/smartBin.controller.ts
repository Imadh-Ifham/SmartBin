import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { smartBinService } from "../services/smartBin.service";

const createSchema = z.object({
  code: z.string().min(1),
  type: z.string().min(1),
  limit: z.number().optional(),
  location: z
    .object({
      type: z.literal("Point"),
      coordinates: z.tuple([z.number(), z.number()]),
    })
    .optional(),
});

const weightSchema = z.object({ weight: z.number() });

export const sendError = (
  res: Response,
  code: number,
  message: string,
  details?: any
) => res.status(code).json({ error: message, details });

export const SmartBinController = {
  create: async (req: Request, res: Response) => {
    try {
      const payload = createSchema.parse(req.body);
      const bin = await smartBinService.createBin(payload as any);
      return res.status(201).json({ message: "Bin created", bin });
    } catch (e: any) {
      if (e instanceof z.ZodError)
        return sendError(res, 400, "Validation failed", e.issues);
      return sendError(res, 500, e.message || "Server error");
    }
  },

  get: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return sendError(res, 400, "Invalid id");
      const bin = await smartBinService.getBin(id);
      if (!bin) return sendError(res, 404, "Bin not found");
      return res.json({ bin });
    } catch (e: any) {
      return sendError(res, 500, e.message || "Server error");
    }
  },

  list: async (req: Request, res: Response) => {
    try {
      const bins = await smartBinService.list();
      return res.json({ count: bins.length, bins });
    } catch (e: any) {
      return sendError(res, 500, e.message || "Server error");
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return sendError(res, 400, "Invalid id");
      const patch = req.body;
      const updated = await smartBinService.updateBin(id, patch as any);
      if (!updated) return sendError(res, 404, "Bin not found");
      return res.json({ message: "Updated", bin: updated });
    } catch (e: any) {
      return sendError(res, 500, e.message || "Server error");
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return sendError(res, 400, "Invalid id");
      const deleted = await smartBinService.deleteBin(id);
      if (!deleted) return sendError(res, 404, "Bin not found");
      return res.json({ message: "Deleted" });
    } catch (e: any) {
      return sendError(res, 500, e.message || "Server error");
    }
  },

  reportWeight: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return sendError(res, 400, "Invalid id");
      const { weight } = weightSchema.parse(req.body);
      const updated = await smartBinService.reportWeight(id, weight);
      return res.json({ message: "Weight recorded", bin: updated });
    } catch (e: any) {
      if (e instanceof z.ZodError)
        return sendError(res, 400, "Validation failed", e.issues);
      return sendError(res, 500, e.message || "Server error");
    }
  },

  startMaintenance: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return sendError(res, 400, "Invalid id");
      const bin: any = await smartBinService.getBin(id);
      if (!bin) return sendError(res, 404, "Bin not found");
      bin.status = "InMaintenance";
      const updated = await smartBinService.updateBin(bin._id.toString(), {
        status: bin.status,
      } as any);
      return res.json({ message: "Maintenance started", bin: updated });
    } catch (e: any) {
      return sendError(res, 500, e.message || "Server error");
    }
  },

  finishMaintenance: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return sendError(res, 400, "Invalid id");
      const bin: any = await smartBinService.getBin(id);
      if (!bin) return sendError(res, 404, "Bin not found");
      bin.status = "Active";
      const updated = await smartBinService.updateBin(bin._id.toString(), {
        status: bin.status,
      } as any);
      return res.json({ message: "Maintenance finished", bin: updated });
    } catch (e: any) {
      return sendError(res, 500, e.message || "Server error");
    }
  },
};

export const asyncHandler =
  (fn: any) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
