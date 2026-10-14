import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MeasurementDrawerModal } from './MeasurementDrawerModal';

describe('MeasurementDrawerModal', () => {
  it('conserve la saisie quand aucune mesure n’est fournie en props', () => {
    render(<MeasurementDrawerModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter la mesure Épaule' }));

    fireEvent.change(screen.getByLabelText('Épaule'), { target: { value: '140' } });

    // Avant correction, l'effet réinjectait un `{}` neuf à chaque rendu :
    // la saisie était effacée et l'effet se relançait en boucle.
    expect(screen.getByDisplayValue('140')).toBeInTheDocument();
    expect(screen.getByText('1 mesure(s) renseignée(s)')).toBeInTheDocument();
  });

  it('reprend les mesures fournies en props', () => {
    render(
      <MeasurementDrawerModal
        onClose={vi.fn()}
        initialMeasurements={{ longueurRobe: 140, epaule: 42 }}
      />,
    );
    expect(screen.getByDisplayValue('140')).toBeInTheDocument();
    expect(screen.getByText('2 mesure(s) renseignée(s)')).toBeInTheDocument();
  });

  it('valide un carnet libre sans les mesures laissées vides', () => {
    const onSave = vi.fn();
    render(<MeasurementDrawerModal onClose={vi.fn()} onSave={onSave} initialMeasurements={{ epaule: 42 }} />);

    fireEvent.change(screen.getByLabelText('Nom de la nouvelle mesure'), { target: { value: 'Tour de bras' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
    fireEvent.change(screen.getByLabelText('Tour de bras'), { target: { value: '31,5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter la mesure Longueur Manche' }));
    fireEvent.click(screen.getByRole('button', { name: /Valider les mesures/ }));

    expect(onSave).toHaveBeenCalledWith({ epaule: 42, 'Tour de bras': 31.5 }, true);
  });

  it('affiche en lecture seule toutes les mesures, quel que soit leur nom', () => {
    render(
      <MeasurementDrawerModal onClose={vi.fn()} isReadOnly initialMeasurements={{ 'Tour de bras': 31, manche: '' }} />,
    );
    expect(screen.getByText('Tour de bras')).toBeInTheDocument();
    expect(screen.getByText('31 cm')).toBeInTheDocument();
    expect(screen.queryByText('Longueur Manche')).not.toBeInTheDocument();
  });
});
