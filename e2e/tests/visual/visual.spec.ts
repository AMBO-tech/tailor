/**
 * Filet de sécurité visuel : captures de référence du design ACTUEL de la PWA TailorApp
 * (Sama Waay), avant refonte. Voir `e2e/README.md` pour le mode d'emploi complet.
 *
 * Toutes les requêtes API sont interceptées (voir `fixtures/legacy-api.ts`) : ces tests
 * ne dépendent d'aucun backend réel. L'horloge est figée (voir `tests/support/clock.ts`)
 * afin que toutes les dates affichées soient stables d'une exécution à l'autre.
 */

import { expect, test, type Page } from '@playwright/test';
import {
  buildDefaultDataset,
  buildManyOrdersDataset,
  buildRevenueHiddenDataset,
  buildSuspendedSubscriptionDataset,
  FixtureDataset,
} from '../../fixtures/data';
import { assertNoUnmockedRequests, installApiRoutes } from '../support/routes';
import { freezeClock } from '../support/clock';
import { seedAuthenticatedSession } from '../support/session';
import { waitForVisualStability } from '../support/stability';
import { FULL_PLAN_INVITE_PHONE, VALID_INVITE_TOKEN } from '../../fixtures/legacy-api';

interface OpenScreenOptions {
  /** Chemin relatif à ouvrir (ex. `/orders`). */
  path: string;
  /** Jeu de données à utiliser ; par défaut, le jeu de données neutre standard. */
  dataset?: FixtureDataset;
  /** Si `false`, aucune session n'est préremplie (écran public, ex. connexion). */
  authenticated?: boolean;
}

/**
 * Prépare un écran pour la capture : gèle l'horloge, installe les mocks d'API, prérempli
 * la session si nécessaire, navigue vers `path`, puis attend la stabilité visuelle.
 */
async function openScreen(page: Page, options: OpenScreenOptions) {
  const dataset = options.dataset ?? buildDefaultDataset();
  await freezeClock(page);
  const routesHandle = await installApiRoutes(page, dataset);

  if (options.authenticated !== false) {
    await seedAuthenticatedSession(page, dataset);
  }

  await page.goto(options.path);
  await waitForVisualStability(page);

  return { dataset, routesHandle };
}

