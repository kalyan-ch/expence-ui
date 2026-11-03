import Link from 'next/link';

/** Page title with an optional action on the right and an optional link back to the parent page above it. */
export function PageHeader({
  title,
  action,
  back,
}: {
  title: string;
  action?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6">
      {back && (
        <Link
          href={back.href}
          className="mb-2 inline-flex items-center gap-1 rounded px-2 py-1 -ml-2 text-sm opacity-70 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
        >
          <span aria-hidden="true">←</span> {back.label}
        </Link>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {action}
      </div>
    </div>
  );
}
