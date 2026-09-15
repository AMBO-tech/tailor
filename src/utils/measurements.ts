/**
 * Labels et utilitaires pour les mensurations en Français / Wolof
 */
export const MEASUREMENT_LABELS: Record<string, { fr: string; hint?: string }> = {
  longueurBoubou: { fr: 'Longueur Boubou', hint: 'De l’épaule au sol' },
  longueurRobe: { fr: 'Longueur Robe', hint: 'De l’épaule à la cheville' },
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
