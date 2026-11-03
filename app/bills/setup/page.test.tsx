import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { handlers, monthFixture } from '../../../mocks/handlers';
import BillsPage from '../page';
import BillSetupPage from './page';

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const server = setupServer(...handlers);

beforeAll(() => server.listen());
beforeEach(() => vi.useFakeTimers({ toFake: ['Date'], now: new Date(2026, 9, 13) }));
afterEach(() => {
  server.resetHandlers();
  vi.useRealTimers();
  push.mockReset();
});
afterAll(() => server.close());

function renderPage(page = <BillSetupPage />) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{page}</QueryClientProvider>);
}

/** Records each request body sent with `method` to `path` and answers with `reply`. */
function record(method: 'post' | 'put', path: string, reply: object = {}) {
  const seen: { url: string; body: unknown }[] = [];
  server.use(
    http[method](path, async ({ request }) => {
      seen.push({ url: request.url, body: await request.json() });
      return HttpResponse.json(reply);
    }),
  );
  return seen;
}

describe('BillSetupPage', () => {
  it('adds a new account as a checking payment account', async () => {
    const seen = record('post', '*/api/accounts');
    const user = userEvent.setup();
    renderPage();

    await user.type(await screen.findByRole('textbox', { name: 'New account name' }), 'DCU');
    await user.click(screen.getByRole('button', { name: 'Add account' }));

    await waitFor(() => expect(seen).toHaveLength(1));
    expect(seen[0].body).toEqual({ name: 'DCU', type: 'CHECKING', openingBalance: 0, paymentAccount: true });
  });

  it('ticking an existing account sends the whole account as a payment account', async () => {
    const seen = record('put', '*/api/accounts/:id');
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('checkbox', { name: /Visa/ }));

    await waitFor(() => expect(seen).toHaveLength(1));
    expect(seen[0].url).toMatch(/\/accounts\/a3$/);
    expect(seen[0].body).toEqual({ name: 'Visa', type: 'CREDIT_CARD', openingBalance: 0, paymentAccount: true });
  });

  it('adds a recurring bill at the end of the list, blank amount as null', async () => {
    const seen = record('post', '*/api/recurring-items');
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Next' }));
    await user.type(await screen.findByRole('textbox', { name: 'Name' }), 'Amex');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Kind' }), 'CARD_PAYMENT');
    await user.type(screen.getByRole('spinbutton', { name: 'Billing day' }), '27');
    await user.click(screen.getByRole('button', { name: 'Add bill' }));

    await waitFor(() => expect(seen).toHaveLength(1));
    expect(seen[0].body).toEqual({
      name: 'Amex',
      kind: 'CARD_PAYMENT',
      accountId: 'a1',
      defaultAmount: null,
      billingDay: 27,
      inExpenditure: true,
      sortOrder: 2,
      active: true,
    });
  });

  it('a biweekly paycheck sends its anchor payday instead of fixed days', async () => {
    const seen = record('post', '*/api/recurring-items');
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Next' }));
    await user.click(await screen.findByRole('button', { name: 'Next' }));
    await user.type(await screen.findByRole('textbox', { name: 'Name' }), 'Salary Chase');
    await user.type(screen.getByRole('spinbutton', { name: 'Amount' }), '1985.72');
    await user.selectOptions(screen.getByRole('combobox', { name: 'How often' }), 'BIWEEKLY');
    fireEvent.change(screen.getByLabelText('A recent payday'), { target: { value: '2026-10-02' } });
    await user.click(screen.getByRole('button', { name: 'Add paycheck' }));

    await waitFor(() => expect(seen).toHaveLength(1));
    expect(seen[0].body).toEqual({
      name: 'Salary Chase',
      kind: 'INCOME',
      accountId: 'a1',
      defaultAmount: 1985.72,
      frequency: 'BIWEEKLY',
      billingDay: null,
      secondDay: null,
      anchorDate: '2026-10-02',
      sortOrder: 2,
      active: true,
    });
  });

  it('finishing saves the starting balances and opens Bills', async () => {
    const empty = { ...monthFixture, accounts: [] };
    server.use(http.get('*/api/months/:month', () => HttpResponse.json(empty)));
    const balances = record('put', '*/api/months/:month/balances/:accountId', empty);
    const user = userEvent.setup();
    renderPage();

    for (let i = 0; i < 3; i++) await user.click(await screen.findByRole('button', { name: 'Next' }));
    await user.type(await screen.findByRole('spinbutton', { name: 'Checking starting balance' }), '2915.91');
    await user.click(screen.getByRole('button', { name: 'Finish' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/bills'));
    expect(balances).toEqual([{ url: expect.stringMatching(/\/balances\/a1$/), body: { startingBalance: 2915.91 } }]);
  });
});

describe('BillsPage before setup', () => {
  it('points at setup and does not open the month', async () => {
    const opened = vi.fn();
    server.use(
      http.get('*/api/recurring-items', () => HttpResponse.json([])),
      http.get('*/api/months/:month', () => {
        opened();
        return HttpResponse.json(monthFixture);
      }),
    );
    renderPage(<BillsPage />);

    expect(await screen.findByRole('link', { name: /Set up accounts, bills and balances/ })).toHaveAttribute('href', '/bills/setup');
    expect(opened).not.toHaveBeenCalled();
  });
});
