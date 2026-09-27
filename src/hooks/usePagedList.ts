import { useMemo } from 'react';
import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query';
import type { CursorPage } from '@types';

export interface PagedListOptions<E> {
  /** Clé du cache (doit inclure l'atelier actif, ARC-1). */
  queryKey: QueryKey;
  /** Charge une page ; `cursor` est absent pour la 1re page. */
  fetchPage: (cursor?: string) => Promise<CursorPage<E>>;
  /**
   * Complète chaque page chargée : la 1re (`isFirstPage`) reçoit par exemple les
   * entités créées hors ligne encore en file, visibles jusqu'à leur synchronisation.
   */
  transformPage?: (items: E[], isFirstPage: boolean) => Promise<E[]>;
}

export interface PagedListResult<E> {
  /** Éléments de toutes les pages chargées, sans doublon. */
  data: E[];
  isLoading: boolean;
  /** Vrai s'il reste des éléments à charger (« Charger plus »). */
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  /** Charge la page suivante. */
  loadMore: () => void;
}

/** Concatène les pages en supprimant les doublons (un élément déplacé entre deux pages). */
export function flattenPages<E extends { id: string }>(pages: CursorPage<E>[] | undefined): E[] {
  const seen = new Set<string>();
  const items: E[] = [];
  for (const page of pages ?? []) {
    for (const item of page.data) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
  }
  return items;
}

/**
 * Liste paginée par curseur (`?limit=30&cursor=`) avec « Charger plus ».
 * Un rafraîchissement (invalidation) recharge toutes les pages déjà affichées.
 */
export function usePagedList<E extends { id: string }>({
  queryKey,
  fetchPage,
  transformPage,
}: PagedListOptions<E>): PagedListResult<E> {
  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const page = await fetchPage(pageParam);
      if (!transformPage) return page;
      return { ...page, data: await transformPage(page.data, !pageParam) };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const data = useMemo(() => flattenPages(query.data?.pages), [query.data]);
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  return {
    data,
    isLoading: query.isLoading,
    hasNextPage,
    isFetchingNextPage,
    loadMore: () => {
      if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
    },
  };
}
