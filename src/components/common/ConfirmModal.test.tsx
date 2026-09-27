import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ConfirmModal } from './ConfirmModal';

const baseProps = {
  isOpen: true,
  title: 'Annuler la commande ?',
  message: 'Cette action est définitive.',
  onConfirm: vi.fn(),
};

describe('ConfirmModal (accessibilité)', () => {
  it('est un dialogue nommé par son titre et décrit par son message', () => {
    render(<ConfirmModal {...baseProps} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: 'Annuler la commande ?' });
    expect(dialog).toHaveAccessibleDescription('Cette action est définitive.');
  });

  it('le bouton icône de fermeture a un nom accessible', () => {
    const onClose = vi.fn();
    render(<ConfirmModal {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('se ferme avec Échap, sauf pendant le traitement', () => {
    const onClose = vi.fn();
    const { rerender } = render(<ConfirmModal {...baseProps} onClose={onClose} isLoading />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();

    rerender(<ConfirmModal {...baseProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
