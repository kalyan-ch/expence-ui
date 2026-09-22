'use client';

import { useState } from 'react';
import { Modal } from '../../components/Modal';
import { ApiError } from '../../lib/api/client';
import {
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from '../../lib/hooks/useAccounts';
import { formatMoney } from '../../lib/format';
import type { Account } from '../../lib/types';
import { AccountDialog } from './AccountDialog';

export default function AccountsPage() {
  const { data: accounts, isPending, error } = useAccounts();
  const create = useCreateAccount();
  const update = useUpdateAccount();
  const remove = useDeleteAccount();

  const [dialog, setDialog] = useState<{ account?: Account } | null>(null);
  const [confirm, setConfirm] = useState<Account | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function confirmDelete() {
    if (!confirm) return;
    setDeleteError(null);
    try {
      await remove.mutateAsync(confirm.id);
      setConfirm(null);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Something went wrong');
    }
  }

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <button
          onClick={() => setDialog({})}
          className="rounded bg-black px-3 py-2 text-sm text-white dark:bg-white dark:text-black"
        >
          New account
        </button>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error.message}
        </p>
      )}

      {isPending ? (
        <p className="text-sm opacity-70">Loading…</p>
      ) : !accounts?.length ? (
        <p className="text-sm opacity-70">No accounts yet. Create one to get started.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="border-b border-black/10 text-left dark:border-white/15">
            <tr>
              <th className="py-2">Name</th>
              <th className="py-2">Type</th>
              <th className="py-2 text-right">Opening balance</th>
              <th className="py-2 text-right">Current balance</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-b border-black/5 dark:border-white/10">
                <td className="py-2">{a.name}</td>
                <td className="py-2">{a.type.replace('_', ' ')}</td>
                <td className="py-2 text-right tabular-nums">{formatMoney(a.openingBalance)}</td>
                <td className="py-2 text-right tabular-nums">{formatMoney(a.balance)}</td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => setDialog({ account: a })}
                    className="px-2 hover:underline"
                    aria-label={`Edit ${a.name}`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setDeleteError(null);
                      setConfirm(a);
                    }}
                    className="px-2 text-red-700 hover:underline"
                    aria-label={`Delete ${a.name}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {dialog && (
        <AccountDialog
          account={dialog.account}
          onClose={() => setDialog(null)}
          onSubmit={(body) =>
            dialog.account
              ? update.mutateAsync({ id: dialog.account.id, body })
              : create.mutateAsync(body)
          }
        />
      )}

      {confirm && (
        <Modal title="Delete account" onClose={() => setConfirm(null)}>
          <p className="text-sm">Delete “{confirm.name}”? This cannot be undone.</p>
          {deleteError && (
            <p role="alert" className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
              {deleteError}
            </p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setConfirm(null)} className="rounded px-3 py-2 text-sm hover:bg-black/5">
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={remove.isPending}
              className="rounded bg-red-700 px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
