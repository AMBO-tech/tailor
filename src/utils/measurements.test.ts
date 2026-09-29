import { describe, expect, it } from 'vitest';
import { MEASUREMENT_LABELS, MEASUREMENT_TEMPLATES, getMeasurementLabel, parseMeasurementInput } from './measurements';

describe('getMeasurementLabel', () => {
  it('renvoie le libellé français connu', () => {
    expect(getMeasurementLabel('tourTaille')).toBe('Tour de Taille');
  });

  it('renvoie la clé brute si elle est inconnue', () => {
    expect(getMeasurementLabel('cleInconnue')).toBe('cleInconnue');
  });
});

describe('MEASUREMENT_TEMPLATES', () => {
  it('ne référence que des mensurations connues', () => {
    for (const template of Object.values(MEASUREMENT_TEMPLATES)) {
      for (const field of template.fields) {
        expect(MEASUREMENT_LABELS[field.key]).toBeDefined();
      }
    }
  });
});

describe('parseMeasurementInput', () => {
  it('renvoie une chaîne vide pour un champ vidé', () => {
    expect(parseMeasurementInput('')).toBe('');
  });

  it('convertit une saisie complète en nombre', () => {
    expect(parseMeasurementInput('42')).toBe(42);
    expect(parseMeasurementInput('42.5')).toBe(42.5);
  });

  it('accepte la virgule du clavier numérique français', () => {
    expect(parseMeasurementInput('42,5')).toBe(42.5);
  });

  it('conserve une décimale en cours de saisie', () => {
    expect(parseMeasurementInput('42,')).toBe('42.');
  });

  it('ignore les caractères parasites et les séparateurs en trop', () => {
    expect(parseMeasurementInput('4a2.5.1 cm')).toBe(42.51);
  });
});
