'use client';

import { useQuery } from '@tanstack/react-query';
import { getByCategory, getMonthly, getSummary } from '../api/reports';
import type { CategoryKind } from '../types';

export function useSummary(month: string) {
  return useQuery({ queryKey: ['reports', 'summary', month], queryFn: () => getSummary(month) });
}

export function useMonthly(from: string, to: string) {
  return useQuery({
    queryKey: ['reports', 'monthly', from, to],
    queryFn: () => getMonthly(from, to),
  });
}

export function useByCategory(from: string, to: string, kind?: CategoryKind) {
  return useQuery({
    queryKey: ['reports', 'by-category', from, to, kind ?? null],
    queryFn: () => getByCategory(from, to, kind),
  });
}
