import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { qrCodeService } from "../services/qr-code.service";

const createSchema = z.object({
  code: z.string().optional(),
  userId: z.string().min(1),
  address: z.string().min(1),
  province: z.string().min(1),
  city: z.string().min(1),
  location: z
    .object({
      type: z.literal("Point"),
      coordinates: z.tuple([z.number(), z.number()]),
    })
    .optional(),
  description: z.string().optional(),
  status: z.enum(["Active", "InMaintenance", "Decommissioned"]).optional(),
});

export const sendError = (
  res: Response,
  code: number,
  message: string,
  details?: any
) => res.status(code).json({ error: message, details });

export const QRCodeController = {
  create: async (req: Request, res: Response) => {
    try {
      const payload = createSchema.parse(req.body);
      const created = await qrCodeService.create(payload as any);
      return res.status(201).json({ message: "Created", item: created });
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
