import React from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@hooks/useAuth';

/** Client TanStack Query isolé pour un test (pas de nouvelle tentative, pas de cache partagé). */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

/**
 * Rend un élément avec les fournisseurs de l'application (routeur, cache, session).
 * Les fournisseurs sont passés en `wrapper` : `rerender` les conserve.
 *
 * @param ui - Élément à rendre.
 * @param queryClient - Client de cache à utiliser (un neuf par défaut).
 * @param route - URL de départ du routeur mémoire.
 */
export function renderWithProviders(
  ui: React.ReactElement,
  queryClient: QueryClient = createTestQueryClient(),
  route = '/',
): RenderResult & { queryClient: QueryClient } {
  function Providers({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <AuthProvider>{children}</AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  }
  return Object.assign(render(ui, { wrapper: Providers }), { queryClient });
}
