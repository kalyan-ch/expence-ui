import { apiFetch } from './client';
import type { Account, AccountType } from '../types';

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  openingBalance: number;
}
export type UpdateAccountInput = CreateAccountInput;

export function listAccounts(): Promise<Account[]> {
  return apiFetch<Account[]>('/accounts');
}

export function createAccount(body: CreateAccountInput): Promise<Account> {
  return apiFetch<Account>('/accounts', { method: 'POST', body: JSON.stringify(body) });
}

export function updateAccount(id: string, body: UpdateAccountInput): Promise<Account> {
  return apiFetch<Account>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export function deleteAccount(id: string): Promise<void> {
  return apiFetch<void>(`/accounts/${id}`, { method: 'DELETE' });
}
