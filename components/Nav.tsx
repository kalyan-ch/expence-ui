'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** `match` lists the routes inside the item's section; recurring bills belong to Bills. */
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
          // Filled only on the item's own page; on a sub-page it is underlined and stays clickable.
          const here = path === href;
          const inSection = !here && match.some((m) => path.startsWith(m));
          const style = here
            ? 'bg-black/10 font-medium dark:bg-white/15'
            : `hover:bg-black/5 dark:hover:bg-white/10 ${inSection ? 'font-medium underline decoration-2 underline-offset-8' : 'opacity-70 hover:opacity-100'}`;
          return (
            <li key={href}>
              <Link href={href} aria-current={here ? 'page' : inSection ? 'true' : undefined} className={`rounded px-3 py-1.5 ${style}`}>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
