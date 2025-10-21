import { ScanEvent } from "../models/scan.model";
import { IScanPayload } from "../services/scan.service";

/**
 * Repository layer for storing QR scan events.
 *
 * Responsibilities:
 * - Encapsulates database persistence logic
 * - Provides a single point for saving scan records
 */
export class ScanRepository {
  /**
   * Saves a new scan event to the database.
   *
   * @param doc - Scan payload containing code, source, and optional userId
   * @returns The saved ScanEvent document
   */
  async save(doc: IScanPayload) {
    const s = new ScanEvent(doc);
    return s.save();
  }
}

/** Singleton instance of ScanRepository */
export const scanRepository = new ScanRepository();
