import { Router } from "express";
import { ScanController, asyncHandler } from "../controllers/scan.controller";

const router = Router();

router.post("/", asyncHandler(ScanController.scan));

export default router;
