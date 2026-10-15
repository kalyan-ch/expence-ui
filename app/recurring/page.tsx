'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BillDialog, type BillValues } from '../../components/BillDialog';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { MoneyText } from '../../components/MoneyText';
import { PageHeader } from '../../components/PageHeader';
import { ApiError } from '../../lib/api/client';
import type { RecurringItemInput } from '../../lib/api/recurringItems';
import { KIND_LABEL } from '../../lib/format';
import { usePaymentAccounts } from '../../lib/hooks/useAccounts';
import {
  useCreateRecurringItem,
  useDeleteRecurringItem,
  useRecurringItems,
  useUpdateRecurringItem,
} from '../../lib/hooks/useRecurringItems';
import type { RecurringItem } from '../../lib/types';

function toInput(r: RecurringItem, change: Partial<RecurringItemInput> = {}): RecurringItemInput {
  const { name, kind, accountId, defaultAmount, billingDay, sortOrder, active } = r;
  return { name, kind, accountId, defaultAmount, billingDay, sortOrder, active, ...change };
}

/** The template every new month copies. Changes here never touch months already started. */
export default function RecurringItemsPage() {
  const { data: items, isPending, error } = useRecurringItems();
  const accounts = usePaymentAccounts();
  const create = useCreateRecurringItem();
  const update = useUpdateRecurringItem();
  const remove = useDeleteRecurringItem();

  const [dialog, setDialog] = useState<{ item?: RecurringItem } | null>(null);
  const [confirm, setConfirm] = useState<RecurringItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function run(action: Promise<unknown>) {
    setActionError(null);
    try {
      await action;
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Something went wrong');
    }
  }

  /** Swaps sort order with the neighbour, so the sheet's row order is kept. */
  function move(i: number, by: number) {
    const a = items![i];
    const b = items![i + by];
    // Equal orders (all 0 on a fresh setup) would swap to the same values, so use positions.
    run(
      Promise.all([
        update.mutateAsync({ id: a.id, body: toInput(a, { sortOrder: i + by }) }),
        update.mutateAsync({ id: b.id, body: toInput(b, { sortOrder: i }) }),
      ]),
    );
  }

  function submit(v: BillValues) {
    const { amount, ...rest } = v;
    const body = { ...rest, defaultAmount: amount };
    return dialog?.item
      ? update.mutateAsync({ id: dialog.item.id, body: toInput(dialog.item, body) })
      : create.mutateAsync({ ...body, sortOrder: items?.length ?? 0, active: true });
  }

  async function confirmDelete() {
    if (!confirm) return;
    setActionError(null);
    try {
      await remove.mutateAsync(confirm.id);
      setConfirm(null);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Something went wrong');
    }
  }

  return (
    <section>
      <PageHeader
        title="Recurring bills"
        action={
          <button
            onClick={() => setDialog({})}
            className="rounded bg-black px-3 py-2 text-sm text-white dark:bg-white dark:text-black"
          >
            New bill
          </button>
        }
      />
      <p className="mb-4 text-sm opacity-70">
        Every new month copies these. Editing one never changes a month already started.{' '}
        <Link href="/bills" className="underline">
          Back to bills
        </Link>
      </p>

      {(error ?? (!confirm && actionError)) && (
        <div className="mb-4">
          <ErrorBanner error={(error ?? actionError)!} />
        </div>
      )}

      {isPending ? (
        <p className="text-sm opacity-70">Loading…</p>
      ) : !items?.length ? (
        <EmptyState message="No recurring bills yet. Add your rent, cards and paychecks to get started." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-black/10 text-left dark:border-white/15">
              <tr>
                <th className="py-2">Order</th>
                <th className="py-2">Name</th>
                <th className="py-2">Kind</th>
                <th className="py-2">Account</th>
                <th className="py-2 text-right">Default amount</th>
                <th className="py-2 text-right">Day</th>
                <th className="py-2 pl-4">Active</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((r, i) => (
                <tr key={r.id} className={`border-b border-black/5 dark:border-white/10 ${r.active ? '' : 'opacity-50'}`}>
                  <td className="py-2 whitespace-nowrap">
                    <button disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${r.name} up`} className="px-1 disabled:opacity-30">
                      ↑
                    </button>
                    <button
                      disabled={i === items.length - 1}
                      onClick={() => move(i, 1)}
                      aria-label={`Move ${r.name} down`}
                      className="px-1 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </td>
                  <td className="py-2">{r.name}</td>
                  <td className="py-2">{KIND_LABEL[r.kind]}</td>
                  <td className="py-2">{r.accountName}</td>
                  <td className="py-2 text-right">{r.defaultAmount == null ? '—' : <MoneyText value={r.defaultAmount} />}</td>
                  <td className="py-2 text-right tabular-nums">{r.billingDay ?? '—'}</td>
                  <td className="py-2 pl-4">
                    <input
                      type="checkbox"
                      checked={r.active}
                      aria-label={`${r.name} active`}
                      onChange={(e) => run(update.mutateAsync({ id: r.id, body: toInput(r, { active: e.target.checked }) }))}
                    />
                  </td>
                  <td className="py-2 text-right whitespace-nowrap">
                    <button onClick={() => setDialog({ item: r })} aria-label={`Edit ${r.name}`} className="px-2 hover:underline">
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setActionError(null);
                        setConfirm(r);
                      }}
                      aria-label={`Delete ${r.name}`}
                      className="px-2 text-red-700 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialog && (
        <BillDialog
          title={dialog.item ? 'Edit recurring bill' : 'New recurring bill'}
          bill={dialog.item && { ...dialog.item, amount: dialog.item.defaultAmount }}
          accounts={accounts.data ?? []}
          amountField="defaultAmount"
          onClose={() => setDialog(null)}
          onSubmit={submit}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title="Delete recurring bill"
          message={`Delete “${confirm.name}”? A bill already used by a month can only be retired: untick Active instead.`}
          busy={remove.isPending}
          error={actionError}
          onConfirm={confirmDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </section>
  );
}
