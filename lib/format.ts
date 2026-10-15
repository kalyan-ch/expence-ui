import type { ItemKind } from './types';

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

const compactMoneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
});

/** Money for chart axes: "$2.5K". */
export function formatMoneyCompact(value: number): string {
  return compactMoneyFormatter.format(value);
}

const shortMonthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });

/** `YYYY-MM` as "Sep '26": short enough for a chart axis, and two Julys still differ. */
export function formatMonthTick(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  return `${shortMonthFormatter.format(new Date(year, month - 1, 1))} '${String(year).slice(2)}`;
}

/** `YYYY-MM` moved by `n` months. */
export function shiftMonth(yearMonth: string, n: number): string {
  const [year, month] = yearMonth.split('-').map(Number);
  return isoDate(new Date(year, month - 1 + n, 1)).slice(0, 7);
}

export const KIND_LABEL: Record<ItemKind, string> = {
  EXPENSE: 'Expense',
  CARD_PAYMENT: 'Card payment',
  SAVINGS: 'Savings',
  INCOME: 'Paycheck',
};

const shortDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

/** ISO `YYYY-MM-DD` as "Oct 9", parsed as local calendar parts like `formatDate`. */
export function formatShortDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return shortDateFormatter.format(new Date(year, month - 1, day));
}
