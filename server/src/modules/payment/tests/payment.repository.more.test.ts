import mongoose, { Types } from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { PaymentRepository } from "../repositories/payment.repository";
import { PaymentModel } from "../models/payment.model";

describe("PaymentRepository (more)", () => {
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
    } catch {}
  });

  afterEach(async () => {
    const cols = await mongoose.connection.db.collections();
    await Promise.all(cols.map((c) => c.deleteMany({})));
  });

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
