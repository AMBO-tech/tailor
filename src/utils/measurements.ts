import { Gender } from '@types';

/**
 * Labels et utilitaires pour les mensurations en Français / Wolof
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

export interface MeasurementTemplate {
  label: string;
  gender: Gender;
  fields: { key: string; label: string }[];
}

export const MEASUREMENT_TEMPLATES: Record<string, MeasurementTemplate> = {
  BOUBOU_3_PIECES_HOMME: {
    label: 'Boubou 3 Pièces',
    gender: 'M',
    fields: [
      { key: 'longueurBoubou', label: 'Longueur Boubou' },
      { key: 'epaule', label: 'Épaule' },
      { key: 'manche', label: 'Longueur Manche' },
      { key: 'tourCou', label: 'Tour de Cou' },
      { key: 'tourPoitrine', label: 'Poitrine' },
      { key: 'longueurPantalon', label: 'Longueur Pantalon' },
      { key: 'tourCeinture', label: 'Tour de Ceinture' },
      { key: 'tourCuisse', label: 'Cuisse' },
    ],
  },
  ROBE_MARINIERE_FEMME: {
    label: 'Robe / Marinière',
    gender: 'F',
    fields: [
      { key: 'longueurRobe', label: 'Longueur Robe' },
      { key: 'epaule', label: 'Épaule' },
      { key: 'tourPoitrine', label: 'Poitrine' },
      { key: 'tourTaille', label: 'Tour de Taille' },
      { key: 'tourBassin', label: 'Bassin / Hanches' },
      { key: 'manche', label: 'Longueur Manche' },
    ],
  },
  TAILLE_BASSE_FEMME: {
    label: 'Taille Basse / Jupe',
    gender: 'F',
    fields: [
      { key: 'longueurHaut', label: 'Longueur Haut' },
      { key: 'tourPoitrine', label: 'Poitrine' },
      { key: 'tourTaille', label: 'Tour de Taille' },
      { key: 'longueurJupe', label: 'Longueur Jupe' },
      { key: 'tourBassin', label: 'Bassin' },
      { key: 'epaule', label: 'Épaule' },
    ],
  },
  GRAND_BOUBOU: {
    label: 'Grand Boubou',
    gender: 'M',
    fields: [
      { key: 'longueurTotale', label: 'Longueur Totale' },
      { key: 'epaule', label: 'Épaule' },
      { key: 'manche', label: 'Longueur Manche' },
      { key: 'tourPoitrine', label: 'Poitrine' },
      { key: 'tourCou', label: 'Tour de Cou' },
    ],
  },
  CHEMISE_PANTALON: {
    label: 'Chemise & Pantalon',
    gender: 'M',
    fields: [
      { key: 'longueurHaut', label: 'Longueur Chemise' },
      { key: 'epaule', label: 'Épaule' },
      { key: 'manche', label: 'Manche' },
      { key: 'tourPoitrine', label: 'Poitrine' },
      { key: 'tourCou', label: 'Tour de Cou' },
      { key: 'longueurPantalon', label: 'Longueur Pantalon' },
      { key: 'tourCeinture', label: 'Ceinture' },
    ],
  },
};

export function getMeasurementLabel(key: string): string {
  return MEASUREMENT_LABELS[key]?.fr || key;
}
