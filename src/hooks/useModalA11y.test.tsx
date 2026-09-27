import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useModalA11y } from './useModalA11y';

/** Modale minimale utilisant le hook, pour tester son comportement. */
function TestDialog({ onClose, label = 'Ma modale' }: { onClose: () => void; label?: string }) {
  const { titleId, dialogProps } = useModalA11y({ onClose });
  return (
    <div {...dialogProps}>
      <h2 id={titleId}>{label}</h2>
      <button type="button">Premier</button>
      <button type="button">Dernier</button>
    </div>
  );
}

/** Page avec un bouton d'ouverture, pour vérifier le retour du focus. */
function Host({ onClose = () => {} }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Ouvrir
      </button>
      {open && (
        <TestDialog
          onClose={() => {
            onClose();
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

describe('useModalA11y', () => {
  it('expose role="dialog", aria-modal et un titre relié', () => {
    render(<TestDialog onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: 'Ma modale' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('place le focus sur le panneau à l’ouverture', () => {
    render(<TestDialog onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  it('ferme avec Échap et rend le focus au déclencheur', () => {
    const onClose = vi.fn();
    render(<Host onClose={onClose} />);
    const trigger = screen.getByRole('button', { name: 'Ouvrir' });
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('piège la touche Tab à l’intérieur de la modale', () => {
    render(<TestDialog onClose={vi.fn()} />);
    const first = screen.getByRole('button', { name: 'Premier' });
    const last = screen.getByRole('button', { name: 'Dernier' });

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(first).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });

  it('avec des modales imbriquées, Échap ne ferme que la plus récente', () => {
    const closeParent = vi.fn();
    const closeChild = vi.fn();
    render(
      <>
        <TestDialog onClose={closeParent} label="Parent" />
        <TestDialog onClose={closeChild} label="Enfant" />
      </>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(closeChild).toHaveBeenCalledTimes(1);
    expect(closeParent).not.toHaveBeenCalled();
  });

  it('respecte closeOnEscape=false', () => {
    const onClose = vi.fn();
    function Locked() {
      const { dialogProps } = useModalA11y({ onClose, closeOnEscape: false });
      return <div {...dialogProps}>Occupé</div>;
    }
    render(<Locked />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });
});
