/**
 * Simulation de la session utilisateur pour les tests visuels.
 *
 * Le front stocke sa session dans `localStorage` (voir `apps/web/src/hooks/useAuth.ts`) :
 * `tailor_token`, `tailor_user`, `tailor_workshops`, `tailor_workshop`, `tailor_workshop_id`.
 * On préremplit ces clés via `page.addInitScript` avant tout chargement de page, afin de
 * démarrer directement sur les écrans protégés sans passer par le formulaire de connexion.
 */

import type { Page } from '@playwright/test';
import { FixtureDataset } from '../../fixtures/data';

/** Construit la valeur `Workshop` (format ancien front) stockée sous `tailor_workshop`. */
function buildStoredWorkshop(dataset: FixtureDataset): Record<string, unknown> {
  return {
    workshopId: dataset.workshop.workshopId,
    name: dataset.workshop.name,
    codePrefix: dataset.workshop.codePrefix,
    logoUrl: dataset.workshop.logoUrl,
    role: 'OWNER',
    subscription: {
      plan: dataset.workshop.subscriptionPlan,
      status: dataset.workshop.subscriptionStatus,
      currentPeriodEnd: dataset.workshop.subscriptionPeriodEndIso,
    },
  };
}

/**
 * Préremplit `localStorage` avec une session authentifiée valide, avant le premier
 * chargement de page. Doit être appelé avant `page.goto(...)`.
 */
export async function seedAuthenticatedSession(page: Page, dataset: FixtureDataset): Promise<void> {
  const storedUser = {
    id: dataset.user.id,
    phone: dataset.user.phone,
    fullName: dataset.user.fullName,
    systemRole: 'USER',
  };
  const storedWorkshop = buildStoredWorkshop(dataset);

  await page.addInitScript(
    ({ token, user, workshops, workshop, workshopId }) => {
      window.localStorage.setItem('tailor_token', token);
      window.localStorage.setItem('tailor_user', user);
      window.localStorage.setItem('tailor_workshops', workshops);
      window.localStorage.setItem('tailor_workshop', workshop);
      window.localStorage.setItem('tailor_workshop_id', workshopId);
    },
    {
      token: 'fixture-jwt-token',
      user: JSON.stringify(storedUser),
      workshops: JSON.stringify([storedWorkshop]),
      workshop: JSON.stringify(storedWorkshop),
      workshopId: dataset.workshop.workshopId,
    },
  );
}
