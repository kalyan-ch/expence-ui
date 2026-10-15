import { apiFetch } from './client';
import type { ItemKind, RecurringItem } from '../types';

export interface RecurringItemInput {
  name: string;
  kind: ItemKind;
  accountId: string;
  defaultAmount: number | null;
  billingDay: number | null;
  sortOrder: number;
  active: boolean;
}

export function listRecurringItems(): Promise<RecurringItem[]> {
  return apiFetch<RecurringItem[]>('/recurring-items');
}

export function createRecurringItem(body: RecurringItemInput): Promise<RecurringItem> {
  return apiFetch<RecurringItem>('/recurring-items', { method: 'POST', body: JSON.stringify(body) });
}

export function updateRecurringItem(id: string, body: RecurringItemInput): Promise<RecurringItem> {
  return apiFetch<RecurringItem>(`/recurring-items/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export function deleteRecurringItem(id: string): Promise<void> {
  return apiFetch<void>(`/recurring-items/${id}`, { method: 'DELETE' });
}
