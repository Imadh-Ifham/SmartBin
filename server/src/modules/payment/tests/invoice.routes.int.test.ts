import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../../app";
import { UserModel } from "../../auth/models/user.model";

/**
 * Integration tests for payment invoice routes using in-memory MongoDB.
 * We sign JWTs directly to exercise authenticate + verifyAuthority and seed a resident user.
 */
describe("/api/payments (integration)", () => {
  let mongod: MongoMemoryServer;
  const JWT_SECRET = "test-secret";

  const signToken = (payload: { id: string; role: string }) =>
    jwt.sign(payload, JWT_SECRET, { expiresIn: "10m" });

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    try {
      await mongod.stop();
    } catch (e: any) {
      // On Windows, mongodb-memory-server can throw EPERM when killing the spawned mongod
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
    // Clean collections between tests for isolation
    const collections = await mongoose.connection.db.collections();
    for (const c of collections) await c.deleteMany({});
  });

  it("POST /generateInvoice with authority token => 201", async () => {
    // Seed a resident user to be invoiced
    const resident = await UserModel.create({
      username: "resident1",
      email: "resident1@example.com",
      password: "hashed",
      role: "resident",
      fullName: "Resident One",
      phoneNumber: "+94000000000",
    } as any);

    const authorityToken = signToken({
      id: new mongoose.Types.ObjectId().toString(),
      role: "authority",
    });

    const res = await request(app)
      .post("/api/payments/generateInvoice")
      .set("Authorization", `Bearer ${authorityToken}`)
      .send({
        userId: resident._id.toString(),
        amount: 1250,
        reason: "Overweight bin (15kg / 10kg limit)",
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(
      expect.objectContaining({
        userId: resident._id.toString(),
        amount: 1250,
        reason: "Overweight bin (15kg / 10kg limit)",
        status: "Pending",
      })
    );
    expect(res.body.invoiceId).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
  });

  it("POST /generateInvoice duplicate within 5 minutes => 400", async () => {
    const resident = await UserModel.create({
      username: "resident2",
      email: "resident2@example.com",
      password: "hashed",
      role: "resident",
      fullName: "Resident Two",
      phoneNumber: "+94000000001",
    } as any);

    const token = signToken({
      id: new mongoose.Types.ObjectId().toString(),
      role: "authority",
    });
    const body = {
      userId: resident._id.toString(),
      amount: 500,
      reason: "Manual",
    };

    const first = await request(app)
      .post("/api/payments/generateInvoice")
      .set("Authorization", `Bearer ${token}`)
      .send(body);
    expect(first.status).toBe(201);

    const second = await request(app)
      .post("/api/payments/generateInvoice")
      .set("Authorization", `Bearer ${token}`)
      .send(body);
    expect(second.status).toBe(400);
    expect(String(second.body?.message || "")).toMatch(/Duplicate invoice/i);
  });

  it("POST /generateInvoice with resident token => 403", async () => {
    const resident = await UserModel.create({
      username: "resident3",
      email: "resident3@example.com",
      password: "hashed",
      role: "resident",
      fullName: "Resident Three",
      phoneNumber: "+94000000002",
    } as any);

    const residentToken = signToken({
      id: resident._id.toString(),
      role: "resident",
    });

    const res = await request(app)
      .post("/api/payments/generateInvoice")
      .set("Authorization", `Bearer ${residentToken}`)
      .send({ userId: resident._id.toString(), amount: 700, reason: "Test" });

    expect(res.status).toBe(403);
  });

  it("POST /generateInvoice with invalid userId => 400", async () => {
    const token = signToken({
      id: new mongoose.Types.ObjectId().toString(),
      role: "authority",
    });
    const res = await request(app)
      .post("/api/payments/generateInvoice")
      .set("Authorization", `Bearer ${token}`)
      .send({ userId: "123", amount: 999, reason: "Invalid" });
    expect(res.status).toBe(400);
  });

  it("GET /status/:userId returns unpaid summary", async () => {
    const resident = await UserModel.create({
      username: "resident4",
      email: "resident4@example.com",
      password: "hashed",
      role: "resident",
      fullName: "Resident Four",
      phoneNumber: "+94000000003",
    } as any);

    const token = signToken({
      id: new mongoose.Types.ObjectId().toString(),
      role: "authority",
    });

    // Create one invoice
    const createRes = await request(app)
      .post("/api/payments/generateInvoice")
      .set("Authorization", `Bearer ${token}`)
      .send({
        userId: resident._id.toString(),
        amount: 1250,
        reason: "Overweight",
      });
    expect(createRes.status).toBe(201);

    const statusRes = await request(app)
      .get(`/api/payments/status/${resident._id.toString()}`)
      .set("Authorization", `Bearer ${token}`);
    expect(statusRes.status).toBe(200);
    expect(statusRes.body).toEqual(
      expect.objectContaining({
        count: expect.any(Number),
        total: expect.any(Number),
      })
    );
    expect(statusRes.body.count).toBeGreaterThanOrEqual(1);
    expect(statusRes.body.total).toBeGreaterThanOrEqual(1250);
  });
});
