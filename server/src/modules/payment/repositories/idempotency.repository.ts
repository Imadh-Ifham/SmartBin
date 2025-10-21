import { IdempotencyModel } from "../models/idempotency.model";

export class IdempotencyRepository {
  async createProcessing(key: string, meta: any = {}) {
    return await IdempotencyModel.create({
      key,
      status: "processing",
      response: meta,
    });
  }
  async find(key: string) {
    return await IdempotencyModel.findOne({ key }).exec();
  }
  async complete(key: string, response: any) {
    return await IdempotencyModel.findOneAndUpdate(
      { key },
      { status: "completed", response },
      { new: true }
    ).exec();
  }
  async fail(key: string, error: any) {
    return await IdempotencyModel.findOneAndUpdate(
      { key },
      { status: "failed", error },
      { new: true }
    ).exec();
  }
}
