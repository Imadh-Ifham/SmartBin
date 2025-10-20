import { Router } from "express";
import { SmartBinController } from "../controllers/smartBin.controller";
import { authenticate } from "../../../middleware/authenticate";
import { verifyAuthority } from "../../../middleware/verifyAuthority";
import { asyncHandler } from "../../../middleware/asyncHandler";

const router = Router();

// public
router.get("/", asyncHandler(SmartBinController.list));
router.get("/:id", asyncHandler(SmartBinController.getById));
router.get("/code/:qrCode", asyncHandler(SmartBinController.getByQRCode));

// actions
router.post(
  "/",
  authenticate,
  verifyAuthority,
  asyncHandler(SmartBinController.create)
);
router.put(
  "/:id",
  authenticate,
  verifyAuthority,
  asyncHandler(SmartBinController.update)
);
router.delete(
  "/:id",
  authenticate,
  verifyAuthority,
  asyncHandler(SmartBinController.delete)
);

router.post(
  "/:id/report-weight",
  authenticate,
  asyncHandler(SmartBinController.reportWeight)
);

export default router;
