'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ErrorBanner } from '../../../components/ErrorBanner';
import { KIND_ORDER, KindBadge } from '../../../components/KindBadge';
import { MoneyText } from '../../../components/MoneyText';
import { PageHeader } from '../../../components/PageHeader';
import { ApiError } from '../../../lib/api/client';
import { formatMonth, formatSchedule, FREQUENCY_LABEL, KIND_LABEL } from '../../../lib/format';
import { useAccounts, useCreateAccount, usePaymentAccounts, useUpdateAccount } from '../../../lib/hooks/useAccounts';
import { useMonth, useSetMonthBalance } from '../../../lib/hooks/useMonths';
import { useCreateRecurringItem, useRecurringItems } from '../../../lib/hooks/useRecurringItems';
import { useToday } from '../../../lib/hooks/useToday';
import type { ItemFrequency, ItemKind } from '../../../lib/types';

const STEPS = ['Accounts', 'Bills', 'Paychecks', 'Starting balances'];
const BILL_KINDS = KIND_ORDER.filter((k) => k !== 'INCOME');
const FREQUENCIES = Object.keys(FREQUENCY_LABEL) as ItemFrequency[];
const inputClass = 'rounded border border-black/20 bg-transparent px-2 py-1 dark:border-white/20';
const primaryClass = 'rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black';
const secondaryClass =
  'rounded border border-black/20 px-3 py-2 text-sm hover:bg-black/5 dark:border-white/25 dark:hover:bg-white/10';
const addClass =
  'rounded bg-black/10 px-3 py-1.5 text-sm font-medium hover:bg-black/15 disabled:opacity-40 dark:bg-white/15 dark:hover:bg-white/25';
const noSpinClass = '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';
const dayClass = `${inputClass} ${noSpinClass} w-full text-right`;
/** Each grid is shared by its card's header, rows and add row, so the add row's inputs sit under their headings. */
const billGridClass =
  'grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_7rem_4.5rem_6.5rem_5.5rem] sm:items-center';
const payGridClass =
  'grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_7rem_minmax(0,1.2fr)_minmax(0,1.6fr)_5.5rem] sm:items-center';

const errorText = (err: unknown) => (err instanceof ApiError ? err.message : 'Something went wrong');
const numberOrNull = (v: string) => (v === '' ? null : Number(v));

/** Runs an action and keeps its error message, so each step can show what failed. */
function useRun() {
  const [error, setError] = useState<string | null>(null);
  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      return true;
    } catch (err) {
      setError(errorText(err));
      return false;
    }
  }
  return { error, run };
}

/** First-time setup for the bills sheet: accounts, bills, paychecks, then this month's balances. */
export default function BillSetupPage() {
  const today = useToday();
  const [step, setStep] = useState(0);
  const back = () => setStep(step - 1);
  const next = () => setStep(step + 1);

  return (
    <section className="space-y-6">
      <PageHeader title="Set up bills" back={{ href: '/bills', label: 'Bills' }} />
      <ol aria-label="Setup steps" className="flex flex-wrap gap-2 text-sm">
        {STEPS.map((s, i) => (
          <li
            key={s}
            aria-current={i === step ? 'step' : undefined}
            className={`rounded px-3 py-1 ${i === step ? 'bg-black/10 font-medium dark:bg-white/15' : 'opacity-60'}`}
          >
            {i + 1}. {s}
          </li>
        ))}
      </ol>
      {step === 0 && <AccountsStep onNext={next} />}
      {step === 1 && <BillsStep onBack={back} onNext={next} />}
      {step === 2 && <PaychecksStep onBack={back} onNext={next} />}
      {step === 3 && today && <BalancesStep month={today.slice(0, 7)} onBack={back} />}
    </section>
  );
}

function StepButtons({ onBack, onNext, nextDisabled }: { onBack: () => void; onNext: () => void; nextDisabled?: boolean }) {
  return (
    <div className="flex justify-between">
      <button onClick={onBack} className={secondaryClass}>
        Back
      </button>
      <button onClick={onNext} disabled={nextDisabled} className={primaryClass}>
        Next
      </button>
    </div>
  );
}

