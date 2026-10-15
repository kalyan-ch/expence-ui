import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { handlers, monthFixture } from '../../mocks/handlers';
import BillsPage from './page';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
// Only Date is faked, so MSW and React timers still run. Oct 13: Rent and Car are overdue.
beforeEach(() => vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 9, 13) }));
afterEach(() => {
  server.resetHandlers();
  vi.useRealTimers();
});
afterAll(() => server.close());

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <BillsPage />
    </QueryClientProvider>,
  );
}

/** Records each PUT body to a month item and answers with `reply`. */
function recordItemPuts(reply = monthFixture) {
  const seen: { url: string; body: Record<string, unknown> }[] = [];
  server.use(
    http.put('*/api/months/:month/items/:id', async ({ request }) => {
      seen.push({ url: request.url, body: (await request.json()) as Record<string, unknown> });
      return HttpResponse.json(reply);
    }),
  );
  return seen;
}

const bills = () => screen.findByRole('table', { name: 'Bills' });
/** The row whose Name cell is exactly `name` ("Car" must not match "Amex Card"). */
const billRow = async (name: string) =>
  within(await bills()).getByRole('cell', { name }).closest('tr') as HTMLElement;

describe('BillsPage', () => {
  it("opens this month's plan with account cards and totals", async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Oct 2026' })).toBeInTheDocument();
    const chase = await screen.findByRole('article', { name: 'Chase' });
    expect(within(chase).getByText('$2,890.81')).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: 'Expenditure' })).getByText('$2,823.77')).toBeInTheDocument();
    // Paychecks live in the income section, not the bills table.
    expect(within(await bills()).queryByText('Salary 1')).not.toBeInTheDocument();
  });

  it('marks unpaid bills past their billing day as overdue', async () => {
    renderPage();

    expect(within(await billRow('Car')).getByText('Overdue since Oct 10')).toBeInTheDocument();
    expect(within(await billRow('Amex Card')).getByText('Due Oct 27')).toBeInTheDocument();
    expect(within(await billRow('Discover Card')).getByText('Set amount')).toBeInTheDocument();
    expect(screen.getByText(/2 overdue/)).toBeInTheDocument();
  });

  it('ticking paid sends the whole row with today as the paid date', async () => {
    const seen = recordItemPuts();
    const user = userEvent.setup();
    renderPage();

    await user.click(within(await billRow('Car')).getByRole('checkbox', { name: 'Car paid' }));

    await waitFor(() => expect(seen).toHaveLength(1));
    expect(seen[0].url).toMatch(/\/months\/2026-10\/items\/i2$/);
    expect(seen[0].body).toEqual({
      name: 'Car',
      kind: 'EXPENSE',
      accountId: 'a2',
      amount: 379.81,
      billingDay: 10,
      status: 'PAID',
      paidOn: '2026-10-13',
    });
  });

  it("a bill's account dropdown lists payment accounts and keeps its current one", async () => {
    renderPage();
    const select = within(await billRow('Car')).getByRole('combobox', { name: 'Car paid from' });
    expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual(['Checking', 'DCU']);
  });

  it('a bill with no amount cannot be ticked paid', async () => {
    renderPage();
    expect(within(await billRow('Discover Card')).getByRole('checkbox')).toBeDisabled();
  });

  it('editing an amount inline saves on Enter and shows the new totals', async () => {
    const seen = recordItemPuts({ ...monthFixture, expenditure: 3000 });
    const user = userEvent.setup();
    renderPage();

    await user.click(within(await billRow('Amex Card')).getByRole('button', { name: /Amex Card amount/ }));
    const input = screen.getByRole('textbox', { name: 'Amex Card amount' });
    await user.clear(input);
    await user.type(input, '609.37{Enter}');

    await waitFor(() => expect(seen[0]?.body.amount).toBe(609.37));
    expect(await within(screen.getByRole('group', { name: 'Expenditure' })).findByText('$3,000.00')).toBeInTheDocument();
  });

  it('an invalid amount shows an error and sends nothing', async () => {
    const seen = recordItemPuts();
    const user = userEvent.setup();
    renderPage();

    await user.click(within(await billRow('Car')).getByRole('button', { name: /Car amount/ }));
    const input = screen.getByRole('textbox', { name: 'Car amount' });
    await user.clear(input);
    await user.type(input, 'abc{Enter}');

    expect(await screen.findByText('Enter an amount like 433.14')).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(seen).toHaveLength(0);
  });

  it('Escape cancels an inline edit', async () => {
    const seen = recordItemPuts();
    const user = userEvent.setup();
    renderPage();

    await user.click(within(await billRow('Car')).getByRole('button', { name: /Car amount/ }));
    await user.type(screen.getByRole('textbox', { name: 'Car amount' }), '9{Escape}');

    expect(within(await billRow('Car')).getByRole('button', { name: 'Car amount: $379.81. Edit' })).toBeInTheDocument();
    expect(seen).toHaveLength(0);
  });

  it('setting a starting balance puts it for that account and month', async () => {
    const seen: unknown[] = [];
    server.use(
      http.put('*/api/months/2026-10/balances/a2', async ({ request }) => {
        seen.push(await request.json());
        return HttpResponse.json(monthFixture);
      }),
    );
    const user = userEvent.setup();
    renderPage();

    const dcu = await screen.findByRole('article', { name: 'DCU' });
    await user.click(within(dcu).getByRole('button', { name: /DCU starting balance: blank/ }));
    await user.type(screen.getByRole('textbox', { name: 'DCU starting balance' }), '4471.51{Enter}');

    await waitFor(() => expect(seen).toEqual([{ startingBalance: 4471.51 }]));
  });

  it('the month switcher fetches the previous month', async () => {
    const months: string[] = [];
    server.use(
      http.get('*/api/months/:month', ({ params }) => {
        months.push(String(params.month));
        return HttpResponse.json({ ...monthFixture, month: params.month });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await bills();

    await user.click(screen.getByRole('button', { name: 'Previous month' }));

    expect(await screen.findByRole('heading', { name: 'Sep 2026' })).toBeInTheDocument();
    expect(months).toEqual(['2026-10', '2026-09']);
  });

  it('adding a one-off bill posts it as pending', async () => {
    const seen: unknown[] = [];
    server.use(
      http.post('*/api/months/2026-10/items', async ({ request }) => {
        seen.push(await request.json());
        return HttpResponse.json(monthFixture, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await bills();

    await user.click(screen.getByRole('button', { name: 'Add one-off bill' }));
    await user.type(screen.getByLabelText('Name'), 'Car repair');
    await user.type(screen.getByLabelText(/Amount/), '120');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(seen).toEqual([
        { name: 'Car repair', kind: 'EXPENSE', accountId: 'a1', amount: 120, billingDay: null, status: 'PENDING', paidOn: null },
      ]),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
