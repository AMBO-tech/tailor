import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MeasurementDrawerModal } from './MeasurementDrawerModal';

describe('MeasurementDrawerModal', () => {
  it('conserve la saisie quand aucune mesure n’est fournie en props', () => {
    render(<MeasurementDrawerModal onClose={vi.fn()} />);
    const [firstField] = screen.getAllByPlaceholderText('0');

    fireEvent.change(firstField, { target: { value: '140' } });

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
});
