import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate";
import { verifyAuthority } from "../../../middleware/verifyAuthority";
import { validateRequest } from "../../../middleware/validateRequest";
import { CreateInvoiceSchema } from "../types/invoice.dto";
import {
  generateInvoice,
  getUnpaidStatus,
} from "../controllers/invoice.controller";

const router = Router();

router.post(
  "/generateInvoice",
  authenticate,
  verifyAuthority,
  validateRequest({ body: CreateInvoiceSchema }),
  generateInvoice
);

router.get("/status/:userId", authenticate, verifyAuthority, getUnpaidStatus);

export default router;
