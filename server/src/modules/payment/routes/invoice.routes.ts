import { Router } from "express";
import { authenticate } from "../../../middleware/authenticate";
import { verifyAuthority } from "../../../middleware/verifyAuthority";
import { validateRequest } from "../../../middleware/validateRequest";
import {
  CreateInvoiceSchema,
  CreateOverweightInvoiceSchema,
} from "../types/invoice.dto";
import {
  generateInvoice,
  getUnpaidStatus,
  getMyInvoices,
  getInvoicesByUser,
  generateOverweightInvoice,
} from "../controllers/invoice.controller";

const router = Router();

router.post(
  "/generateInvoice",
  authenticate,
  verifyAuthority,
  validateRequest({ body: CreateInvoiceSchema }),
  generateInvoice
);

router.post(
  "/generateOverweightInvoice",
  authenticate,
  verifyAuthority,
  validateRequest({ body: CreateOverweightInvoiceSchema }),
  generateOverweightInvoice
);

router.get("/status/:userId", authenticate, verifyAuthority, getUnpaidStatus);

// Resident: view their own invoices
router.get("/me/invoices", authenticate, getMyInvoices);
// Admin/Authority/Collector: view any user's invoices
router.get(
  "/:userId/invoices",
  authenticate,
  verifyAuthority,
  getInvoicesByUser
);

export default router;
