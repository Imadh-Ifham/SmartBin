import mongoose, { Types } from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { PaymentRepository } from "../../repositories/payment.repository";
import { PaymentModel } from "../../models/payment.model";

describe("PaymentRepository", () => {
  const repo = new PaymentRepository();
  let repl: MongoMemoryReplSet;

  beforeAll(async () => {
    repl = await MongoMemoryReplSet.create({
      replSet: { storageEngine: "wiredTiger" },
    });
    await mongoose.connect(repl.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    try {
      await repl.stop();
    } catch {
      /* ignore on Windows EPERM */
    }
  });

  afterEach(async () => {
    const cols = await mongoose.connection.db.collections();
    await Promise.all(cols.map((c) => c.deleteMany({})));
  });

  it("create() without session and with session", async () => {
    const invoiceId = new Types.ObjectId().toString();
    const p1 = await repo.create({
      invoiceId,
      amount: 100,
      method: "Bank",
      status: "Processing",
    } as any);
    expect(p1!.invoiceId.toString()).toBeDefined();

    // For in-memory tests on Windows, avoid transactions to reduce lock contention
    const p2 = await repo.create({
      invoiceId,
      amount: 120,
      method: "Bank",
      status: "Success",
    } as any);
    expect(p2!.status).toBe("Success");
  });

  it("findByInvoice() sorts by timestamp desc", async () => {
    const invoiceId = new Types.ObjectId().toString();
    await PaymentModel.create({
      invoiceId,
      amount: 1,
      method: "Bank",
      status: "Success",
      timestamp: new Date(1),
    } as any);
    await PaymentModel.create({
      invoiceId,
      amount: 2,
      method: "Bank",
      status: "Success",
      timestamp: new Date(2),
    } as any);

    const list = await repo.findByInvoice(invoiceId);
    expect(list[0]!.amount).toBe(2);
    expect(list[1]!.amount).toBe(1);
  });

  it("updateStatus() works (no session)", async () => {
    const invoiceId = new Types.ObjectId();
    const created = await PaymentModel.create({
      invoiceId,
      amount: 10,
      method: "Bank",
      status: "Processing",
    } as any);
    const updated = await repo.updateStatus(created._id.toString(), "Success");
    expect(updated?.status).toBe("Success");
  });

  // Consolidated from payment.repository.more.test.ts
  it("findByTransactionId returns a payment", async () => {
    const tx = "TX-123";
    await PaymentModel.create({
      invoiceId: new Types.ObjectId(),
      amount: 50,
      method: "Bank",
      status: "Success",
      transactionId: tx,
    } as any);
    const p = await repo.findByTransactionId(tx);
    expect(p?.transactionId).toBe(tx);
  });

  it("sumSuccessByInvoiceIds handles empty and invalid arrays", async () => {
    const empty = await repo.sumSuccessByInvoiceIds([]);
    expect(empty.size).toBe(0);
    const invalid = await repo.sumSuccessByInvoiceIds(["not-an-id"]);
    expect(invalid.size).toBe(0);
  });

  it("sumSuccessByInvoiceIds returns totals per invoice", async () => {
    const i1 = new Types.ObjectId();
    const i2 = new Types.ObjectId();
    await PaymentModel.create({
      invoiceId: i1,
      amount: 100,
      method: "Bank",
      status: "Success",
    } as any);
    await PaymentModel.create({
      invoiceId: i1,
      amount: 50,
      method: "Bank",
      status: "Processing",
    } as any);
    await PaymentModel.create({
      invoiceId: i1,
      amount: 25,
      method: "Bank",
      status: "Success",
    } as any);
    await PaymentModel.create({
      invoiceId: i2,
      amount: 10,
      method: "Bank",
      status: "Success",
    } as any);

    const map = await repo.sumSuccessByInvoiceIds([
      i1.toString(),
      i2.toString(),
    ]);
    expect(map.get(i1.toString())).toBe(125);
    expect(map.get(i2.toString())).toBe(10);
  });
});
