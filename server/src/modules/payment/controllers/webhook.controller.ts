import { Request, Response } from "express";
import { StripeService } from "../services/stripe.service";
import { PaymentService } from "../services/payment.service";

const stripeSvc = new StripeService();
const paymentSvc = new PaymentService();

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string | undefined;
  try {
    const event = stripeSvc.verifyWebhookSignature(req.body as Buffer, sig);

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as any;
        await paymentSvc.handleGatewaySucceeded(pi.id);
        break;
      }
      default:
        // ignore other events for now
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("Stripe webhook error:", err?.message || err);
    return res.status(400).send(`Webhook Error: ${err?.message || err}`);
  }
};
