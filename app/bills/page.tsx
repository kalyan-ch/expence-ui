'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BillDialog, type BillValues } from '../../components/BillDialog';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { InlineAmount } from '../../components/InlineAmount';
import { KIND_ORDER, KIND_TONE, KindBadge } from '../../components/KindBadge';
import { MoneyText } from '../../components/MoneyText';
import { ApiError } from '../../lib/api/client';
import type { MonthItemInput } from '../../lib/api/months';
import { formatMonth, formatShortDate, isoDate, shiftMonth } from '../../lib/format';
import { usePaymentAccounts } from '../../lib/hooks/useAccounts';
import { useRecurringItems } from '../../lib/hooks/useRecurringItems';
import {
  useAddMonthItem,
  useDeleteMonthItem,
  useMonth,
  useSetMonthBalance,
  useUpdateMonthItem,
} from '../../lib/hooks/useMonths';
import { useToday } from '../../lib/hooks/useToday';
import type { Account, Month, MonthItem } from '../../lib/types';

/**
 * Opening a month copies the recurring bills into it once, so the month is not fetched
 * until there are accounts and bills to copy; until then this points at the setup flow.
 */
export default function BillsPage() {
  const today = useToday();
  const accounts = usePaymentAccounts();
  const recurring = useRecurringItems();
  const title = <h1 className="text-2xl font-semibold">Bills</h1>;

  if (!today || accounts.isPending || recurring.isPending) return title;
  const error = accounts.error ?? recurring.error;
  if (error) return <section className="space-y-6">{title}<ErrorBanner error={error} /></section>;
  if (!accounts.data?.length || !recurring.data?.some((r) => r.active))
    return (
      <section className="space-y-6">
        {title}
        <EmptyState
          message="Your bills aren't set up yet. "
          action={
            <Link href="/bills/setup" className="underline">
              Set up accounts, bills and balances
            </Link>
          }
        />
      </section>
    );
  return <Bills today={today} />;
}

/** Due date in the plan month; a day past a short month's end falls on its last day. */
function dueDate(month: string, day: number): string {
  const [year, mon] = month.split('-').map(Number);
  return isoDate(new Date(year, mon - 1, Math.min(day, new Date(year, mon, 0).getDate())));
}

const isPaid = (b: MonthItem) => b.status === 'PAID';
const isOverdue = (b: MonthItem, month: string, today: string) =>
  !isPaid(b) && b.amount != null && b.billingDay != null && dueDate(month, b.billingDay) < today;

function statusText(b: MonthItem, month: string, today: string) {
  if (isPaid(b)) return b.paidOn ? `Paid ${formatShortDate(b.paidOn)}` : 'Paid';
  if (b.amount == null) return b.kind === 'CARD_PAYMENT' ? 'Set amount' : 'Nothing due';
  if (b.billingDay == null) return 'No due date';
  const due = dueDate(month, b.billingDay);
  if (due < today) return `Overdue since ${formatShortDate(due)}`;
  return due === today ? 'Due today' : `Due ${formatShortDate(due)}`;
}

function toInput(b: MonthItem, change: Partial<MonthItemInput> = {}): MonthItemInput {
  const { name, kind, accountId, amount, billingDay, status, paidOn, inExpenditure } = b;
  return { name, kind, accountId, amount, billingDay, status, paidOn, inExpenditure, ...change };
}

