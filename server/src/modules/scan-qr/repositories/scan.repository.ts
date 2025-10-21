import { ScanEvent } from "../models/scan.model";
import { IScanPayload } from "../services/scan.service";

export class ScanRepository {
  async save(doc: IScanPayload) {
    const s = new ScanEvent(doc);
    return s.save();
  }
}

export const scanRepository = new ScanRepository();
