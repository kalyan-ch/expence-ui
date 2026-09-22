import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { categoriesFixture, handlers } from '../../mocks/handlers';
import CategoriesPage from './page';

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <CategoriesPage />
    </QueryClientProvider>,
  );
}

/** Serves a mutable list so a refetch after a mutation sees the write. */
function serveList(list: { id: string; name: string; kind: string; isDefault: boolean }[]) {
  server.use(http.get('*/api/categories', () => HttpResponse.json(list)));
  return list;
}

describe('CategoriesPage', () => {
  it('lists income and expense categories separately', async () => {
    renderPage();

    const income = await screen.findByRole('region', { name: 'Income' });
    const expense = screen.getByRole('region', { name: 'Expense' });

    expect(within(income).getByText('Salary')).toBeInTheDocument();
    expect(within(income).queryByText('Groceries')).not.toBeInTheDocument();
    expect(within(expense).getByText('Groceries')).toBeInTheDocument();
    expect(within(expense).getByText('Pets')).toBeInTheDocument();
  });

  it('marks defaults and disables their delete control', async () => {
    renderPage();
    await screen.findByText('Groceries');

    expect(screen.getByRole('button', { name: 'Delete Groceries' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete Pets' })).toBeEnabled();
    // The default marker sits next to the name, not on the whole row.
    expect(screen.getAllByText('Default')).toHaveLength(2);
  });

  it('adding a category posts with the selected kind', async () => {
    let posted: unknown;
    const list = serveList([...categoriesFixture]);
    server.use(
      http.post('*/api/categories', async ({ request }) => {
        posted = await request.json();
        const created = { id: 'c4', name: 'Bonus', kind: 'INCOME' as const, isDefault: false };
        list.push(created);
        return HttpResponse.json(created, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Groceries');

    await user.click(screen.getByRole('button', { name: 'New category' }));
    await user.type(screen.getByLabelText('Name'), 'Bonus');
    await user.selectOptions(screen.getByLabelText('Kind'), 'INCOME');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Bonus')).toBeInTheDocument();
    expect(posted).toEqual({ name: 'Bonus', kind: 'INCOME' });
  });

  it('renaming posts only the name', async () => {
    let put: unknown;
    const list = serveList(categoriesFixture.map((c) => ({ ...c })));
    server.use(
      http.put('*/api/categories/:id', async ({ request }) => {
        put = await request.json();
        const renamed = { id: 'c3', name: 'Pet care', kind: 'EXPENSE' as const, isDefault: false };
        list[2] = renamed;
        return HttpResponse.json(renamed);
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Pets');

    await user.click(screen.getByRole('button', { name: 'Rename Pets' }));
    const dialog = screen.getByRole('dialog', { name: 'Rename category' });
    const name = within(dialog).getByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'Pet care');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Pet care')).toBeInTheDocument();
    expect(put).toEqual({ name: 'Pet care' });
    // Renaming never offers a kind control — kind is immutable after creation.
    expect(screen.queryByLabelText('Kind')).not.toBeInTheDocument();
  });

  it('renders a 409 from delete inside the confirm dialog', async () => {
    server.use(
      http.delete('*/api/categories/:id', () =>
        HttpResponse.json(
          { message: "Category 'Pets' is used by 1 transaction and cannot be deleted" },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Pets');

    await user.click(screen.getByRole('button', { name: 'Delete Pets' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete category' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(
      await within(dialog).findByText("Category 'Pets' is used by 1 transaction and cannot be deleted"),
    ).toBeInTheDocument();
  });
});
