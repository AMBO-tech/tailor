import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Measurements } from '@types';
import { MeasurementBookEditor } from './MeasurementBookEditor';

function Harness({ initial = {}, onChange }: { initial?: Measurements; onChange?: (m: Measurements) => void }) {
  const [book, setBook] = useState<Measurements>(initial);
  return (
    <MeasurementBookEditor
      value={book}
      onChange={(next) => {
        setBook(next);
        onChange?.(next);
      }}
    />
  );
}

describe('MeasurementBookEditor', () => {
  it('démarre vide, sans modèle imposé', () => {
    render(<Harness />);
    expect(screen.getByText(/Aucune mesure pour l’instant/)).toBeInTheDocument();
  });

  it('ajoute une suggestion et place le curseur dans son champ', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter la mesure Tour de Taille' }));
    expect(screen.getByLabelText('Tour de Taille')).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Ajouter la mesure Tour de Taille' })).not.toBeInTheDocument();
  });

  it('ajoute une mesure au nom libre avec Entrée sans envoyer le formulaire', () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Harness />
      </form>,
    );
    const name = screen.getByLabelText('Nom de la nouvelle mesure');
    fireEvent.change(name, { target: { value: 'Tour de bras' } });
    fireEvent.keyDown(name, { key: 'Enter' });

    expect(screen.getByLabelText('Tour de bras')).toBeInTheDocument();
    expect(name).toHaveValue('');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('retire une mesure', () => {
    const onChange = vi.fn();
    render(<Harness initial={{ epaule: 42, manche: 60 }} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Retirer la mesure Épaule' }));
    expect(onChange).toHaveBeenLastCalledWith({ manche: 60 });
  });
});
