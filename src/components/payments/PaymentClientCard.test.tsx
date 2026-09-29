import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Order } from '@types';
import {
  PaymentClientCard,
  computePaidPercent,
  formatAmount,
  formatClientPhone,
  getClientInitials,
} from './PaymentClientCard';

const TODAY = new Date('2026-09-29T10:00:00');

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'o-1',
    workshopId: 'w-1',
    clientId: 'c-1',
    orderNumber: 'AWA-2026-0007',
    modelName: 'Grand boubou brodé',
    totalAmount: 30000,
    totalPaid: 10000,
    remainingBalance: 20000,
    status: 'EN_COURS',
    deliveryDeadline: '2026-10-12',
    createdAt: '2026-09-20T09:00:00.000Z',
    client: { id: 'c-1', fullName: 'Awa Ndiaye', phone: '771234567' },
    ...overrides,
  } as Order;
}

describe('PaymentClientCard', () => {
  it("affiche l'identité de la cliente, sa commande et le reste à payer", () => {
    render(<PaymentClientCard order={makeOrder()} today={TODAY} />);

    expect(screen.getByRole('region', { name: 'Encaissement pour Awa Ndiaye' })).toBeInTheDocument();
    expect(screen.getByText('AN')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '77 123 45 67' })).toHaveAttribute('href', 'tel:771234567');
    expect(screen.getByText('#AWA-2026-0007')).toBeInTheDocument();
    expect(screen.getByText('Grand boubou brodé')).toBeInTheDocument();
    expect(screen.getByText('Reste à payer')).toBeInTheDocument();
    expect(screen.getByText('20 000 F')).toBeInTheDocument();
  });

  it('représente la part déjà payée par une barre de progression', () => {
    render(<PaymentClientCard order={makeOrder()} today={TODAY} />);
    expect(screen.getByRole('progressbar', { name: 'Part déjà payée' })).toHaveAttribute('aria-valuenow', '33');
  });

  it('signale une livraison en retard en rouge', () => {
    render(<PaymentClientCard order={makeOrder({ deliveryDeadline: '2026-09-26' })} today={TODAY} />);
    const line = screen.getByText(/j de retard/).closest('p');
    expect(line).toHaveClass('text-rose-600');
  });

  it('indique une commande soldée au lieu du reste à payer', () => {
    render(
      <PaymentClientCard order={makeOrder({ totalPaid: 30000, remainingBalance: 0 })} today={TODAY} />,
    );
    expect(screen.getByText('Commande entièrement soldée')).toBeInTheDocument();
    expect(screen.queryByText('Reste à payer')).not.toBeInTheDocument();
  });

  it('reste lisible sans cliente ni téléphone', () => {
    render(<PaymentClientCard order={makeOrder({ client: undefined })} today={TODAY} />);
    expect(screen.getByText('Cliente')).toBeInTheDocument();
    expect(screen.getByText('Téléphone non renseigné')).toBeInTheDocument();
  });
});

describe('getClientInitials', () => {
  it('prend les initiales des deux premiers mots, ou les deux premières lettres', () => {
    expect(getClientInitials('Awa Ndiaye')).toBe('AN');
    expect(getClientInitials('  fatou   diop sow ')).toBe('FD');
    expect(getClientInitials('Mariama')).toBe('MA');
    expect(getClientInitials('   ')).toBe('?');
  });
});

describe('formatClientPhone', () => {
  it("affiche le numéro au format local, sans l'indicatif 221", () => {
    expect(formatClientPhone('771234567')).toBe('77 123 45 67');
    expect(formatClientPhone('221771231234')).toBe('77 123 12 34');
    expect(formatClientPhone('+221 78 111 22 33')).toBe('78 111 22 33');
  });
});

describe('formatAmount', () => {
  it('sépare les milliers par une espace simple', () => {
    expect(formatAmount(30000)).toBe('30 000 F');
    expect(formatAmount(0)).toBe('0 F');
  });
});

describe('computePaidPercent', () => {
  it('borne le pourcentage entre 0 et 100', () => {
    expect(computePaidPercent(30000, 10000)).toBe(33);
    expect(computePaidPercent(30000, 45000)).toBe(100);
    expect(computePaidPercent(0, 5000)).toBe(0);
    expect(computePaidPercent(30000, -1)).toBe(0);
  });
});
