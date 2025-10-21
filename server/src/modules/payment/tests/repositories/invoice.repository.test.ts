import mongoose, { Types } from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { InvoiceRepository } from "../../repositories/invoice.repository";

describe("InvoiceRepository", () => {
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
    } catch {
      /* ignore on Windows EPERM */
    }
  });

  afterEach(async () => {
    const cols = await mongoose.connection.db.collections();
    await Promise.all(cols.map((c) => c.deleteMany({})));
  });

  it("create() stores string userId as ObjectId", async () => {
    const uid = new Types.ObjectId();
    const inv = await repo.create({
      userId: uid.toString(),
      amount: 1000,
      reason: "Manual",
      status: "Pending",
    } as any);
    expect(inv.userId).toBeInstanceOf(Types.ObjectId);
  });

  it("create() accepts ObjectId directly", async () => {
    const uid = new Types.ObjectId();
    const inv = await repo.create({
      userId: uid,
      amount: 1200,
      reason: "Manual",
      status: "Pending",
    } as any);
    expect(inv.userId.toString()).toBe(uid.toString());
  });

  it("updateStatus() works with and without session", async () => {
    const uid = new Types.ObjectId();
    const inv = await repo.create({
      userId: uid,
      amount: 500,
      reason: "X",
      status: "Pending",
    } as any);
    const noSession = await repo.updateStatus(inv._id.toString(), "Paid");
    expect(noSession?.status).toBe("Paid");

    const session = await mongoose.startSession();
    const withSession = await repo.updateStatus(
      inv._id.toString(),
      "Refunded",
      { session }
    );
    session.endSession();
    expect(withSession?.status).toBe("Refunded");
  });

  it("findRecentPendingByUserAndReason() respects time window", async () => {
    const uid = new Types.ObjectId();
    // inside window
    await repo.create({
      userId: uid,
      amount: 100,
      reason: "Window",
      status: "Pending",
    } as any);
    // outside window
    const old = await repo.create({
      userId: uid,
      amount: 100,
      reason: "Window",
      status: "Pending",
    } as any);
    await (old as any).updateOne({
      $set: { createdAt: new Date(Date.now() - 10 * 60 * 1000) },
    });

    const found = await repo.findRecentPendingByUserAndReason(
      uid.toString(),
      "Window",
      60 * 1000
    );
    expect(found).toBeTruthy();
    expect(found?.reason).toBe("Window");
  });

  it("findAllByUser() supports optional status filter", async () => {
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

    const all = await repo.findAllByUser(uid.toString());
    expect(all.length).toBe(2);

    const onlyPaid = await repo.findAllByUser(uid, "Paid");
    expect(onlyPaid.length).toBe(1);
    expect(onlyPaid[0]?.status).toBe("Paid");
  });

  // Consolidated from invoice.repository.more.test.ts
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
