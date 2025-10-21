// Centralized pricing/config accessors with safe defaults.
// This avoids sprinkling magic numbers in services and keeps a single source of truth.

export function getOverweightRateLkr(): number {
  const raw = process.env.OVERWEIGHT_RATE_LKR;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 250; // default 250 LKR/kg
}

export function getDiscountBounds(): { min: number; max: number } {
  const minRaw = process.env.DISCOUNT_MIN_PERCENT;
  const maxRaw = process.env.DISCOUNT_MAX_PERCENT;
  const min = minRaw !== undefined ? Number(minRaw) : 0;
  const max = maxRaw !== undefined ? Number(maxRaw) : 100;
  const validMin = Number.isFinite(min) ? min : 0;
  const validMax = Number.isFinite(max) ? max : 100;
  return { min: validMin, max: validMax };
}

export function getDuplicateWindowMs(): number {
  const raw = process.env.INVOICE_DUPLICATE_WINDOW_MS;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : 5 * 60 * 1000; // default 5 minutes
}
