import { Router } from "express";
import {
  CollectorController,
  asyncHandler,
} from "../controllers/collector.controller";
import { authenticate } from "../../../middleware/authenticate";
import { verifyAuthority } from "../../../middleware/verifyAuthority";

const router = Router();

router.post(
  "/start",
  authenticate,
  asyncHandler(CollectorController.startShift)
);
router.post(
  "/:id/end",
  authenticate,
  verifyAuthority,
  asyncHandler(CollectorController.endShift)
);
router.post(
  "/:id/assign-route",
  authenticate,
  verifyAuthority,
  asyncHandler(CollectorController.assignRoute)
);
router.post(
  "/:id/collect",
  authenticate,
  asyncHandler(CollectorController.markCollected)
);
router.post(
  "/:id/skip",
  authenticate,
  asyncHandler(CollectorController.skipBin)
);
router.post(
  "/:id/report-issue",
  authenticate,
  asyncHandler(CollectorController.reportIssue)
);

export default router;
