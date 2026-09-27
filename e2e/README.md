# Filet de sécurité visuel — TailorApp (Sama Waay)

Ce dossier contient des tests **Playwright** dont le seul but est de garantir que la
refonte de `tailor (src/)` (branche `refactor/v2`) **ne change pas le design** de la PWA.
Ce sont des captures d'écran de référence du design **actuel**, pas des tests
fonctionnels du back-end : toutes les requêtes API sont interceptées et servies par des
fixtures locales, déterministes, sans backend réel.

## Principe

- **Aucun backend requis.** Toutes les requêtes HTTP vers l'API sont interceptées via
  `page.route()` (voir `fixtures/legacy-api.ts`). Toute requête non prévue échoue
  explicitement et le test le signale clairement (voir « Route attrape-tout » ci-dessous).
- **Horloge figée.** `page.clock` fixe l'heure sur `2026-09-25T09:00:00Z`
  (`fixtures/data.ts` → `FROZEN_NOW_ISO`), fuseau `Africa/Dakar`, afin que toutes les
  dates affichées (échéances, dates d'essayage, reçus) soient stables d'une exécution à
  l'autre.
- **Données réalistes sénégalaises.** Clientes, commandes (dont une en retard et une
  avec essayage prévu le jour même), encaissements Wave / Orange Money / Espèces, un
  atelier (« Atelier Awa Couture ») avec un abonnement en essai.
- **Trois profils mobiles** (voir `playwright.config.ts`) :
  - `android-bas-de-gamme` — petit écran Android d'entrée de gamme (360×740, Chromium).
  - `pixel-7` — Android haut de gamme de référence (Chromium).
  - `iphone-se` — iOS le plus contraint encore largement utilisé (WebKit).

## Architecture des fixtures (deux couches)

```
fixtures/
├── data.ts        # Couche 1 : données métier neutres (clientes, commandes, paiements...)
└── legacy-api.ts  # Couche 2 : adaptateur vers le format de l'ANCIENNE API (routes, JSON)
```

- **`data.ts`** ne connaît rien du format HTTP. Il expose des interfaces `Neutral*`
  (`NeutralClient`, `NeutralOrder`, `NeutralPayment`, `NeutralWorkshop`, `NeutralMember`)
  et deux jeux de données : `buildDefaultDataset()` (abonnement en essai actif) et
  `buildSuspendedSubscriptionDataset()` (abonnement suspendu, pour le bandeau d'alerte).
- **`legacy-api.ts`** est le SEUL fichier qui connaît la forme exacte des réponses
  attendues par `tailor (src/)/src/services/api/*.ts` (routes, verbes HTTP, enveloppe JSON,
  calcul du `remainingBalance`, des métriques du tableau de bord, etc.).

**Pourquoi cette séparation ?** Le plan de refonte (section 10.5, D10) prévoit qu'un
futur agent adaptera le format des fixtures au nouveau format d'API du back-end refondu.
Ce futur agent n'aura besoin de modifier QUE `legacy-api.ts` (ou d'ajouter un fichier
frère, ex. `new-api.ts`, et de changer l'import dans `tests/support/routes.ts`) :
`data.ts` reste inchangé, et **les captures de référence doivent rester strictement
identiques** puisque le rendu visuel ne dépend que des données, pas du format de
transport.

### Route attrape-tout

`installLegacyApiRoutes()` enregistre une route `http://api.test.local/**` en premier
(donc de plus basse priorité — Playwright donne priorité aux routes enregistrées après).
Toute requête qui n'est interceptée par aucune route spécifique :

1. reçoit une réponse d'erreur explicite (HTTP 599) pour ne pas faire attendre l'app,
2. est enregistrée dans `getUnmockedRequests()`.

Chaque test appelle `assertNoUnmockedRequests(handle)` (voir `tests/support/routes.ts`)
à la fin, qui fait échouer le test avec un message listant précisément la ou les URLs
non mockées si l'écran a déclenché un appel imprévu.

## Lancer les tests

```bash
# Depuis la racine du dépôt tailor
npx playwright install chromium webkit      # une seule fois

npm run test:e2e                            # visuel + a11y + parcours
npm run test:e2e -- tests/visual            # captures visuelles seules
npm run test:e2e -- tests/flows             # parcours critiques seuls
npx playwright show-report e2e/playwright-report
```

Le serveur `tailor (src/)` est démarré automatiquement par Playwright (`webServer` dans
`playwright.config.ts`), en mode **build + preview** (plus stable qu'un serveur de
développement pour des captures reproductibles), avec `VITE_API_URL=http://api.test.local`
afin que toutes les requêtes de l'app passent par les mocks.

## Mettre à jour les références

**Règle impérative : toute différence visuelle doit être revue et approuvée dans la
Pull Request.** Ne jamais régénérer les captures « pour faire passer le test » sans
comprendre l'origine du changement visuel.

```bash
npm run test:e2e:update
# équivalent à :
npm run test:e2e:update
```

Puis relancer sans `--update-snapshots` (idéalement deux fois de suite) pour vérifier
que les nouvelles références sont stables avant de committer les fichiers PNG dans
`tests/visual/__screenshots__/`.

## Organisation des captures

```
tests/visual/__screenshots__/
├── android-bas-de-gamme/
│   └── visual.spec.ts/
│       ├── connexion.png
│       ├── tableau-de-bord.png
│       └── ...
├── pixel-7/
│   └── visual.spec.ts/...
└── iphone-se/
    └── visual.spec.ts/...
```

Chaque projet (device) a son propre dossier de captures (`snapshotPathTemplate` dans
`playwright.config.ts`), car la mise en page mobile diffère légèrement selon la taille
d'écran et le moteur de rendu (Chromium vs WebKit).

## Écrans couverts

Connexion, tableau de bord (accueil), liste des commandes, fiche commande (carte),
modale nouvelle commande, liste des clientes, carnet de mesures (drawer), encaissements,
modale d'encaissement, modale de reçu, réglages, modale d'abonnement, bandeau
abonnement suspendu, page 404.

## Gestion des tests instables (flaky)

- `expect.toHaveScreenshot` est configuré avec `maxDiffPixelRatio: 0.01` et
  `animations: 'disabled'` (voir `playwright.config.ts`).
- `tests/support/stability.ts` attend `document.fonts.ready`, l'inactivité réseau, et
  neutralise défensivement les animations/transitions CSS restantes avant chaque capture.
- `tests/support/clock.ts` fige l'horloge du navigateur pour que toutes les dates
  affichées soient déterministes.
- Si un test devient instable malgré ces garde-fous, le mettre en quarantaine avec
  `test.fixme('raison + lien issue', ...)` plutôt que de le supprimer ou d'augmenter
  `maxDiffPixelRatio` au-delà du raisonnable.

## Baseline d'accessibilité

`tests/a11y/baseline.spec.ts` exécute `axe-core` (`@axe-core/playwright`) sur les
principaux écrans et écrit `e2e/a11y-baseline.json` (nombre de violations + identifiants
par écran). Ce test **n'échoue jamais** sur le nombre de violations : c'est une mesure
de référence à améliorer au fil de la refonte, pas une porte de qualité bloquante.

## Adaptation au dépôt tailor

- Repris de `tailorapp/e2e` : trois profils mobiles, API simulée par fixtures, horloge figée.
- Les captures de référence ont été générées sur le build de `main` **avant** le lot 2
  (commit `dc15e7e`, design de référence), via `E2E_DIST=<dossier du build> npm run test:e2e:update`.
- Correctif des fixtures : `/orders/dashboard` était capturé par la route `/orders/:id`
  (404), d'où un tableau de bord vide sur les captures ; il est désormais rempli.
- La capture « modale de reçu » est active (écran rendu atteignable par `fix/front-bugs`).
- `tests/flows/` : connexion → commande → encaissement avec reçu ; encaissement hors ligne
  puis synchronisation ; déconnexion qui vide le cache.

## Références par plateforme (Windows / Linux CI)

Le rendu des polices diffère selon le système : les captures sont rangées par plateforme
(`__screenshots__/{platform}/…`). Les références `win32` fournies ont été générées sur le
build de référence. Pour la CI (Linux), lancer une fois le workflow **CI** manuellement avec
`update_snapshots = true` sur le commit du design de référence, récupérer l'artefact
`linux-screenshots` et le committer dans `e2e/tests/visual/__screenshots__/linux/`. Tant
que ces références Linux n'existent pas, les tests visuels échouent en CI (« snapshot
doesn't exist ») ; les parcours et l'a11y passent.
