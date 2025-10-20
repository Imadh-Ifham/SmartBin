import { Router } from "express";
import { ScanController, asyncHandler } from "../controllers/scan.controller";
import { authenticate } from "../../../middleware/authenticate";

const router = Router();

router.post("/", authenticate, asyncHandler(ScanController.scan));

export default router;
