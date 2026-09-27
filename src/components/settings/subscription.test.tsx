import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { db } from '@db/db';
import { renderWithProviders } from '../../testUtils';
import { installFakeApi, seedSession, TEST_WORKSHOP } from '../../testFakeApi';
import { ManualPaymentSheet } from './ManualPaymentSheet';
import { SubscriptionModal } from './SubscriptionModal';
import { SubscriptionSuspendedBanner } from '@components/common/SubscriptionSuspendedBanner';
import { buildManualPaymentWhatsAppUrl } from '@hooks/useSubscription';
import { extractErrorMessage } from '@services/api/apiClient';
import { syncPendingMutations } from '@services/sync';
import { toast } from '@services/toast';
import type { Workshop } from '@types';

const workshop = TEST_WORKSHOP as Workshop;

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => value });
}

describe('abonnement : « J’ai déjà payé »', () => {
  let openSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.restoreAllMocks();
    seedSession();
    await db.pendingMutations.clear();
    openSpy = vi.fn();
    vi.stubGlobal('open', openSpy);
    setOnline(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setOnline(true);
  });

  it('affiche le numéro de transfert de la config et le copie', async () => {
    installFakeApi();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    renderWithProviders(<SubscriptionModal isOpen onClose={vi.fn()} workshop={workshop} />);

    expect(await screen.findByText('77 672 31 36')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Copier le numéro' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('+221776723136'));
  });

  it('envoie la demande avec un clientMutationId stable et ouvre le lien WhatsApp de l’API', async () => {
    const { db: api, fetchMock } = installFakeApi();
    renderWithProviders(
      <ManualPaymentSheet
        workshop={workshop}
        plan="SOLO"
        months={6}
        amount={18000}
        defaultMethod="WAVE"
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Free Money' }));
    fireEvent.change(screen.getByLabelText('ID de transaction (facultatif)'), {
      target: { value: ' TX-42 ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Envoyer la demande/ }));

    expect(
      await screen.findByText('Demande envoyée — activation dès vérification'),
    ).toBeInTheDocument();
    expect(screen.getByText('SW-ABO-001')).toBeInTheDocument();
    expect(openSpy).toHaveBeenCalledWith('https://wa.me/221776723136?text=abo', '_blank');
    const call = fetchMock.mock.calls.find(([url]) =>
      String(url).endsWith('/subscriptions/manual-payments'),
    )!;
    const body = JSON.parse(String(call[1]?.body));
    expect(body).toMatchObject({
      plan: 'SOLO',
      months: 6,
      method: 'FREE_MONEY',
      transactionRef: 'TX-42',
    });
    expect(body.clientMutationId).toEqual(expect.any(String));
    expect(api.subscriptionPayments).toHaveLength(1);
  });

  it('409 (3 demandes en attente) : message du serveur, feuille toujours ouverte', async () => {
    const { db: api } = installFakeApi();
    for (let i = 0; i < 3; i++) {
      api.subscriptionPayments.push({
        id: `x${i}`,
        clientMutationId: `c${i}`,
        reference: `R${i}`,
        plan: 'SOLO',
        months: 1,
        amount: 3000,
        method: 'WAVE',
        status: 'PENDING',
        createdAt: 'x',
      });
    }
    const error = vi.spyOn(toast, 'error');
    renderWithProviders(
      <ManualPaymentSheet
        workshop={workshop}
        plan="SOLO"
        months={1}
        amount={3000}
        defaultMethod="WAVE"
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Envoyer la demande/ }));
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith('Vous avez déjà 3 demandes en attente de validation.'),
    );
    expect(openSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Envoyer la demande/ })).toBeInTheDocument();
  });

  it('hors ligne : mise en file, WhatsApp ouvert quand même (lien local), puis synchronisation', async () => {
    const { db: api } = installFakeApi();
    setOnline(false);
    renderWithProviders(
      <ManualPaymentSheet
        workshop={workshop}
        plan="EQUIPE"
        months={1}
        amount={5000}
        defaultMethod="ORANGE_MONEY"
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Envoyer la demande/ }));

    expect(
      await screen.findByText('Demande envoyée — activation dès vérification'),
    ).toBeInTheDocument();
    expect(openSpy.mock.calls[0][0]).toMatch(/^https:\/\/wa\.me\/221776723136\?text=/);
    expect(decodeURIComponent(openSpy.mock.calls[0][0])).toContain('Forfait : EQUIPE (1 mois)');
    expect(await db.pendingMutations.count()).toBe(1);

    setOnline(true);
    await syncPendingMutations();
    expect(api.subscriptionPayments).toHaveLength(1);
    expect(await db.pendingMutations.count()).toBe(0);
  });

  it('lien WhatsApp de repli construit localement', () => {
    const url = buildManualPaymentWhatsAppUrl({
      workshopName: 'Atelier Awa',
      codePrefix: 'AW',
      plan: 'SOLO',
      months: 3,
      amount: 9000,
      method: 'WAVE',
      reference: 'SW-1',
      transactionRef: 'TX',
    });
    const text = decodeURIComponent(url.split('text=')[1]);
    expect(url.startsWith('https://wa.me/221776723136?text=')).toBe(true);
    expect(text).toMatch(/Montant : 9\s000 FCFA/);
    expect(text).toContain('Référence : SW-1');
    expect(text).toContain('Transaction : TX');
  });

  it('les demandes en attente sont listées dans la modale', async () => {
    const { db: api } = installFakeApi();
    api.subscriptionPayments.push({
      id: 'p',
      clientMutationId: 'c',
      reference: 'SW-ABO-777',
      plan: 'SOLO',
      months: 1,
      amount: 3000,
      method: 'WAVE',
      status: 'PENDING',
      createdAt: 'x',
    });
    renderWithProviders(<SubscriptionModal isOpen onClose={vi.fn()} workshop={workshop} />);
    const list = await screen.findByText('Demandes en attente de validation');
    expect(within(list.parentElement!).getByText('SW-ABO-777')).toBeInTheDocument();
  });
});

describe('bandeau d’abonnement expiré', () => {
  it('suit isReadOnly de l’API quand il est fourni', () => {
    const onOpen = vi.fn();
    const { rerender, container } = render(
      <SubscriptionSuspendedBanner
        workshop={workshop}
        isReadOnly={false}
        onOpenSubscriptionModal={onOpen}
      />,
    );
    expect(container).toBeEmptyDOMElement();
    rerender(
      <SubscriptionSuspendedBanner
        workshop={workshop}
        isReadOnly
        onOpenSubscriptionModal={onOpen}
      />,
    );
    expect(screen.getByText('Abonnement expiré. Atelier en lecture seule.')).toBeInTheDocument();
  });
});

describe('extractErrorMessage', () => {
  it('lit un message simple ou un tableau de messages de validation', () => {
    expect(
      extractErrorMessage({ statusCode: 400, message: 'Forfait invalide', error: 'Bad Request' }),
    ).toBe('Forfait invalide');
    expect(
      extractErrorMessage({ message: ['months must not be greater than 12', 'Moyen invalide'] }),
    ).toBe('months must not be greater than 12 · Moyen invalide');
    expect(extractErrorMessage({})).toBeUndefined();
  });
});
