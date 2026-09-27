import { describe, expect, it } from 'vitest';
import { getActiveWorkshopId, readStoredJson } from './storage';

describe('readStoredJson (M-23)', () => {
  it('renvoie la valeur désérialisée', () => {
    localStorage.setItem('k', JSON.stringify({ a: 1 }));
    expect(readStoredJson('k', null)).toEqual({ a: 1 });
  });

  it('renvoie le repli si la clé est absente ou vaut null', () => {
    expect(readStoredJson('absente', [])).toEqual([]);
    localStorage.setItem('k', 'null');
    expect(readStoredJson('k', 'repli')).toBe('repli');
  });

  it('supprime une valeur corrompue au lieu de lever une exception', () => {
    localStorage.setItem('k', '{pas du json');
    expect(() => readStoredJson('k', null)).not.toThrow();
    expect(readStoredJson('k', 'repli')).toBe('repli');
    expect(localStorage.getItem('k')).toBeNull();
  });
});

describe('getActiveWorkshopId', () => {
  it('lit l’atelier courant, ou renvoie une chaîne vide', () => {
    expect(getActiveWorkshopId()).toBe('');
    localStorage.setItem('tailor_workshop_id', 'ws-1');
    expect(getActiveWorkshopId()).toBe('ws-1');
  });
});
