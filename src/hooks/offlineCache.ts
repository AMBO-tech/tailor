import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { CursorPage, Order } from '@types';
import { toast } from '@services/toast';

/** Message affiché quand une création est mise en file hors ligne. */
export const QUEUED_TOAST_MESSAGE =
  'Hors ligne : enregistré sur le téléphone, sera synchronisé automatiquement ✨';

/**
 * Vrai si l'entité renvoyée par une mutation est une entité optimiste mise en
 * file (non encore synchronisée) plutôt qu'une réponse du serveur.
 */
export function isQueuedEntity(entity: { isSynced?: boolean } | null | undefined): boolean {
  return entity?.isSynced === false;
}

/** Données d'une liste paginée « Charger plus » (`useInfiniteQuery`). */
type PagedListData<E> = InfiniteData<CursorPage<E>, string | undefined>;

/** Vrai si la valeur en cache est une liste paginée (pages `{ data, nextCursor }`). */
export function isPagedListData<E>(value: unknown): value is PagedListData<E> {
  const pages = (value as { pages?: unknown } | null)?.pages;
  return Array.isArray(pages) && pages.every((p) => Array.isArray((p as { data?: unknown })?.data));
}

/**
 * Applique une transformation à une liste en cache, qu'elle soit un tableau
 * (ancien format) ou une liste paginée. Pour une liste paginée, `firstPageOnly`
 * limite la transformation à la 1re page (ajout en tête).
 */
function mapCachedList<E>(old: unknown, transform: (list: E[]) => E[], firstPageOnly = false): unknown {
  if (Array.isArray(old)) return transform(old as E[]);
  if (!isPagedListData<E>(old)) return old;
  return {
    ...old,
    pages: old.pages.map((page, index) =>
      firstPageOnly && index > 0 ? page : { ...page, data: transform(page.data) },
    ),
  };
}

/** Toutes les entités d'une liste en cache (tableau ou pages). */
function listEntities<E>(data: unknown): E[] {
  if (Array.isArray(data)) return data as E[];
  return isPagedListData<E>(data) ? data.pages.flatMap((page) => page.data) : [];
}

/**
 * Ajoute une entité optimiste en tête de toutes les listes en cache sous un
 * préfixe (`['orders']`, `['clients']`...), tableaux comme listes paginées
 * (1re page). Les entrées « détail » (objets seuls) sont ignorées.
 */
export function prependToCachedLists<E extends { id: string }>(
  queryClient: QueryClient,
  prefix: readonly unknown[],
  entity: E,
): void {
  queryClient.setQueriesData<unknown>({ queryKey: prefix }, (old: unknown) =>
    mapCachedList<E>(old, (list) => [entity, ...list.filter((e) => e.id !== entity.id)], true),
  );
}

/** Applique une transformation à une commande dans toutes les listes en cache. */
export function updateCachedOrder(
  queryClient: QueryClient,
  orderId: string,
  update: (order: Order) => Order,
): void {
  queryClient.setQueriesData<unknown>({ queryKey: ['orders'] }, (old: unknown) =>
    mapCachedList<Order>(old, (list) => list.map((o) => (o.id === orderId ? update(o) : o))),
  );
}

/** Retrouve une entité par id dans les listes en cache sous un préfixe. */
export function findInCachedLists<E extends { id: string }>(
  queryClient: QueryClient,
  prefix: readonly unknown[],
  id: string | undefined,
): E | undefined {
  if (!id) return undefined;
  for (const [, data] of queryClient.getQueriesData<unknown>({ queryKey: prefix })) {
    const found = listEntities<E>(data).find((e) => e.id === id);
    if (found) return found;
  }
  return undefined;
}

/** Affiche le message « enregistré hors ligne ». */
export function notifyQueued(): void {
  toast.info(QUEUED_TOAST_MESSAGE);
}
