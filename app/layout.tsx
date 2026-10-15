import type { Metadata } from 'next';
import { Nav } from '../components/Nav';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Expence',
  description: 'Personal finance tracker',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <div className="min-h-screen">
            <header className="border-b border-black/10 dark:border-white/15">
              <Nav />
            </header>
            <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
