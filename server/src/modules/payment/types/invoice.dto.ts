import { z } from "zod";

export const CreateInvoiceSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId"),
  amount: z.number().positive("Amount must be > 0"),
  reason: z.string().min(3),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type CreateInvoiceDto = z.infer<typeof CreateInvoiceSchema>;

// Create an invoice from overweight calculation (server computes fee from weights)
export const CreateOverweightInvoiceSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId"),
  actualWeight: z.number().nonnegative(),
  allowedWeight: z.number().nonnegative(),
  ratePerKg: z.number().positive().optional(), // optional override (defaults to 250 LKR/kg)
  reason: z.string().min(3).optional(), // optional custom reason label
  metadata: z.record(z.string(), z.any()).optional(),
});

export type CreateOverweightInvoiceDto = z.infer<
  typeof CreateOverweightInvoiceSchema
>;
