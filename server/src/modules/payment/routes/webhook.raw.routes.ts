import express, { Router } from "express";
import { handleStripeWebhook } from "../controllers/webhook.controller";

// Router with raw body parsing specifically for Stripe webhook
const router = Router();

router.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

export default router;
