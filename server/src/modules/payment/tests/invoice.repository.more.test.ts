import mongoose, { Types } from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { InvoiceRepository } from "../repositories/invoice.repository";

describe("InvoiceRepository (more)", () => {
  const repo = new InvoiceRepository();
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

  it("findPendingByUser returns only Pending", async () => {
    const uid = new Types.ObjectId();
    await repo.create({
      userId: uid,
      amount: 100,
      reason: "A",
      status: "Pending",
    } as any);
    await repo.create({
      userId: uid,
      amount: 200,
      reason: "B",
      status: "Paid",
    } as any);
    const list = await repo.findPendingByUser(uid.toString());
    expect(list).toHaveLength(1);
    expect(list[0]!.status).toBe("Pending");
  });

  it("updateTotals updates paidToDate, outstanding and status", async () => {
    const uid = new Types.ObjectId();
    const inv = await repo.create({
      userId: uid,
      amount: 1000,
      reason: "C",
      status: "Pending",
    } as any);
    const updated = await repo.updateTotals(inv._id.toString(), {
      paidToDate: 400,
      outstanding: 600,
      status: "Partially Paid",
    });
    expect(updated?.paidToDate).toBe(400);
    expect(updated?.outstanding).toBe(600);
    expect(updated?.status).toBe("Partially Paid");
  });
});
