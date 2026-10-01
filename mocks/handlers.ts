import { http, HttpResponse } from 'msw';

export const txFixture = {
  id: 't1',
  accountId: 'a1',
  accountName: 'Checking',
  categoryId: 'c1',
  categoryName: 'Groceries',
  amount: -42,
  type: 'EXPENSE' as const,
  occurredOn: '2026-09-01',
  description: 'Test',
  transferGroupId: null,
};

export const accountsFixture = [
  { id: 'a1', name: 'Checking', type: 'CHECKING' as const, openingBalance: 100, balance: 58 },
];

export const categoriesFixture = [
  { id: 'c1', name: 'Groceries', kind: 'EXPENSE' as const, isDefault: true },
  { id: 'c2', name: 'Salary', kind: 'INCOME' as const, isDefault: true },
  { id: 'c3', name: 'Pets', kind: 'EXPENSE' as const, isDefault: false },
];

export const summaryFixture = {
  month: '2026-09',
  totalBalance: 58,
  income: 100,
  expenses: 42,
  savings: 58,
};

export const monthlyFixture = [
  { month: '2026-08', income: 0, expenses: 0 },
  { month: '2026-09', income: 100, expenses: 42 },
];

export const byCategoryFixture = [
  { categoryId: 'c1', categoryName: 'Groceries', total: 30 },
  { categoryId: 'c3', categoryName: 'Pets', total: 12 },
];

/** Mirrors the API: from/to (and kind on by-category) are required, else 400. */
function missingParams(request: Request, names: string[]) {
  const params = new URL(request.url).searchParams;
  const missing = names.filter((n) => !params.get(n));
  return missing.length
    ? HttpResponse.json({ message: `Missing parameter: ${missing.join(', ')}` }, { status: 400 })
    : null;
}

export const handlers = [
  http.get('*/api/transactions', () =>
    HttpResponse.json({
      content: [txFixture],
      page: 0,
      size: 50,
      totalElements: 1,
      totalPages: 1,
    }),
  ),
  http.get('*/api/accounts', () => HttpResponse.json(accountsFixture)),
  http.get('*/api/categories', ({ request }) => {
    const kind = new URL(request.url).searchParams.get('kind');
    return HttpResponse.json(kind ? categoriesFixture.filter((c) => c.kind === kind) : categoriesFixture);
  }),
  http.get('*/api/reports/summary', () => HttpResponse.json(summaryFixture)),
  http.get('*/api/reports/monthly', ({ request }) =>
    missingParams(request, ['from', 'to']) ?? HttpResponse.json(monthlyFixture),
  ),
  http.get('*/api/reports/by-category', ({ request }) =>
    missingParams(request, ['from', 'to', 'kind']) ?? HttpResponse.json(byCategoryFixture),
  ),
  http.post('*/api/transactions', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...txFixture, id: 't2', ...body }, { status: 201 });
  }),
];
