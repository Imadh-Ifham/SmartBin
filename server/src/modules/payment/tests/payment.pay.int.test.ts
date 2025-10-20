import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import app from "../../../app";
import { UserModel } from "../../auth/models/user.model";
import { InvoiceModel } from "../models/invoice.model";
import { PaymentModel } from "../models/payment.model";

// Mock StripeService to avoid real network calls
jest.mock("../services/stripe.service", () => {
  return {
    StripeService: class {
      async createPaymentIntent(amount: number) {
        return {
          id: `pi_test_${amount}`,
          clientSecret: "test_client_secret",
          status: "succeeded",
          raw: { mocked: true },
        } as any;
      }
      verifyWebhookSignature(payload: Buffer, sig?: string) {
        return {
          type: "payment_intent.succeeded",
          data: { object: { id: "pi_test" } },
        } as any;
      }
    },
  };
});

describe("/api/payments/pay (integration)", () => {
  let replset: MongoMemoryReplSet;
  const JWT_SECRET = "test-secret";

  const signToken = (payload: { id: string; role: string }) =>
    jwt.sign(payload, JWT_SECRET, { expiresIn: "10m" });

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.PAYMENT_CURRENCY = "lkr";
    // Use a replica set for transaction support
    replset = await MongoMemoryReplSet.create({
      replSet: { storageEngine: "wiredTiger" },
    });
    const uri = replset.getUri();
    await mongoose.connect(uri);
    // Use real sessions from Mongoose; no stubs to ensure transaction support
  });

  afterAll(async () => {
    await mongoose.disconnect();
    try {
      await replset.stop();
    } catch (e: any) {
      if (String(e?.message || e).includes("EPERM")) {
        console.warn(
          "mongodb-memory-server stop EPERM ignored (Windows quirk)"
        );
      } else {
        throw e;
      }
    }
  });

  afterEach(async () => {
    const collections = await mongoose.connection.db.collections();
    for (const c of collections) await c.deleteMany({});
  });

  it("pays invoice with Card method and idempotency", async () => {
    // Seed resident and invoice
    const resident = await UserModel.create({
      username: "payer1",
      email: "payer1@example.com",
      password: "hashed",
      role: "resident",
      fullName: "Payer One",
      phoneNumber: "+94000000010",
    } as any);

    const invoice = await InvoiceModel.create({
      userId: resident._id,
      amount: 1500,
      reason: "Overweight",
      status: "Pending",
    } as any);

    const token = signToken({ id: resident._id.toString(), role: "resident" });

    const idempotencyKey = "test-key-123";
    const res1 = await request(app)
      .post("/api/payments/pay")
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", idempotencyKey)
      .send({
        invoiceId: invoice._id.toString(),
        method: "Card",
        amount: 1500,
      });
    // Debug response when failing locally
    // eslint-disable-next-line no-console
    console.log("/pay response:", res1.body);
    expect(res1.status).toBe(200);
    expect(res1.body).toEqual(
      expect.objectContaining({
        payment: expect.objectContaining({
          invoiceId: expect.any(String),
          amount: 1500,
          method: "Card",
        }),
        clientSecret: expect.any(String),
        receipt: expect.objectContaining({
          url: expect.stringContaining("/api/payments/receipts/"),
        }),
      })
    );

    // Invoice should be Paid
    const updatedInv = await InvoiceModel.findById(invoice._id).lean();
    expect(updatedInv?.status).toBe("Paid");

    const paymentCount = await PaymentModel.countDocuments({
      invoiceId: invoice._id,
    });
    expect(paymentCount).toBe(1);

    // Repeat with same idempotency key - should not create another payment
    const res2 = await request(app)
      .post("/api/payments/pay")
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", idempotencyKey)
      .send({
        invoiceId: invoice._id.toString(),
        method: "Card",
        amount: 1500,
      });

    expect(res2.status).toBe(200);
    const paymentCountAfter = await PaymentModel.countDocuments({
      invoiceId: invoice._id,
    });
    expect(paymentCountAfter).toBe(1);
  });
});
