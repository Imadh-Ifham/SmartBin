import { Router } from "express";
import {
  getInvoices,
  processPayment,
  calculateOverweight,
  applyDiscount,
  generateInvoice,
  refund,
  adminReports,
} from "../controllers/payment.Controller";

const router = Router();

router.get("/:userId/invoices", getInvoices);
router.post("/pay", processPayment);
router.post("/calculateOverweight", calculateOverweight);
router.post("/applyDiscount", applyDiscount);
router.post("/generateInvoice", generateInvoice);
router.post("/refund", refund);
router.get("/admin/reports", adminReports);

export default router;
