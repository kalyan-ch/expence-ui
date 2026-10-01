'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatMoney, formatMonth } from '../../lib/format';
import type { MonthlyPoint } from '../../lib/types';

const SERIES = [
  { key: 'income', label: 'Income', color: 'var(--series-1)' },
  { key: 'expenses', label: 'Expenses', color: 'var(--series-2)' },
] as const;

const compactMoney = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
});

/** Grouped monthly bars on one money axis. The sr-only table is the non-visual view. */
export function IncomeExpenseBars({ title, data }: { title: string; data: MonthlyPoint[] }) {
  return (
    <figure aria-label={title}>
      <ul className="mb-2 flex gap-4 text-sm">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span aria-hidden className="size-2.5 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </li>
        ))}
      </ul>
      {/* initialDimension is the pre-measure size; also what jsdom (no ResizeObserver) renders at. */}
      <ResponsiveContainer width="100%" height={280} initialDimension={{ width: 640, height: 280 }}>
        <BarChart data={data} barGap={2} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            tick={{ fill: 'var(--chart-muted)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--chart-grid)' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => compactMoney.format(v)}
            tick={{ fill: 'var(--chart-muted)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            cursor={{ fill: 'var(--chart-grid)', opacity: 0.4 }}
            labelFormatter={(m) => formatMonth(String(m))}
            formatter={(value) => formatMoney(Number(value))}
            contentStyle={{ background: 'var(--background)', borderColor: 'var(--chart-grid)' }}
            itemStyle={{ color: 'var(--foreground)' }}
          />
          {SERIES.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={s.color}
              maxBarSize={24}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>Income</th>
            <th>Expenses</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <th>{formatMonth(d.month)}</th>
              <td>{formatMoney(d.income)}</td>
              <td>{formatMoney(d.expenses)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
