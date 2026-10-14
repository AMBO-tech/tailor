import { describe, expect, it } from 'vitest';
import {
  MAX_MEASUREMENT_NAME_LENGTH,
  addMeasurement,
  finalizeMeasurements,
  getMeasurementLabel,
  parseMeasurementInput,
  removeMeasurement,
} from './measurements';

describe('getMeasurementLabel', () => {
  it('renvoie le libellé français connu', () => {
    expect(getMeasurementLabel('tourTaille')).toBe('Tour de Taille');
  });

  it('renvoie la clé brute si elle est inconnue', () => {
    expect(getMeasurementLabel('cleInconnue')).toBe('cleInconnue');
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

describe('addMeasurement', () => {
  it('ajoute une mesure nommée librement, sans valeur', () => {
    expect(addMeasurement({}, '  Tour de  bras ')).toEqual({ book: { 'Tour de bras': '' }, key: 'Tour de bras' });
  });

  it('réutilise la clé d’une suggestion connue', () => {
    expect(addMeasurement({}, 'tour de taille')).toEqual({ book: { tourTaille: '' }, key: 'tourTaille' });
  });

  it('ne duplique pas une mesure déjà présente', () => {
    const book = { tourTaille: 80 };
    expect(addMeasurement(book, 'Tour de Taille')).toEqual({ book, key: 'tourTaille' });
    expect(addMeasurement({ 'Tour de bras': 30 }, 'tour de bras')?.key).toBe('Tour de bras');
  });

  it('refuse un nom vide ou trop long', () => {
    expect(addMeasurement({}, '   ')).toBeNull();
    expect(addMeasurement({}, 'x'.repeat(MAX_MEASUREMENT_NAME_LENGTH + 1))).toBeNull();
  });

  it('ne modifie pas le carnet d’origine', () => {
    const book = { epaule: 42 };
    addMeasurement(book, 'Manche');
    expect(book).toEqual({ epaule: 42 });
  });
});

describe('removeMeasurement', () => {
  it('retire la mesure sans toucher aux autres', () => {
    expect(removeMeasurement({ epaule: 42, manche: 60 }, 'epaule')).toEqual({ manche: 60 });
  });
});

describe('finalizeMeasurements', () => {
  it('retire les mesures vides et convertit les saisies en cours', () => {
    expect(finalizeMeasurements({ epaule: 42, manche: '', 'Tour de bras': '31.' })).toEqual({
      epaule: 42,
      'Tour de bras': 31,
    });
  });
});
