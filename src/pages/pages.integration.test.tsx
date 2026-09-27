/**
 * Tests d'intégration des écrans : routes réelles, hooks et composants réels,
 * API simulée au niveau de `fetch` (mêmes routes et formats que le back).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { AppRoutes } from '@routes';
import { ToastContainer } from '@components/common';
import { renderWithProviders, createTestQueryClient } from '../testUtils';
import { installFakeApi, seedSession } from '../testFakeApi';

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

describe('écrans de l’application', () => {
  let openSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    seedSession();
    openSpy = vi.fn();
    vi.stubGlobal('open', openSpy);
  });

  afterEach(() => vi.unstubAllGlobals());

  describe('routes', () => {
    it('redirige vers la connexion sans session', async () => {
      localStorage.clear();
      installFakeApi();
      renderApp('/orders');
      expect(await screen.findByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
    });

    it('redirige un utilisateur connecté de /login vers l’accueil', async () => {
      installFakeApi();
      renderApp('/login');
      expect(await screen.findByText('Créer une Nouvelle Commande')).toBeInTheDocument();
    });

    it('affiche la page 404 et permet de revenir à l’accueil', async () => {
      installFakeApi();
      renderApp('/inconnue');
      expect(screen.getByText('Page Introuvable (404)')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Retour à l'accueil/ }));
      expect(await screen.findByText('Créer une Nouvelle Commande')).toBeInTheDocument();
    });
  });

  describe('tableau de bord', () => {
    it('affiche indicateurs, urgences et derniers encaissements, puis navigue', async () => {
      installFakeApi();
      renderApp('/');
      expect(await screen.findByText('Reliquats à encaisser')).toBeInTheDocument();
      expect(await screen.findAllByText('Robe marinière')).not.toHaveLength(0);
      expect(screen.getAllByText(/REC-2026-001/).length).toBeGreaterThan(0);

      fireEvent.click(screen.getByText('Commandes en cours'));
      expect(await screen.findByRole('button', { name: 'Toutes' })).toBeInTheDocument();
    });

    it('actions rapides : nouvelle cliente, nouvelle commande et encaissement', async () => {
      const { db } = installFakeApi();
      renderApp('/');
      await screen.findByText('Reliquats à encaisser');

      fireEvent.click(screen.getByText('Ajouter Cliente'));
      const clientDialog = await screen.findByRole('dialog', { name: /Nouvelle cliente/ });
      fireEvent.change(within(clientDialog).getByLabelText('Nom complet *'), { target: { value: 'Aïda Ba' } });
      fireEvent.change(within(clientDialog).getByLabelText('Téléphone *'), { target: { value: '77 555 44 33' } });
      fireEvent.click(within(clientDialog).getByRole('button', { name: /Enregistrer la cliente/ }));
      await waitFor(() => expect(db.clients.some((c) => c.fullName === 'Aïda Ba')).toBe(true));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

      fireEvent.click(screen.getByText('Créer une Nouvelle Commande'));
      const orderDialog = await screen.findByRole('dialog', { name: 'Nouvelle Commande' });
      fireEvent.click(within(orderDialog).getByRole('button', { name: /Fermer/ }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

      fireEvent.click(screen.getByText('Encaisser Acompte'));
      expect(await screen.findByRole('dialog', { name: 'Encaisser un Versement' })).toBeInTheDocument();
    });
  });

  describe('commandes', () => {
    it('liste, filtre, recherche et change le statut d’une commande', async () => {
      const { db } = installFakeApi();
      renderApp('/orders');
      expect(await screen.findByText('Robe marinière')).toBeInTheDocument();
      expect(screen.getByText('Grand boubou')).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText('Rechercher une commande'), { target: { value: 'boubou' } });
      await waitFor(() => expect(screen.queryByText('Robe marinière')).not.toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Effacer la recherche' }));
      expect(await screen.findByText('Robe marinière')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Terminées' }));
      await waitFor(() => expect(screen.queryByText('Robe marinière')).not.toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: 'Toutes' }));
      await screen.findByText('Robe marinière');

      fireEvent.click(screen.getByRole('button', { name: /Terminer/ }));
      await waitFor(() => expect(db.orders[0].status).toBe('TERMINE'));
    });

    it('actions d’une carte : mesures, photo, WhatsApp, annulation et encaissement', async () => {
      const { db } = installFakeApi();
      renderApp('/orders');
      await screen.findByText('Robe marinière');

      fireEvent.click(screen.getAllByRole('button', { name: 'Consulter les mesures' })[0]);
      const measures = await screen.findByRole('dialog', { name: 'Mesures de Coupe' });
      expect(within(measures).getByText('140 cm')).toBeInTheDocument();
      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

      fireEvent.click(screen.getByTitle('Voir la photo du tissu'));
      expect(await screen.findByRole('dialog', { name: 'Photo du tissu' })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));

      fireEvent.click(screen.getAllByRole('button', { name: 'Envoyer point sur WhatsApp' })[0]);
      expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('https://wa.me/221771234567'), '_blank');

      fireEvent.click(screen.getByRole('button', { name: 'Annuler la commande' }));
      const confirm = await screen.findByRole('dialog');
      fireEvent.click(within(confirm).getAllByRole('button').at(-1)!);
      await waitFor(() => expect(db.orders[0].status).toBe('ANNULE'));

      fireEvent.click(screen.getAllByRole('button', { name: /^Encaisser$/ })[0]);
      expect(await screen.findByRole('dialog', { name: 'Encaisser un Versement' })).toBeInTheDocument();
    });

    it('crée une commande complète depuis la page', async () => {
      const { db } = installFakeApi();
      renderApp('/orders');
      await screen.findByText('Robe marinière');
      fireEvent.click(screen.getAllByRole('button', { name: /Nouvelle/ })[0]);
      const dialog = await screen.findByRole('dialog', { name: 'Nouvelle Commande' });

      fireEvent.change(within(dialog).getByLabelText('Modèle à confectionner *'), { target: { value: 'Taille basse' } });
      fireEvent.change(within(dialog).getByLabelText('Prix total (FCFA) *'), { target: { value: '30000' } });
      fireEvent.click(within(dialog).getByRole('button', { name: '50%' }));
      fireEvent.click(within(dialog).getByRole('button', { name: 'Wave' }));
      fireEvent.click(within(dialog).getByRole('button', { name: /Renseigner mesures|Modifier mesures/ }));
      const drawer = await screen.findByRole('dialog', { name: 'Ajuster les Mesures' });
      fireEvent.click(within(drawer).getByRole('button', { name: 'Grand Boubou' }));
      fireEvent.change(within(drawer).getByLabelText('Épaule'), { target: { value: '45' } });
      fireEvent.click(within(drawer).getByRole('button', { name: /Valider les mesures/ }));

      fireEvent.click(within(dialog).getByRole('button', { name: /Enregistrer la Commande/ }));
      await waitFor(() => expect(db.orders.some((o) => o.modelName === 'Taille basse')).toBe(true));
      const created = db.orders.find((o) => o.modelName === 'Taille basse')!;
      expect(created).toMatchObject({ totalAmount: 30000, depositAmount: 15000, paymentMethod: 'WAVE' });
    });
  });

  describe('clientes', () => {
    it('liste, modifie une fiche, consulte les mesures, contacte et commande', async () => {
      const { db } = installFakeApi();
      renderApp('/clients');
      expect(await screen.findByText('Fatou Diop')).toBeInTheDocument();

      fireEvent.click(screen.getAllByRole('button', { name: 'Modifier fiche & mesures' })[0]);
      const edit = await screen.findByRole('dialog', { name: 'Modifier la cliente' });
      fireEvent.change(within(edit).getByLabelText('Notes & Préférences (Optionnel)'), { target: { value: 'Col rond' } });
      fireEvent.click(within(edit).getByRole('button', { name: 'Homme' }));
      fireEvent.click(within(edit).getByRole('button', { name: 'Femme' }));
      fireEvent.change(within(edit).getByLabelText('Épaule'), { target: { value: '44' } });
      fireEvent.click(within(edit).getByRole('button', { name: /Enregistrer les modifications/ }));
      await waitFor(() => expect(db.clients[0].notes).toBe('Col rond'));

      fireEvent.click(await screen.findByRole('button', { name: 'Voir le carnet de mesures de Fatou Diop' }));
      const measures = await screen.findByRole('dialog', { name: 'Mesures de Coupe' });
      fireEvent.click(within(measures).getAllByRole('button', { name: 'Fermer' })[0]);

      fireEvent.click(screen.getAllByRole('button', { name: 'Contacter sur WhatsApp' })[0]);
      expect(openSpy).toHaveBeenCalled();

      fireEvent.click(screen.getAllByRole('button', { name: /Commander/ })[0]);
      expect(await screen.findByRole('dialog', { name: 'Nouvelle Commande' })).toBeInTheDocument();
    });

    it('recherche différée et création d’une cliente', async () => {
      const { db, fetchMock } = installFakeApi();
      renderApp('/clients');
      await screen.findByText('Fatou Diop');

      fireEvent.change(screen.getByLabelText('Rechercher une cliente'), { target: { value: 'Moussa' } });
      await waitFor(() =>
        expect(fetchMock.mock.calls.some(([url]) => String(url).includes('q=Moussa'))).toBe(true),
      );

      fireEvent.click(screen.getAllByRole('button', { name: /Nouvelle|Ajouter/ })[0]);
      const dialog = await screen.findByRole('dialog', { name: /Nouvelle cliente/ });
      fireEvent.change(within(dialog).getByLabelText('Nom complet *'), { target: { value: 'Khady Ndiaye' } });
      fireEvent.change(within(dialog).getByLabelText('Téléphone *'), { target: { value: '12' } });
      fireEvent.click(within(dialog).getByRole('button', { name: /Enregistrer la cliente/ }));
      expect(await screen.findByText(/numéro de téléphone sénégalais valide/)).toBeInTheDocument();

      fireEvent.change(within(dialog).getByLabelText('Téléphone *'), { target: { value: '76 111 22 33' } });
      fireEvent.click(within(dialog).getByRole('button', { name: /Enregistrer la cliente/ }));
      await waitFor(() => expect(db.clients.some((c) => c.fullName === 'Khady Ndiaye')).toBe(true));
    });
  });

  describe('encaissements', () => {
    it('liste les versements, renvoie le reçu WhatsApp et ouvre le ticket', async () => {
      installFakeApi();
      renderApp('/payments');
      expect(await screen.findByText(/REC-2026-001/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /WhatsApp/ }));
      expect(openSpy).toHaveBeenCalledWith('https://wa.me/221771234567?text=recu', '_blank');
      fireEvent.click(screen.getByRole('button', { name: /Ticket/ }));
      expect(await screen.findByRole('dialog', { name: 'Aperçu du Reçu de Caisse' })).toBeInTheDocument();
    });

    it('ouvre la modale d’encaissement pré-remplie depuis ?orderId=', async () => {
      installFakeApi();
      renderApp('/payments?orderId=o1');
      const dialog = await screen.findByRole('dialog', { name: 'Encaisser un Versement' });
      await waitFor(() => expect(within(dialog).getByLabelText('Commande associée (Optionnel)')).toHaveValue('o1'));
      fireEvent.click(within(dialog).getByRole('button', { name: /Régler tout le reliquat/ }));
      expect(within(dialog).getByLabelText('Montant versé (FCFA) *')).toHaveValue(15000);
      fireEvent.click(within(dialog).getByRole('button', { name: 'Orange Money' }));
      fireEvent.click(within(dialog).getByRole('button', { name: 'Règlement / Solde' }));
      fireEvent.click(within(dialog).getByRole('button', { name: /Encaisser & Émettre le Reçu/ }));
      expect(await screen.findByText('Versement Enregistré !')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Imprimer le Reçu/ }));
      expect(await screen.findByRole('dialog', { name: 'Aperçu du Reçu de Caisse' })).toBeInTheDocument();
    });
  });

  describe('réglages', () => {
    it('affiche l’atelier, gère l’équipe, l’abonnement et la déconnexion', async () => {
      installFakeApi();
      renderApp('/settings');
      expect((await screen.findAllByText('Atelier Awa Couture')).length).toBeGreaterThan(0);
      expect(await screen.findByText('Ibrahima Fall')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Nouveau membre/ }));
      fireEvent.change(screen.getByLabelText('Numéro de téléphone du collaborateur'), { target: { value: '761112233' } });
      fireEvent.click(screen.getAllByRole('button', { name: /Inviter/ }).at(-1)!);
      expect(await screen.findByRole('link', { name: /Envoyer sur WhatsApp/ })).toHaveAttribute(
        'href',
        'https://wa.me/221761112233?text=invite',
      );

      fireEvent.click(screen.getAllByRole('button', { name: /Révoquer/ })[0]);
      const confirm = await screen.findByRole('dialog');
      fireEvent.click(within(confirm).getAllByRole('button').at(-1)!);

      fireEvent.click(screen.getByRole('button', { name: /Gérer l'offre/ }));
      const sub = await screen.findByRole('dialog', { name: 'Abonnement Sama Waay' });
      fireEvent.click(within(sub).getByRole('button', { name: /ÉQUIPE/ }));
      fireEvent.click(within(sub).getByRole('button', { name: 'Orange Money' }));
      fireEvent.click(within(sub).getByRole('button', { name: '3 mois' }));
      expect(await within(sub).findByText('77 672 31 36')).toBeInTheDocument();
      expect(within(sub).getByText('15 000 FCFA')).toBeInTheDocument();
      fireEvent.click(within(sub).getByRole('button', { name: /J'ai déjà payé/ }));
      const sheet = await screen.findByRole('dialog', { name: "J'ai déjà payé" });
      fireEvent.click(within(sheet).getByRole('button', { name: /Envoyer la demande/ }));
      expect(await within(sheet).findByText('Demande envoyée — activation dès vérification')).toBeInTheDocument();
      expect(openSpy).toHaveBeenLastCalledWith('https://wa.me/221776723136?text=abo', '_blank');
      fireEvent.click(within(sheet).getAllByRole('button', { name: 'Fermer' }).at(-1)!);
      expect(await within(sub).findByText('SW-ABO-001')).toBeInTheDocument();
      fireEvent.click(within(sub).getAllByRole('button', { name: 'Fermer' })[0]);

      fireEvent.click(screen.getAllByRole('button', { name: /^Se déconnecter$/ }).at(-1)!);
      expect(await screen.findByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
    });
  });

  describe('connexion', () => {
    it('affiche l’erreur du serveur puis se connecte', async () => {
      localStorage.clear();
      installFakeApi();
      renderApp('/login');

      fireEvent.change(screen.getByLabelText('Numéro de téléphone'), { target: { value: '77 111 22 33' } });
      fireEvent.change(screen.getByLabelText(/Code PIN/), { target: { value: '0000' } });
      fireEvent.click(screen.getByRole('button', { name: /Accéder à mon atelier/ }));
      expect(await screen.findByRole('alert')).toHaveTextContent('Téléphone ou code PIN incorrect');

      fireEvent.change(screen.getByLabelText(/Code PIN/), { target: { value: '1234' } });
      fireEvent.click(screen.getByRole('button', { name: /Accéder à mon atelier/ }));
      expect(await screen.findByText('Créer une Nouvelle Commande')).toBeInTheDocument();
      expect(localStorage.getItem('tailor_token')).toBe('jwt');
    });

    it('crée un atelier', async () => {
      localStorage.clear();
      installFakeApi();
      renderApp('/login');
      fireEvent.click(screen.getByRole('button', { name: 'Créer un atelier' }));
      fireEvent.change(screen.getByLabelText(/Nom complet/), { target: { value: 'Modou Fall' } });
      fireEvent.change(screen.getByLabelText(/Nom de l'atelier/), { target: { value: 'Keur Couture' } });
      fireEvent.change(screen.getByLabelText('Numéro de téléphone'), { target: { value: '771112233' } });
      fireEvent.change(screen.getByLabelText(/Code PIN/), { target: { value: '1234' } });
      fireEvent.click(screen.getByRole('button', { name: /Créer mon atelier/ }));
      expect(await screen.findByText('Créer une Nouvelle Commande')).toBeInTheDocument();
    });
  });
});
