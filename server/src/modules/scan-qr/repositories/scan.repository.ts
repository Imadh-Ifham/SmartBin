import { ScanEvent } from "../models/scan.model";

export class ScanRepository {
  async save(doc: any) {
    const s = new ScanEvent(doc);
    return s.save();
  }

  async findRecentByRaw(raw: string, sinceMs: number = 1500) {
    const since = new Date(Date.now() - sinceMs);
    return ScanEvent.find({ raw, createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(10);
  }
}

export const scanRepository = new ScanRepository();
