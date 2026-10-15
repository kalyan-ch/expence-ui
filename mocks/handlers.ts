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
  { id: 'a1', name: 'Checking', type: 'CHECKING' as const, openingBalance: 100, balance: 58, paymentAccount: true },
  { id: 'a3', name: 'Visa', type: 'CREDIT_CARD' as const, openingBalance: 0, balance: 0, paymentAccount: false },
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

const chase = { accountId: 'a1', accountName: 'Chase' };
const dcu = { accountId: 'a2', accountName: 'DCU' };
const row = { recurringItemId: 'r', sortOrder: 0, status: 'PENDING' as const, paidOn: null };

/** The October 2026 sheet: three bills, one blank card, one paycheck. */
export const monthFixture = {
  month: '2026-10',
  items: [
    { ...row, ...chase, id: 'i1', name: 'Rent', kind: 'EXPENSE' as const, amount: 2010.82, billingDay: 1 },
    { ...row, ...dcu, id: 'i2', name: 'Car', kind: 'EXPENSE' as const, amount: 379.81, billingDay: 10 },
    { ...row, ...dcu, id: 'i3', name: 'Amex Card', kind: 'CARD_PAYMENT' as const, amount: 433.14, billingDay: 27 },
    { ...row, ...dcu, id: 'i4', name: 'Discover Card', kind: 'CARD_PAYMENT' as const, amount: null, billingDay: 7 },
    { ...row, ...chase, id: 'i5', name: 'Salary 1', kind: 'INCOME' as const, amount: 1985.72, billingDay: null },
  ],
  accounts: [
    { ...chase, startingBalance: 2915.91, income: 1985.72, expenses: 2010.82, remaining: 2890.81 },
    { ...dcu, startingBalance: null, income: 0, expenses: 812.95, remaining: -812.95 },
  ],
  total: 2823.77,
  expenditure: 2823.77,
  unpaidCount: 3,
  unpaidTotal: 2823.77,
};

export const recurringFixture = [
  { ...chase, id: 'r1', name: 'Rent', kind: 'EXPENSE' as const, defaultAmount: 2010.82, billingDay: 1, sortOrder: 0, active: true },
  { ...dcu, id: 'r2', name: 'Car', kind: 'EXPENSE' as const, defaultAmount: 379.81, billingDay: 10, sortOrder: 1, active: true },
];

export const monthsFixture = [
  { month: '2026-09', total: 5800, expenditure: 5800 },
  { month: '2026-10', total: 3633.28, expenditure: 3633.28 },
  { month: '2026-11', total: 777, expenditure: 777 },
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
  http.get('*/api/months', () => HttpResponse.json(monthsFixture)),
  http.get('*/api/months/:month', ({ params }) => HttpResponse.json({ ...monthFixture, month: params.month })),
  http.get('*/api/recurring-items', () => HttpResponse.json(recurringFixture)),
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
