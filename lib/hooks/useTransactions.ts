'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  updateTransaction,
} from '../api/transactions';
import type { CreateTransactionInput, TransactionFilters, UpdateTransactionInput } from '../api/transactions';

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => listTransactions(filters),
  });
}

// A transaction changes balances and report totals, so every transaction write
// invalidates those keys too — the dashboard is correct the moment the edit lands.
function invalidateAfterTransactionWrite(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['transactions'] });
  qc.invalidateQueries({ queryKey: ['accounts'] });
  qc.invalidateQueries({ queryKey: ['reports'] });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTransactionInput) => createTransaction(body),
    onSuccess: () => invalidateAfterTransactionWrite(qc),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTransactionInput }) =>
      updateTransaction(id, body),
    onSuccess: () => invalidateAfterTransactionWrite(qc),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => invalidateAfterTransactionWrite(qc),
  });
}
