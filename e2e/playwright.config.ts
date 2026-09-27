import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

/** Racine du dépôt tailor (le dossier e2e/ est à l'intérieur). */
const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Dossier de build à servir. Par défaut, l'application est reconstruite dans
 * `dist-e2e/` avec l'API simulée ; `E2E_DIST` permet de servir un build déjà
 * produit (ex. le build de référence ayant servi à générer les captures).
 */
const E2E_DIST = process.env.E2E_DIST || 'dist-e2e';

/**
 * Options de lancement Chromium qui stabilisent le rendu du texte d'une exécution à
 * l'autre (désactive le hinting de police dépendant du sous-pixel), recommandation
 * standard de Playwright pour des captures d'écran déterministes.
 * @see https://playwright.dev/docs/test-snapshots
 */
const CHROMIUM_STABLE_FONT_ARGS = [
  '--font-render-hinting=none',
  '--disable-font-subpixel-positioning',
  '--disable-lcd-text',
];

/**
 * Configuration Playwright du filet de sécurité visuel de TailorApp (Sama Waay).
 *
 * Trois profils mobiles représentatifs du parc réel :
 * - `android-bas-de-gamme` : petit écran Android d'entrée de gamme (Chromium).
 * - `pixel-7` : Android haut de gamme de référence (Chromium).
 * - `iphone-se` : iOS le plus contraint encore largement utilisé (WebKit).
 *
 * Le serveur applicatif est démarré en mode « build + preview » (plutôt que `vite dev`)
 * car c'est le mode le plus stable et le plus proche de la production pour des captures
 * d'écran déterministes (pas de HMR, pas de recompilation à la volée).
 */
export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Un seul serveur `vite preview` sert toutes les requêtes : trop de workers en
  // parallèle sur une machine de développement peut le saturer et provoquer des
  // dépassements de délai sur `networkidle`. On limite le parallélisme localement.
  workers: process.env.CI ? 2 : 4,
  reporter: [['html', { open: 'never', outputFolder: 'playwright-report' }], ['list']],
  outputDir: 'test-results',
  // {platform} : le rendu des polices diffère entre Windows et Linux (CI) ; chaque
  // plateforme a ses propres références (voir e2e/README.md).
  snapshotPathTemplate: '{testDir}/visual/__screenshots__/{platform}/{projectName}/{testFileName}/{arg}{ext}',

  use: {
    baseURL: 'http://localhost:5173',
    locale: 'fr-FR',
    timezoneId: 'Africa/Dakar',
    serviceWorkers: 'block',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  expect: {
    toHaveScreenshot: {
      // Tolérance légèrement supérieure au 0,01 « nominal » : le rendu de texte à un
      // deviceScaleFactor fractionnaire (ex. Pixel 7) produit un anti-aliasing
      // sub-pixel qui varie de quelques pixels d'une exécution à l'autre même à
      // horloge et données strictement identiques. `--font-render-hinting=none`
      // (voir `chromiumFontArgs` ci-dessous) réduit déjà l'essentiel de ce bruit ;
      // cette marge absorbe le résidu sans masquer une vraie régression visuelle.
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    },
  },

  projects: [
    {
      name: 'android-bas-de-gamme',
      use: {
        browserName: 'chromium',
        viewport: { width: 360, height: 740 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
        userAgent:
          'Mozilla/5.0 (Linux; Android 11; SM-A125F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
        launchOptions: { args: CHROMIUM_STABLE_FONT_ARGS },
      },
    },
    {
      name: 'pixel-7',
      use: {
        ...devices['Pixel 7'],
        launchOptions: { args: CHROMIUM_STABLE_FONT_ARGS },
      },
    },
    {
      name: 'iphone-se',
      use: {
        ...devices['iPhone SE'],
      },
    },
  ],

  webServer: {
    command: process.env.E2E_DIST
      ? `npx vite preview --outDir "${E2E_DIST}" --port 5173 --strictPort`
      : `npx vite build --outDir ${E2E_DIST} && npx vite preview --outDir ${E2E_DIST} --port 5173 --strictPort`,
    cwd: APP_ROOT,
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      VITE_API_URL: 'http://api.test.local',
    },
  },
});
