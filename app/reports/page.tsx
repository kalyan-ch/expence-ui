'use client';

import { useState } from 'react';
import { IncomeExpenseBars } from '../../components/charts/IncomeExpenseBars';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { FormField } from '../../components/FormField';
import { MoneyText } from '../../components/MoneyText';
import { PageHeader } from '../../components/PageHeader';
import { isoDate } from '../../lib/format';
import { useByCategory, useMonthly } from '../../lib/hooks/useReports';
import { useToday } from '../../lib/hooks/useToday';
import type { CategoryKind } from '../../lib/types';

export default function ReportsPage() {
  const today = useToday();
  return today ? <Reports today={today} /> : <PageHeader title="Reports" />;
}

function Reports({ today }: { today: string }) {
  const [year, month] = today.split('-').map(Number);
  // Default range: the first of the month five months back through today (six months).
  const [from, setFrom] = useState(() => isoDate(new Date(year, month - 6, 1)));
  const [to, setTo] = useState(today);
  const [kind, setKind] = useState<CategoryKind>('EXPENSE');

  const monthly = useMonthly(from, to);
  const categories = useByCategory(from, to, kind);
  const error = monthly.error ?? categories.error;
  const hasActivity = monthly.data?.some((m) => m.income || m.expenses);
  const total = categories.data?.reduce((sum, c) => sum + c.total, 0) ?? 0;

  return (
    <section className="space-y-8">
      <PageHeader title="Reports" />

      <div className="flex flex-wrap gap-4">
        {/* Inputs refuse '' so a cleared field never sends a request the API rejects. */}
        <FormField id="from" label="From">
          <input type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} />
        </FormField>
        <FormField id="to" label="To">
          <input type="date" value={to} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} />
        </FormField>
      </div>

      {error && <ErrorBanner error={error} />}

      <section aria-labelledby="monthly-heading">
        <h2 id="monthly-heading" className="mb-3 text-lg font-semibold">
          Income vs expenses
        </h2>
        {monthly.isPending ? (
          <p className="text-sm opacity-70">Loading…</p>
        ) : !hasActivity ? (
          <EmptyState message="No income or expenses in this range." />
        ) : (
          <IncomeExpenseBars title="Income and expenses by month" data={monthly.data ?? []} />
        )}
      </section>

      <section aria-labelledby="categories-heading">
        <div className="mb-3 flex items-end justify-between gap-4">
          <h2 id="categories-heading" className="text-lg font-semibold">
            Category totals
          </h2>
          <FormField id="kind" label="Kind">
            <select value={kind} onChange={(e) => setKind(e.target.value as CategoryKind)}>
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
          </FormField>
        </div>
        {categories.isPending ? (
          <p className="text-sm opacity-70">Loading…</p>
        ) : !categories.data?.length ? (
          <EmptyState message="No categorised transactions in this range." />
        ) : (
          <table className="w-full text-sm">
            <caption className="mb-2 text-left text-xs opacity-70">
              Share of categorised {kind === 'EXPENSE' ? 'expenses' : 'income'}; uncategorised
              transactions are excluded.
            </caption>
            <thead className="border-b border-black/10 text-left dark:border-white/15">
              <tr>
                <th className="py-2">Category</th>
                <th className="py-2 text-right">Total</th>
                <th className="py-2 text-right">Share</th>
              </tr>
            </thead>
            <tbody>
              {categories.data.map((c) => (
                <tr key={c.categoryId} className="border-b border-black/5 dark:border-white/10">
                  <td className="py-2">{c.categoryName}</td>
                  <td className="py-2 text-right">
                    <MoneyText value={c.total} />
                  </td>
                  <td className="py-2 text-right tabular-nums">{((c.total / total) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </section>
  );
}
