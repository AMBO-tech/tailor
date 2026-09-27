import { afterEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ToastContainer } from './Toast';
import { toast } from '@services/toast';

describe('ToastContainer (accessibilité)', () => {
  afterEach(() => {
    act(() => {
      screen.queryAllByRole('button', { name: 'Fermer la notification' }).forEach((b) => b.click());
    });
  });

  it('annonce les messages dans une région aria-live', () => {
    render(<ToastContainer />);
    act(() => toast.success('Commande créée', 0));

    const region = screen.getByRole('region', { name: 'Notifications' });
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('status')).toHaveTextContent('Commande créée');
  });

  it('les erreurs sont des alertes', () => {
    render(<ToastContainer />);
    act(() => toast.error('Réseau indisponible', 0));
    expect(screen.getByRole('alert')).toHaveTextContent('Réseau indisponible');
  });

  it('le bouton de fermeture est nommé et retire le toast', () => {
    render(<ToastContainer />);
    act(() => toast.info('Info', 0));
    fireEvent.click(screen.getByRole('button', { name: 'Fermer la notification' }));
    expect(screen.queryByText('Info')).not.toBeInTheDocument();
  });
});
