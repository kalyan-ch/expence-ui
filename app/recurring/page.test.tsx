import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { accountsFixture, handlers, recurringFixture } from '../../mocks/handlers';
import RecurringItemsPage from './page';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <RecurringItemsPage />
    </QueryClientProvider>,
  );
}

function recordPuts() {
  const seen: { id: string; body: Record<string, unknown> }[] = [];
  server.use(
    http.put('*/api/recurring-items/:id', async ({ params, request }) => {
      seen.push({ id: String(params.id), body: (await request.json()) as Record<string, unknown> });
      return HttpResponse.json(recurringFixture[0]);
    }),
  );
  return seen;
}

describe('RecurringItemsPage', () => {
  it('lists bills in sheet order with amount, account and day', async () => {
    renderPage();

    const rows = await screen.findAllByRole('row');
    expect(rows[1]).toHaveTextContent(/Rent.*Expense.*Chase.*\$2,010\.82.*1/);
    expect(rows[2]).toHaveTextContent(/Car.*DCU/);
  });

  it('unticking Active retires the bill', async () => {
    const seen = recordPuts();
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('checkbox', { name: 'Car active' }));

    await waitFor(() => expect(seen).toHaveLength(1));
    expect(seen[0]).toEqual({ id: 'r2', body: expect.objectContaining({ active: false, defaultAmount: 379.81 }) });
  });

  it('moving a bill down swaps the two sort orders', async () => {
    const seen = recordPuts();
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Move Rent down' }));

    await waitFor(() => expect(seen).toHaveLength(2));
    expect(Object.fromEntries(seen.map((s) => [s.id, s.body.sortOrder]))).toEqual({ r1: 1, r2: 0 });
  });

  it('a new bill posts the default amount under its API name', async () => {
    const seen: unknown[] = [];
    server.use(
      http.post('*/api/recurring-items', async ({ request }) => {
        seen.push(await request.json());
        return HttpResponse.json(recurringFixture[0], { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Rent');

    await user.click(screen.getByRole('button', { name: 'New bill' }));
    await user.type(screen.getByLabelText('Name'), 'Freedom Card');
    await user.selectOptions(screen.getByLabelText('Kind'), 'CARD_PAYMENT');
    await user.type(screen.getByLabelText(/Billing day/), '22');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(seen).toEqual([
        { name: 'Freedom Card', kind: 'CARD_PAYMENT', accountId: 'a1', defaultAmount: null, billingDay: 22, sortOrder: 2, active: true },
      ]),
    );
  });

  it('the account dropdown offers only payment accounts', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Rent');

    await user.click(screen.getByRole('button', { name: 'New bill' }));

    expect(within(screen.getByLabelText('Account')).getAllByRole('option').map((o) => o.textContent)).toEqual(['Checking']);
  });

  it('with no payment accounts, points to Accounts and blocks saving', async () => {
    server.use(http.get('*/api/accounts', () => HttpResponse.json([{ ...accountsFixture[1] }])));
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Rent');

    await user.click(screen.getByRole('button', { name: 'New bill' }));

    expect(screen.getByRole('link', { name: /payment account/ })).toHaveAttribute('href', '/accounts');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('shows the 409 message when a bill used by a month is deleted', async () => {
    server.use(
      http.delete('*/api/recurring-items/:id', () =>
        HttpResponse.json({ message: "'Rent' is used by 1 month; retire it instead" }, { status: 409 }),
      ),
    );
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Delete Rent' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete recurring bill' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await within(dialog).findByText("'Rent' is used by 1 month; retire it instead")).toBeInTheDocument();
  });
});
