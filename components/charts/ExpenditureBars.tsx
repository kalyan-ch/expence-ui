'use client';

import { Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatMoney, formatMoneyCompact, formatMonthTick } from '../../lib/format';

export interface ExpenditurePoint {
  /** `YYYY-MM`: the spending month the bar is labelled with. */
  month: string;
  expenditure: number;
}

/**
 * One bar per month, single series (so no legend: the title names it). Dashed line is
 * the average of the last 12 bars; only the latest and the highest bar carry a label.
 */
export function ExpenditureBars({ title, data }: { title: string; data: ExpenditurePoint[] }) {
  const year = data.slice(-12);
  const avg = year.reduce((s, d) => s + d.expenditure, 0) / year.length;
  const peak = data.reduce((a, d) => (d.expenditure > a.expenditure ? d : a), data[0]);
  const labelled = new Set([peak.month, data.at(-1)!.month]);

  return (
    <figure aria-label={title}>
      {/* initialDimension is the pre-measure size; also what jsdom (no ResizeObserver) renders at. */}
      <ResponsiveContainer width="100%" height={300} initialDimension={{ width: 640, height: 300 }}>
        <BarChart data={data} margin={{ top: 20, right: 36, bottom: 0, left: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonthTick}
            tick={{ fill: 'var(--chart-muted)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--chart-muted)' }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatMoneyCompact}
            tick={{ fill: 'var(--chart-muted)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            cursor={{ fill: 'var(--chart-grid)', opacity: 0.6 }}
            labelFormatter={(m) => formatMonthTick(String(m))}
            formatter={(value) => [formatMoney(Number(value)), 'Expenditure']}
            contentStyle={{ background: 'var(--background)', borderColor: 'var(--chart-grid)' }}
            itemStyle={{ color: 'var(--foreground)' }}
          />
          <Bar dataKey="expenditure" name="Expenditure" fill="var(--series-1)" maxBarSize={40} radius={[4, 4, 0, 0]} isAnimationActive={false}>
            <LabelList
              dataKey="expenditure"
              position="top"
              content={({ x, y, width, value, index }) =>
                index != null && labelled.has(data[index].month) ? (
                  <text
                    x={Number(x) + Number(width) / 2}
                    y={Number(y) - 6}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={600}
                    fill="var(--foreground)"
                  >
                    {Math.round(Number(value)).toLocaleString('en-US')}
                  </text>
                ) : null
              }
            />
          </Bar>
          <ReferenceLine
            y={avg}
            stroke="var(--foreground)"
            strokeOpacity={0.55}
            strokeDasharray="4 4"
            label={{ value: 'avg', position: 'right', fill: 'var(--chart-muted)', fontSize: 12 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
