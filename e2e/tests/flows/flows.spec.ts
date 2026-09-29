/**
 * Parcours e2e critiques (API simulée par les fixtures, horloge figée) :
 * 1. connexion → nouvelle commande → encaissement avec reçu ;
 * 2. encaissement hors ligne puis synchronisation au retour du réseau ;
 * 3. déconnexion qui vide le cache (aucune donnée de la session précédente).
 */
import { expect, test, type Page } from '@playwright/test';
import {
  buildDefaultDataset,
  buildManyOrdersDataset,
  type FixtureDataset,
} from '../../fixtures/data';
import { assertNoUnmockedRequests, installApiRoutes } from '../support/routes';
import { VALID_INVITE_TOKEN } from '../../fixtures/legacy-api';
import { freezeClock } from '../support/clock';
import { seedAuthenticatedSession } from '../support/session';

async function login(page: Page): Promise<void> {
  await page.getByLabel('Numéro de téléphone').fill('77 123 45 00');
  await page.getByLabel(/Code PIN/).fill('1234');
  await page.getByRole('button', { name: /Accéder à mon atelier/ }).click();
  await expect(page.getByText('Créer une Nouvelle Commande')).toBeVisible();
}

test.describe('Parcours critiques', () => {
  test('connexion → nouvelle commande → encaissement avec reçu', async ({ page }) => {
    await freezeClock(page);
    const routes = await installApiRoutes(page, buildDefaultDataset());
    await page.goto('/login');
    await login(page);

    await page.getByText('Créer une Nouvelle Commande').click();
    const orderDialog = page.getByRole('dialog', { name: 'Nouvelle Commande' });
    await expect(orderDialog).toBeVisible();
    await orderDialog.getByLabel('Modèle à confectionner *').fill('Robe de cérémonie');
    await orderDialog.getByLabel('Prix total (FCFA) *').fill('30000');
    const createOrder = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().endsWith('/orders'),
    );
    await orderDialog.getByRole('button', { name: /Enregistrer la Commande/ }).click();
    const orderRequest = await createOrder;
    expect(orderRequest.postDataJSON()).toMatchObject({
      modelName: 'Robe de cérémonie',
      totalAmount: 30000,
    });
    await expect(page.getByText(/Commande #CMD-2026-999 créée/)).toBeVisible();

    await page.getByText('Encaisser Acompte').click();
    const payDialog = page.getByRole('dialog', { name: 'Encaisser un Versement' });
    await payDialog.getByLabel('Montant versé (FCFA) *').fill('10000');
    await payDialog.getByRole('button', { name: /Encaisser & Émettre le Reçu/ }).click();
    await expect(page.getByText('Versement Enregistré !')).toBeVisible();
    await expect(page.getByText('REC-2026-0099')).toBeVisible();
    await expect(page.getByRole('link', { name: /Envoyer le Reçu par WhatsApp/ })).toHaveAttribute(
      'href',
      /^https:\/\/wa\.me\//,
    );

    await page.getByRole('button', { name: /Imprimer le Reçu/ }).click();
    await expect(page.getByRole('dialog', { name: 'Aperçu du Reçu de Caisse' })).toBeVisible();
    assertNoUnmockedRequests(routes);
  });

  test('encaissement hors ligne puis synchronisation', async ({ page, context }) => {
    const dataset = buildDefaultDataset();
    await freezeClock(page);
    const routes = await installApiRoutes(page, dataset);
    await seedAuthenticatedSession(page, dataset);
    await page.goto('/payments');
    await expect(page.getByText('REC-2026-0031')).toBeVisible();

    await context.setOffline(true);
    await page.getByRole('button', { name: 'Encaisser' }).click();
    const payDialog = page.getByRole('dialog', { name: 'Encaisser un Versement' });
    await payDialog.getByLabel('Montant versé (FCFA) *').fill('5000');
    await payDialog.getByRole('button', { name: /Encaisser & Émettre le Reçu/ }).click();

    // Enregistré sur le téléphone : reçu local, indicateur « Hors ligne · 1 en attente ».
    await expect(page.getByText('Versement Enregistré !')).toBeVisible();
    await expect(page.getByText(/Hors ligne : enregistré sur le téléphone/)).toBeVisible();
    await expect(
      page.getByRole('status').filter({ hasText: 'Hors ligne · 1 en attente' }),
    ).toBeVisible();
    await payDialog.getByRole('button', { name: 'Fermer' }).last().click();

    const synced = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().endsWith('/payments'),
    );
    await context.setOffline(false);
    const request = await synced;
    expect(request.postDataJSON()).toMatchObject({ amount: 5000 });
    await expect(page.getByText(/en attente/)).toHaveCount(0);
    assertNoUnmockedRequests(routes);
  });

  test('la déconnexion vide le cache de la session précédente', async ({ page }) => {
    const first = buildDefaultDataset();
    await freezeClock(page);
    await installApiRoutes(page, first);
    await seedAuthenticatedSession(page, first);
    await page.goto('/orders');
    await expect(page.getByText('Grand Boubou Brodé 3 pièces')).toBeVisible();

    await page.getByRole('button', { name: 'Se déconnecter' }).first().click();
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('tailor_token'))).toBeNull();

    // Nouvelle session : l'API ne renvoie plus qu'une seule commande.
    const second: FixtureDataset = {
      ...first,
      orders: first.orders.filter((o) => o.id === 'or-termine-reliquat'),
      payments: [],
    };
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    const routes = await installApiRoutes(page, second);
    await login(page);
    await page.getByRole('link', { name: /Commandes/ }).click();

    await expect(page.getByText('Taille Basse Wax Imprimé')).toBeVisible();
    await expect(page.getByText('Grand Boubou Brodé 3 pièces')).toHaveCount(0);
    assertNoUnmockedRequests(routes);
  });

  test('abonnement : « J’ai déjà payé » envoie la demande et ouvre WhatsApp', async ({ page }) => {
    const dataset = buildDefaultDataset();
    await freezeClock(page);
    await page.addInitScript(() => {
      (window as unknown as { __opened: string[] }).__opened = [];
      window.open = (url?: string | URL) => {
        (window as unknown as { __opened: string[] }).__opened.push(String(url));
        return null;
      };
    });
    const routes = await installApiRoutes(page, dataset);
    await seedAuthenticatedSession(page, dataset);
    await page.goto('/settings');

    await page.getByRole('button', { name: "Gérer l'offre" }).click();
    const modal = page.getByRole('dialog', { name: 'Abonnement Sama Waay' });
    await expect(modal.getByText('77 672 31 36')).toBeVisible();
    await modal.getByRole('button', { name: /ÉQUIPE/ }).click();
    await modal.getByRole('button', { name: '3 mois' }).click();
    await expect(modal.getByText('15 000 FCFA')).toBeVisible();
    await modal.getByRole('button', { name: "J'ai déjà payé" }).click();

    const sheet = page.getByRole('dialog', { name: "J'ai déjà payé" });
    await sheet.getByRole('button', { name: 'Free Money' }).click();
    await sheet.getByLabel('ID de transaction (facultatif)').fill('FM-123');
    const declared = page.waitForRequest((req) =>
      req.url().endsWith('/subscriptions/manual-payments'),
    );
    await sheet.getByRole('button', { name: /Envoyer la demande/ }).click();
    const body = (await declared).postDataJSON();
    expect(body).toMatchObject({
      plan: 'EQUIPE',
      months: 3,
      method: 'FREE_MONEY',
      transactionRef: 'FM-123',
    });
    expect(body.clientMutationId).toEqual(expect.any(String));

    await expect(sheet.getByText('Demande envoyée — activation dès vérification')).toBeVisible();
    await expect(sheet.getByText('SW-ABO-2026-0001')).toBeVisible();
    const opened = await page.evaluate(
      () => (window as unknown as { __opened: string[] }).__opened,
    );
    expect(opened).toEqual(['https://wa.me/221776723136?text=Abonnement']);
    assertNoUnmockedRequests(routes);
  });

  test('back-office : connexion admin puis validation d’une demande', async ({ page }) => {
    const dataset = buildDefaultDataset();
    await freezeClock(page);
    const routes = await installApiRoutes(page, dataset);
    await page.goto('/admin/login');

    await page.getByLabel('Adresse e-mail').fill('admin@samawaay.sn');
    await page.getByLabel('Mot de passe').fill('mauvais');
    await page.getByRole('button', { name: /Accéder au back-office/ }).click();
    await expect(page.getByRole('alert')).toHaveText(/E-mail ou mot de passe incorrect/);

    await page.getByLabel('Mot de passe').fill('Secret123!');
    await page.getByRole('button', { name: /Accéder au back-office/ }).click();
    await expect(page.getByText('SW-ABO-2026-0042')).toBeVisible();

    const confirmed = page.waitForRequest((req) => req.url().includes('/confirm'));
    await page.getByRole('button', { name: /^Valider$/ }).click();
    await page
      .getByRole('dialog', { name: 'Valider ce paiement ?' })
      .getByRole('button', { name: 'Valider' })
      .click();
    await confirmed;
    await expect(page.getByText(/Paiement validé/)).toBeVisible();
    assertNoUnmockedRequests(routes);
  });
  test('invitation : le lien /join?token= fait rejoindre l’atelier et connecte', async ({
    page,
  }) => {
    const dataset = buildDefaultDataset();
    await freezeClock(page);
    const routes = await installApiRoutes(page, dataset);
    await page.goto(`/join?token=${VALID_INVITE_TOKEN}`);

    await page.getByLabel('Numéro de téléphone invité').fill('77 123 45 00');
    await page.getByLabel('Nom complet *').fill('Awa Ndiaye');
    await page.getByLabel(/Code PIN/).fill('1234');
    const joined = page.waitForRequest((req) => req.url().endsWith('/workshops/join'));
    await page.getByRole('button', { name: /Rejoindre l'atelier/ }).click();
    expect((await joined).postDataJSON()).toEqual({
      token: VALID_INVITE_TOKEN,
      fullName: 'Awa Ndiaye',
      pin: '1234',
    });

    await expect(
      page.getByText(`Bienvenue dans l'atelier ${dataset.workshop.name} ✨`),
    ).toBeVisible();
    await expect(page.getByText('Créer une Nouvelle Commande')).toBeVisible();
    assertNoUnmockedRequests(routes);
  });

  test('invitation expirée : message clair, retour à la connexion', async ({ page }) => {
    await freezeClock(page);
    const routes = await installApiRoutes(page, buildDefaultDataset());
    await page.goto('/join?token=jeton-expire-0000');
    await page.getByLabel('Numéro de téléphone invité').fill('77 123 45 00');
    await page.getByLabel('Nom complet *').fill('Awa Ndiaye');
    await page.getByLabel(/Code PIN/).fill('1234');
    await page.getByRole('button', { name: /Rejoindre l'atelier/ }).click();
    await expect(page.getByRole('alert')).toHaveText(/Lien d'invitation invalide ou expiré/);
    await page.getByRole('link', { name: /Aller à la connexion/ }).click();
    await expect(page.getByRole('button', { name: /Accéder à mon atelier/ })).toBeVisible();
    assertNoUnmockedRequests(routes);
  });

  test('pagination : « Charger plus » demande la page suivante par curseur', async ({ page }) => {
    const dataset = buildManyOrdersDataset();
    await freezeClock(page);
    const routes = await installApiRoutes(page, dataset);
    await seedAuthenticatedSession(page, dataset);
    const firstPage = page.waitForRequest((req) => req.url().endsWith('/orders?limit=30'));
    await page.goto('/orders');
    await firstPage;

    await expect(page.getByText('Tenue n° 032')).toHaveCount(0);
    const nextPage = page.waitForRequest((req) => req.url().includes('/orders?limit=30&cursor='));
    await page.getByRole('button', { name: 'Charger plus' }).click();
    expect(new URL((await nextPage).url()).searchParams.get('cursor')).toBeTruthy();
    await expect(page.getByText('Tenue n° 032')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Charger plus' })).toHaveCount(0);
    assertNoUnmockedRequests(routes);
  });
});
