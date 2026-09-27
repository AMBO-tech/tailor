/**
 * Initialisation commune des tests Vitest :
 * - matchers DOM de Testing Library (`toBeInTheDocument`, ...) ;
 * - IndexedDB simulée (`fake-indexeddb`) pour Dexie ;
 * - démontage automatique des rendus et remise à zéro de `localStorage`.
 */
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// jsdom ne fournit pas matchMedia (utilisé par usePWAInstall).
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
