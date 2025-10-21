import { Router } from "express";
import { createWasteCollection } from "../controllers/waste-collection.controller";

const router = Router();

// POST /api/waste-collections
router.post("/", createWasteCollection);

export default router;
