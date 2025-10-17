import { Router } from "express";
import {
  SmartBinController,
  asyncHandler,
} from "../controllers/smartBin.controller";
import { authenticate } from "../../../middleware/authenticate";
import { verifyAuthority } from "../../../middleware/verifyAuthority";

const router = Router();

// public
router.get("/", asyncHandler(SmartBinController.list));
router.get("/:id", asyncHandler(SmartBinController.get));

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
router.post(
  "/:id/start-maintenance",
  authenticate,
  verifyAuthority,
  asyncHandler(SmartBinController.startMaintenance)
);
router.post(
  "/:id/finish-maintenance",
  authenticate,
  verifyAuthority,
  asyncHandler(SmartBinController.finishMaintenance)
);

export default router;
