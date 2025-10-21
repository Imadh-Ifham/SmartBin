import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { binTypeService } from "../services/bin-type.service";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});
const updateSchema = createSchema.partial();

export const sendError = (
  res: Response,
  code: number,
  message: string,
  details?: any
) => res.status(code).json({ error: message, details });

export const BinTypeController = {
  list: async (req: Request, res: Response) => {
    try {
      const items = await binTypeService.list();
      return res.json({ count: items.length, items });
    } catch (e: any) {
      return sendError(res, 500, e.message || "Server error");
    }
  },

  get: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return sendError(res, 400, "Invalid id");
      const item = await binTypeService.get(id);
      if (!item) return sendError(res, 404, "Not found");
      return res.json({ item });
    } catch (e: any) {
      return sendError(res, 500, e.message || "Server error");
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const payload = createSchema.parse(req.body);
      const created = await binTypeService.create(payload as any);
      return res.status(201).json({ message: "Created", item: created });
    } catch (e: any) {
      if (e instanceof z.ZodError)
        return sendError(res, 400, "Validation failed", e.issues);
      return sendError(res, 500, e.message || "Server error");
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return sendError(res, 400, "Invalid id");
      const payload = updateSchema.parse(req.body);
      const updated = await binTypeService.update(id, payload as any);
      if (!updated) return sendError(res, 404, "Not found");
      return res.json({ message: "Updated", item: updated });
    } catch (e: any) {
      if (e instanceof z.ZodError)
        return sendError(res, 400, "Validation failed", e.issues);
      return sendError(res, 500, e.message || "Server error");
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) return sendError(res, 400, "Invalid id");
      const deleted = await binTypeService.delete(id);
      if (!deleted) return sendError(res, 404, "Not found");
      return res.json({ message: "Deleted" });
    } catch (e: any) {
      return sendError(res, 500, e.message || "Server error");
    }
  },
};
