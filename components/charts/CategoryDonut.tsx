'use client';

import { Cell, Pie, PieChart, Tooltip } from 'recharts';
import { formatMoney } from '../../lib/format';
import type { CategoryTotal } from '../../lib/types';

const SLOTS = 6;

/**
 * Part-to-whole donut, at most six slices: past that the tail folds into "Other"
 * (never a generated seventh hue). The list beside it is the direct-label and
 * table view, so identity never rests on colour alone.
 */
export function CategoryDonut({ title, data }: { title: string; data: CategoryTotal[] }) {
  const slices =
    data.length <= SLOTS
      ? data.map((d) => ({ name: d.categoryName, total: d.total }))
      : [
          ...data.slice(0, SLOTS - 1).map((d) => ({ name: d.categoryName, total: d.total })),
          { name: 'Other', total: data.slice(SLOTS - 1).reduce((sum, d) => sum + d.total, 0) },
        ];
  const sum = slices.reduce((s, d) => s + d.total, 0);
  const color = (i: number) => `var(--series-${i + 1})`;

  return (
    <figure aria-label={title} className="flex flex-wrap items-center gap-6">
      <PieChart width={200} height={200}>
        <Pie
          data={slices}
          dataKey="total"
          nameKey="name"
          innerRadius={60}
          outerRadius={95}
          stroke="var(--background)"
          strokeWidth={2}
          isAnimationActive={false}
        >
          {slices.map((s, i) => (
            <Cell key={s.name} fill={color(i)} role="img" aria-label={`${s.name}: ${formatMoney(s.total)}`} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatMoney(Number(value))}
          contentStyle={{ background: 'var(--background)', borderColor: 'var(--chart-grid)' }}
          itemStyle={{ color: 'var(--foreground)' }}
        />
      </PieChart>
      <ul className="space-y-1 text-sm">
        {slices.map((s, i) => (
          <li key={s.name} className="flex items-center gap-2">
            <span aria-hidden className="size-2.5 rounded-full" style={{ background: color(i) }} />
            <span>{s.name}</span>
            <span className="ml-auto pl-4 tabular-nums">{formatMoney(s.total)}</span>
            <span className="w-14 text-right tabular-nums opacity-70">
              {((s.total / sum) * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
