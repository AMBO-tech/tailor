/** Composants secondaires : bannières, formulaires et capture photo. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SubscriptionSuspendedBanner } from './common/SubscriptionSuspendedBanner';
import { PWAInstallBanner } from './common/PWAInstallBanner';
import { InviteEmployeeForm } from './settings/InviteEmployeeForm';
import { ConnectionStatusCard } from './settings/ConnectionStatusCard';
import { PhotoCaptureInput } from './orders/PhotoCaptureInput';
import * as compressor from '@utils/imageCompressor';
import { checkServerHealth, measureNetworkLatency } from '@services/network';
import type { Workshop } from '@types';

const workshop = (status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED'): Workshop => ({
  workshopId: 'ws-1',
  name: 'Atelier',
  codePrefix: 'AW',
  role: 'OWNER',
  subscription: { plan: 'SOLO', status, currentPeriodEnd: '2099-01-01T00:00:00Z' },
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe('SubscriptionSuspendedBanner', () => {
  it('ne s’affiche que pour un abonnement suspendu et ouvre l’offre', () => {
    const onOpen = vi.fn();
    const { rerender, container } = render(
      <SubscriptionSuspendedBanner
        workshop={workshop('ACTIVE')}
        onOpenSubscriptionModal={onOpen}
      />,
    );
    expect(container).toBeEmptyDOMElement();

    rerender(
      <SubscriptionSuspendedBanner
        workshop={workshop('SUSPENDED')}
        onOpenSubscriptionModal={onOpen}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Renouveler/ }));
    expect(onOpen).toHaveBeenCalled();
  });
});

describe('PWAInstallBanner', () => {
  it('propose l’installation après beforeinstallprompt puis peut être ignorée', async () => {
    const prompt = vi.fn();
    render(<PWAInstallBanner />);
    const event = Object.assign(new Event('beforeinstallprompt'), {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
    });
    act(() => {
      window.dispatchEvent(event);
    });

    fireEvent.click(await screen.findByRole('button', { name: /Installer/ }));
    await waitFor(() => expect(prompt).toHaveBeenCalled());
  });

  it('est masquée une fois ignorée', async () => {
    render(<PWAInstallBanner />);
    act(() => {
      window.dispatchEvent(
        Object.assign(new Event('beforeinstallprompt'), {
          prompt: vi.fn(),
          userChoice: Promise.resolve({ outcome: 'dismissed', platform: 'web' }),
        }),
      );
    });
    fireEvent.click(await screen.findByRole('button', { name: "Ignorer l'installation" }));
    expect(screen.queryByRole('button', { name: /Installer/ })).not.toBeInTheDocument();
    expect(sessionStorage.getItem('pwa_banner_dismissed')).toBe('true');
  });
});

describe('InviteEmployeeForm', () => {
  it('invite le numéro saisi et affiche le lien WhatsApp', async () => {
    const onInvite = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <InviteEmployeeForm onInvite={onInvite} isLoading={false} inviteLink={null} />,
    );
    fireEvent.change(screen.getByLabelText('Ajouter un collaborateur'), {
      target: { value: ' 761112233 ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Inviter/ }));
    await waitFor(() => expect(onInvite).toHaveBeenCalledWith('761112233'));

    rerender(
      <InviteEmployeeForm onInvite={onInvite} isLoading={false} inviteLink="https://wa.me/x" />,
    );
    expect(screen.getByText(/Envoyer sur WhatsApp/)).toBeInTheDocument();
  });
});

describe('ConnectionStatusCard', () => {
  it('indique le mode en ligne ou hors ligne', () => {
    const { rerender } = render(<ConnectionStatusCard isOnline />);
    expect(screen.getByText('API Connectée')).toBeInTheDocument();
    rerender(<ConnectionStatusCard isOnline={false} />);
    expect(screen.getByText('Déconnecté')).toBeInTheDocument();
  });
});

describe('PhotoCaptureInput', () => {
  it('compresse la photo importée depuis la galerie', async () => {
    vi.spyOn(compressor, 'compressImage').mockResolvedValue('data:image/jpeg;base64,AAA');
    const onChange = vi.fn();
    const { container } = render(<PhotoCaptureInput value="" onChange={onChange} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File(['x'], 'tissu.png', { type: 'image/png' })] },
    });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('data:image/jpeg;base64,AAA'));
  });

  it('avec une photo : agrandir, supprimer, et repli caméra native sans getUserMedia', () => {
    const onChange = vi.fn();
    render(<PhotoCaptureInput value="data:image/jpeg;base64,AAA" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Agrandir la photo' }));
    expect(screen.getByRole('dialog', { name: 'Photo du tissu agrandie' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: "Fermer l'aperçu" }));

    fireEvent.click(screen.getByRole('button', { name: 'Reprendre la photo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer la photo' }));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('ouvre la caméra intégrée et affiche l’erreur si elle est refusée', async () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      mediaDevices: { getUserMedia: vi.fn().mockRejectedValue(new Error('Permission refusée')) },
    });
    render(<PhotoCaptureInput value="" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Prendre Photo/ }));
    expect(await screen.findByText('Permission refusée')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fermer la caméra' }));
    expect(screen.queryByRole('dialog', { name: 'Prise de Vue Tissu' })).not.toBeInTheDocument();
  });
});

describe('services/network', () => {
  it('vérifie la santé du serveur et mesure la latence', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok', { status: 200 })));
    expect(await checkServerHealth()).toBe(true);
    expect(await measureNetworkLatency()).toEqual(expect.any(Number));

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    expect(await checkServerHealth()).toBe(false);
    expect(await measureNetworkLatency()).toBeNull();
  });
});
