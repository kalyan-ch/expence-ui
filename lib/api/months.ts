import { apiFetch } from './client';
import type { ItemKind, ItemStatus, Month, MonthSummary } from '../types';

/** A PUT replaces every field, so edits send the whole row. */
export interface MonthItemInput {
  name: string;
  kind: ItemKind;
  accountId: string;
  amount: number | null;
  billingDay: number | null;
  status: ItemStatus;
  paidOn: string | null;
}

export function listMonths(): Promise<MonthSummary[]> {
  return apiFetch<MonthSummary[]>('/months');
}

/** A month not planned yet is started from the recurring items. */
export function getMonth(month: string): Promise<Month> {
  return apiFetch<Month>(`/months/${month}`);
}

export function addMonthItem(month: string, body: MonthItemInput): Promise<Month> {
  return apiFetch<Month>(`/months/${month}/items`, { method: 'POST', body: JSON.stringify(body) });
}

export function updateMonthItem(month: string, id: string, body: MonthItemInput): Promise<Month> {
  return apiFetch<Month>(`/months/${month}/items/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export function deleteMonthItem(month: string, id: string): Promise<Month> {
  return apiFetch<Month>(`/months/${month}/items/${id}`, { method: 'DELETE' });
}

export function setMonthBalance(month: string, accountId: string, startingBalance: number): Promise<Month> {
  return apiFetch<Month>(`/months/${month}/balances/${accountId}`, {
    method: 'PUT',
    body: JSON.stringify({ startingBalance }),
  });
}
