/** Back-office : connexion admin, demandes « J'ai déjà payé », ateliers. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { AppRoutes } from '@routes';
import { ToastContainer } from '@components/common';
import { renderWithProviders, createTestQueryClient } from '../testUtils';
import { ADMIN_EMAIL, ADMIN_PASSWORD, installFakeApi, seedSession } from '../testFakeApi';
import {
  clearAdminSession,
  getAdminToken,
  hasAdminSession,
  saveAdminSession,
} from '@utils/adminSession';
import { unwrapList } from '@services/api/admin.service';

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

async function loginAsAdmin() {
  fireEvent.change(screen.getByLabelText('Adresse e-mail'), { target: { value: ADMIN_EMAIL } });
  fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: ADMIN_PASSWORD } });
  fireEvent.click(screen.getByRole('button', { name: /Accéder au back-office/ }));
  await screen.findByText('Back-office');
}

describe('espace administrateur', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('protège /admin : redirection vers la connexion sans session admin', async () => {
    installFakeApi();
    seedSession(); // une session atelier ne donne pas accès au back-office
    renderApp('/admin');
    expect(
      await screen.findByRole('button', { name: /Accéder au back-office/ }),
    ).toBeInTheDocument();
  });

  it('échec de connexion : message générique, aucune session créée', async () => {
    installFakeApi();
    renderApp('/admin/login');
    fireEvent.change(screen.getByLabelText('Adresse e-mail'), { target: { value: ADMIN_EMAIL } });
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'faux' } });
    fireEvent.click(screen.getByRole('button', { name: /Accéder au back-office/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou mot de passe incorrect.');
    expect(hasAdminSession()).toBe(false);
  });

  it('connexion, validation d’une demande, séparation des sessions et déconnexion', async () => {
    const { db } = installFakeApi();
    seedSession();
    renderApp('/admin/login');
    await loginAsAdmin();

    expect(getAdminToken()).toBe('admin-jwt');
    expect(localStorage.getItem('tailor_token')).toBe('jwt'); // session atelier intacte

    const card = (await screen.findByText('SW-ABO-2026-0042')).closest(
      'div.bg-white',
    ) as HTMLElement;
    expect(within(card).getByText('Tx : WV-778899')).toBeInTheDocument();
    fireEvent.click(within(card).getByRole('button', { name: /Valider/ }));
    const confirm = await screen.findByRole('dialog', { name: 'Valider ce paiement ?' });
    fireEvent.click(within(confirm).getByRole('button', { name: 'Valider' }));
    await waitFor(() => expect(db.adminPayments[0].status).toBe('CONFIRMED'));

    fireEvent.click(screen.getByRole('button', { name: 'Se déconnecter' }));
    expect(
      await screen.findByRole('button', { name: /Accéder au back-office/ }),
    ).toBeInTheDocument();
    expect(hasAdminSession()).toBe(false);
    expect(localStorage.getItem('tailor_token')).toBe('jwt');
  });

  it('refus avec motif obligatoire (3 caractères minimum)', async () => {
    const { db } = installFakeApi();
    saveAdminSession('admin-jwt', {
      id: 'adm',
      phone: '',
      fullName: 'Admin',
      systemRole: 'SUPER_ADMIN',
    });
    renderApp('/admin');

    fireEvent.click(await screen.findByRole('button', { name: /Refuser/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Refuser ce paiement ?' });
    const confirmButton = within(dialog).getByRole('button', { name: 'Refuser' });
    expect(confirmButton).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText('Motif du refus'), {
      target: { value: 'Aucun transfert reçu' },
    });
    expect(confirmButton).toBeEnabled();
    fireEvent.click(confirmButton);
    await waitFor(() =>
      expect(db.adminPayments[0]).toMatchObject({
        status: 'REJECTED',
        rejectionReason: 'Aucun transfert reçu',
      }),
    );
    clearAdminSession();
  });

  it('filtres de statut, recherche d’ateliers et activation manuelle', async () => {
    const { db } = installFakeApi();
    saveAdminSession('admin-jwt', {
      id: 'adm',
      phone: '',
      fullName: 'Admin',
      systemRole: 'SUPER_ADMIN',
    });
    renderApp('/admin');

    await screen.findByText('SW-ABO-2026-0042');
    fireEvent.click(screen.getByRole('button', { name: 'Validées' }));
    expect(await screen.findByText('SW-ABO-2026-0040')).toBeInTheDocument();
    expect(screen.queryByText('SW-ABO-2026-0042')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Toutes' }));
    await screen.findByText('SW-ABO-2026-0042');

    fireEvent.click(screen.getByRole('tab', { name: 'Ateliers' }));
    expect(await screen.findByText('Keur Couture')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Rechercher un atelier/), {
      target: { value: 'awa' },
    });
    await waitFor(() => expect(screen.queryByText('Keur Couture')).not.toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText(/Rechercher un atelier/), {
      target: { value: 'zzz' },
    });
    expect(await screen.findByText('Aucun atelier trouvé')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Rechercher un atelier/), {
      target: { value: '' },
    });

    const card = (await screen.findByText('Keur Couture')).closest('div.bg-white') as HTMLElement;
    expect(within(card).getByText('Expiré')).toBeInTheDocument();
    fireEvent.click(within(card).getByRole('button', { name: /Activer/ }));
    const dialog = await screen.findByRole('dialog', { name: "Activer l'abonnement" });
    fireEvent.click(within(dialog).getByRole('button', { name: 'ÉQUIPE' }));
    fireEvent.click(within(dialog).getByRole('button', { name: '6 mois' }));
    fireEvent.change(within(dialog).getByLabelText('Référence du paiement'), {
      target: { value: 'WAVE-1' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Activer' }));
    await waitFor(() =>
      expect(db.activations).toEqual([
        { workshopId: 'ws-2', plan: 'EQUIPE', durationMonths: 6, paymentReference: 'WAVE-1' },
      ]),
    );
    clearAdminSession();
  });

  it('session admin expirée (401) : retour à la connexion', async () => {
    installFakeApi();
    saveAdminSession('ancien-jeton', {
      id: 'adm',
      phone: '',
      fullName: 'Admin',
      systemRole: 'SUPER_ADMIN',
    });
    renderApp('/admin');
    await waitFor(() => expect(hasAdminSession()).toBe(false));
  });

  it('unwrapList accepte un tableau ou une page { data, nextCursor }', () => {
    expect(unwrapList([1, 2])).toEqual([1, 2]);
    expect(unwrapList({ data: [3], nextCursor: null })).toEqual([3]);
  });
});
