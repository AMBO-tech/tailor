import { describe, expect, it } from 'vitest';
import { detectSenegalOperator, formatSenegalPhoneDisplay } from './phone';

describe('formatSenegalPhoneDisplay', () => {
  it('regroupe progressivement les chiffres saisis', () => {
    expect(formatSenegalPhoneDisplay('77')).toBe('77');
    expect(formatSenegalPhoneDisplay('77123')).toBe('77 123');
    expect(formatSenegalPhoneDisplay('7712345')).toBe('77 123 45');
    expect(formatSenegalPhoneDisplay('771234567')).toBe('77 123 45 67');
  });

  it('ignore les caractères non numériques et tronque au-delà de 9 chiffres', () => {
    expect(formatSenegalPhoneDisplay('77-123.45 67')).toBe('77 123 45 67');
    expect(formatSenegalPhoneDisplay('7712345678999')).toBe('77 123 45 67');
  });
});

describe('detectSenegalOperator', () => {
  it.each([
    ['771234567', 'ORANGE'],
    ['78 123 45 67', 'ORANGE'],
    ['761234567', 'FREE'],
    ['701234567', 'EXPRESSO'],
    ['751234567', 'PROXICACHE'],
    ['331234567', 'UNKNOWN'],
  ])('%s → %s', (phone, operator) => {
    expect(detectSenegalOperator(phone)).toBe(operator);
  });
});