/** A list of recurring rows with an add row underneath, laid out on one shared grid. */
function SetupCard({
  title,
  summary,
  grid,
  headings,
  empty,
  rows,
  form,
}: {
  title: string;
  summary: string;
  grid: string;
  headings: string[];
  empty: string;
  rows: React.ReactNode[];
  form: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-black/10 text-sm dark:border-white/15">
      <div className="flex items-baseline justify-between px-4 pt-3">
        <h2 className="font-semibold">{title}</h2>
        <span className="text-xs opacity-60">{summary}</span>
      </div>
      <div className={`${grid} hidden border-b border-black/10 px-4 py-2 text-xs uppercase tracking-wide opacity-60 sm:grid dark:border-white/15`}>
        {headings.map((h) => (
          <span key={h} className={h.startsWith('>') ? 'text-right' : ''}>
            {h.replace('>', '')}
          </span>
        ))}
      </div>
      <ul aria-label={title}>
        {rows}
        {!rows.length && <li className="px-4 py-6 text-center opacity-60">{empty}</li>}
      </ul>
      {form}
    </div>
  );
}

const rowClass = 'border-b border-black/5 px-4 py-2.5 dark:border-white/10';
const formClass = 'bg-black/[0.03] px-4 py-3 dark:bg-white/[0.04]';

function AmountInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className={`${inputClass} flex items-center gap-1 focus-within:ring-1 focus-within:ring-current`}>
      <span className="opacity-50">$</span>
      <input
        aria-label="Amount"
        placeholder="varies"
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${noSpinClass} w-full bg-transparent text-right outline-none`}
      />
    </label>
  );
}

function AccountSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data: accounts = [] } = usePaymentAccounts();
  return (
    <select aria-label="Account" value={value || accounts[0]?.id} onChange={(e) => onChange(e.target.value)} className={inputClass}>
      {accounts.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
    </select>
  );
}

function AccountsStep({ onNext }: { onNext: () => void }) {
  const { data: accounts = [], isPending, error } = useAccounts();
  const create = useCreateAccount();
  const update = useUpdateAccount();
  const { error: actionError, run } = useRun();
  const [name, setName] = useState('');

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (await run(() => create.mutateAsync({ name, type: 'CHECKING', openingBalance: 0, paymentAccount: true }))) setName('');
  }

  return (
    <div className="space-y-4">
      <p className="text-sm opacity-80">Which checking accounts do your bills come out of and your paychecks go into?</p>
      {(error ?? actionError) && <ErrorBanner error={(error ?? actionError)!} />}
      {isPending ? (
        <p className="text-sm opacity-70">Loading…</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {accounts.map((a) => (
            <li key={a.id}>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={a.paymentAccount}
                  onChange={(e) => {
                    const { name, type, openingBalance } = a;
                    run(() => update.mutateAsync({ id: a.id, body: { name, type, openingBalance, paymentAccount: e.target.checked } }));
                  }}
                />
                {a.name} <span className="opacity-60">· pays bills</span>
              </label>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="flex gap-2">
        <input aria-label="New account name" placeholder="e.g. Chase" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        <button type="submit" disabled={!name.trim() || create.isPending} className={addClass}>
          <span aria-hidden="true">+</span> Add account
        </button>
      </form>
      <div className="flex justify-end">
        <button onClick={onNext} disabled={!accounts.some((a) => a.paymentAccount)} className={primaryClass}>
          Next
        </button>
      </div>
    </div>
  );
}

function BillsStep({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const { data: all = [], error } = useRecurringItems();
  const { data: accounts = [] } = usePaymentAccounts();
  const create = useCreateRecurringItem();
  const { error: actionError, run } = useRun();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<ItemKind>('EXPENSE');
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [day, setDay] = useState('');
  const [inExpenditure, setInExpenditure] = useState(true);
  const bills = all.filter((r) => r.kind !== 'INCOME');

  // Kind, account and the expenditure choice stay put after each add, so a run of similar bills is quick.
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const saved = await run(() =>
      create.mutateAsync({
        name,
        kind,
        accountId: accountId || accounts[0].id,
        defaultAmount: numberOrNull(amount),
        billingDay: numberOrNull(day),
        inExpenditure,
        sortOrder: all.length,
        active: true,
      }),
    );
    if (saved) {
      setName('');
      setAmount('');
      setDay('');
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm opacity-80">
        Add each bill of the sheet: expenses, card payments and savings deposits. Leave the amount blank if it changes every
        month. Untick <em>In expenditure</em> for anything that shouldn&apos;t count as spending.
      </p>
      {(error ?? actionError) && <ErrorBanner error={(error ?? actionError)!} />}
      <SetupCard
        title="Recurring bills"
        summary={`${bills.length} ${bills.length === 1 ? 'bill' : 'bills'}`}
        grid={billGridClass}
        headings={['Name', 'Kind', 'Account', '>Amount', '>Due day', 'In expenditure']}
        empty="No bills yet. Type the first row below, e.g. Rent · Expense · 1800 · day 1."
        rows={bills.map((r) => (
          <li key={r.id} className={`${billGridClass} ${rowClass}`}>
            <span className="font-medium">{r.name}</span>
            <span>
              <KindBadge kind={r.kind} />
            </span>
            <span className="opacity-80">{r.accountName}</span>
            <span className="text-right tabular-nums">
              {r.defaultAmount == null ? <span className="opacity-50">varies</span> : <MoneyText value={r.defaultAmount} />}
            </span>
            <span className="text-right tabular-nums">{r.billingDay ?? <span className="opacity-50">—</span>}</span>
            <span className={r.inExpenditure ? '' : 'opacity-50'}>{r.inExpenditure ? 'Yes' : 'No'}</span>
          </li>
        ))}
        form={
          <form onSubmit={add} aria-label="Add a recurring bill" className={`${billGridClass} ${formClass}`}>
            <input aria-label="Name" placeholder="Name, e.g. Rent" value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} col-span-2 sm:col-span-1`} />
            <select
              aria-label="Kind"
              value={kind}
              onChange={(e) => {
                const k = e.target.value as ItemKind;
                setKind(k);
                setInExpenditure(k !== 'SAVINGS');
              }}
              className={inputClass}
            >
              {BILL_KINDS.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
                </option>
              ))}
            </select>
            <AccountSelect value={accountId} onChange={setAccountId} />
            <AmountInput value={amount} onChange={setAmount} />
            <input aria-label="Billing day" placeholder="1–31" type="number" min="1" max="31" value={day} onChange={(e) => setDay(e.target.value)} className={dayClass} />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={inExpenditure} onChange={(e) => setInExpenditure(e.target.checked)} />
              <span className="sm:sr-only">In expenditure</span>
            </label>
            <button type="submit" disabled={!name.trim() || !accounts.length || create.isPending} className={`${addClass} col-span-2 sm:col-span-1`}>
              <span aria-hidden="true">+</span> Add bill
            </button>
          </form>
        }
      />
      <p className="text-xs opacity-60">
        You can edit, reorder or retire these later on{' '}
        <Link href="/recurring" className="underline">
          Recurring bills
        </Link>
        .
      </p>
      <StepButtons onBack={onBack} onNext={onNext} nextDisabled={!bills.length} />
    </div>
  );
}

