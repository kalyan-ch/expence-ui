import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { byCategoryFixture, handlers, summaryFixture, txFixture } from '../mocks/handlers';
import DashboardPage from './page';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
// Only Date is faked, so MSW and React timers still run.
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
      <DashboardPage />
    </QueryClientProvider>,
  );
}

/** Records the query string of every request to `path`. */
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

describe('DashboardPage', () => {
  it('renders the four tiles for the current month', async () => {
    const seen = recordRequests('reports/summary', summaryFixture);
    renderPage();

    const tile = (name: string) => screen.findByRole('group', { name });
    expect(await within(await tile('Total balance')).findByText('$58.00')).toBeInTheDocument();
    expect(await within(await tile('Income')).findByText('$100.00')).toBeInTheDocument();
    expect(await within(await tile('Expenses')).findByText('$42.00')).toBeInTheDocument();
    expect(await within(await tile('Savings')).findByText('$58.00')).toBeInTheDocument();
    expect(screen.getByLabelText('Month')).toHaveValue('2026-09');
    expect(seen[0].get('month')).toBe('2026-09');
  });

  it('refetches the summary and donut when the month changes', async () => {
    const summaries = recordRequests('reports/summary', summaryFixture);
    const categories = recordRequests('reports/by-category', byCategoryFixture);
    renderPage();
    await screen.findByRole('group', { name: 'Income' });

    fireEvent.change(screen.getByLabelText('Month'), { target: { value: '2026-08' } });

    await waitFor(() => expect(summaries.at(-1)?.get('month')).toBe('2026-08'));
    await waitFor(() => expect(categories.at(-1)?.get('from')).toBe('2026-08-01'));
    expect(categories.at(-1)?.get('to')).toBe('2026-08-31');
    expect(categories.at(-1)?.get('kind')).toBe('EXPENSE');
  });

  it('renders one labelled donut slice per category', async () => {
    renderPage();

    const donut = await screen.findByRole('figure', { name: 'Spending by category' });
    await waitFor(() => expect(within(donut).getAllByRole('img')).toHaveLength(2));
    expect(within(donut).getByRole('img', { name: 'Groceries: $30.00' })).toBeInTheDocument();
    expect(within(donut).getByRole('img', { name: 'Pets: $12.00' })).toBeInTheDocument();
  });

  it('shows an empty state instead of a donut for a month without spending', async () => {
    server.use(http.get('*/api/reports/by-category', () => HttpResponse.json([])));
    renderPage();

    expect(await screen.findByText('No spending this month.')).toBeInTheDocument();
    expect(screen.queryByRole('figure', { name: 'Spending by category' })).not.toBeInTheDocument();
  });

  it('lists the ten most recent transactions', async () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ ...txFixture, id: `t${i}`, description: `Tx ${i}` }));
    const seen = recordRequests('transactions', { content: rows, page: 0, size: 10, totalElements: 30, totalPages: 3 });
    renderPage();

    const recent = await screen.findByRole('region', { name: 'Recent transactions' });
    await waitFor(() => expect(within(recent).getAllByRole('row')).toHaveLength(11)); // + header
    expect(within(recent).getByRole('row', { name: /Tx 0/ })).toHaveTextContent('($42.00)');
    expect(seen[0].get('size')).toBe('10');
  });
});
