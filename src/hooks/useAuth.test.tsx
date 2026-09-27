import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './useAuth';
import { createTestQueryClient } from '../testUtils';

function setup() {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return { queryClient, ...renderHook(() => useAuth(), { wrapper }) };
}

describe('useAuth', () => {
  it('M-23 : démarre sans planter avec un localStorage corrompu', () => {
    localStorage.setItem('tailor_token', 'jwt');
    localStorage.setItem('tailor_user', '{corrompu');
    localStorage.setItem('tailor_workshops', 'pas-du-json');
    localStorage.setItem('tailor_workshop', '');

    const { result } = setup();

    expect(result.current.user).toBeNull();
    expect(result.current.workshops).toEqual([]);
    expect(result.current.currentWorkshop).toBeNull();
    expect(localStorage.getItem('tailor_user')).toBeNull();
  });

  it('ARC-1 : la déconnexion vide le cache des données de l’atelier', () => {
    localStorage.setItem('tailor_token', 'jwt');
    const { result, queryClient } = setup();
    queryClient.setQueryData(['orders', 'ws-1', {}], [{ id: 'o1' }]);
    queryClient.setQueryData(['clients', 'ws-1', {}], [{ id: 'c1' }]);

    act(() => result.current.logout());

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('tailor_token')).toBeNull();
  });
});
