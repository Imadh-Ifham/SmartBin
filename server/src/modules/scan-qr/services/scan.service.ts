import { scanRepository } from "../repositories/scan.repository";
import { EventEmitter } from "events";
import { smartBinService } from "../../smart-bin/services/smartBin.service";

export class ScanService extends EventEmitter {
  private repo = scanRepository;

  constructor() {
    super();
  }

  parse(raw: string) {
    // naive parse: try JSON, then fallback to raw code
    try {
      const parsed = JSON.parse(raw);
      return parsed;
    } catch {
      return { code: raw };
    }
  }

  async handleScan(raw: string, source: string = "camera") {
    // dedupe: check recent identical scans
    const recent = await this.repo.findRecentByRaw(raw, 1500);
    if (recent && recent.length > 0) {
      return { deduped: true };
    }

    const parsed = this.parse(raw);
    const saved = await this.repo.save({
      raw,
      parsed,
      source,
      detectedAt: new Date(),
    });

    // try to resolve a bin
    let bin = null;
    try {
      const idOrCode = parsed?.code ?? raw;
      bin = await smartBinService.getBin(idOrCode);
    } catch (err) {
      // swallow
    }

    const event = { raw, parsed, saved, bin };
    this.emit("scan:detected", event);
    return event;
  }
}

export const scanService = new ScanService();
