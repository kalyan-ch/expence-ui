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

const monthFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short' });

/** `YYYY-MM` as "Sep 2026". */
export function formatMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  return monthFormatter.format(new Date(year, month - 1, 1));
}

/** Local calendar date as ISO `YYYY-MM-DD`. Never `toISOString()`: that is the UTC date. */
export function isoDate(date: Date): string {
  return date.toLocaleDateString('en-CA');
}
