# ✂️ Tailor App (Frontend PWA Offline-First)

Application Web Progressive ultra-légère pour maîtres tailleurs et couturiers au Sénégal.
Fonctionne 100% hors-ligne dans les marchés grâce à Dexie.js (IndexedDB).

## Qualité du code

| Commande | Rôle |
| --- | --- |
| `npm run typecheck` | TypeScript en mode `strict` |
| `npm run lint` | ESLint (react-hooks en erreur, jsx-a11y en avertissement) |
| `npm test` / `npm run test:cov` | Vitest + Testing Library (jsdom, fake-indexeddb) |
| `npm run format` | Prettier (non appliqué en masse pour garder des diffs lisibles) |

Les tests sont placés à côté du code testé (`*.test.ts(x)`). Aucun `console.*` direct :
passer par `utils/logger`. Les messages d'erreur se lisent via `utils/errors#getErrorMessage`.
