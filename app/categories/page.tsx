'use client';

import { useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { PageHeader } from '../../components/PageHeader';
import { ApiError } from '../../lib/api/client';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useRenameCategory,
} from '../../lib/hooks/useCategories';
import type { Category, CategoryKind } from '../../lib/types';
import { CategoryDialog } from './CategoryDialog';

const KINDS: { kind: CategoryKind; label: string }[] = [
  { kind: 'INCOME', label: 'Income' },
  { kind: 'EXPENSE', label: 'Expense' },
];

export default function CategoriesPage() {
  // One unfiltered fetch, split here: the list is small and both sections
  // invalidate together anyway.
  const { data: categories, isPending, error } = useCategories();
  const create = useCreateCategory();
  const rename = useRenameCategory();
  const remove = useDeleteCategory();

  const [dialog, setDialog] = useState<{ category?: Category } | null>(null);
  const [confirm, setConfirm] = useState<Category | null>(null);
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
        title="Categories"
        action={
          <button
            onClick={() => setDialog({})}
            className="rounded bg-black px-3 py-2 text-sm text-white dark:bg-white dark:text-black"
          >
            New category
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
      ) : (
        <div className="grid gap-8 sm:grid-cols-2">
          {KINDS.map(({ kind, label }) => {
            const rows = categories?.filter((c) => c.kind === kind) ?? [];
            return (
              <section key={kind} aria-label={label}>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide opacity-70">
                  {label}
                </h2>
                {!rows.length ? (
                  <EmptyState message={`No ${label.toLowerCase()} categories yet.`} />
                ) : (
                  <ul className="text-sm">
                    {rows.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between border-b border-black/5 py-2 dark:border-white/10"
                      >
                        <span>
                          {c.name}
                          {c.isDefault && (
                            <span className="ml-2 rounded bg-black/5 px-1.5 py-0.5 text-xs opacity-70 dark:bg-white/10">
                              Default
                            </span>
                          )}
                        </span>
                        <span>
                          <button
                            onClick={() => setDialog({ category: c })}
                            className="px-2 hover:underline"
                            aria-label={`Rename ${c.name}`}
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => {
                              setDeleteError(null);
                              setConfirm(c);
                            }}
                            // Defaults are rejected with a 409 server-side; disable
                            // rather than make the user find out.
                            disabled={c.isDefault}
                            className="px-2 text-red-700 hover:underline disabled:opacity-40 disabled:no-underline"
                            aria-label={`Delete ${c.name}`}
                          >
                            Delete
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      {dialog && (
        <CategoryDialog
          category={dialog.category}
          onClose={() => setDialog(null)}
          onSubmit={(body) =>
            dialog.category
              ? rename.mutateAsync({ id: dialog.category.id, name: body.name })
              : create.mutateAsync(body)
          }
        />
      )}

      {confirm && (
        <ConfirmDialog
          title="Delete category"
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