function PaychecksStep({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const { data: all = [], error } = useRecurringItems();
  const { data: accounts = [] } = usePaymentAccounts();
  const create = useCreateRecurringItem();
  const { error: actionError, run } = useRun();
  const [name, setName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<ItemFrequency>('TWICE_MONTHLY');
  const [day, setDay] = useState('');
  const [secondDay, setSecondDay] = useState('');
  const [anchorDate, setAnchorDate] = useState('');
  const pay = all.filter((r) => r.kind === 'INCOME');
  const fixedDays = frequency === 'MONTHLY' || frequency === 'TWICE_MONTHLY';

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const saved = await run(() =>
      create.mutateAsync({
        name,
        kind: 'INCOME',
        accountId: accountId || accounts[0].id,
        defaultAmount: numberOrNull(amount),
        frequency,
        billingDay: fixedDays ? numberOrNull(day) : null,
        secondDay: frequency === 'TWICE_MONTHLY' ? numberOrNull(secondDay) : null,
        anchorDate: fixedDays ? null : anchorDate || null,
        sortOrder: all.length,
        active: true,
      }),
    );
    if (saved) {
      setName('');
      setAmount('');
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm opacity-80">
        Add what each paycheck puts into each account. If one paycheck is split across accounts, add one row per account. For
        every 2 weeks or weekly, pick any recent payday and the rest are counted from it.
      </p>
      {(error ?? actionError) && <ErrorBanner error={(error ?? actionError)!} />}
      <SetupCard
        title="Paychecks"
        summary={`${pay.length} ${pay.length === 1 ? 'paycheck' : 'paychecks'}`}
        grid={payGridClass}
        headings={['Name', 'Account', '>Amount', 'How often', 'When']}
        empty="No paychecks yet. Type the first one below, e.g. Salary – Chase · 1985.72 · Twice a month · 15 & 31."
        rows={pay.map((r) => (
          <li key={r.id} className={`${payGridClass} ${rowClass}`}>
            <span className="font-medium">{r.name}</span>
            <span className="opacity-80">{r.accountName}</span>
            <span className="text-right tabular-nums">
              {r.defaultAmount == null ? <span className="opacity-50">varies</span> : <MoneyText value={r.defaultAmount} />}
            </span>
            <span>
              <KindBadge kind="INCOME">{FREQUENCY_LABEL[r.frequency]}</KindBadge>
            </span>
            <span className="tabular-nums opacity-80">{formatSchedule(r)}</span>
          </li>
        ))}
        form={
          <form onSubmit={add} aria-label="Add a paycheck" className={`${payGridClass} ${formClass}`}>
            <input aria-label="Name" placeholder="Name, e.g. Salary – Chase" value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} col-span-2 sm:col-span-1`} />
            <AccountSelect value={accountId} onChange={setAccountId} />
            <AmountInput value={amount} onChange={setAmount} />
            <select aria-label="How often" value={frequency} onChange={(e) => setFrequency(e.target.value as ItemFrequency)} className={inputClass}>
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {FREQUENCY_LABEL[f]}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              {fixedDays ? (
                <>
                  <input aria-label="Pay day" placeholder="Day" type="number" min="1" max="31" value={day} onChange={(e) => setDay(e.target.value)} className={dayClass} />
                  {frequency === 'TWICE_MONTHLY' && (
                    <>
                      <span className="opacity-50">&amp;</span>
                      <input aria-label="Second pay day" placeholder="Day" type="number" min="1" max="31" value={secondDay} onChange={(e) => setSecondDay(e.target.value)} className={dayClass} />
                    </>
                  )}
                </>
              ) : (
                <input aria-label="A recent payday" type="date" value={anchorDate} onChange={(e) => setAnchorDate(e.target.value)} className={`${inputClass} w-full dark:[color-scheme:dark]`} />
              )}
            </div>
            <button type="submit" disabled={!name.trim() || !accounts.length || create.isPending} className={`${addClass} col-span-2 sm:col-span-1`}>
              <span aria-hidden="true">+</span> Add paycheck
            </button>
          </form>
        }
      />
      <StepButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}

function BalancesStep({ month, onBack }: { month: string; onBack: () => void }) {
  const router = useRouter();
  // Opening the month fills it from the recurring bills and paychecks just set up.
  const plan = useMonth(month);
  const { data: accounts = [] } = usePaymentAccounts();
  const setBalance = useSetMonthBalance(month);
  const { error: actionError, run } = useRun();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const saved = (id: string) => plan.data?.accounts.find((a) => a.accountId === id)?.startingBalance;
  const value = (id: string) => drafts[id] ?? (saved(id) == null ? '' : String(saved(id)));

  async function finish() {
    setSaving(true);
    const ok = await run(async () => {
      for (const a of accounts) {
        if (value(a.id) !== '') await setBalance.mutateAsync({ accountId: a.id, startingBalance: Number(value(a.id)) });
      }
    });
    setSaving(false);
    if (ok) router.push('/bills');
  }

  return (
    <div className="space-y-4">
      <p className="text-sm opacity-80">
        Type each account&apos;s balance from your bank app as of the start of {formatMonth(month)}, before any bills come out.
      </p>
      {(plan.error ?? actionError) && <ErrorBanner error={(plan.error ?? actionError)!} />}
      <div className="space-y-2 text-sm">
        {accounts.map((a) => (
          <label key={a.id} className="flex items-center gap-3">
            <span className="w-32">{a.name}</span>
            <input
              type="number"
              step="0.01"
              aria-label={`${a.name} starting balance`}
              value={value(a.id)}
              onChange={(e) => setDrafts({ ...drafts, [a.id]: e.target.value })}
              className={`${inputClass} w-36`}
            />
          </label>
        ))}
      </div>
      <div className="flex justify-between">
        <button onClick={onBack} className={secondaryClass}>
          Back
        </button>
        <button onClick={finish} disabled={saving || !plan.data} className={primaryClass}>
          {saving ? 'Saving…' : 'Finish'}
        </button>
      </div>
    </div>
  );
}
