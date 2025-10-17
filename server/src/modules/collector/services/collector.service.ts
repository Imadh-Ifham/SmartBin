import { collectorRepository } from "../repositories/collector.repository";
import { smartBinService } from "../..//smart-bin/services/smartBin.service";
import type { ICollectorShift } from "../models/collector.model";

export interface AssignRoutePayload {
  name?: string;
  stops: Array<{ binId: string; sequence: number }>;
}

export class CollectorService {
  constructor(
    private repo = collectorRepository,
    private binService = smartBinService
  ) {}

  async startShift(collectorId: string): Promise<ICollectorShift> {
    // end any previous active shift (defensive)
    const existing: any = await this.repo.findActiveShiftByCollector(
      collectorId
    );
    if (existing) {
      existing.endedAt = new Date();
      await existing.save();
    }

    const shift = await this.repo.createShift({ collectorId });
    return shift;
  }

  async endShift(shiftId: string) {
    return this.repo.endShift(shiftId);
  }

  async assignRoute(shiftId: string, payload: AssignRoutePayload) {
    const route = {
      name: payload.name,
      stops: payload.stops.map((s) => ({
        binId: s.binId,
        sequence: s.sequence,
        status: "Pending",
      })),
    } as any;
    return this.repo.assignRoute(shiftId, route);
  }

  async markCollected(shiftId: string, binId: string, collectedBy?: string) {
    // update shift stop
    const updatedShift = await this.repo.markStopCollected(shiftId, binId);
    // update bin weight/status if needed (example: reset weight after collection)
    try {
      const bin = await this.binService.getBin(binId);
      if (bin) {
        // sample behavior: reset currentWeight to 0 after collection
        await this.binService.reportWeight(String(bin._id), 0);
      }
    } catch (err) {
      // swallow bin update errors but log in future
    }
    return updatedShift;
  }

  async skipBin(shiftId: string, binId: string, reason?: string) {
    return this.repo.markStopSkipped(shiftId, binId, reason);
  }

  async reportIssue(
    shiftId: string,
    binId: string,
    issue: string,
    reportedBy?: string
  ) {
    const shift: any = await this.repo.findShiftById(shiftId);
    if (!shift) return null;
    shift.metadata = {
      ...(shift.metadata || {}),
      issues: [
        ...(shift.metadata?.issues || []),
        { binId, issue, reportedBy, at: new Date() },
      ],
    };
    return shift.save();
  }
}

export const collectorService = new CollectorService();
