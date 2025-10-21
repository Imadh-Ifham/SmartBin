import { Router } from "express";
import { QRCodeController } from "../controllers/qr-code.controller";
import { asyncHandler } from "../../policies/policy.controller";
import { authenticate } from "../../../middleware/authenticate";
import { verifyAuthority } from "../../../middleware/verifyAuthority";

const router = Router();

router.post(
  "/",
  authenticate,
  verifyAuthority,
  asyncHandler(QRCodeController.create)
);

router.get("/:code", asyncHandler(QRCodeController.getBin));

export default router;
