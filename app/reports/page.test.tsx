import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { byCategoryFixture, handlers, monthlyFixture } from '../../mocks/handlers';
import ReportsPage from './page';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
beforeEach(() => vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 8, 15) }));
afterEach(() => {
  server.resetHandlers();
  vi.useRealTimers();
});
afterAll(() => server.close());

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ReportsPage />
    </QueryClientProvider>,
  );
}

function recordRequests(path: string, body: unknown) {
  const seen: URLSearchParams[] = [];
  server.use(
    http.get(`*/api/${path}`, ({ request }) => {
      seen.push(new URL(request.url).searchParams);
      return HttpResponse.json(body);
    }),
  );
  return seen;
}

describe('ReportsPage', () => {
  it('drives both the grouped bars and the category table from the date range', async () => {
    const monthly = recordRequests('reports/monthly', monthlyFixture);
    const categories = recordRequests('reports/by-category', byCategoryFixture);
    renderPage();

    const bars = await screen.findByRole('figure', { name: 'Income and expenses by month' });
    expect(within(bars).getByRole('row', { name: 'Sep 2026 $100.00 $42.00' })).toBeInTheDocument();
    expect(bars.querySelectorAll('.recharts-bar-rectangle path')).toHaveLength(2); // Aug is zero-height
    expect(monthly[0].get('from')).toBe('2026-04-01');
    expect(monthly[0].get('to')).toBe('2026-09-15');

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-07-01' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-07-31' } });

    await waitFor(() => expect(monthly.at(-1)?.get('from')).toBe('2026-07-01'));
    expect(monthly.at(-1)?.get('to')).toBe('2026-07-31');
    await waitFor(() => expect(categories.at(-1)?.get('to')).toBe('2026-07-31'));
    expect(categories.at(-1)?.get('from')).toBe('2026-07-01');
    expect(categories.at(-1)?.get('kind')).toBe('EXPENSE');
  });

  it("shows each category's share of the total", async () => {
    renderPage();

    const groceries = await screen.findByRole('row', { name: /Groceries/ });
    expect(groceries).toHaveTextContent('$30.00');
    expect(groceries).toHaveTextContent('71.4%');
    expect(screen.getByRole('row', { name: /Pets/ })).toHaveTextContent('28.6%');
  });

  it('switches the category table to income', async () => {
    const categories = recordRequests('reports/by-category', byCategoryFixture);
    renderPage();
    await screen.findByRole('row', { name: /Groceries/ });

    fireEvent.change(screen.getByLabelText('Kind'), { target: { value: 'INCOME' } });

    await waitFor(() => expect(categories.at(-1)?.get('kind')).toBe('INCOME'));
  });

  it('renders an empty state, not a broken chart, for an empty range', async () => {
    server.use(
      http.get('*/api/reports/monthly', () => HttpResponse.json([{ month: '2026-09', income: 0, expenses: 0 }])),
      http.get('*/api/reports/by-category', () => HttpResponse.json([])),
    );
    const { container } = renderPage();

    expect(await screen.findByText('No income or expenses in this range.')).toBeInTheDocument();
    expect(await screen.findByText('No categorised transactions in this range.')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeNull();
  });
});
