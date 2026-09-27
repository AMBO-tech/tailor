import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderCard } from './OrderCard';
import type { Order } from '@types';

const order: Order = {
  id: 'o1',
  workshopId: 'ws-1',
  clientId: 'c1',
  orderNumber: 'AW-1',
  modelName: 'Boubou',
  fabricPhotoUrl: 'https://cdn.test/tissu.jpg',
  totalAmount: 20000,
  totalPaid: 0,
  status: 'EN_COURS',
  deliveryDeadline: '2026-10-01T00:00:00.000Z',
  createdAt: '2026-09-01T00:00:00.000Z',
};

describe('OrderCard', () => {
  it('PERF-4 : la miniature du tissu est chargée paresseusement', () => {
    render(
      <OrderCard
        order={order}
        onUpdateStatus={vi.fn()}
        onRecordPayment={vi.fn()}
        onViewMeasurements={vi.fn()}
      />,
    );
    const img = screen.getByAltText('Tissu');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
  });
});
