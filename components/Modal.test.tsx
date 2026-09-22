import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

function renderModal(onClose = vi.fn()) {
  render(
    <Modal title="Delete account" onClose={onClose}>
      <button>Confirm</button>
    </Modal>,
  );
  return onClose;
}

describe('Modal', () => {
  it('moves focus into the dialog on open', () => {
    renderModal();

    expect(screen.getByRole('button', { name: 'Confirm' })).toHaveFocus();
  });

  it('closes on Escape', async () => {
    const onClose = renderModal();

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  it('closes on an overlay click but not on a click inside', async () => {
    const onClose = renderModal();

    await userEvent.click(screen.getByRole('dialog', { name: 'Delete account' }));
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(screen.getByTestId('modal-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
