import { apiFetch } from './client';
import type { Transfer } from '../types';

export interface CreateTransferInput {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  occurredOn: string;
  description?: string | null;
}

export function createTransfer(body: CreateTransferInput): Promise<Transfer> {
  return apiFetch<Transfer>('/transfers', { method: 'POST', body: JSON.stringify(body) });
}

export function deleteTransfer(groupId: string): Promise<void> {
  return apiFetch<void>(`/transfers/${groupId}`, { method: 'DELETE' });
}
