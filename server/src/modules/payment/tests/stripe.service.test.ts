import Stripe from "stripe";
import { StripeService } from "../services/stripe.service";

jest.mock("stripe");

describe("StripeService", () => {
  const svc = new StripeService();
  const mkStripeMock = () => {
    const paymentIntents = { create: jest.fn(), retrieve: jest.fn() } as any;
    const refunds = { create: jest.fn() } as any;
    const webhooks = { constructEvent: jest.fn() } as any;
    (Stripe as any).mockImplementation(() => ({
      paymentIntents,
      refunds,
      webhooks,
    }));
    return { paymentIntents, refunds, webhooks };
  };

  const setKey = (val?: string) => (process.env.STRIPE_SECRET_KEY = val as any);
  const setWebhookSecret = (val?: string) =>
    (process.env.STRIPE_WEBHOOK_SECRET = val as any);

  beforeEach(() => {
    jest.resetAllMocks();
    delete (global as any)._stripe;
    setKey("sk_test_x");
    setWebhookSecret("whsec_test");
  });

  it("createPaymentIntent passes idempotencyKey and returns clientSecret", async () => {
    const m = mkStripeMock();
    m.paymentIntents.create.mockResolvedValue({
      id: "pi_1",
      client_secret: "sec",
      status: "succeeded",
    });
    const res = await svc.createPaymentIntent(123, "LKR", "desc", "idem-1");
    expect(m.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 12300, currency: "lkr" }),
      { idempotencyKey: "idem-1" }
    );
    expect(res.clientSecret).toBe("sec");
  });

  it("verifyWebhookSignature calls constructEvent and throws when signature missing", () => {
    const m = mkStripeMock();
    m.webhooks.constructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
    });
    const buf = Buffer.from("{}", "utf-8");
    expect(svc.verifyWebhookSignature(buf, "t=1,v1=abc")).toEqual({
      type: "payment_intent.succeeded",
    });
    expect(() => svc.verifyWebhookSignature(buf, undefined as any)).toThrow(
      "Missing stripe signature header"
    );
  });

  it("lazy init error when STRIPE_SECRET_KEY missing", async () => {
    setKey(undefined);
    const m = mkStripeMock();
    await expect(svc.createPaymentIntent(1)).rejects.toThrow(
      /Stripe not configured/
    );
    expect(m.paymentIntents.create).not.toHaveBeenCalled();
  });

  it("retrievePaymentIntent proxies to Stripe SDK", async () => {
    const m = mkStripeMock();
    m.paymentIntents.retrieve.mockResolvedValue({
      id: "pi_123",
      status: "succeeded",
    });
    const res = await svc.retrievePaymentIntent("pi_123");
    expect(m.paymentIntents.retrieve).toHaveBeenCalledWith("pi_123");
    expect(res).toEqual({ id: "pi_123", status: "succeeded" });
  });

  it("refund supports optional amount parameter", async () => {
    const m = mkStripeMock();
    m.refunds.create.mockResolvedValue({ id: "re_1", status: "succeeded" });
    // without amount
    await svc.refund("pi_1");
    expect(m.refunds.create).toHaveBeenCalledWith({ payment_intent: "pi_1" });
    // with amount -> multiplied by 100
    await svc.refund("pi_2", 12.34);
    expect(m.refunds.create).toHaveBeenCalledWith({
      payment_intent: "pi_2",
      amount: 1234,
    });
  });
});
