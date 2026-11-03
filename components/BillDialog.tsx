'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ApiError } from '../lib/api/client';
import { FREQUENCY_LABEL, KIND_LABEL } from '../lib/format';
import type { Account, ItemFrequency, ItemKind } from '../lib/types';
import { ErrorBanner } from './ErrorBanner';
import { FormField } from './FormField';
import { Modal } from './Modal';

export interface BillValues {
  name: string;
  kind: ItemKind;
  accountId: string;
  amount: number | null;
  billingDay: number | null;
  /** Recurring items only (`schedule`); a month row is always on one day. */
  frequency?: ItemFrequency;
  secondDay?: number | null;
  anchorDate?: string | null;
}

const KINDS: ItemKind[] = ['EXPENSE', 'CARD_PAYMENT', 'SAVINGS', 'INCOME'];
const FREQUENCIES = Object.keys(FREQUENCY_LABEL) as ItemFrequency[];
const toText = (n: number | null | undefined) => (n == null ? '' : String(n));
const toNumber = (s: string) => (s === '' ? null : Number(s));

/**
 * Add or edit a bill or paycheck. Amount and billing day may be left blank.
 * `amountField` is the API's name for the amount, so its 400 error lands under the input.
 * `schedule` adds how often it repeats: one or two fixed days, or every 1 or 2 weeks from a payday.
 */
export function BillDialog({
  title,
  bill,
  accounts,
  amountField = 'amount',
  schedule,
  onSubmit,
  onClose,
}: {
  title: string;
  bill?: BillValues;
  accounts: Account[];
  amountField?: string;
  schedule?: boolean;
  onSubmit: (values: BillValues) => Promise<unknown>;
  onClose: () => void;
}) {
  const [name, setName] = useState(bill?.name ?? '');
  const [kind, setKind] = useState<ItemKind>(bill?.kind ?? 'EXPENSE');
  const [accountId, setAccountId] = useState(bill?.accountId ?? accounts[0]?.id ?? '');
  const [amount, setAmount] = useState(bill?.amount == null ? '' : String(bill.amount));
  const [day, setDay] = useState(toText(bill?.billingDay));
  const [frequency, setFrequency] = useState<ItemFrequency>(bill?.frequency ?? 'MONTHLY');
  const [secondDay, setSecondDay] = useState(toText(bill?.secondDay));
  const [anchorDate, setAnchorDate] = useState(bill?.anchorDate ?? '');
  const fixedDays = frequency === 'MONTHLY' || frequency === 'TWICE_MONTHLY';
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name,
        kind,
        accountId,
        amount: toNumber(amount),
        billingDay: fixedDays ? toNumber(day) : null,
        ...(schedule && {
          frequency,
          secondDay: frequency === 'TWICE_MONTHLY' ? toNumber(secondDay) : null,
          anchorDate: fixedDays ? null : anchorDate || null,
        }),
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, 'Something went wrong'));
    } finally {
      setSaving(false);
    }
  }

  const fieldError = (field: string) => error?.fieldErrors?.[field];

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        {error && !error.fieldErrors && <ErrorBanner error={error} />}

        <FormField id="bill-name" label="Name" error={fieldError('name')}>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>

        <FormField id="bill-kind" label="Kind" error={fieldError('kind')}>
          <select value={kind} onChange={(e) => setKind(e.target.value as ItemKind)}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </FormField>

        {accounts.length ? (
          <FormField id="bill-account" label="Account" error={fieldError('accountId')}>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </FormField>
        ) : (
          <p className="text-sm">
            No payment accounts yet.{' '}
            <Link href="/accounts" className="underline">
              Mark one as a payment account on Accounts
            </Link>
            .
          </p>
        )}

        <FormField id="bill-amount" label="Amount (blank if nothing due)" error={fieldError(amountField)}>
          <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </FormField>

        {schedule && (
          <FormField id="bill-frequency" label="How often" error={fieldError('frequency')}>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as ItemFrequency)}>
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {FREQUENCY_LABEL[f]}
                </option>
              ))}
            </select>
          </FormField>
        )}

        {fixedDays ? (
          <FormField
            id="bill-day"
            label={frequency === 'TWICE_MONTHLY' ? 'First day (1–31)' : 'Billing day (1–31, optional)'}
            error={fieldError('billingDay')}
          >
            <input type="number" min="1" max="31" value={day} onChange={(e) => setDay(e.target.value)} />
          </FormField>
        ) : (
          <FormField id="bill-anchor" label="A recent payday (the rest are counted from it)" error={fieldError('anchorDate')}>
            <input type="date" value={anchorDate} onChange={(e) => setAnchorDate(e.target.value)} />
          </FormField>
        )}

        {frequency === 'TWICE_MONTHLY' && (
          <FormField id="bill-second-day" label="Second day (1–31)" error={fieldError('secondDay')}>
            <input type="number" min="1" max="31" value={secondDay} onChange={(e) => setSecondDay(e.target.value)} />
          </FormField>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded px-3 py-2 text-sm hover:bg-black/5">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !accountId}
            className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
