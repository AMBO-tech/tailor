import { describe, expect, it } from 'vitest';
import { getErrorMessage, isAbortError } from './errors';

describe('getErrorMessage', () => {
  it('renvoie le message d’une Error', () => {
    expect(getErrorMessage(new Error('Boom'), 'repli')).toBe('Boom');
  });

  it('accepte un objet portant un message', () => {
    expect(getErrorMessage({ message: 'Réseau' }, 'repli')).toBe('Réseau');
  });

  it.each([[new Error('')], [null], [undefined], ['texte'], [{ message: 42 }]])(
    'utilise le repli pour %p',
    (value) => {
      expect(getErrorMessage(value, 'repli')).toBe('repli');
    },
  );
});

describe('isAbortError', () => {
  it('reconnaît une annulation', () => {
    expect(isAbortError(new DOMException('aborted', 'AbortError'))).toBe(true);
    expect(isAbortError({ name: 'AbortError' })).toBe(true);
  });

  it('ignore les autres erreurs', () => {
    expect(isAbortError(new Error('x'))).toBe(false);
    expect(isAbortError(null)).toBe(false);
  });
});
