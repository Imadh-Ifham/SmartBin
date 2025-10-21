import { Router } from "express";
import { PolicyController } from "./policy.controller";
import { verifyAuthority } from "../../middleware/verifyAuthority";
import { authenticate } from "../../middleware/authenticate";

const router = Router();

/**
 * Policy Routes
 * Defines all HTTP endpoints for policy management, mapping to PolicyController methods.
 * Public endpoints allow read access; authority-only endpoints require authentication and authority role.
 */

/**
 * GET /policies/
 * List all policies (public)
 */
router.get("/", PolicyController.list.bind(PolicyController));

/**
 * GET /policies/:id
 * Get a single policy by ID (public)
 */
router.get("/:id", PolicyController.get.bind(PolicyController));

/**
 * GET /policies/:id/versions
 * Get all versions for a policy (public)
 */
router.get("/:id/versions", PolicyController.versions.bind(PolicyController));

/**
 * GET /policies/:id/audit
 * Get audit trail for a policy (public)
 */
router.get("/:id/audit", PolicyController.audit.bind(PolicyController));

/**
 * POST /policies/
 * Create a new policy (authority only)
 */
router.post("/", authenticate, verifyAuthority, PolicyController.create.bind(PolicyController));

/**
 * PUT /policies/:id
 * Update a policy by ID (authority only)
 */
router.put("/:id", authenticate, verifyAuthority, PolicyController.update.bind(PolicyController));

/**
 * POST /policies/:id/approve
 * Approve a policy (authority only)
 */
router.post("/:id/approve", authenticate, verifyAuthority, PolicyController.approve.bind(PolicyController));

/**
 * POST /policies/:id/issue
 * Flag an issue on a policy (authority only)
 */
router.post("/:id/issue", authenticate, verifyAuthority, PolicyController.flagIssue.bind(PolicyController));

/**
 * POST /policies/:id/feedbackRequest
 * Request stakeholder feedback for a policy (authority only)
 */
router.post("/:id/feedbackRequest", authenticate, verifyAuthority, PolicyController.requestFeedback.bind(PolicyController));

/**
 * POST /policies/:id/revalidateCompliance
 * Revalidate compliance for a policy (authority only)
 */
router.post("/:id/revalidateCompliance", authenticate, verifyAuthority, PolicyController.revalidateCompliance.bind(PolicyController));

/**
 * DELETE /policies/:id
 * Delete a policy by ID (authority only)
 */
router.delete("/:id", authenticate, verifyAuthority, PolicyController.remove.bind(PolicyController));

export default router;
