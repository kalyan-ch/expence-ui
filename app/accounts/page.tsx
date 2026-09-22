'use client';

import { useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { MoneyText } from '../../components/MoneyText';
import { PageHeader } from '../../components/PageHeader';
import { ApiError } from '../../lib/api/client';
import {
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from '../../lib/hooks/useAccounts';
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
      <PageHeader
        title="Accounts"
        action={
          <button
            onClick={() => setDialog({})}
            className="rounded bg-black px-3 py-2 text-sm text-white dark:bg-white dark:text-black"
          >
            New account
          </button>
        }
      />

      {error && (
        <div className="mb-4">
          <ErrorBanner error={error} />
        </div>
      )}

      {isPending ? (
        <p className="text-sm opacity-70">Loading…</p>
      ) : !accounts?.length ? (
        <EmptyState message="No accounts yet. Create one to get started." />
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
                <td className="py-2 text-right">
                  <MoneyText value={a.openingBalance} />
                </td>
                <td className="py-2 text-right">
                  <MoneyText value={a.balance} />
                </td>
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
        <ConfirmDialog
          title="Delete account"
          message={`Delete “${confirm.name}”? This cannot be undone.`}
          busy={remove.isPending}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </section>
  );
}
