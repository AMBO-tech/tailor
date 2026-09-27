/**
 * Attente de stabilité visuelle avant une capture d'écran.
 *
 * Combine : polices Web chargées (`document.fonts.ready`), absence de requêtes réseau
 * en vol, et une désactivation défensive des animations CSS (en complément du réglage
 * global `animations: 'disabled'` de `expect.toHaveScreenshot`, voir `playwright.config.ts`).
 */

import type { Page } from '@playwright/test';

const DISABLE_ANIMATIONS_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    caret-color: transparent !important;
  }
`;

/** Injecte une feuille de style qui neutralise toutes les animations/transitions CSS. */
export async function disableCssAnimations(page: Page): Promise<void> {
  await page.addStyleTag({ content: DISABLE_ANIMATIONS_CSS });
}

/** Attend que les polices Web soient chargées et que le réseau soit inactif. */
export async function waitForVisualStability(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await disableCssAnimations(page);
}
