'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAccount, deleteAccount, listAccounts, updateAccount } from '../api/accounts';
import type { CreateAccountInput, UpdateAccountInput } from '../api/accounts';

export function useAccounts() {
  return useQuery({ queryKey: ['accounts'], queryFn: listAccounts });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAccountInput) => createAccount(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateAccountInput }) => updateAccount(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
