const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

/** Money with grouping separators and 2 decimals; negatives in parentheses. */
export function formatMoney(value: number): string {
  const formatted = moneyFormatter.format(Math.abs(value));
  return value < 0 ? `(${formatted})` : formatted;
}

/**
 * Formats an ISO `YYYY-MM-DD` date. Parsed as local calendar parts, never via
 * `new Date(iso)` — that reads UTC midnight and drifts a day west of Greenwich.
 */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
}
