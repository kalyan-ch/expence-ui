'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** `match` lists the routes that light up the item; recurring bills belong to Bills. */
const NAV = [
  { href: '/bills', label: 'Bills', match: ['/bills', '/recurring'] },
  { href: '/accounts', label: 'Accounts', match: ['/accounts'] },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-4">
      <Link href="/" className="font-semibold">
        Expence
      </Link>
      <ul className="flex gap-1 text-sm">
        {NAV.map(({ href, label, match }) => {
          const active = match.some((m) => path.startsWith(m));
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`rounded px-3 py-1.5 ${active ? 'bg-black/10 font-medium dark:bg-white/15' : 'opacity-70 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10'}`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
