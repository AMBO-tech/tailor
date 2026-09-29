/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

/** Durée de conservation des photos de tissus en cache (30 jours). */
const PHOTO_CACHE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
/** Durée de conservation des polices Google en cache (1 an). */
const FONT_CACHE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export default defineConfig({
  plugins: [
    react(),
    // PWA : service worker Workbox généré au build (remplace l'ancien public/sw.js).
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        id: '/',
        short_name: 'Sama Waay',
        name: 'Sama Waay — Atelier & Couture',
        description: "L'application mobile de gestion d'ateliers de couture au Sénégal",
        lang: 'fr-SN',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#000000',
        theme_color: '#f59e0b',
        categories: ['business', 'productivity'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Photos de tissus (Cloudflare R2 / uploads) : immuables, CacheFirst.
            urlPattern: ({ request, url }) =>
              request.destination === 'image' &&
              (url.origin !== self.location.origin || url.pathname.startsWith('/uploads/')),
            handler: 'CacheFirst',
            options: {
              cacheName: 'sama-waay-photos',
              expiration: { maxEntries: 300, maxAgeSeconds: PHOTO_CACHE_MAX_AGE_SECONDS },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: FONT_CACHE_MAX_AGE_SECONDS },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@routes': path.resolve(__dirname, './src/routes'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@db': path.resolve(__dirname, './src/db'),
    },
  },
  server: {
    port: 5173,
    host: true
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    // Les parcours d'intégration (écrans complets) dépassent 5 s sous couverture.
    testTimeout: 20_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/setupTests.ts', 'src/testUtils.tsx', 'src/testFakeApi.ts', 'src/vite-env.d.ts', 'src/main.tsx', 'src/types/**'],
      reporter: ['text', 'html'],
      // Seuil minimal exigé (CI) : la commande test:cov échoue en dessous.
      thresholds: { lines: 80, statements: 80 },
    },
  },
});
