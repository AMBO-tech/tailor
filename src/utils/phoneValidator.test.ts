import { describe, expect, it } from 'vitest';
import { validateAndNormalizeSenegalPhone } from './phoneValidator';

describe('validateAndNormalizeSenegalPhone', () => {
  it('normalise un numéro mobile local au format international', () => {
    expect(validateAndNormalizeSenegalPhone('77 123 45 67')).toEqual({
      isValid: true,
      normalized: '+221771234567',
      display: '77 123 45 67',
    });
  });

  it('accepte les préfixes +221 et fixes (33)', () => {
    expect(validateAndNormalizeSenegalPhone('+221 76 000 11 22').normalized).toBe('+221760001122');
    expect(validateAndNormalizeSenegalPhone('338201234').isValid).toBe(true);
  });

  it('rejette un numéro invalide en le renvoyant tel quel', () => {
    expect(validateAndNormalizeSenegalPhone('12345')).toEqual({
      isValid: false,
      normalized: '12345',
      display: '12345',
    });
    expect(validateAndNormalizeSenegalPhone('791234567').isValid).toBe(false);
  });

  it('accepte le préfixe international 00221', () => {
    expect(validateAndNormalizeSenegalPhone('00221771234567').normalized).toBe('+221771234567');
  });
});
