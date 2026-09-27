/**
 * Données métier neutres (« Couche 1 ») pour les tests visuels de TailorApp / Sama Waay.
 *
 * Ce module ne connaît RIEN du format HTTP de l'ancienne (ni de la future) API.
 * Il expose uniquement des données réalistes et déterministes (clientes, commandes,
 * encaissements, atelier) sous une forme neutre, proche du modèle métier.
 *
 * Le fichier `legacy-api.ts` (Couche 2) est le seul endroit qui sait comment
 * transformer ces données neutres en réponses HTTP conformes au format de
 * l'ancienne API (`apps/web/src/services/api/*.ts`). Quand un futur agent adaptera
 * les fixtures au nouveau format d'API, seul `legacy-api.ts` (ou un nouveau fichier
 * `new-api.ts` équivalent) devra changer : ce fichier-ci ne doit pas bouger, et les
 * captures de référence doivent rester identiques.
 */

/** Horodatage figé utilisé par `page.clock` dans tous les tests visuels. */
export const FROZEN_NOW_ISO = '2026-09-25T09:00:00.000Z';

/** Fuseau horaire simulé pour tous les navigateurs de test (Dakar = UTC+0, pas d'heure d'été). */
export const TIMEZONE_ID = 'Africa/Dakar';

/**
 * Construit une image de tissu factice en SVG inline (data URI), sans aucune requête
 * réseau externe : les tests visuels ne doivent dépendre d'aucune ressource distante
 * (déterminisme, stabilité, fonctionnement hors-ligne).
 */