function Bills({ today }: { today: string }) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const { data, isPending, error } = useMonth(month);
  const accounts = usePaymentAccounts();
  const add = useAddMonthItem(month);
  const update = useUpdateMonthItem(month);
  const remove = useDeleteMonthItem(month);
  const setBalance = useSetMonthBalance(month);

  const [adding, setAdding] = useState(false);
  const [confirm, setConfirm] = useState<MonthItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function run(action: Promise<unknown>) {
    setActionError(null);
    try {
      await action;
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Something went wrong');
    }
  }

  function askRemove(b: MonthItem) {
    setActionError(null);
    setConfirm(b);
  }

  const edit = (b: MonthItem, change: Partial<MonthItemInput>) =>
    update.mutateAsync({ id: b.id, body: toInput(b, change) });

  const bills = data?.items.filter((b) => b.kind !== 'INCOME') ?? [];
  const pay = data?.items.filter((b) => b.kind === 'INCOME') ?? [];
  const overdue = bills.filter((b) => isOverdue(b, month, today));

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month" className="rounded px-2 py-1 text-xl hover:bg-black/5">
            ‹
          </button>
          <h1 className="min-w-36 text-center text-2xl font-semibold">{formatMonth(month)}</h1>
          <button onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month" className="rounded px-2 py-1 text-xl hover:bg-black/5">
            ›
          </button>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/recurring" className="opacity-70 hover:underline">
            Edit recurring bills
          </Link>
          <button
            onClick={() => setAdding(true)}
            className="rounded bg-black px-3 py-2 text-white dark:bg-white dark:text-black"
          >
            Add one-off bill
          </button>
        </div>
      </div>

      {(error ?? actionError) && <ErrorBanner error={(error ?? actionError)!} />}

      {isPending ? (
        <p className="text-sm opacity-70">Loading…</p>
      ) : !data ? null : !data.items.length ? (
        <EmptyState
          message="No bills in this month. "
          action={
            <Link href="/recurring" className="underline">
              Set up recurring bills
            </Link>
          }
        />
      ) : (
        <>
          <AccountCards data={data} onBalance={(accountId, v) => setBalance.mutateAsync({ accountId, startingBalance: v })} />

          <p role="status" className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <strong className="tabular-nums">
              {data.unpaidCount} {data.unpaidCount === 1 ? 'bill' : 'bills'} still due · <MoneyText value={data.unpaidTotal} />
            </strong>
            {overdue.length > 0 && <span className="text-red-700 dark:text-red-400">⚠ {overdue.length} overdue</span>}
          </p>

          <BillTable
            title="Bills"
            rows={bills}
            month={month}
            today={today}
            accounts={accounts.data ?? []}
            paidLabel="paid"
            onToggle={(b, paid) => run(edit(b, { status: paid ? 'PAID' : 'PENDING', paidOn: paid ? today : null }))}
            onAccount={(b, accountId) => run(edit(b, { accountId }))}
            onExpenditure={(b, inExpenditure) => run(edit(b, { inExpenditure }))}
            onDay={(b, billingDay) => run(edit(b, { billingDay }))}
            onAmount={(b, amount) => edit(b, amount == null ? { amount, status: 'PENDING', paidOn: null } : { amount })}
            onDelete={askRemove}
          />

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Total', value: data.total, note: 'all bills' },
              { label: 'Expenditure', value: data.expenditure, note: 'bills ticked In expenditure' },
              { label: 'Paid', value: data.total - data.unpaidTotal, note: `${bills.filter(isPaid).length} bills` },
              { label: 'Still due', value: data.unpaidTotal, note: `${data.unpaidCount} bills` },
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

          {pay.length > 0 && (
            <details>
              <summary className="cursor-pointer text-sm font-semibold">
                Income · {pay.length} paychecks · <MoneyText value={pay.reduce((s, p) => s + (p.amount ?? 0), 0)} />
              </summary>
              <BillTable
                title="Income"
                rows={pay}
                month={month}
                today={today}
                accounts={accounts.data ?? []}
                paidLabel="received"
                onToggle={(b, paid) => run(edit(b, { status: paid ? 'PAID' : 'PENDING', paidOn: paid ? today : null }))}
                onAccount={(b, accountId) => run(edit(b, { accountId }))}
                onExpenditure={(b, inExpenditure) => run(edit(b, { inExpenditure }))}
                onDay={(b, billingDay) => run(edit(b, { billingDay }))}
                onAmount={(b, amount) => edit(b, { amount })}
                onDelete={askRemove}
              />
            </details>
          )}
        </>
      )}

      {adding && (
        <BillDialog
          title={`Add a bill to ${formatMonth(month)}`}
          accounts={accounts.data ?? []}
          onClose={() => setAdding(false)}
          onSubmit={(v: BillValues) => add.mutateAsync({ ...v, status: 'PENDING', paidOn: null })}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title="Remove bill"
          message={`Remove “${confirm.name}” from ${formatMonth(month)}? Other months and the recurring bill stay as they are.`}
          confirmLabel="Remove"
          busy={remove.isPending}
          error={actionError}
          onConfirm={async () => {
            setActionError(null);
            try {
              await remove.mutateAsync(confirm.id);
              setConfirm(null);
            } catch (err) {
              setActionError(err instanceof ApiError ? err.message : 'Something went wrong');
            }
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </section>
  );
}

function AccountCards({ data, onBalance }: { data: Month; onBalance: (accountId: string, v: number) => Promise<unknown> }) {
  return (
    <section aria-label="Accounts" className="grid gap-4 sm:grid-cols-2">
      {data.accounts.map((a) => (
        <article key={a.accountId} aria-label={a.accountName} className="rounded-lg border border-black/10 p-4 dark:border-white/15">
          <h2 className="text-sm font-semibold">{a.accountName}</h2>
          <p className="mt-1 text-2xl font-semibold">
            <MoneyText value={a.remaining} /> <span className="text-sm font-normal opacity-70">left at month end</span>
          </p>
          <p className="mt-2 flex flex-wrap gap-x-3 text-sm tabular-nums opacity-80">
            <span>
              <InlineAmount
                balance
                value={a.startingBalance}
                label={`${a.accountName} starting balance`}
                onSave={(v) => onBalance(a.accountId, v ?? 0)}
              />{' '}
              balance
            </span>
            <span>
              + <MoneyText value={a.income} /> pay
            </span>
            <span>
              − <MoneyText value={a.expenses} /> bills
            </span>
          </p>
        </article>
      ))}
    </section>
  );
}

function BillTable({
  title,
  rows,
  month,
  today,
  accounts,
  paidLabel,
  onToggle,
  onAccount,
  onExpenditure,
  onDay,
  onAmount,
  onDelete,
}: {
  title: string;
  rows: MonthItem[];
  month: string;
  today: string;
  accounts: Account[];
  paidLabel: string;
  onToggle: (b: MonthItem, paid: boolean) => void;
  onAccount: (b: MonthItem, accountId: string) => void;
  onExpenditure: (b: MonthItem, inExpenditure: boolean) => void;
  onDay: (b: MonthItem, billingDay: number | null) => void;
  onAmount: (b: MonthItem, amount: number | null) => Promise<unknown>;
  onDelete: (b: MonthItem) => void;
}) {
  // Pay never counts toward Expenditure, so the income table has no such column.
  const showExpenditure = rows.some((b) => b.kind !== 'INCOME');
  return (
    <div className="overflow-x-auto">
      <table aria-label={title} className="w-full text-sm">
        <thead className="border-b border-black/10 text-left dark:border-white/15">
          <tr>
            <th className="border-l-4 border-l-transparent py-2 pl-3 capitalize">{paidLabel}</th>
            <th className="py-2">Due</th>
            <th className="py-2">Name</th>
            <th className="py-2">From</th>
            <th className="py-2 text-right">Amount</th>
            {showExpenditure && <th className="py-2 pl-4 text-center">In expenditure</th>}
            <th className="py-2 pl-4">Status</th>
            <th className="py-2" />
          </tr>
        </thead>
        {KIND_ORDER.map((kind) => {
          const group = rows.filter((b) => b.kind === kind);
          if (!group.length) return null;
          return (
            <tbody key={kind}>
              <tr>
                <th colSpan={showExpenditure ? 8 : 7} scope="rowgroup" className="pb-1 pt-4 text-left font-normal">
                  <KindBadge kind={kind} />
                  <span className="ml-2 text-xs tabular-nums opacity-60">
                    {group.length} · <MoneyText value={group.reduce((s, b) => s + (b.amount ?? 0), 0)} />
                  </span>
                </th>
              </tr>
              {group.map((b) => {
                const overdue = isOverdue(b, month, today);
                return (
                  <tr
                    key={b.id}
                    className={`border-b border-black/5 dark:border-white/10 ${isPaid(b) ? 'opacity-60' : ''} ${overdue ? 'bg-red-50 dark:bg-red-950/30' : ''}`}
                  >
                    <td className={`border-l-4 py-2 pl-3 ${KIND_TONE[kind].bar}`}>
                      <input
                        type="checkbox"
                        checked={isPaid(b)}
                        disabled={b.amount == null}
                        title={b.amount == null ? 'Add an amount first' : undefined}
                        aria-label={`${b.name} ${paidLabel}`}
                        onChange={(e) => onToggle(b, e.target.checked)}
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="date"
                        aria-label={`${b.name} due date`}
                        min={`${month}-01`}
                        max={dueDate(month, 31)}
                        value={b.billingDay ? dueDate(month, b.billingDay) : ''}
                        onChange={(e) => onDay(b, e.target.value ? Number(e.target.value.slice(8)) : null)}
                        className="rounded border border-transparent bg-transparent px-1 py-0.5 tabular-nums hover:border-black/20 dark:[color-scheme:dark] dark:hover:border-white/20"
                      />
                    </td>
                    <td className="py-2">{b.name}</td>
                    <td className="py-2">
                      <select
                        aria-label={`${b.name} paid from`}
                        value={b.accountId}
                        onChange={(e) => onAccount(b, e.target.value)}
                        className="rounded border border-black/20 bg-transparent px-1 py-0.5 dark:border-white/20"
                      >
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                        {!accounts.some((a) => a.id === b.accountId) && <option value={b.accountId}>{b.accountName}</option>}
                      </select>
                    </td>
                    <td className="py-2 text-right">
                      <InlineAmount value={b.amount} label={`${b.name} amount`} onSave={(v) => onAmount(b, v)} />
                    </td>
                    {showExpenditure && (
                      <td className="py-2 pl-4 text-center">
                        <input
                          type="checkbox"
                          checked={b.inExpenditure}
                          aria-label={`${b.name} in expenditure`}
                          onChange={(e) => onExpenditure(b, e.target.checked)}
                        />
                      </td>
                    )}
                    <td className={`py-2 pl-4 ${overdue ? 'font-medium text-red-700 dark:text-red-400' : 'opacity-70'}`}>
                      {statusText(b, month, today)}
                    </td>
                    <td className="py-2 text-right">
                      <button onClick={() => onDelete(b)} aria-label={`Remove ${b.name}`} className="px-2 text-red-700 hover:underline">
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
