import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { PaymentsPage } from './PaymentsPage';
import { renderWithProviders } from '../testUtils';
import { paymentService } from '@services/api/payment.service';
import { orderService } from '@services/api/order.service';
import type { Order } from '@types';

const unpaid: Order = {
  id: 'o1',
  workshopId: 'ws-1',
  clientId: 'c1',
  orderNumber: 'AW-1',
  modelName: 'Robe',
  totalAmount: 20000,
  totalPaid: 5000,
  remainingBalance: 15000,
  status: 'EN_COURS',
  deliveryDeadline: '2026-10-01T00:00:00.000Z',
  createdAt: '2026-09-01T00:00:00.000Z',
  client: { id: 'c1', fullName: 'Awa Ndiaye', phone: '771234567' },
};

describe('PaymentsPage — flux d’encaissement', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(paymentService, 'listPayments').mockResolvedValue([]);
    vi.spyOn(orderService, 'listOrders').mockResolvedValue([unpaid]);
  });

  it('la modale reste ouverte et affiche le reçu après l’encaissement', async () => {
    vi.spyOn(paymentService, 'recordPayment').mockResolvedValue({
      id: 'p1',
      workshopId: 'ws-1',
      orderId: 'o1',
      receiptNumber: 'REC-2026-007',
      amount: 5000,
      method: 'CASH',
      channel: 'ORDER_BALANCE',
      paidAt: '2026-09-25T09:00:00.000Z',
      whatsAppLink: 'https://wa.me/221771234567?text=ok',
    });
    renderWithProviders(<PaymentsPage />);

    fireEvent.click((await screen.findAllByRole('button', { name: /Encaisser/ }))[0]);
    fireEvent.change(await screen.findByLabelText('Montant versé (FCFA) *'), {
      target: { value: '5000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Encaisser & Émettre le Reçu/ }));

    expect(await screen.findByText('Versement Enregistré !')).toBeInTheDocument();
    expect(screen.getByText('REC-2026-007')).toBeInTheDocument();
  });

  it('PERF-2 : la liste des commandes n’est chargée qu’une fois', async () => {
    renderWithProviders(<PaymentsPage />);
    fireEvent.click((await screen.findAllByRole('button', { name: /Encaisser/ }))[0]);
    await screen.findByRole('option', { name: /AW-1/ });
    expect(orderService.listOrders).toHaveBeenCalledTimes(1);
  });
});
