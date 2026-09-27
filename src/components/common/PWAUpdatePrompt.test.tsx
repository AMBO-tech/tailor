import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const updateServiceWorker = vi.fn();
const setNeedRefresh = vi.fn();
let needRefresh = false;

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [false, vi.fn()],
    updateServiceWorker,
  }),
}));

import { PWAUpdatePrompt } from './PWAUpdatePrompt';

describe('PWAUpdatePrompt', () => {
  beforeEach(() => {
    updateServiceWorker.mockClear();
    setNeedRefresh.mockClear();
  });

  it('ne rend rien sans mise à jour en attente', () => {
    needRefresh = false;
    const { container } = render(<PWAUpdatePrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it('propose la mise à jour et active le nouveau service worker', () => {
    needRefresh = true;
    render(<PWAUpdatePrompt />);
    expect(screen.getByRole('status')).toHaveTextContent('Nouvelle version disponible');

    fireEvent.click(screen.getByRole('button', { name: 'Mettre à jour' }));
    expect(updateServiceWorker).toHaveBeenCalledWith(true);
  });

  it('peut être reportée', () => {
    needRefresh = true;
    render(<PWAUpdatePrompt />);
    fireEvent.click(screen.getByRole('button', { name: 'Mettre à jour plus tard' }));
    expect(setNeedRefresh).toHaveBeenCalledWith(false);
  });
});
