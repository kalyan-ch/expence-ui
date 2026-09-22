'use client';

import { Modal } from './Modal';
import { ErrorBanner } from './ErrorBanner';

/** Destructive-action confirm. `error` carries a server 409 message inline. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm">{message}</p>
      {error && <div className="mt-3">
        <ErrorBanner error={error} />
      </div>}
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded px-3 py-2 text-sm hover:bg-black/5">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className="rounded bg-red-700 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
