'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ApiError } from '../lib/api/client';
import { KIND_LABEL } from '../lib/format';
import type { Account, ItemKind } from '../lib/types';
import { ErrorBanner } from './ErrorBanner';
import { FormField } from './FormField';
import { Modal } from './Modal';

export interface BillValues {
  name: string;
  kind: ItemKind;
  accountId: string;
  amount: number | null;
  billingDay: number | null;
}

const KINDS: ItemKind[] = ['EXPENSE', 'CARD_PAYMENT', 'SAVINGS', 'INCOME'];

/**
 * Add or edit a bill or paycheck. Amount and billing day may be left blank.
 * `amountField` is the API's name for the amount, so its 400 error lands under the input.
 */
export function BillDialog({
  title,
  bill,
  accounts,
  amountField = 'amount',
  onSubmit,
  onClose,
}: {
  title: string;
  bill?: BillValues;
  accounts: Account[];
  amountField?: string;
  onSubmit: (values: BillValues) => Promise<unknown>;
  onClose: () => void;
}) {
  const [name, setName] = useState(bill?.name ?? '');
  const [kind, setKind] = useState<ItemKind>(bill?.kind ?? 'EXPENSE');
  const [accountId, setAccountId] = useState(bill?.accountId ?? accounts[0]?.id ?? '');
  const [amount, setAmount] = useState(bill?.amount == null ? '' : String(bill.amount));
  const [day, setDay] = useState(bill?.billingDay == null ? '' : String(bill.billingDay));
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
        amount: amount === '' ? null : Number(amount),
        billingDay: day === '' ? null : Number(day),
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

        <FormField id="bill-day" label="Billing day (1–31, optional)" error={fieldError('billingDay')}>
          <input type="number" min="1" max="31" value={day} onChange={(e) => setDay(e.target.value)} />
        </FormField>

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
