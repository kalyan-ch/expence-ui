import { KIND_LABEL } from '../lib/format';
import type { ItemKind } from '../lib/types';

/** Order the bill groups appear in, matching the sheet: expenses, card payments, savings, then pay. */
export const KIND_ORDER: ItemKind[] = ['EXPENSE', 'CARD_PAYMENT', 'SAVINGS', 'INCOME'];

/** One colour per kind: `bar` marks a row's left edge, `pill` is the badge. Full class names so Tailwind keeps them. */
export const KIND_TONE: Record<ItemKind, { bar: string; pill: string }> = {
  EXPENSE: { bar: 'border-l-amber-500', pill: 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300' },
  CARD_PAYMENT: { bar: 'border-l-sky-500', pill: 'bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-300' },
  SAVINGS: { bar: 'border-l-emerald-500', pill: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300' },
  INCOME: { bar: 'border-l-violet-500', pill: 'bg-violet-100 text-violet-900 dark:bg-violet-500/15 dark:text-violet-300' },
};

/** A pill in the kind's colour; shows the kind's name unless given other text. */
export function KindBadge({ kind, children }: { kind: ItemKind; children?: React.ReactNode }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${KIND_TONE[kind].pill}`}>
      {children ?? KIND_LABEL[kind]}
    </span>
  );
}
