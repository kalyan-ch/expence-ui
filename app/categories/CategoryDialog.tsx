'use client';

import { useState } from 'react';
import { FormField } from '../../components/FormField';
import { ErrorBanner } from '../../components/ErrorBanner';
import { Modal } from '../../components/Modal';
import { ApiError } from '../../lib/api/client';
import type { Category, CategoryKind } from '../../lib/types';

const KINDS: CategoryKind[] = ['EXPENSE', 'INCOME'];

export function CategoryDialog({
  category,
  onSubmit,
  onClose,
}: {
  /** Present = rename, absent = create. Kind is immutable after creation. */
  category?: Category;
  onSubmit: (body: { name: string; kind: CategoryKind }) => Promise<unknown>;
  onClose: () => void;
}) {
  const [name, setName] = useState(category?.name ?? '');
  const [kind, setKind] = useState<CategoryKind>(category?.kind ?? 'EXPENSE');
  const [error, setError] = useState<ApiError | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ name, kind });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, 'Something went wrong'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={category ? 'Rename category' : 'New category'} onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        {error && !error.fieldErrors && <ErrorBanner error={error} />}

        <FormField id="category-name" label="Name" error={error?.fieldErrors?.name}>
          <input name="name" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>

        {!category && (
          <FormField id="category-kind" label="Kind" error={error?.fieldErrors?.kind}>
            <select
              name="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as CategoryKind)}
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k === 'INCOME' ? 'Income' : 'Expense'}
                </option>
              ))}
            </select>
          </FormField>
        )}

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
