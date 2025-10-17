export interface BinLite {
  id: number;
  [key: string]: any;
}

export default class ScanService {
  // Parse the raw payload from QR into a numeric id if possible
  parseId(raw: string): number | null {
    if (!raw) return null;
    let id: number | null = null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) id = Number(parsed.id);
    } catch (_) {
      const n = Number(raw);
      if (!Number.isNaN(n)) id = n;
    }
    return id !== null ? id : null;
  }

  // Find a bin by raw payload and a list of bins. Generic so callers keep full bin type.
  findBin<T extends BinLite>(raw: string, bins: T[] = []): T | undefined {
    const id = this.parseId(raw);
    if (id === null) return undefined;
    return bins.find((b) => b.id === id);
  }
}
