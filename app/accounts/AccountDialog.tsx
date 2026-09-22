'use client';

import { useState } from 'react';
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
        {error && !error.fieldErrors && (
          <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {error.message}
          </p>
        )}

        <div className="text-sm">
          <label htmlFor="account-name" className="mb-1 block font-medium">
            Name
          </label>
          <input
            id="account-name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(fieldError('name'))}
            aria-describedby={fieldError('name') ? 'account-name-error' : undefined}
            className="w-full rounded border border-black/20 px-3 py-2 dark:border-white/20"
          />
          {fieldError('name') && (
            <p id="account-name-error" role="alert" className="mt-1 text-red-700">
              {fieldError('name')}
            </p>
          )}
        </div>

        <div className="text-sm">
          <label htmlFor="account-type" className="mb-1 block font-medium">
            Type
          </label>
          <select
            id="account-type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
            className="w-full rounded border border-black/20 px-3 py-2 dark:border-white/20"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm">
          <label htmlFor="account-opening" className="mb-1 block font-medium">
            Opening balance
          </label>
          <input
            id="account-opening"
            name="openingBalance"
            type="number"
            step="0.01"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            aria-invalid={Boolean(fieldError('openingBalance'))}
            aria-describedby={fieldError('openingBalance') ? 'account-opening-error' : undefined}
            className="w-full rounded border border-black/20 px-3 py-2 dark:border-white/20"
          />
          {fieldError('openingBalance') && (
            <p id="account-opening-error" role="alert" className="mt-1 text-red-700">
              {fieldError('openingBalance')}
            </p>
          )}
        </div>

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
