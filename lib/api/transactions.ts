import { apiFetch } from './client';
import type { Page, Transaction, TransactionType } from '../types';

export interface TransactionFilters {
  from?: string;
  to?: string;
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  page?: number;
  size?: number;
}

export interface CreateTransactionInput {
  accountId: string;
  categoryId?: string | null;
  amount: number;
  type: Exclude<TransactionType, 'TRANSFER'>;
  occurredOn: string;
  description?: string | null;
}
export type UpdateTransactionInput = CreateTransactionInput;

function queryString(filters: TransactionFilters): string {
  const params = new URLSearchParams();
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.accountId) params.set('accountId', filters.accountId);
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  if (filters.type) params.set('type', filters.type);
  if (filters.page !== undefined) params.set('page', String(filters.page));
  if (filters.size !== undefined) params.set('size', String(filters.size));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function listTransactions(filters: TransactionFilters = {}): Promise<Page<Transaction>> {
  return apiFetch<Page<Transaction>>(`/transactions${queryString(filters)}`);
}

export function createTransaction(body: CreateTransactionInput): Promise<Transaction> {
  return apiFetch<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(body) });
}

export function updateTransaction(id: string, body: UpdateTransactionInput): Promise<Transaction> {
  return apiFetch<Transaction>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export function deleteTransaction(id: string): Promise<void> {
  return apiFetch<void>(`/transactions/${id}`, { method: 'DELETE' });
}
