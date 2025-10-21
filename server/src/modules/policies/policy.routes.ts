import { Router } from "express";
import { PolicyController } from "./policy.controller";
import { verifyAuthority } from "../../middleware/verifyAuthority";
import { authenticate } from "../../middleware/authenticate";

const router = Router();

/**
 * Policy Routes
 *
 * This file maps HTTP endpoints to the PolicyController methods. Routes follow RESTful
 * conventions for the Policy resource. Access control is applied where required:
 * - Public read endpoints: anyone can list/read policies (GET)
 * - Authority-only endpoints: create/update/approve/flag/feedback/revalidate/delete require
 *   authentication and an authority role (middleware: `authenticate`, `verifyAuthority`).
 *
 * Design notes:
 * - Controller pattern: routing logic is kept minimal and delegates work to the controller
 *   (separation of concerns). The controller in turn calls the service layer.
 * - Responsibility: this module only defines routes and middleware; it doesn't implement
 *   business logic (Single Responsibility Principle).
 */

/**
 * GET /policies/
 * List all policies (public)
 *
 * Controller: PolicyController.list
 * Behavior: accepts query filters (q, category, ministry, status, complianceStatus) and
 * returns an array of enriched policy documents. The controller validates the request,
 * builds service options, and delegates to PolicyService.list.
 */
router.get("/", PolicyController.list.bind(PolicyController));

/**
 * GET /policies/:id
 * Get a single policy by ID (public)
 *
 * Controller: PolicyController.get
 * Behavior: validates the id; returns the policy or a 404/400 depending on the input.
 */
router.get("/:id", PolicyController.get.bind(PolicyController));

/**
 * GET /policies/:id/versions
 * Get all versions for a policy (public)
 *
 * Controller: PolicyController.versions
 * Behavior: returns historical PolicyVersion entries. Useful for audit/version tracking.
 */
router.get("/:id/versions", PolicyController.versions.bind(PolicyController));

/**
 * GET /policies/:id/audit
 * Get audit trail for a policy (public)
 *
 * Controller: PolicyController.audit
 * Behavior: returns an array of audit entries (action, date, user). The audit trail
 * is maintained by the service when create/update/approve/flag actions occur.
 */
router.get("/:id/audit", PolicyController.audit.bind(PolicyController));

/**
 * POST /policies/
 * Create a new policy (authority only)
 *
 * Controller: PolicyController.create
 * Behavior: validate payload (title, description, effectiveDate, etc), create a policy,
 * persist an initial audit entry, and attempt to notify stakeholders. The controller
 * ensures only authorized users can call this endpoint.
 */
router.post("/", authenticate, verifyAuthority, PolicyController.create.bind(PolicyController));

/**
 * PUT /policies/:id
 * Update a policy by ID (authority only)
 *
 * Controller: PolicyController.update
 * Behavior: accepts partial updates; service will save a version snapshot (if DB
 * connected), run compliance checks if required, update the audit trail, and persist
 * the updated policy.
 */
router.put("/:id", authenticate, verifyAuthority, PolicyController.update.bind(PolicyController));

/**
 * POST /policies/:id/approve
 * Approve a policy (authority only)
 *
 * Controller: PolicyController.approve
 * Behavior: runs compliance checks (if applicable), saves a version snapshot, updates
 * status to Active, increments version, writes an audit entry, and notifies stakeholders.
 */
router.post("/:id/approve", authenticate, verifyAuthority, PolicyController.approve.bind(PolicyController));

/**
 * POST /policies/:id/issue
 * Flag an issue on a policy (authority only)
 *
 * Controller: PolicyController.flagIssue
 * Behavior: record an issue string on the policy, update version and audit trail, and
 * persist. This is used to flag problems discovered during reviews or operations.
 */
router.post("/:id/issue", authenticate, verifyAuthority, PolicyController.flagIssue.bind(PolicyController));

/**
 * POST /policies/:id/feedbackRequest
 * Request stakeholder feedback for a policy (authority only)
 *
 * Controller: PolicyController.requestFeedback
 * Behavior: call FeedbackService to record a feedback request and attempt to send
 * notifications to specified stakeholder groups.
 */
router.post("/:id/feedbackRequest", authenticate, verifyAuthority, PolicyController.requestFeedback.bind(PolicyController));

/**
 * POST /policies/:id/revalidateCompliance
 * Revalidate compliance for a policy (authority only)
 *
 * Controller: PolicyController.revalidateCompliance
 * Behavior: re-run compliance checks and, if the compliance status changed, update
 * the policy, add an audit entry, and notify stakeholders about the change.
 */
router.post("/:id/revalidateCompliance", authenticate, verifyAuthority, PolicyController.revalidateCompliance.bind(PolicyController));

/**
 * DELETE /policies/:id
 * Delete a policy by ID (authority only)
 *
 * Controller: PolicyController.remove
 * Behavior: remove the policy document from the database. This is authority-protected.
 */
router.delete("/:id", authenticate, verifyAuthority, PolicyController.remove.bind(PolicyController));

export default router;
