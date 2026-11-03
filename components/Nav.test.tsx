import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Nav } from './Nav';

const nav = vi.hoisted(() => ({ path: '/' }));
vi.mock('next/navigation', () => ({ usePathname: () => nav.path }));

function current(value = 'page') {
  return screen.queryAllByRole('link').filter((l) => l.getAttribute('aria-current') === value).map((l) => l.textContent);
}

describe('Nav', () => {
  it('Expence links home and nothing is highlighted on the dashboard', () => {
    nav.path = '/';
    render(<Nav />);
    expect(screen.getByRole('link', { name: 'Expence' })).toHaveAttribute('href', '/');
    expect(screen.getAllByRole('listitem').map((l) => l.textContent)).toEqual(['Bills', 'Accounts']);
    expect(current()).toEqual([]);
  });

  it.each([
    ['/bills', 'Bills'],
    ['/accounts', 'Accounts'],
  ])('highlights the item for %s', (path, label) => {
    nav.path = path;
    render(<Nav />);
    expect(current()).toEqual([label]);
  });

  it.each(['/recurring', '/bills/setup'])('on %s, Bills is marked as the section, not the current page', (path) => {
    nav.path = path;
    render(<Nav />);
    expect(current()).toEqual([]);
    expect(current('true')).toEqual(['Bills']);
  });
});
