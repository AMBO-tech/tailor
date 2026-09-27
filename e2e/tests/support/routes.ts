/**
 * Point d'entrée unique, côté tests, pour installer les mocks d'API.
 *
 * Regroupe l'installation des routes (`fixtures/legacy-api.ts`) et l'assertion qu'aucune
 * requête n'est restée non mockée (route « attrape-tout »). Un futur agent qui adapte les
 * fixtures au nouveau format d'API n'a qu'à faire pointer `installApiRoutes` vers un
 * nouvel adaptateur (`fixtures/new-api.ts`) : les tests eux-mêmes n'ont pas à changer.
 */

import { expect, type Page } from '@playwright/test';
import { FixtureDataset } from '../../fixtures/data';
import { installLegacyApiRoutes, LegacyApiRoutesHandle } from '../../fixtures/legacy-api';

/** Installe les mocks d'API (format ancien) pour le jeu de données donné. */
export async function installApiRoutes(page: Page, dataset: FixtureDataset): Promise<LegacyApiRoutesHandle> {
  return installLegacyApiRoutes(page, dataset);
}

/**
 * Échoue le test, avec un message listant les URLs concernées, si une requête a atteint
 * la route « attrape-tout » (donc un endpoint non prévu par les fixtures).
 */
export function assertNoUnmockedRequests(handle: LegacyApiRoutesHandle): void {
  const unmocked = handle.getUnmockedRequests();
  expect(unmocked, `Requêtes API non mockées détectées :\n${unmocked.join('\n')}`).toEqual([]);
}
