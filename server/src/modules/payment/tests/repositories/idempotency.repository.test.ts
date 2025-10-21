import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { IdempotencyRepository } from "../../repositories/idempotency.repository";

describe("IdempotencyRepository", () => {
  const repo = new IdempotencyRepository();
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

  it("createProcessing → find → complete → fail", async () => {
    const key = "idem-test-1";
    await repo.createProcessing(key, { a: 1 });
    const found1 = await repo.find(key);
    expect(found1?.status).toBe("processing");

    await repo.complete(key, { ok: true });
    const found2 = await repo.find(key);
    expect(found2?.status).toBe("completed");

    await repo.fail(key, { err: "x" });
    const found3 = await repo.find(key);
    expect(found3?.status).toBe("failed");
  });
});
