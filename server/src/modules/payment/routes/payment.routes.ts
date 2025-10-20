import express, { Router } from "express";
import { processPayment } from "../controllers/payment.Controller";
import { getReceipt } from "../controllers/receipt.controller";
import { authenticate } from "../../../middleware/authenticate";
import { validateRequest } from "../../../middleware/validateRequest";
import { ProcessPaymentSchema } from "../types/pay.dto";

const router = Router();

router.post(
  "/pay",
  authenticate,
  validateRequest({ body: ProcessPaymentSchema }),
  processPayment
);
router.get("/receipts/:id", authenticate, getReceipt);

export default router;
