import { Router } from "express";
import {
  BinTypeController,
  asyncHandler,
} from "../controllers/bin-type.controller";
import { authenticate } from "../../../middleware/authenticate";
import { verifyAuthority } from "../../../middleware/verifyAuthority";

const router = Router();

router.get("/", asyncHandler(BinTypeController.list));
router.get("/:id", asyncHandler(BinTypeController.get));
router.post(
  "/",
  //authenticate,
  //verifyAuthority,
  asyncHandler(BinTypeController.create)
);
router.put(
  "/:id",
  // authenticate,
  // verifyAuthority,
  asyncHandler(BinTypeController.update)
);
router.delete(
  "/:id",
  // authenticate,
  // verifyAuthority,
  asyncHandler(BinTypeController.remove)
);

export default router;
