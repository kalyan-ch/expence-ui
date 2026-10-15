'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createRecurringItem,
  deleteRecurringItem,
  listRecurringItems,
  updateRecurringItem,
} from '../api/recurringItems';
import type { RecurringItemInput } from '../api/recurringItems';

export function useRecurringItems() {
  return useQuery({ queryKey: ['recurring-items'], queryFn: listRecurringItems });
}

function useRecurringMutation<V>(fn: (vars: V) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring-items'] }),
  });
}

export const useCreateRecurringItem = () =>
  useRecurringMutation((body: RecurringItemInput) => createRecurringItem(body));

export const useUpdateRecurringItem = () =>
  useRecurringMutation(({ id, body }: { id: string; body: RecurringItemInput }) => updateRecurringItem(id, body));

export const useDeleteRecurringItem = () => useRecurringMutation((id: string) => deleteRecurringItem(id));
