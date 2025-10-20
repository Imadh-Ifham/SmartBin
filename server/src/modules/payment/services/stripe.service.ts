import Stripe from "stripe";

let _stripe: Stripe | undefined;
function getStripeClient(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Stripe not configured: set STRIPE_SECRET_KEY in your environment (.env)"
    );
  }
  _stripe = new Stripe(key);
  return _stripe;
}

export class StripeService {
  async createPaymentIntent(
    amount: number,
    currency = process.env.PAYMENT_CURRENCY || "lkr",
    description?: string,
    idempotencyKey?: string
  ) {
    const params: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount * 100),
      currency: (currency || "lkr").toLowerCase() as any,
      payment_method_types: ["card"],
      // description is optional; only set when provided to satisfy exactOptionalPropertyTypes
      ...(description ? { description } : {}),
    } as any;
    const opts = idempotencyKey ? { idempotencyKey } : undefined;
    const stripe = getStripeClient();
    const pi = await stripe.paymentIntents.create(params, opts);
    return {
      id: pi.id,
      clientSecret: pi.client_secret,
      status: pi.status,
      raw: pi,
    };
  }

  async retrievePaymentIntent(paymentIntentId: string) {
    const stripe = getStripeClient();
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async refund(paymentIntentId: string, amount?: number) {
    const params: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };
    if (amount) params.amount = Math.round(amount * 100);
    const stripe = getStripeClient();
    return await stripe.refunds.create(params);
  }

  verifyWebhookSignature(payload: Buffer, signatureHeader?: string) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET || "";
    if (!signatureHeader) throw new Error("Missing stripe signature header");
    const stripe = getStripeClient();
    return stripe.webhooks.constructEvent(payload, signatureHeader, secret);
  }
}
