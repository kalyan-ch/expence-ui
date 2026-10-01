'use client';

import { useState } from 'react';
import { CategoryDonut } from '../components/charts/CategoryDonut';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { FormField } from '../components/FormField';
import { MoneyText } from '../components/MoneyText';
import { PageHeader } from '../components/PageHeader';
import { formatDate, isoDate } from '../lib/format';
import { useByCategory, useSummary } from '../lib/hooks/useReports';
import { useToday } from '../lib/hooks/useToday';
import { useTransactions } from '../lib/hooks/useTransactions';

export default function DashboardPage() {
  const today = useToday();
  return today ? <Dashboard thisMonth={today.slice(0, 7)} /> : <PageHeader title="Dashboard" />;
}

function Dashboard({ thisMonth }: { thisMonth: string }) {
  const [month, setMonth] = useState(thisMonth);
  const [year, mon] = month.split('-').map(Number);
  const from = `${month}-01`;
  const to = isoDate(new Date(year, mon, 0)); // day 0 of next month = last day of this one

  const summary = useSummary(month);
  const spend = useByCategory(from, to, 'EXPENSE');
  const recent = useTransactions({ page: 0, size: 10 });
  const error = summary.error ?? spend.error ?? recent.error;

  const tiles = [
    { label: 'Total balance', value: summary.data?.totalBalance },
    { label: 'Income', value: summary.data?.income },
    { label: 'Expenses', value: summary.data?.expenses },
    { label: 'Savings', value: summary.data?.savings },
  ];

  return (
    <section className="space-y-8">
      <PageHeader
        title="Dashboard"
        action={
          <FormField id="month" label="Month">
            {/* Cleared input sends ''; keep the last valid month instead. */}
            <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
          </FormField>
        }
      />

      {error && <ErrorBanner error={error} />}

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {tiles.map((t) => (
          <div
            key={t.label}
            role="group"
            aria-label={t.label}
            className="rounded-lg border border-black/10 p-4 dark:border-white/15"
          >
            <dt className="text-sm opacity-70">{t.label}</dt>
            <dd className="mt-1 text-xl font-semibold">
              {t.value === undefined ? '…' : <MoneyText value={t.value} />}
            </dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="spend-heading">
        <h2 id="spend-heading" className="mb-3 text-lg font-semibold">
          Spending by category
        </h2>
        {spend.isPending ? (
          <p className="text-sm opacity-70">Loading…</p>
        ) : !spend.data?.length ? (
          <EmptyState message="No spending this month." />
        ) : (
          <CategoryDonut title="Spending by category" data={spend.data} />
        )}
      </section>

      <section aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="mb-3 text-lg font-semibold">
          Recent transactions
        </h2>
        {recent.isPending ? (
          <p className="text-sm opacity-70">Loading…</p>
        ) : !recent.data?.content.length ? (
          <EmptyState message="No transactions yet." />
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-black/10 text-left dark:border-white/15">
              <tr>
                <th className="py-2">Date</th>
                <th className="py-2">Description</th>
                <th className="py-2">Account</th>
                <th className="py-2">Category</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recent.data.content.map((t) => (
                <tr key={t.id} className="border-b border-black/5 dark:border-white/10">
                  <td className="py-2">{formatDate(t.occurredOn)}</td>
                  <td className="py-2">{t.description}</td>
                  <td className="py-2">{t.accountName}</td>
                  <td className="py-2">{t.categoryName ?? (t.transferGroupId ? 'Transfer' : '—')}</td>
                  <td className="py-2 text-right">
                    <MoneyText value={t.amount} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </section>
  );
}
