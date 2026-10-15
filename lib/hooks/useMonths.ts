'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addMonthItem, deleteMonthItem, getMonth, listMonths, setMonthBalance, updateMonthItem } from '../api/months';
import type { MonthItemInput } from '../api/months';
import type { Month } from '../types';

export function useMonths() {
  return useQuery({ queryKey: ['months', 'list'], queryFn: listMonths });
}

export function useMonth(month: string) {
  return useQuery({ queryKey: ['months', month], queryFn: () => getMonth(month) });
}

/** Every month change returns the whole month, so the cache is replaced instead of refetched. */
function useMonthMutation<V>(month: string, fn: (vars: V) => Promise<Month>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      qc.setQueryData(['months', month], data);
      qc.invalidateQueries({ queryKey: ['months', 'list'] });
    },
  });
}

export const useAddMonthItem = (month: string) =>
  useMonthMutation(month, (body: MonthItemInput) => addMonthItem(month, body));

export const useUpdateMonthItem = (month: string) =>
  useMonthMutation(month, ({ id, body }: { id: string; body: MonthItemInput }) => updateMonthItem(month, id, body));

export const useDeleteMonthItem = (month: string) =>
  useMonthMutation(month, (id: string) => deleteMonthItem(month, id));

export const useSetMonthBalance = (month: string) =>
  useMonthMutation(month, ({ accountId, startingBalance }: { accountId: string; startingBalance: number }) =>
    setMonthBalance(month, accountId, startingBalance),
  );