test.describe('Filet de sécurité visuel — écrans actuels de Sama Waay', () => {
  test('écran de connexion', async ({ page }) => {
    const { routesHandle } = await openScreen(page, { path: '/login', authenticated: false });

    await expect(page).toHaveScreenshot('connexion.png', { fullPage: true });
    assertNoUnmockedRequests(routesHandle);
  });

  test('tableau de bord (accueil)', async ({ page }) => {
    const { routesHandle } = await openScreen(page, { path: '/' });

    await expect(page).toHaveScreenshot('tableau-de-bord.png', { fullPage: true });
    assertNoUnmockedRequests(routesHandle);
  });

  test('liste des commandes', async ({ page }) => {
    const { routesHandle } = await openScreen(page, { path: '/orders' });

    await expect(page).toHaveScreenshot('liste-commandes.png', { fullPage: true });
    assertNoUnmockedRequests(routesHandle);
  });

  test('fiche commande (carte)', async ({ page }) => {
    const { routesHandle } = await openScreen(page, { path: '/orders' });

    const firstOrderCard = page.locator('main div.space-y-3 > div').first();
    await expect(firstOrderCard).toBeVisible();
    await expect(firstOrderCard).toHaveScreenshot('fiche-commande.png');
    assertNoUnmockedRequests(routesHandle);
  });

  test('modale nouvelle commande', async ({ page }) => {
    const { routesHandle } = await openScreen(page, { path: '/orders' });

    await page.getByRole('button', { name: 'Nouvelle' }).click();
    await expect(page.getByText('Nouvelle Commande')).toBeVisible();
    await waitForVisualStability(page);

    await expect(page).toHaveScreenshot('modale-nouvelle-commande.png', { fullPage: true });
    assertNoUnmockedRequests(routesHandle);
  });

  test('liste des clientes', async ({ page }) => {
    const { routesHandle } = await openScreen(page, { path: '/clients' });

    await expect(page).toHaveScreenshot('liste-clientes.png', { fullPage: true });
    assertNoUnmockedRequests(routesHandle);
  });

  test('carnet de mesures (drawer)', async ({ page }) => {
    const { routesHandle } = await openScreen(page, { path: '/clients' });

    // La première carte affichant un carnet de coupe (les client·e·s sont triés par
    // ordre alphabétique ; « Aissatou Fall » n'a pas de mesures enregistrées).
    await page.getByText('Carnet de coupe').first().click();
    await expect(page.getByText('Mesures de Coupe')).toBeVisible();
    await waitForVisualStability(page);

    await expect(page).toHaveScreenshot('carnet-de-mesures.png', { fullPage: true });
    assertNoUnmockedRequests(routesHandle);
  });

  test('encaissements (liste des versements)', async ({ page }) => {
    const { routesHandle } = await openScreen(page, { path: '/payments' });

    await expect(page).toHaveScreenshot('encaissements.png', { fullPage: true });
    assertNoUnmockedRequests(routesHandle);
  });

  test('modale d’encaissement', async ({ page }) => {
    const { routesHandle } = await openScreen(page, { path: '/payments' });

    await page.getByRole('button', { name: 'Encaisser' }).click();
    await expect(page.getByText('Encaisser un Versement')).toBeVisible();
    await waitForVisualStability(page);

    await expect(page).toHaveScreenshot('modale-encaissement.png', { fullPage: true });
    assertNoUnmockedRequests(routesHandle);
  });

  // Écran de reçu rendu atteignable par fix/front-bugs (la modale n'est plus fermée
  // par la page avant l'affichage du reçu) : la capture est désormais active.
  test('modale de reçu', async ({ page }) => {
    const { routesHandle } = await openScreen(page, { path: '/payments' });

    await page.getByRole('button', { name: 'Encaisser' }).click();
    await expect(page.getByText('Encaisser un Versement')).toBeVisible();

    await page.getByPlaceholder('Ex: 10000').fill('10000');
    await page.getByRole('button', { name: 'Encaisser & Émettre le Reçu' }).click();
    await expect(page.getByText('Versement Enregistré !')).toBeVisible();

    await page.getByRole('button', { name: 'Imprimer le Reçu / Ticket Papier' }).click();
    await expect(page.getByText('Aperçu du Reçu de Caisse')).toBeVisible();
    await waitForVisualStability(page);

    await expect(page).toHaveScreenshot('modale-recu.png', { fullPage: true });
    assertNoUnmockedRequests(routesHandle);
  });

  test('réglages (atelier)', async ({ page }) => {
    const { routesHandle } = await openScreen(page, { path: '/settings' });

    await expect(page).toHaveScreenshot('reglages.png', { fullPage: true });
    assertNoUnmockedRequests(routesHandle);
  });

  test('modale d’abonnement', async ({ page }) => {
    const { routesHandle } = await openScreen(page, { path: '/settings' });

    await page.getByRole('button', { name: "Gérer l'offre" }).click();
    await expect(page.getByText('Abonnement Sama Waay')).toBeVisible();
    await waitForVisualStability(page);

    await expect(page).toHaveScreenshot('modale-abonnement.png', { fullPage: true });
    assertNoUnmockedRequests(routesHandle);
  });

  test('feuille « J’ai déjà payé »', async ({ page }) => {
    const { routesHandle } = await openScreen(page, { path: '/settings' });

    await page.getByRole('button', { name: "Gérer l'offre" }).click();
    await page.getByRole('button', { name: "J'ai déjà payé" }).click();
    await expect(page.getByRole('dialog', { name: "J'ai déjà payé" })).toBeVisible();
    await waitForVisualStability(page);

    await expect(page).toHaveScreenshot('feuille-deja-paye.png', { fullPage: true });
    assertNoUnmockedRequests(routesHandle);
  });

  test('demande d’abonnement envoyée', async ({ page }) => {
    await page.addInitScript(() => {
      window.open = () => null;
    });
    const { routesHandle } = await openScreen(page, { path: '/settings' });

    await page.getByRole('button', { name: "Gérer l'offre" }).click();
    await page.getByRole('button', { name: "J'ai déjà payé" }).click();
    await page.getByRole('button', { name: /Envoyer la demande/ }).click();
    await expect(page.getByText('Demande envoyée — activation dès vérification')).toBeVisible();
    await waitForVisualStability(page);

    await expect(page).toHaveScreenshot('demande-abonnement-envoyee.png', { fullPage: true });
    assertNoUnmockedRequests(routesHandle);
  });

  test('bandeau abonnement suspendu', async ({ page }) => {
    const { routesHandle } = await openScreen(page, {
      path: '/',
      dataset: buildSuspendedSubscriptionDataset(),
    });

    await expect(page.getByText('Abonnement expiré. Atelier en lecture seule.')).toBeVisible();
    await expect(page).toHaveScreenshot('bandeau-abonnement-suspendu.png', { fullPage: true });
    assertNoUnmockedRequests(routesHandle);
  });

  test('connexion administrateur', async ({ page }) => {
    const { routesHandle } = await openScreen(page, { path: '/admin/login', authenticated: false });
    await expect(page.getByRole('button', { name: /Accéder au back-office/ })).toBeVisible();
    await expect(page).toHaveScreenshot('admin-connexion.png', { fullPage: true });
    assertNoUnmockedRequests(routesHandle);
  });

  test('back-office : demandes « J’ai déjà payé »', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('tailor_admin_token', 'fixture-admin-token');
      window.localStorage.setItem(
        'tailor_admin_user',
        JSON.stringify({ id: 'usr-admin', phone: '', fullName: 'Équipe Sama Waay', systemRole: 'SUPER_ADMIN' }),
      );
    });
    const { routesHandle } = await openScreen(page, { path: '/admin', authenticated: false });
    await expect(page.getByText('SW-ABO-2026-0042')).toBeVisible();
    await waitForVisualStability(page);
    await expect(page).toHaveScreenshot('admin-demandes.png', { fullPage: true });
    assertNoUnmockedRequests(routesHandle);
  });

  test('back-office : ateliers', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('tailor_admin_token', 'fixture-admin-token');
      window.localStorage.setItem(
        'tailor_admin_user',
        JSON.stringify({ id: 'usr-admin', phone: '', fullName: 'Équipe Sama Waay', systemRole: 'SUPER_ADMIN' }),
      );
    });
    const { routesHandle } = await openScreen(page, { path: '/admin', authenticated: false });
    await page.getByRole('tab', { name: 'Ateliers' }).click();
    await expect(page.getByText('Keur Serigne Couture')).toBeVisible();
    await waitForVisualStability(page);
    await expect(page).toHaveScreenshot('admin-ateliers.png', { fullPage: true });
    assertNoUnmockedRequests(routesHandle);
  });

  test('rejoindre un atelier (invitation)', async ({ page }) => {
    const { routesHandle } = await openScreen(page, { path: `/join?token=${VALID_INVITE_TOKEN}`, authenticated: false });
    await expect(page.getByRole('button', { name: /Rejoindre l'atelier/ })).toBeVisible();
    await expect(page).toHaveScreenshot('rejoindre-atelier.png', { fullPage: true });
    assertNoUnmockedRequests(routesHandle);
  });

  test('invitation expirée', async ({ page }) => {
    const { routesHandle } = await openScreen(page, { path: '/join', authenticated: false });
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveScreenshot('invitation-expiree.png', { fullPage: true });
    assertNoUnmockedRequests(routesHandle);
  });

  test('invitation refusée (forfait plein)', async ({ page }) => {
    const { routesHandle } = await openScreen(page, { path: '/settings' });
    await page.getByRole('button', { name: /Nouveau membre/ }).click();
    await page.getByLabel('Numéro de téléphone du collaborateur').fill(FULL_PLAN_INVITE_PHONE);
    await page.getByRole('button', { name: /^Inviter$/ }).click();
    await expect(page.getByText(/Le forfait SOLO est limité/)).toBeVisible();
    await waitForVisualStability(page);
    await expect(page).toHaveScreenshot('invitation-forfait-plein.png', { fullPage: true });
    assertNoUnmockedRequests(routesHandle);
  });

  test('tableau de bord employé (chiffre d’affaires masqué)', async ({ page }) => {
    const { routesHandle } = await openScreen(page, { path: '/', dataset: buildRevenueHiddenDataset() });
    await expect(page.getByText('Reliquats à encaisser')).toBeVisible();
    await expect(page.getByText('Chiffre du mois')).toHaveCount(0);
    await expect(page).toHaveScreenshot('tableau-de-bord-employe.png', { fullPage: true });
    assertNoUnmockedRequests(routesHandle);
  });

  test('liste des commandes : bouton « Charger plus »', async ({ page }) => {
    const { routesHandle } = await openScreen(page, { path: '/orders', dataset: buildManyOrdersDataset() });
    const loadMore = page.getByRole('button', { name: 'Charger plus' });
    await loadMore.scrollIntoViewIfNeeded();
    await waitForVisualStability(page);
    await expect(page).toHaveScreenshot('liste-commandes-charger-plus.png');
    assertNoUnmockedRequests(routesHandle);
  });

  test('page introuvable (404)', async ({ page }) => {
    const { routesHandle } = await openScreen(page, {
      path: '/route-inexistante-e2e',
      authenticated: false,
    });

    await expect(page).toHaveScreenshot('page-404.png', { fullPage: true });
    assertNoUnmockedRequests(routesHandle);
  });
});
