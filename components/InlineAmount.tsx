'use client';

import { useRef, useState } from 'react';
import { ApiError } from '../lib/api/client';
import { formatMoney } from '../lib/format';

const AMOUNT = /^\d+(\.\d{1,2})?$/;
const BALANCE = /^-?\d+(\.\d{1,2})?$/;

/**
 * Money shown as a button; click to edit in place. Enter or blur saves, Escape cancels.
 * A bill amount may be cleared (blank = nothing due); a balance may be negative but not blank.
 */
export function InlineAmount({
  value,
  label,
  balance,
  onSave,
}: {
  value: number | null;
  label: string;
  balance?: boolean;
  onSave: (value: number | null) => Promise<unknown>;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const errorId = `${label.replace(/\W+/g, '-')}-error`;

  if (draft === null) {
    return (
      <button
        type="button"
        onClick={() => {
          setError(null);
          setDraft(value == null ? '' : value.toFixed(2));
        }}
        aria-label={`${label}: ${value == null ? 'blank' : formatMoney(value)}. Edit`}
        className={`tabular-nums hover:underline ${value == null ? 'opacity-60' : ''}`}
      >
        {value == null ? 'Add' : formatMoney(value)}
      </button>
    );
  }

  async function save(text: string) {
    if (busy.current) return;
    const v = text.replace(/[$,\s]/g, '');
    const blank = !balance && (v === '' || Number(v) === 0);
    if (!blank && !(balance ? BALANCE : AMOUNT).test(v)) {
      setError(balance ? 'Enter a balance like 2915.91' : 'Enter an amount like 433.14');
      return;
    }
    busy.current = true;
    try {
      await onSave(blank ? null : Number(v));
      setDraft(null);
    } catch (err) {
      const fields = err instanceof ApiError && err.fieldErrors ? Object.values(err.fieldErrors) : [];
      setError(fields[0] ?? (err instanceof ApiError ? err.message : 'Something went wrong'));
    } finally {
      busy.current = false;
    }
  }

  return (
    <span className="inline-flex flex-col items-end">
      <input
        autoFocus
        inputMode="decimal"
        aria-label={label}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save(draft);
          if (e.key === 'Escape') setDraft(null);
        }}
        onBlur={() => !error && save(draft)}
        className="w-28 rounded border border-black/20 px-2 py-1 text-right tabular-nums dark:border-white/20"
      />
      {error && (
        <span id={errorId} role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </span>
      )}
    </span>
  );
}
