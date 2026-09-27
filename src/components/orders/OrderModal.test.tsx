import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { OrderModal } from './OrderModal';
import { renderWithProviders } from '../../testUtils';
import { clientService } from '@services/api/client.service';
import type { Client, CreateOrderDto } from '@types';

const clients: Client[] = [
  {
    id: 'c1',
    workshopId: 'ws-1',
    fullName: 'Awa Ndiaye',
    phone: '771234567',
    gender: 'F',
    measurements: { tourTaille: 70 },
    createdAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'c2',
    workshopId: 'ws-1',
    fullName: 'Fatou Sow',
    phone: '781234567',
    gender: 'F',
    measurements: {},
    createdAt: '2026-09-01T00:00:00.000Z',
  },
];

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText('Modèle à confectionner *'), {
    target: { value: 'Robe marinière' },
  });
  fireEvent.change(screen.getByLabelText('Prix total (FCFA) *'), { target: { value: '25000' } });
  fireEvent.click(screen.getByRole('button', { name: /Enregistrer la Commande/ }));
}

describe('OrderModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('FE-2 : utilise les clientes fournies, présélectionne la première, sans appel réseau', () => {
    const listClients = vi.spyOn(clientService, 'listClients');
    renderWithProviders(<OrderModal onClose={vi.fn()} clients={clients} />);
    expect(screen.getByText('Awa Ndiaye')).toBeInTheDocument();
    expect(screen.getByText(/Tour de Taille/)).toBeInTheDocument();
    expect(listClients).not.toHaveBeenCalled();
  });

  it('FE-2 : sans liste fournie, lit les clientes via le cache TanStack Query', async () => {
    vi.spyOn(clientService, 'listClients').mockResolvedValue(clients);
    renderWithProviders(<OrderModal onClose={vi.fn()} />);
    expect(await screen.findByText('Awa Ndiaye')).toBeInTheDocument();
  });

  it('respecte la cliente présélectionnée', () => {
    renderWithProviders(
      <OrderModal onClose={vi.fn()} clients={clients} preselectedClientId="c2" />,
    );
    expect(screen.getByText('Fatou Sow')).toBeInTheDocument();
    expect(screen.queryByText('Awa Ndiaye')).not.toBeInTheDocument();
  });

  it('le prix total accepte un montant rond (pas de 100 aligné sur min)', () => {
    renderWithProviders(<OrderModal onClose={vi.fn()} clients={clients} />);
    const total = screen.getByLabelText('Prix total (FCFA) *') as HTMLInputElement;
    fireEvent.change(total, { target: { value: '25000' } });
    // Avec min=1 et step=100, 25000 était invalide : le navigateur bloquait l'envoi.
    expect(total.validity.valid).toBe(true);
  });

  it('ARC-3 : réutilise les mêmes identifiants lors d’une relance après échec', async () => {
    const onSubmit = vi
      .fn<(dto: CreateOrderDto) => Promise<void>>()
      .mockRejectedValueOnce(new Error('Réseau'))
      .mockResolvedValueOnce(undefined);
    const onClose = vi.fn();
    renderWithProviders(<OrderModal onClose={onClose} clients={clients} onSubmit={onSubmit} />);

    fillAndSubmit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Enregistrer la Commande/ })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer la Commande/ }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());

    const [first, second] = onSubmit.mock.calls.map(([dto]) => dto);
    expect(second.clientMutationId).toBe(first.clientMutationId);
    expect(second.id).toBe(first.id);
    expect(first.clientId).toBe('c1');
  });
});
