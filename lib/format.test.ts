import { describe, expect, it } from 'vitest';
import { formatDate, formatMoney } from './format';

describe('formatMoney', () => {
  it('formats zero', () => {
    expect(formatMoney(0)).toBe('$0.00');
  });

  it('formats thousands with grouping and 2 decimals', () => {
    expect(formatMoney(1234.5)).toBe('$1,234.50');
  });

  it('renders negatives in parentheses', () => {
    expect(formatMoney(-42)).toBe('($42.00)');
  });

  it('rounds to 2 decimals', () => {
    expect(formatMoney(1.005)).toBe('$1.01');
    expect(formatMoney(-1234.5678)).toBe('($1,234.57)');
  });
});

describe('formatDate', () => {
  it('renders the ISO date without timezone drift', () => {
    expect(formatDate('2026-09-04')).toBe('Sep 4, 2026');
  });

  it('handles the first of a month', () => {
    expect(formatDate('2026-01-01')).toBe('Jan 1, 2026');
  });
});