function buildFabricPhotoDataUri(hexColor: string, label: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">` +
    `<rect width="200" height="200" fill="${hexColor}"/>` +
    `<text x="100" y="105" font-family="sans-serif" font-size="22" fill="#1f2937" ` +
    `text-anchor="middle" dominant-baseline="middle">${label}</text>` +
    `</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export type Gender = 'M' | 'F';
export type OrderStatus = 'EN_COURS' | 'TERMINE' | 'LIVRE' | 'ANNULE';
export type PaymentMethod = 'CASH' | 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY';
export type PaymentChannel = 'ORDER_DEPOSIT' | 'ORDER_BALANCE' | 'SUBSCRIPTION_FEE';
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED';
export type SubscriptionPlan = 'SOLO' | 'EQUIPE';

/** Utilisatrice/utilisateur actuellement connecté·e pendant les tests. */
export interface NeutralUser {
  id: string;
  phone: string;
  fullName: string;
}

/** Atelier de couture ("workshop") auquel appartient la session simulée. */
export interface NeutralWorkshop {
  workshopId: string;
  name: string;
  codePrefix: string;
  logoUrl?: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPeriodEndIso: string;
}

/** Membre de l'atelier (couturier·ère employé·e ou apprenti·e). */
export interface NeutralMember {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  role: 'OWNER' | 'EMPLOYEE';
  joinedAtIso: string;
}

/** Cliente ou client de l'atelier, avec son carnet de mesures. */
export interface NeutralClient {
  id: string;
  fullName: string;
  phone: string;
  gender: Gender;
  notes?: string;
  measurements: Record<string, number>;
  createdAtIso: string;
}

/** Commande de confection sur mesure. */
export interface NeutralOrder {
  id: string;
  orderNumber: string;
  clientId: string;
  modelName: string;
  fabricPhotoUrl?: string;
  totalAmount: number;
  totalPaid: number;
  status: OrderStatus;
  fittingDateIso?: string;
  deliveryDeadlineIso: string;
  measurementSnapshot: Record<string, number>;
  createdAtIso: string;
}

/** Encaissement (acompte ou solde) lié ou non à une commande. */
export interface NeutralPayment {
  id: string;
  receiptNumber: string;
  orderId?: string;
  amount: number;
  method: PaymentMethod;
  channel: PaymentChannel;
  paidAtIso: string;
}

/** Jeu de données complet utilisé pour peupler les mocks d'API des tests visuels. */
export interface FixtureDataset {
  user: NeutralUser;
  workshop: NeutralWorkshop;
  members: NeutralMember[];
  clients: NeutralClient[];
  orders: NeutralOrder[];
  payments: NeutralPayment[];
  /** Employé : le tableau de bord reçoit `revenueHidden: true` (chiffre d'affaires masqué). */
  revenueHidden?: boolean;
}

const WORKSHOP_ID = 'wk-awa-couture-001';

const CLIENT_FATOU_DIOP: NeutralClient = {
  id: 'cl-fatou-diop',
  fullName: 'Fatou Diop',
  phone: '221771234501',
  gender: 'F',
  notes: 'Aime les coupes amples, col rond.',
  measurements: {
    longueurRobe: 105,
    epaule: 38,
    tourPoitrine: 96,
    tourTaille: 78,
    tourBassin: 102,
    manche: 56,
  },
  createdAtIso: '2026-06-02T10:15:00.000Z',
};

const CLIENT_MARIAMA_SOW: NeutralClient = {
  id: 'cl-mariama-sow',
  fullName: 'Mariama Sow',
  phone: '221771234502',
  gender: 'F',
  measurements: {
    longueurHaut: 62,
    tourPoitrine: 90,
    tourTaille: 74,
    longueurJupe: 68,
    tourBassin: 98,
    epaule: 37,
  },
  createdAtIso: '2026-07-11T14:40:00.000Z',
};

const CLIENT_MOUSSA_BA: NeutralClient = {
  id: 'cl-moussa-ba',
  fullName: 'Moussa Ba',
  phone: '221771234503',
  gender: 'M',
  measurements: {
    longueurBoubou: 128,
    epaule: 48,
    manche: 62,
    tourCou: 42,
    tourPoitrine: 108,
    longueurPantalon: 104,
    tourCeinture: 92,
    tourCuisse: 60,
  },
  createdAtIso: '2026-04-20T09:05:00.000Z',
};

const CLIENT_AISSATOU_FALL: NeutralClient = {
  id: 'cl-aissatou-fall',
  fullName: 'Aissatou Fall',
  phone: '221771234504',
  gender: 'F',
  notes: 'Cliente fidèle, préfère le tissu bazin riche.',
  measurements: {},
  createdAtIso: '2026-09-01T08:00:00.000Z',
};

const CLIENT_IBRAHIMA_NDOUR: NeutralClient = {
  id: 'cl-ibrahima-ndour',
  fullName: 'Ibrahima Ndour',
  phone: '221771234505',
  gender: 'M',
  measurements: {
    longueurTotale: 132,
    epaule: 47,
    manche: 61,
    tourPoitrine: 104,
    tourCou: 41,
  },
  createdAtIso: '2026-08-14T16:20:00.000Z',
};

const CLIENTS: NeutralClient[] = [
  CLIENT_FATOU_DIOP,
  CLIENT_MARIAMA_SOW,
  CLIENT_MOUSSA_BA,
  CLIENT_AISSATOU_FALL,
  CLIENT_IBRAHIMA_NDOUR,
];

const ORDERS: NeutralOrder[] = [
  {
    id: 'or-en-cours-retard',
    orderNumber: 'CMD-2026-014',
    clientId: 'cl-fatou-diop',
    modelName: 'Grand Boubou Brodé 3 pièces',
    fabricPhotoUrl: buildFabricPhotoDataUri('#FDE68A', 'Bazin'),
    totalAmount: 45000,
    totalPaid: 15000,
    status: 'EN_COURS',
    fittingDateIso: '2026-09-18T11:00:00.000Z',
    // En retard : échéance déjà dépassée par rapport à FROZEN_NOW_ISO.
    deliveryDeadlineIso: '2026-09-20T18:00:00.000Z',
    measurementSnapshot: CLIENT_FATOU_DIOP.measurements,
    createdAtIso: '2026-09-10T09:30:00.000Z',
  },
  {
    id: 'or-en-cours-essayage-jour',
    orderNumber: 'CMD-2026-015',
    clientId: 'cl-moussa-ba',
    modelName: 'Boubou 3 Pièces Bazin Riche',
    fabricPhotoUrl: buildFabricPhotoDataUri('#BFDBFE', 'Wax'),
    totalAmount: 60000,
    totalPaid: 30000,
    status: 'EN_COURS',
    // Essayage prévu aujourd'hui (même jour que FROZEN_NOW_ISO).
    fittingDateIso: '2026-09-25T15:00:00.000Z',
    deliveryDeadlineIso: '2026-09-30T18:00:00.000Z',
    measurementSnapshot: CLIENT_MOUSSA_BA.measurements,
    createdAtIso: '2026-09-15T12:00:00.000Z',
  },
  {
    id: 'or-termine-reliquat',
    orderNumber: 'CMD-2026-011',
    clientId: 'cl-mariama-sow',
    modelName: 'Taille Basse Wax Imprimé',
    totalAmount: 32000,
    totalPaid: 20000,
    status: 'TERMINE',
    deliveryDeadlineIso: '2026-09-26T18:00:00.000Z',
    measurementSnapshot: CLIENT_MARIAMA_SOW.measurements,
    createdAtIso: '2026-09-05T10:00:00.000Z',
  },
  {
    id: 'or-livre-solde',
    orderNumber: 'CMD-2026-009',
    clientId: 'cl-ibrahima-ndour',
    modelName: 'Grand Boubou Cérémonie',
    totalAmount: 55000,
    totalPaid: 55000,
    status: 'LIVRE',
    deliveryDeadlineIso: '2026-09-15T18:00:00.000Z',
    measurementSnapshot: CLIENT_IBRAHIMA_NDOUR.measurements,
    createdAtIso: '2026-08-28T08:45:00.000Z',
  },
  {
    id: 'or-annule',
    orderNumber: 'CMD-2026-007',
    clientId: 'cl-aissatou-fall',
    modelName: 'Robe Marinière Dentelle',
    totalAmount: 28000,
    totalPaid: 0,
    status: 'ANNULE',
    deliveryDeadlineIso: '2026-09-12T18:00:00.000Z',
    measurementSnapshot: {},
    createdAtIso: '2026-08-20T09:00:00.000Z',
  },
];

const PAYMENTS: NeutralPayment[] = [
  {
    id: 'pay-1',
    receiptNumber: 'REC-2026-0031',
    orderId: 'or-livre-solde',
    amount: 55000,
    method: 'WAVE',
    channel: 'ORDER_BALANCE',
    paidAtIso: '2026-09-23T17:10:00.000Z',
  },
  {
    id: 'pay-2',
    receiptNumber: 'REC-2026-0032',
    orderId: 'or-en-cours-essayage-jour',
    amount: 30000,
    method: 'ORANGE_MONEY',
    channel: 'ORDER_DEPOSIT',
    paidAtIso: '2026-09-24T09:20:00.000Z',
  },
  {
    id: 'pay-3',
    receiptNumber: 'REC-2026-0033',
    orderId: 'or-termine-reliquat',
    amount: 20000,
    method: 'CASH',
    channel: 'ORDER_DEPOSIT',
    paidAtIso: '2026-09-24T14:05:00.000Z',
  },
  {
    id: 'pay-4',
    receiptNumber: 'REC-2026-0034',
    orderId: 'or-en-cours-retard',
    amount: 15000,
    method: 'WAVE',
    channel: 'ORDER_DEPOSIT',
    paidAtIso: '2026-09-25T08:30:00.000Z',
  },
];

const MEMBERS: NeutralMember[] = [
  {
    id: 'mb-owner',
    userId: 'usr-awa-ndiaye',
    fullName: 'Awa Ndiaye',
    phone: '221771234500',
    role: 'OWNER',
    joinedAtIso: '2026-03-01T08:00:00.000Z',
  },
  {
    id: 'mb-employee',
    userId: 'usr-coumba-gueye',
    fullName: 'Coumba Gueye',
    phone: '221771234599',
    role: 'EMPLOYEE',
    joinedAtIso: '2026-05-14T10:00:00.000Z',
  },
];

/** Construit le jeu de données par défaut : abonnement d'essai actif. */
export function buildDefaultDataset(): FixtureDataset {
  return {
    user: {
      id: 'usr-awa-ndiaye',
      phone: '221771234500',
      fullName: 'Awa Ndiaye',
    },
    workshop: {
      workshopId: WORKSHOP_ID,
      name: 'Atelier Awa Couture',
      codePrefix: 'AWC',
      subscriptionPlan: 'SOLO',
      subscriptionStatus: 'TRIAL',
      subscriptionPeriodEndIso: '2026-10-09T23:59:59.000Z',
    },
    members: MEMBERS,
    clients: CLIENTS,
    orders: ORDERS,
    payments: PAYMENTS,
  };
}

/** Variante du jeu de données où l'abonnement de l'atelier est suspendu (bandeau d'alerte). */
export function buildSuspendedSubscriptionDataset(): FixtureDataset {
  const base = buildDefaultDataset();
  return {
    ...base,
    workshop: {
      ...base.workshop,
      subscriptionStatus: 'SUSPENDED',
      subscriptionPeriodEndIso: '2026-09-20T23:59:59.000Z',
    },
  };
}

/** Variante « employé » : chiffre d'affaires masqué par l'API sur le tableau de bord. */
export function buildRevenueHiddenDataset(): FixtureDataset {
  return { ...buildDefaultDataset(), revenueHidden: true };
}

/**
 * Variante avec plus d'une page de commandes (30 par page) : le bouton
 * « Charger plus » apparaît en bas de la liste.
 */
export function buildManyOrdersDataset(extraOrders = 32): FixtureDataset {
  const base = buildDefaultDataset();
  const template = base.orders[0];
  if (!template) throw new Error('[fixtures] Aucune commande de base');
  const extras: NeutralOrder[] = Array.from({ length: extraOrders }, (_, index) => {
    const n = String(index + 1).padStart(3, '0');
    return { ...template, id: `or-bulk-${n}`, orderNumber: `CMD-2026-B${n}`, modelName: `Tenue n° ${n}` };
  });
  return { ...base, orders: [...base.orders, ...extras] };
}

export const WORKSHOP_ID_CONST = WORKSHOP_ID;
