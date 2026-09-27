import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { PaymentModal } from './PaymentModal';
import { renderWithProviders } from '../../testUtils';
import { api } from '@services/api';
import type { Order, RecordPaymentDto, RecordPaymentResponse } from '@types';

const order = (id: string, overrides: Partial<Order> = {}): Order => ({
  id,
  workshopId: 'ws-1',
  clientId: `c-${id}`,
  orderNumber: `AW-${id}`,
  modelName: 'Boubou',
  totalAmount: 20000,
  totalPaid: 5000,
  remainingBalance: 15000,
  status: 'EN_COURS',
  deliveryDeadline: '2026-10-01T00:00:00.000Z',
  createdAt: '2026-09-01T00:00:00.000Z',
  client: { id: `c-${id}`, fullName: `Cliente ${id}`, phone: '771234567' },
  ...overrides,
});

const response: RecordPaymentResponse = {
  id: 'p1',
  workshopId: 'ws-1',
  receiptNumber: 'REC-42',
  amount: 5000,
  method: 'CASH',
  channel: 'ORDER_BALANCE',
  paidAt: '2026-09-25T09:00:00.000Z',
  whatsAppLink: 'https://wa.me/221771234567?text=ok',
};

function fillAmountAndSubmit(value = '5000') {
  fireEvent.change(screen.getByLabelText('Montant versé (FCFA) *'), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: /Encaisser & Émettre le Reçu/ }));
}

describe('PaymentModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('affiche l’écran de reçu avec le numéro renvoyé par le serveur', async () => {
    const onSubmit = vi.fn().mockResolvedValue(response);
    renderWithProviders(
      <PaymentModal onClose={vi.fn()} onSubmit={onSubmit} unpaidOrders={[order('1')]} />,
    );

    fillAmountAndSubmit();

    expect(await screen.findByText('Versement Enregistré !')).toBeInTheDocument();
    expect(screen.getByText('REC-42')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /WhatsApp/ })).toHaveAttribute(
      'href',
      response.whatsAppLink,
    );
  });

  it('ARC-3 : réutilise les mêmes identifiants lors d’une relance après échec', async () => {
    const onSubmit = vi
      .fn<(dto: RecordPaymentDto) => Promise<RecordPaymentResponse>>()
      .mockRejectedValueOnce(new Error("Délai d'attente réseau dépassé"))
      .mockResolvedValueOnce(response);
    renderWithProviders(
      <PaymentModal onClose={vi.fn()} onSubmit={onSubmit} unpaidOrders={[order('1')]} />,
    );

    fillAmountAndSubmit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Encaisser & Émettre le Reçu/ })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: /Encaisser & Émettre le Reçu/ }));
    await screen.findByText('Versement Enregistré !');

    const [first, second] = onSubmit.mock.calls.map(([dto]) => dto);
    expect(second.clientMutationId).toBe(first.clientMutationId);
    expect(second.id).toBe(first.id);
  });

  it('FE-3 : présélectionne la première commande sans rappeler l’API si la liste est fournie', () => {
    const listOrders = vi.spyOn(api, 'listOrders');
    renderWithProviders(
      <PaymentModal onClose={vi.fn()} unpaidOrders={[order('1'), order('2')]} />,
    );
    expect(screen.getByLabelText('Commande associée (Optionnel)')).toHaveValue('1');
    expect(listOrders).not.toHaveBeenCalled();
  });

  it('FE-3 : respecte la commande présélectionnée', () => {
    renderWithProviders(
      <PaymentModal
        onClose={vi.fn()}
        unpaidOrders={[order('1'), order('2')]}
        preselectedOrderId="2"
      />,
    );
    expect(screen.getByLabelText('Commande associée (Optionnel)')).toHaveValue('2');
  });

  it('charge les commandes actives en repli quand aucune liste n’est fournie', async () => {
    vi.spyOn(api, 'listOrders').mockResolvedValue([
      order('1'),
      order('2', { status: 'LIVRE', remainingBalance: 0 }),
    ]);
    renderWithProviders(<PaymentModal onClose={vi.fn()} />);
    await waitFor(() =>
      expect(screen.getByLabelText('Commande associée (Optionnel)')).toHaveValue('1'),
    );
    expect(screen.queryByRole('option', { name: /AW-2/ })).not.toBeInTheDocument();
  });

  it('le reçu imprimable garde les données de la commande au moment de l’encaissement', async () => {
    const onSubmit = vi.fn().mockResolvedValue(response);
    const { rerender } = renderWithProviders(
      <PaymentModal onClose={vi.fn()} onSubmit={onSubmit} unpaidOrders={[order('1')]} />,
    );
    fillAmountAndSubmit();
    await screen.findByText('Versement Enregistré !');

    // Après l'encaissement, la liste est rechargée : la commande soldée en disparaît.
    rerender(<PaymentModal onClose={vi.fn()} onSubmit={onSubmit} unpaidOrders={[]} />);
    fireEvent.click(screen.getByRole('button', { name: /Imprimer le Reçu/ }));

    const receipt = await screen.findByRole('dialog', { name: 'Aperçu du Reçu de Caisse' });
    expect(receipt).toHaveTextContent('Cliente 1');
    expect(receipt).toHaveTextContent('REC-42');
  });
});
