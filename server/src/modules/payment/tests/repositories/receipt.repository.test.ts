import mongoose, { Types } from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { ReceiptRepository } from "../../repositories/receipt.repository";

describe("ReceiptRepository", () => {
  const repo = new ReceiptRepository();
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

  it("create(); findByPaymentId(); findById()", async () => {
    const invoiceId = new Types.ObjectId().toString();
    const paymentId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();
    const created = await repo.create({
      invoiceId,
      paymentId,
      userId,
      amount: 250,
      data: { ok: true },
    });
    const byPid = await repo.findByPaymentId(paymentId);
    expect(byPid?.id || byPid?._id?.toString()).toBeDefined();
    const byId = await repo.findById((created as any)._id.toString());
    expect(byId?.amount).toBe(250);
  });
});
