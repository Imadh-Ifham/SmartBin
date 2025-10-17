import express from "express";
import { AuthController } from "./auth.controller";

const router = express.Router();
const controller = new AuthController();

// Expose login and registration. Registration will reject attempts to create
// an admin user (that behavior is enforced in AuthService.register).
router.post("/register", controller.register);
router.post("/login", controller.login);

export default router;
