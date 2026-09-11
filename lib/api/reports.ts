import { apiFetch } from './client';
import type { CategoryKind, CategoryTotal, MonthlyPoint, Summary } from '../types';

export function getSummary(month: string): Promise<Summary> {
  return apiFetch<Summary>(`/reports/summary?month=${encodeURIComponent(month)}`);
}

export function getMonthly(from: string, to: string): Promise<MonthlyPoint[]> {
  return apiFetch<MonthlyPoint[]>(
    `/reports/monthly?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  );
}

export function getByCategory(
  from: string,
  to: string,
  kind?: CategoryKind,
): Promise<CategoryTotal[]> {
  const qs = new URLSearchParams({ from, to });
  if (kind) qs.set('kind', kind);
  return apiFetch<CategoryTotal[]>(`/reports/by-category?${qs.toString()}`);
}
