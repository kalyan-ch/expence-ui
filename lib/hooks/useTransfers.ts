'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTransfer, deleteTransfer } from '../api/transfers';
import type { CreateTransferInput } from '../api/transfers';

function invalidateAfterTransfer(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['transactions'] });
  qc.invalidateQueries({ queryKey: ['accounts'] });
  qc.invalidateQueries({ queryKey: ['reports'] });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTransferInput) => createTransfer(body),
    onSuccess: () => invalidateAfterTransfer(qc),
  });
}

export function useDeleteTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => deleteTransfer(groupId),
    onSuccess: () => invalidateAfterTransfer(qc),
  });
}
