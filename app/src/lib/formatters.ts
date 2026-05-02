/**
 * Currency & Number Formatters
 * Formats IDR values with adaptive units (M, B, T)
 */

/**
 * Format raw IDR value to human-readable string
 * Examples:
 *   351_000_000 → "Rp 351M"
 *   1_200_000_000_000 → "Rp 1.2T"
 *   19_500_000_000_000 → "Rp 19.5T"
 */
export function formatIdr(value: number): string {
  if (!value || value <= 0) return "—";

  const abs = Math.abs(value);

  if (abs >= 1_000_000_000_000) {
    return `Rp ${(abs / 1_000_000_000_000).toFixed(1).replace(/\.0$/, '')}T`;
  }
  if (abs >= 1_000_000_000) {
    return `Rp ${(abs / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  }
  if (abs >= 1_000_000) {
    return `Rp ${(abs / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  return `Rp ${abs.toLocaleString('id-ID')}`;
}

/**
 * Format raw IDR value for compact display (1 decimal max)
 */
export function formatIdrCompact(value: number): string {
  if (!value || value <= 0) return "—";

  const abs = Math.abs(value);

  if (abs >= 1_000_000_000_000) {
    const t = abs / 1_000_000_000_000;
    return t >= 10 ? `Rp ${Math.round(t)}T` : `Rp ${t.toFixed(1)}T`;
  }
  if (abs >= 1_000_000_000) {
    const b = abs / 1_000_000_000;
    return b >= 10 ? `Rp ${Math.round(b)}B` : `Rp ${b.toFixed(1)}B`;
  }
  if (abs >= 1_000_000) {
    const m = abs / 1_000_000;
    return m >= 10 ? `Rp ${Math.round(m)}M` : `Rp ${m.toFixed(1)}M`;
  }
  return `Rp ${(abs / 1000).toFixed(0)}K`;
}

/**
 * Format percentage (IRR)
 */
export function formatPercent(value: number): string {
  if (!value && value !== 0) return "—";
  return `${value.toFixed(1)}%`;
}

/**
 * Format years (payback period)
 */
export function formatYears(value: number): string {
  if (!value && value !== 0) return "—";
  return `${value.toFixed(1)} yr`;
}

/**
 * Format number with Indonesian locale
 */
export function formatNumber(value: number): string {
  if (!value && value !== 0) return "—";
  return value.toLocaleString('id-ID');
}
