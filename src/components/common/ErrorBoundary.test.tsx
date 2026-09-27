import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

function Broken(): never {
  throw new Error('rendu cassé');
}

describe('ErrorBoundary (M-24)', () => {
  it('affiche ses enfants quand tout va bien', () => {
    render(
      <ErrorBoundary>
        <p>Contenu</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Contenu')).toBeInTheDocument();
  });

  it('remplace une erreur de rendu par un écran de secours', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Une erreur est survenue');
    expect(screen.getByRole('button', { name: /Recharger/ })).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
