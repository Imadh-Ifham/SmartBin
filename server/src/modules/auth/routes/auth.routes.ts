import express from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../../../middleware/authenticate";

const router = express.Router();
const controller = new AuthController();

// Expose login and registration. Registration will reject attempts to create
// an admin user (that behavior is enforced in AuthService.register).
router.post("/register", controller.register);
router.post("/login", controller.login);

// session and identity endpoints expected by the client
router.get("/me", authenticate, controller.me);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);

export default router;
