/**
 * Gel de l'horloge du navigateur pour des captures d'écran déterministes.
 *
 * Toutes les dates affichées (échéances de livraison, dates d'essayage, horodatages
 * de paiement) dépendent de `Date.now()`. On fige l'horloge sur `FROZEN_NOW_ISO`
 * (voir `fixtures/data.ts`) via `page.clock`, avant tout chargement de page.
 */

import type { Page } from '@playwright/test';
import { FROZEN_NOW_ISO } from '../../fixtures/data';

/** Fige `Date.now()` et les timers du navigateur sur l'instant de référence des fixtures. */
export async function freezeClock(page: Page): Promise<void> {
  await page.clock.install({ time: new Date(FROZEN_NOW_ISO) });
}
