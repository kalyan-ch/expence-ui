import { formatMoney } from '../lib/format';

/** Money in tabular figures; negatives in parentheses and red. */
export function MoneyText({ value }: { value: number }) {
  return (
    <span className={`tabular-nums ${value < 0 ? 'text-red-700 dark:text-red-400' : ''}`}>
      {formatMoney(value)}
    </span>
  );
}
