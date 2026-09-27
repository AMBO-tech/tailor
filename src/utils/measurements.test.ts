import { describe, expect, it } from 'vitest';
import { MEASUREMENT_LABELS, MEASUREMENT_TEMPLATES, getMeasurementLabel } from './measurements';

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
