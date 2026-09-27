/**
 * Baseline d'accessibilité (référence à améliorer, pas une porte de qualité).
 *
 * Ce test exécute `axe-core` sur les mêmes écrans que le filet de sécurité visuel
 * (`tests/visual/visual.spec.ts`) et ENREGISTRE, sans jamais faire échouer le test, le
 * nombre de violations par écran dans `e2e/a11y-baseline.json`. Ce fichier sert de
 * point de départ mesurable pour les améliorations d'accessibilité de la refonte.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { buildDefaultDataset, buildSuspendedSubscriptionDataset } from '../../fixtures/data';
import { installApiRoutes } from '../support/routes';
import { freezeClock } from '../support/clock';
import { seedAuthenticatedSession } from '../support/session';
import { waitForVisualStability } from '../support/stability';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, '../../a11y-baseline.json');

interface ScreenViolationSummary {
  screen: string;
  violationCount: number;
  violationIds: string[];
}

/** Un « pas » de scénario : navigue/interagit puis renvoie le nom de l'écran obtenu. */
type ScreenStep = (page: Page) => Promise<string>;

const STEPS: ScreenStep[] = [
  async (page) => {
    await page.goto('/login');
    await waitForVisualStability(page);
    return 'connexion';
  },
  async (page) => {
    await page.goto('/');
    await waitForVisualStability(page);
    return 'tableau-de-bord';
  },
  async (page) => {
    await page.goto('/orders');
    await waitForVisualStability(page);
    return 'liste-commandes';
  },
  async (page) => {
    await page.getByRole('button', { name: 'Nouvelle' }).click();
    await expect(page.getByText('Nouvelle Commande')).toBeVisible();
    await waitForVisualStability(page);
    return 'modale-nouvelle-commande';
  },
  async (page) => {
    await page.goto('/clients');
    await waitForVisualStability(page);
    return 'liste-clientes';
  },
  async (page) => {
    await page.getByText('Carnet de coupe').first().click();
    await expect(page.getByText('Mesures de Coupe')).toBeVisible();
    await waitForVisualStability(page);
    return 'carnet-de-mesures';
  },
  async (page) => {
    await page.goto('/payments');
    await waitForVisualStability(page);
    return 'encaissements';
  },
  async (page) => {
    await page.getByRole('button', { name: 'Encaisser' }).click();
    await expect(page.getByText('Encaisser un Versement')).toBeVisible();
    await waitForVisualStability(page);
    return 'modale-encaissement';
  },
  async (page) => {
    await page.goto('/settings');
    await waitForVisualStability(page);
    return 'reglages';
  },
  async (page) => {
    await page.getByRole('button', { name: "Gérer l'offre" }).click();
    await expect(page.getByText('Abonnement Sama Waay')).toBeVisible();
    await waitForVisualStability(page);
    return 'modale-abonnement';
  },
  async (page) => {
    await page.goto('/route-inexistante-e2e');
    await waitForVisualStability(page);
    return 'page-404';
  },
];

test('baseline axe-core sur les écrans clés (référence, ne doit jamais échouer)', async ({
  page,
}, testInfo) => {
  // Cette baseline n'a besoin d'être calculée qu'une seule fois (le contenu DOM ne
  // dépend pas du device) : on l'exécute uniquement sur le projet `pixel-7`, afin de
  // ne pas tripler inutilement le temps d'exécution et la charge sur le serveur
  // `vite preview` partagé quand `playwright test` (sans filtre) lance tous les projets.
  test.skip(
    testInfo.project.name !== 'pixel-7',
    'Baseline a11y exécutée une seule fois, sur le projet de référence pixel-7.',
  );

  const dataset = buildDefaultDataset();
  await freezeClock(page);
  await installApiRoutes(page, dataset);
  await seedAuthenticatedSession(page, dataset);

  const results: ScreenViolationSummary[] = [];

  for (const step of STEPS) {
    const screen = await step(page);
    const axeResults = await new AxeBuilder({ page }).analyze();
    results.push({
      screen,
      violationCount: axeResults.violations.length,
      violationIds: axeResults.violations.map((v) => v.id),
    });
  }

  // Bandeau abonnement suspendu : jeu de données dédié, capturé séparément.
  const suspendedDataset = buildSuspendedSubscriptionDataset();
  await installApiRoutes(page, suspendedDataset);
  await seedAuthenticatedSession(page, suspendedDataset);
  await page.goto('/');
  await waitForVisualStability(page);
  const suspendedAxe = await new AxeBuilder({ page }).analyze();
  results.push({
    screen: 'bandeau-abonnement-suspendu',
    violationCount: suspendedAxe.violations.length,
    violationIds: suspendedAxe.violations.map((v) => v.id),
  });

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(results, null, 2)}\n`, 'utf-8');

  // Ce test ne doit jamais échouer sur le nombre de violations : c'est une baseline,
  // pas une porte de qualité. On vérifie seulement que le fichier a bien été écrit.
  expect(fs.existsSync(OUTPUT_PATH)).toBe(true);
});
