import { CollectorShift } from "../models/collector.model";
import { Types } from "mongoose";

export class CollectorRepository {
  async createShift(doc: any) {
    const s = new CollectorShift(doc);
    return s.save();
  }

  async findShiftById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return CollectorShift.findById(id);
  }

  async findActiveShiftByCollector(collectorId: string) {
    if (!Types.ObjectId.isValid(collectorId)) return null;
    return CollectorShift.findOne({ collectorId, endedAt: { $exists: false } });
  }

  async assignRoute(shiftId: string, route: any) {
    const shift = await this.findShiftById(shiftId);
    if (!shift) return null;
    shift.route = route;
    return shift.save();
  }

  async markStopCollected(shiftId: string, binId: string) {
    const shift: any = await this.findShiftById(shiftId);
    if (!shift) return null;
    const stop = (shift.route?.stops || []).find(
      (s: any) => String(s.binId) === String(binId)
    );
    if (!stop) return null;
    stop.status = "Collected";
    stop.collectedAt = new Date();
    return shift.save();
  }

  async markStopSkipped(shiftId: string, binId: string, reason?: string) {
    const shift: any = await this.findShiftById(shiftId);
    if (!shift) return null;
    const stop = (shift.route?.stops || []).find(
      (s: any) => String(s.binId) === String(binId)
    );
    if (!stop) return null;
    stop.status = "Skipped";
    shift.metadata = {
      ...(shift.metadata || {}),
      lastSkip: { binId, reason, at: new Date() },
    };
    return shift.save();
  }

  async endShift(shiftId: string) {
    const shift = await this.findShiftById(shiftId);
    if (!shift) return null;
    shift.endedAt = new Date();
    return shift.save();
  }
}

export const collectorRepository = new CollectorRepository();
