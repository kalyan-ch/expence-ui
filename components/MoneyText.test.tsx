import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MoneyText } from './MoneyText';

describe('MoneyText', () => {
  it('renders a negative in parentheses with the negative tone', () => {
    render(<MoneyText value={-42.5} />);

    const el = screen.getByText('($42.50)');
    expect(el).toHaveClass('text-red-700');
  });

  it('renders a positive without the negative tone', () => {
    render(<MoneyText value={100} />);

    const el = screen.getByText('$100.00');
    expect(el).not.toHaveClass('text-red-700');
  });
});
