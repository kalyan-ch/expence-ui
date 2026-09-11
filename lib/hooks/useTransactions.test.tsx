import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { handlers, summaryFixture, txFixture } from '../../mocks/handlers';
import { ApiError } from '../api/client';
import { useAccounts } from './useAccounts';
import { useSummary } from './useReports';
import { useCreateTransaction, useTransactions } from './useTransactions';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useTransactions', () => {
  it('returns mapped transaction data', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useTransactions({}), { wrapper: wrapper(qc) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.content[0]).toMatchObject({ id: txFixture.id, amount: -42 });
  });

  it('creating a transaction invalidates transactions, accounts and reports', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    let accountsFetches = 0;
    let monthlyFetches = 0;
    server.use(
      http.get('*/api/accounts', async () => {
        accountsFetches++;
        return HttpResponse.json([]);
      }),
      http.get('*/api/reports/summary*', async () => {
        monthlyFetches++;
        return HttpResponse.json(summaryFixture);
      }),
    );

    // Mount queries for the keys that should be invalidated, so there is something to refetch.
    const { result: txList } = renderHook(() => useTransactions({}), { wrapper: wrapper(qc) });
    const { result: accts } = renderHook(() => useAccounts(), { wrapper: wrapper(qc) });
    const { result: summary } = renderHook(() => useSummary('2026-09'), { wrapper: wrapper(qc) });
    await waitFor(() => expect(txList.current.isSuccess).toBe(true));
    await waitFor(() => expect(accts.current.isSuccess).toBe(true));
    await waitFor(() => expect(summary.current.isSuccess).toBe(true));

    const beforeAccounts = accountsFetches;
    const beforeReports = monthlyFetches;

    const { result: mut } = renderHook(() => useCreateTransaction(), { wrapper: wrapper(qc) });
    await mut.current.mutateAsync({
      accountId: 'a1',
      categoryId: 'c1',
      amount: 10,
      type: 'EXPENSE',
      occurredOn: '2026-09-02',
      description: 'lunch',
    });

    await waitFor(() => expect(accountsFetches).toBeGreaterThan(beforeAccounts));
    await waitFor(() => expect(monthlyFetches).toBeGreaterThan(beforeReports));
  });

  it('surfaces ApiError message to the caller on failure', async () => {
    server.use(
      http.post('*/api/transactions', () =>
        HttpResponse.json({ message: 'Validation failed', errors: { amount: 'must be greater than 0' } }, { status: 400 }),
      ),
    );
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useCreateTransaction(), { wrapper: wrapper(qc) });

    await expect(
      result.current.mutateAsync({
        accountId: 'a1',
        categoryId: 'c1',
        amount: -5,
        type: 'EXPENSE',
        occurredOn: '2026-09-02',
        description: null,
      }),
    ).rejects.toMatchObject({ message: 'Validation failed' });

    try {
      await result.current.mutateAsync({
        accountId: 'a1',
        categoryId: 'c1',
        amount: -5,
        type: 'EXPENSE',
        occurredOn: '2026-09-02',
        description: null,
      });
    } catch (e) {
      expect((e as ApiError).fieldErrors?.amount).toBe('must be greater than 0');
    }
  });
});
