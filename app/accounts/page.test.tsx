import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { handlers } from '../../mocks/handlers';
import AccountsPage from './page';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AccountsPage />
    </QueryClientProvider>,
  );
}

describe('AccountsPage', () => {
  it('renders name, type, opening balance and current balance', async () => {
    renderPage();

    const row = await screen.findByRole('row', { name: /Checking/ });
    expect(within(row).getByText('CHECKING')).toBeInTheDocument();
    expect(within(row).getByText('$100.00')).toBeInTheDocument();
    expect(within(row).getByText('$58.00')).toBeInTheDocument();
  });

  it('creating an account posts and the row appears', async () => {
    const created = { id: 'a2', name: 'Savings', type: 'SAVINGS', openingBalance: 250, balance: 250 };
    let posted = false;
    server.use(
      http.post('*/api/accounts', async () => {
        posted = true;
        return HttpResponse.json(created, { status: 201 });
      }),
      http.get('*/api/accounts', () =>
        HttpResponse.json(
          posted
            ? [{ id: 'a1', name: 'Checking', type: 'CHECKING', openingBalance: 100, balance: 58 }, created]
            : [{ id: 'a1', name: 'Checking', type: 'CHECKING', openingBalance: 100, balance: 58 }],
        ),
      ),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('row', { name: /Checking/ });

    await user.click(screen.getByRole('button', { name: 'New account' }));
    await user.type(screen.getByLabelText('Name'), 'Savings');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('row', { name: /Savings/ })).toBeInTheDocument();
  });

  it('renders a 400 field error under the name input', async () => {
    server.use(
      http.post('*/api/accounts', () =>
        HttpResponse.json({ message: 'Validation failed', errors: { name: 'must not be blank' } }, { status: 400 }),
      ),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('row', { name: /Checking/ });

    await user.click(screen.getByRole('button', { name: 'New account' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('must not be blank')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders the 409 server message in the delete confirm dialog', async () => {
    server.use(
      http.delete('*/api/accounts/:id', () =>
        HttpResponse.json(
          { message: "Account 'Checking' has 1 transaction and cannot be deleted" },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('row', { name: /Checking/ });

    await user.click(screen.getByRole('button', { name: 'Delete Checking' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete account' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(
      await within(dialog).findByText("Account 'Checking' has 1 transaction and cannot be deleted"),
    ).toBeInTheDocument();
    // Dialog stays open so the message is readable.
    expect(screen.getByRole('dialog', { name: 'Delete account' })).toBeInTheDocument();
  });

  it('shows an empty state when there are no accounts', async () => {
    server.use(http.get('*/api/accounts', () => HttpResponse.json([])));
    renderPage();

    expect(await screen.findByText(/No accounts yet/)).toBeInTheDocument();
  });
});
