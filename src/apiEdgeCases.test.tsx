/**
 * Cas limites de l'API (routes inchangées) : le front affiche un message
 * clair, une seule fois, et ne plante pas.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { ApiError, request } from '@services/api/apiClient';
import { isRetryableError } from '@services/offlineQueue';
import { paymentService } from '@services/api/payment.service';
import { orderService } from '@services/api/order.service';
import { toast } from '@services/toast';
import { PaymentModal } from '@components/payments/PaymentModal';
import { PaymentsPage } from '@pages/PaymentsPage';
import { renderWithProviders } from './testUtils';
import type { Order } from '@types';

const order: Order = {
  id: 'o1',
  workshopId: 'ws-1',
  clientId: 'c1',
  orderNumber: 'AW-1',
  modelName: 'Robe',
  totalAmount: 20000,
  totalPaid: 5000,
  remainingBalance: 15000,
  status: 'EN_COURS',
  deliveryDeadline: '2026-10-01',
  createdAt: '2026-09-01',
  client: { id: 'c1', fullName: 'Awa Ndiaye', phone: '771234567' },
};

function submitAmount(value: string) {
  fireEvent.change(screen.getByLabelText('Montant versé (FCFA) *'), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: /Encaisser & Émettre le Reçu/ }));
}

describe('cas limites de l’API', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it('429 sans message : texte explicite « compte temporairement verrouillé »', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 429 })));
    await expect(request('/auth/login')).rejects.toThrow('compte temporairement verrouillé');
  });

  it('429 est retenté plus tard par la synchronisation, pas un 400', () => {
    expect(isRetryableError(new ApiError('Trop de requêtes', 429))).toBe(true);
    expect(isRetryableError(new ApiError('Commande obligatoire', 400))).toBe(false);
  });

  it('paiement sans commande : bloqué côté front avec un message, rien n’est envoyé', () => {
    const warning = vi.spyOn(toast, 'warning');
    const onSubmit = vi.fn();
    renderWithProviders(<PaymentModal onClose={vi.fn()} onSubmit={onSubmit} unpaidOrders={[]} />);

    submitAmount('5000');

    expect(onSubmit).not.toHaveBeenCalled();
    expect(warning).toHaveBeenCalledWith('Veuillez choisir la commande concernée par ce versement.');
  });

  it('whatsAppLink null : l’écran de reçu s’affiche avec un lien WhatsApp local', async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      id: 'p1',
      workshopId: 'ws-1',
      receiptNumber: 'REC-9',
      amount: 5000,
      method: 'CASH',
      channel: 'ORDER_BALANCE',
      paidAt: '2026-09-25T09:00:00Z',
      whatsAppLink: null,
    });
    renderWithProviders(<PaymentModal onClose={vi.fn()} onSubmit={onSubmit} unpaidOrders={[order]} />);

    submitAmount('5000');

    expect(await screen.findByText('REC-9')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /WhatsApp/ }).getAttribute('href')).toMatch(
      /^https:\/\/wa\.me\/221771234567\?text=/,
    );
  });

  it('422 (trop-perçu) : le message du serveur est affiché une seule fois', async () => {
    vi.spyOn(paymentService, 'listPayments').mockResolvedValue([]);
    vi.spyOn(orderService, 'listOrders').mockResolvedValue([order]);
    vi.spyOn(paymentService, 'recordPayment').mockRejectedValue(
      new ApiError('Le montant dépasse le reliquat restant (15 000 FCFA).', 422),
    );
    const error = vi.spyOn(toast, 'error');
    renderWithProviders(<PaymentsPage />);

    fireEvent.click((await screen.findAllByRole('button', { name: /Encaisser/ }))[0]);
    await screen.findByRole('option', { name: /AW-1/ });
    submitAmount('99900');

    await waitFor(() => expect(error).toHaveBeenCalledTimes(1));
    expect(error).toHaveBeenCalledWith('Le montant dépasse le reliquat restant (15 000 FCFA).');
    // Le formulaire reste affiché pour corriger le montant.
    expect(screen.getByLabelText('Montant versé (FCFA) *')).toBeInTheDocument();
  });
});
