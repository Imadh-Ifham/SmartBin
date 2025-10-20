import { Router } from "express";
import {
  asyncHandler,
  QRCodeController,
} from "../controllers/qr-code.controller";

const router = Router();

router.post(
  "/",
  //authenticate,
  //verifyAuthority,
  asyncHandler(QRCodeController.create)
);

export default router;
