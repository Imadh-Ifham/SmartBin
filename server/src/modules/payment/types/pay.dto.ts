import { z } from "zod";

export const ProcessPaymentSchema = z.object({
  invoiceId: z.string().regex(/^[0-9a-fA-F]{24}$/i, "Invalid invoice id"),
  method: z.enum(["Card", "Bank", "eWallet"]),
  amount: z.number().positive("Amount must be > 0"),
  paymentDetails: z
    .object({
      cardToken: z.string().optional(),
      paymentIntentId: z.string().optional(),
      bankRef: z.string().optional(),
      walletId: z.string().optional(),
    })
    .optional(),
  idempotencyKey: z.string().optional(),
});

export type ProcessPaymentDto = z.infer<typeof ProcessPaymentSchema>;
