/** Page- or form-level error message. Field errors belong in `FormField`. */
export function ErrorBanner({ error }: { error: Error | string }) {
  return (
    <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40">
      {typeof error === 'string' ? error : error.message}
    </p>
  );
}
