import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Expence',
  description: 'Personal finance tracker',
};

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/categories', label: 'Categories' },
  { href: '/reports', label: 'Reports' },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <div className="min-h-screen">
            <header className="border-b border-black/10 dark:border-white/15">
              <nav aria-label="Main" className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4">
                <span className="font-semibold">Expence</span>
                <ul className="flex gap-4 text-sm">
                  {NAV.map(({ href, label }) => (
                    <li key={href}>
                      <Link className="hover:underline hover:underline-offset-4" href={href}>
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </header>
            <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
