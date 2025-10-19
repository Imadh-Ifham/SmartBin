import { z } from "zod";

export const CreateInvoiceSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId"),
  amount: z.number().positive("Amount must be > 0"),
  reason: z.string().min(3),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type CreateInvoiceDto = z.infer<typeof CreateInvoiceSchema>;
