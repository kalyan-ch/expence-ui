'use client';

import { useState } from 'react';
import { ExpenditureBars } from '../components/charts/ExpenditureBars';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { MoneyText } from '../components/MoneyText';
import { formatMonthTick, shiftMonth } from '../lib/format';
import { useMonths } from '../lib/hooks/useMonths';

/**
 * A plan is named for the month its bills are paid, and they cover the month before
 * (the October plan is September's spending), so each bar is labelled one month back.
 * ponytail: Rent is the payment month's, but rides in the spending-month bar as the sheet does.
 */
export function ExpenditureTrend({ thisMonth }: { thisMonth: string }) {
  const { data: months, isPending, error } = useMonths();
  const [showTable, setShowTable] = useState(false);

  // Opening a future month in Bills creates it; the axis still stops at this month's plan.
  const data = (months ?? [])
    .filter((m) => m.month <= thisMonth)
    .map((m) => ({ month: shiftMonth(m.month, -1), expenditure: m.expenditure }));
  const last = data.at(-1);
  const prev = data.at(-2);
  const year = data.slice(-12);
  const avg = year.reduce((s, d) => s + d.expenditure, 0) / (year.length || 1);
  const peak = data.reduce((a, d) => (d.expenditure > a.expenditure ? d : a), data[0]);

  return (
    <section aria-labelledby="trend-heading" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 id="trend-heading" className="text-lg font-semibold">
            Expenditure by month
          </h2>
          <p className="text-sm opacity-70">Bills and card payments, not savings.</p>
        </div>
        {data.length > 0 && (
          <button
            onClick={() => setShowTable(!showTable)}
            aria-expanded={showTable}
            className="rounded-full border border-black/15 px-3 py-1 text-sm dark:border-white/20"
          >
            {showTable ? 'Hide table' : 'Show table'}
          </button>
        )}
      </div>

      {error && <ErrorBanner error={error} />}

      {isPending ? (
        <p className="text-sm opacity-70">Loading…</p>
      ) : !last ? (
        <EmptyState message="No months planned yet." />
      ) : (
        <>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                label: `${formatMonthTick(last.month)} expenditure`,
                value: last.expenditure,
                note: prev
                  ? `${last.expenditure < prev.expenditure ? 'Down' : 'Up'} from ${formatMonthTick(prev.month)}`
                  : 'First month',
              },
              { label: `${year.length}-month average`, value: avg, note: `${formatMonthTick(year[0].month)} – ${formatMonthTick(last.month)}` },
              { label: 'Highest month', value: peak.expenditure, note: formatMonthTick(peak.month) },
            ].map((t) => (
              <div key={t.label} role="group" aria-label={t.label} className="rounded-lg border border-black/10 p-4 dark:border-white/15">
                <dt className="text-sm opacity-70">{t.label}</dt>
                <dd className="mt-1 text-xl font-semibold">
                  <MoneyText value={t.value} />
                </dd>
                <dd className="text-xs opacity-60">{t.note}</dd>
              </div>
            ))}
          </dl>

          <ExpenditureBars title="Expenditure by month" data={data} />

          {showTable && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-black/10 text-left dark:border-white/15">
                  <tr>
                    <th className="py-2">Month</th>
                    <th className="py-2 text-right">Expenditure</th>
                    <th className="py-2 text-right">vs previous</th>
                  </tr>
                </thead>
                <tbody>
                  {data
                    .map((d, i) => ({ ...d, delta: i ? d.expenditure - data[i - 1].expenditure : null }))
                    .reverse()
                    .map((d) => (
                      <tr key={d.month} className="border-b border-black/5 dark:border-white/10">
                        <td className="py-2">{formatMonthTick(d.month)}</td>
                        <td className="py-2 text-right">
                          <MoneyText value={d.expenditure} />
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {d.delta == null ? '—' : `${d.delta > 0 ? '+' : '−'}${Math.round(Math.abs(d.delta)).toLocaleString('en-US')}`}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
