import { cloneElement, type ReactElement } from 'react';

export const fieldInputClass =
  'w-full rounded border border-black/20 px-3 py-2 dark:border-white/20';

/**
 * Labelled input. `error` is one entry of `ApiError.fieldErrors`; it wires
 * `aria-invalid` and `aria-describedby` onto the child input for you.
 */
export function FormField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactElement<Record<string, unknown>>;
}) {
  const errorId = `${id}-error`;
  return (
    <div className="text-sm">
      <label htmlFor={id} className="mb-1 block font-medium">
        {label}
      </label>
      {cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? errorId : undefined,
        className: fieldInputClass,
      })}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
