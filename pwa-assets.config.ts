import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

/**
 * Génère les icônes de la PWA à partir de `public/icon.svg` (fond noir, ciseaux dorés).
 * Le SVG remplit déjà tout le carré : aucune marge, et fond noir si un recadrage est nécessaire.
 * Commande : npx pwa-assets-generator
 */
const NOIR = { padding: 0, resizeOptions: { background: '#000000' } };

export default defineConfig({
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, ...NOIR },
    maskable: { ...minimal2023Preset.maskable, ...NOIR },
    apple: { ...minimal2023Preset.apple, ...NOIR },
  },
  images: ['public/icon.svg'],
});
