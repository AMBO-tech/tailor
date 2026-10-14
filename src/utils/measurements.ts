import { Measurements } from '@types';

/**
 * Carnet de mesures libre : le tailleur nomme lui-même chaque mesure, car elles varient
 * d'une couture à l'autre. Les libellés ci-dessous servent de suggestions rapides et
 * d'affichage des clés historiques (`tourTaille` → « Tour de Taille »).
 */
export const MEASUREMENT_LABELS: Record<string, { fr: string; hint?: string }> = {
  longueurBoubou: { fr: 'Longueur Boubou', hint: 'De l’épaule au sol' },
  longueurRobe: { fr: 'Longueur Robe', hint: 'De l’épaule à la cheville' },
  longueurHaut: { fr: 'Longueur Haut / Camisole' },
  longueurJupe: { fr: 'Longueur Jupe' },
  longueurTotale: { fr: 'Longueur Totale' },
  epaule: { fr: 'Épaule', hint: 'D’un os de l’épaule à l’autre' },
  manche: { fr: 'Longueur Manche', hint: 'De l’épaule au poignet' },
  tourCou: { fr: 'Tour de Cou' },
  tourPoitrine: { fr: 'Tour de Poitrine', hint: 'À l’endroit le plus fort' },
  tourTaille: { fr: 'Tour de Taille', hint: 'Au creux de la taille' },
  tourBassin: { fr: 'Tour de Bassin / Hanches' },
  longueurPantalon: { fr: 'Longueur Pantalon' },
  tourCeinture: { fr: 'Tour de Ceinture' },
  tourCuisse: { fr: 'Tour de Cuisse' },
  basPantalon: { fr: 'Bas Pantalon' },
};

export function getMeasurementLabel(key: string): string {
  return MEASUREMENT_LABELS[key]?.fr || key;
}

/**
 * Normalise la saisie d'une mensuration faite au pavé décimal.
 *
 * @remarks
 * Sur un téléphone réglé en français, le pavé décimal propose une virgule : elle est convertie en point.
 * Une décimale en cours de saisie (« 42, ») reste une chaîne pour ne pas effacer le séparateur à l'écran.
 *
 * @param raw - Valeur brute du champ.
 * @returns `''` si le champ est vide, la chaîne partielle pendant la saisie, sinon le nombre.
 */
export function parseMeasurementInput(raw: string): number | string {
  const [integerPart, ...decimals] = raw.replace(/,/g, '.').replace(/[^\d.]/g, '').split('.');
  const cleaned = decimals.length > 0 ? `${integerPart}.${decimals.join('')}` : integerPart;
  if (cleaned === '') return '';
  return cleaned.endsWith('.') ? cleaned : Number(cleaned);
}

/** Bornes alignées sur la validation de l'API (carnet de mesures). */
export const MAX_MEASUREMENTS = 60;
export const MAX_MEASUREMENT_NAME_LENGTH = 40;

/** Une mesure compte comme renseignée dès qu'elle a une valeur. */
export function isMeasurementFilled(value: number | string | null | undefined): boolean {
  return value !== '' && value !== null && value !== undefined;
}

/**
 * Ajoute une mesure vide au carnet, sans doublon.
 *
 * @remarks
 * Un nom qui correspond à une suggestion connue (« tour de taille ») réutilise sa clé
 * (`tourTaille`) ; une mesure déjà présente n'est pas dupliquée, sa clé est renvoyée.
 *
 * @returns Le nouveau carnet (inchangé si la mesure existait) et la clé de la mesure,
 * ou `null` si le nom est vide, trop long ou si le carnet est plein.
 */
export function addMeasurement(
  book: Measurements,
  name: string,
): { book: Measurements; key: string } | null {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (!trimmed || trimmed.length > MAX_MEASUREMENT_NAME_LENGTH) return null;
  const wanted = trimmed.toLowerCase();
  const known = Object.keys(MEASUREMENT_LABELS).find(
    (key) => key.toLowerCase() === wanted || MEASUREMENT_LABELS[key].fr.toLowerCase() === wanted,
  );
  const key = known ?? trimmed;
  const existing = Object.keys(book).find(
    (k) => k.toLowerCase() === key.toLowerCase() || getMeasurementLabel(k).toLowerCase() === wanted,
  );
  if (existing) return { book, key: existing };
  if (Object.keys(book).length >= MAX_MEASUREMENTS) return null;
  return { book: { ...book, [key]: '' }, key };
}

/** Retire une mesure du carnet. */
export function removeMeasurement(book: Measurements, key: string): Measurements {
  const { [key]: _removed, ...rest } = book;
  return rest;
}

/**
 * Prépare le carnet à l'enregistrement : les mesures sans valeur sont retirées et une
 * saisie en cours (« 42. ») devient un nombre.
 */
export function finalizeMeasurements(book: Measurements): Measurements {
  return Object.fromEntries(
    Object.entries(book)
      .filter(([, value]) => isMeasurementFilled(value))
      .map(([key, value]) => [key, typeof value === 'string' ? Number(value) || value : value]),
  );
}
