import { Router } from "express";
import { PolicyController } from "./policy.controller";
import { verifyAuthority } from "../../middleware/verifyAuthority";
import { authenticate } from "../../middleware/authenticate";

const router = Router();

// Public read endpoints
router.get("/", PolicyController.list.bind(PolicyController));
router.get("/:id", PolicyController.get.bind(PolicyController));
router.get("/:id/versions", PolicyController.versions.bind(PolicyController));
router.get("/:id/audit", PolicyController.audit.bind(PolicyController));

// Authority-only endpoints (require valid JWT + authority role)
router.post("/", authenticate, verifyAuthority, PolicyController.create.bind(PolicyController));
router.put("/:id", authenticate, verifyAuthority, PolicyController.update.bind(PolicyController));
router.post("/:id/approve", authenticate, verifyAuthority, PolicyController.approve.bind(PolicyController));
router.post("/:id/issue", authenticate, verifyAuthority, PolicyController.flagIssue.bind(PolicyController));
router.post("/:id/feedbackRequest", authenticate, verifyAuthority, PolicyController.requestFeedback.bind(PolicyController));
router.post("/:id/revalidateCompliance", authenticate, verifyAuthority, PolicyController.revalidateCompliance.bind(PolicyController));
router.delete("/:id", authenticate, verifyAuthority, PolicyController.remove.bind(PolicyController));

export default router;
