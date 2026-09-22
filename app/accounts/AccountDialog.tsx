'use client';

import { useState } from 'react';
import { ErrorBanner } from '../../components/ErrorBanner';
import { FormField } from '../../components/FormField';
import { Modal } from '../../components/Modal';
import { ApiError } from '../../lib/api/client';
import type { CreateAccountInput } from '../../lib/api/accounts';
import type { Account, AccountType } from '../../lib/types';

const TYPES: AccountType[] = ['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'CASH'];

export function AccountDialog({
  account,
  onSubmit,
  onClose,
}: {
  /** Present = edit, absent = create. */
  account?: Account;
  onSubmit: (body: CreateAccountInput) => Promise<unknown>;
  onClose: () => void;
}) {
  const [name, setName] = useState(account?.name ?? '');
  const [type, setType] = useState<AccountType>(account?.type ?? 'CHECKING');
  const [openingBalance, setOpeningBalance] = useState(String(account?.openingBalance ?? 0));
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ name, type, openingBalance: Number(openingBalance) });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, 'Something went wrong'));
    } finally {
      setSaving(false);
    }
  }

  const fieldError = (field: string) => error?.fieldErrors?.[field];

  return (
    <Modal title={account ? 'Edit account' : 'New account'} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        {error && !error.fieldErrors && <ErrorBanner error={error} />}

        <FormField id="account-name" label="Name" error={fieldError('name')}>
          <input name="name" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>

        <FormField id="account-type" label="Type" error={fieldError('type')}>
          <select name="type" value={type} onChange={(e) => setType(e.target.value as AccountType)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace('_', ' ')}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          id="account-opening"
          label="Opening balance"
          error={fieldError('openingBalance')}
        >
          <input
            name="openingBalance"
            type="number"
            step="0.01"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
          />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded px-3 py-2 text-sm hover:bg-black/5">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
