/** Invitation : page publique /join, connexion automatique et refus « forfait plein ». */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { AppRoutes } from '@routes';
import { ToastContainer } from '@components/common';
import { renderWithProviders, createTestQueryClient } from '../testUtils';
import { INVITE_TOKEN, installFakeApi, seedSession } from '../testFakeApi';
import { extractJoinedWorkshopName, prioritizeWorkshop, readInvitationToken } from '@utils/invitation';
import type { Workshop } from '@types';

function renderApp(route: string) {
  return renderWithProviders(
    <>
      <ToastContainer />
      <AppRoutes />
    </>,
    createTestQueryClient(),
    route,
  );
}

function fillJoinForm(pin = '1234') {
  fireEvent.change(screen.getByLabelText('Numéro de téléphone invité'), { target: { value: '77 111 22 33' } });
  fireEvent.change(screen.getByLabelText('Nom complet *'), { target: { value: 'Awa Ndiaye' } });
  fireEvent.change(screen.getByLabelText(/Code PIN secret/), { target: { value: pin } });
  fireEvent.click(screen.getByRole('button', { name: /Rejoindre l'atelier/ }));
}

describe('rejoindre un atelier (/join)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('accepte l’invitation (?token=), se connecte et active l’atelier rejoint', async () => {
    const { fetchMock } = installFakeApi();
    renderApp(`/join?token=${INVITE_TOKEN}`);
    fillJoinForm();

    expect(await screen.findByText("Bienvenue dans l'atelier Keur Couture ✨")).toBeInTheDocument();
    await waitFor(() => expect(localStorage.getItem('tailor_workshop_id')).toBe('ws-2'));
    expect(localStorage.getItem('tailor_token')).toBe('jwt');

    const joinCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/workshops/join'));
    expect(JSON.parse(String(joinCall?.[1]?.body))).toEqual({ token: INVITE_TOKEN, fullName: 'Awa Ndiaye', pin: '1234' });
    const loginCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/auth/login'));
    expect(JSON.parse(String(loginCall?.[1]?.body))).toEqual({ phone: '771112233', pin: '1234' });
  });

  it('accepte aussi le format /join/:token', async () => {
    installFakeApi();
    renderApp(`/join/${INVITE_TOKEN}`);
    fillJoinForm();
    await waitFor(() => expect(localStorage.getItem('tailor_workshop_id')).toBe('ws-2'));
  });

  it('lien expiré ou déjà utilisé : message clair et retour à la connexion', async () => {
    installFakeApi();
    renderApp('/join?token=jeton-expire-0000');
    fillJoinForm();
    expect(await screen.findByRole('alert')).toHaveTextContent("Lien d'invitation invalide ou expiré.");
    expect(screen.getByText(/Demandez un nouveau lien/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Rejoindre l'atelier/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: /Aller à la connexion/ }));
    expect(await screen.findByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
  });

  it('lien sans jeton : invitation invalide affichée d’emblée', async () => {
    installFakeApi();
    renderApp('/join');
    expect(await screen.findByRole('alert')).toHaveTextContent("Lien d'invitation invalide ou expiré.");
  });

  it('compte existant avec un autre PIN : invitation acceptée, renvoi vers la connexion', async () => {
    installFakeApi();
    renderApp(`/join?token=${INVITE_TOKEN}`);
    fillJoinForm('9999');
    expect(await screen.findByText(/votre code PIN habituel\./)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
    expect(localStorage.getItem('tailor_token')).toBeNull();
  });

  it('erreur réseau ou autre : message affiché dans le formulaire', async () => {
    installFakeApi();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ message: 'Erreur interne' }), { status: 500 })));
    renderApp(`/join?token=${INVITE_TOKEN}`);
    fillJoinForm();
    expect(await screen.findByText('Erreur interne')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Rejoindre l'atelier/ })).toBeInTheDocument();
  });
});

describe('invitation refusée (403 forfait plein)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    seedSession();
  });

  it('affiche le message du serveur sous le champ, sans lien WhatsApp', async () => {
    const { db } = installFakeApi();
    db.inviteLimitReached = true;
    renderApp('/settings');
    fireEvent.click(await screen.findByRole('button', { name: /Nouveau membre/ }));
    fireEvent.change(screen.getByLabelText('Numéro de téléphone du collaborateur'), { target: { value: '761112233' } });
    fireEvent.click(screen.getAllByRole('button', { name: /Inviter/ }).at(-1)!);

    const refusal = await screen.findByText('Le forfait SOLO est limité à 1 employé. Passez au forfait EQUIPE pour inviter davantage.');
    expect(refusal.closest('[role="alert"]')).not.toBeNull();
    expect(screen.queryByRole('link', { name: /Envoyer sur WhatsApp/ })).not.toBeInTheDocument();

    db.inviteLimitReached = false;
    fireEvent.change(screen.getByLabelText('Numéro de téléphone du collaborateur'), { target: { value: '761112233' } });
    fireEvent.click(screen.getAllByRole('button', { name: /Inviter/ }).at(-1)!);
    expect(await screen.findByRole('link', { name: /Envoyer sur WhatsApp/ })).toBeInTheDocument();
    expect(screen.queryByText(/Le forfait SOLO est limité/)).not.toBeInTheDocument();
  });
});

describe('utils/invitation', () => {
  const ws = (workshopId: string, name: string): Workshop => ({ workshopId, name, codePrefix: 'X', role: 'EMPLOYEE' });

  it('readInvitationToken : ?token= prioritaire, segment de route, jeton trop court', () => {
    expect(readInvitationToken(new URLSearchParams('token=abcdefgh12'), 'autre-jeton-1')).toBe('abcdefgh12');
    expect(readInvitationToken(new URLSearchParams(''), 'jeton-de-route')).toBe('jeton-de-route');
    expect(readInvitationToken(new URLSearchParams('token=abc'))).toBeNull();
    expect(readInvitationToken(new URLSearchParams(''))).toBeNull();
  });

  it('extractJoinedWorkshopName : message de l’API ou format inconnu', () => {
    expect(extractJoinedWorkshopName("Vous avez rejoint l'Atelier Keur Couture avec succès")).toBe('Keur Couture');
    expect(extractJoinedWorkshopName('ok')).toBeNull();
    expect(extractJoinedWorkshopName(undefined)).toBeNull();
  });

  it('prioritizeWorkshop : place l’atelier rejoint en tête sans modifier la liste', () => {
    const list = [ws('a', 'Atelier A'), ws('b', 'Keur Couture')];
    expect(prioritizeWorkshop(list, 'keur couture').map((w) => w.workshopId)).toEqual(['b', 'a']);
    expect(list.map((w) => w.workshopId)).toEqual(['a', 'b']);
    expect(prioritizeWorkshop(list, 'Atelier A')).toBe(list);
    expect(prioritizeWorkshop(list, null)).toBe(list);
    expect(prioritizeWorkshop(list, 'Inconnu')).toBe(list);
  });
});
