/**
 * File d'attente hors ligne (Dexie `pendingMutations`).
 *
 * Quand l'appareil est hors ligne, ou qu'une requête échoue pour une raison
 * réseau / serveur (5xx, délai dépassé), la création est écrite dans la file
 * avec son `clientMutationId` stable, et une entité « optimiste » est renvoyée
 * pour être affichée immédiatement. `services/sync.ts` rejoue ensuite la file.
 */
import { v4 as uuidv4 } from 'uuid';
import { db } from '@db/db';
import { ApiError, TOO_MANY_REQUESTS } from '@services/api/apiClient';
import { readStoredJson, getActiveWorkshopId } from '@utils/storage';
import type {
  Client,
  CreateClientDto,
  CreateOrderDto,
  Order,
  OrderStatus,
  PaymentEntry,
  PendingMutation,
  RecordPaymentDto,
  User,
} from '@types';

/** Type de mutation mise en file. */
export type QueuedMutationType = PendingMutation['type'];

/** Charge utile attendue pour chaque type de mutation. */
export type QueuedPayload<T extends QueuedMutationType> = Extract<
  PendingMutation,
  { type: T }
>['payload'];

/**
 * Clé du propriétaire courant (« utilisateur:atelier »). Chaque session ne voit
 * et ne synchronise que ses propres mutations : l'en-tête `x-workshop-id` envoyé
 * lors du rejeu correspond toujours à l'atelier d'origine.
 *
 * @returns La clé, ou `''` hors session.
 */
export function getOwnerKey(): string {
  const user = readStoredJson<Pick<User, 'id'> | null>('tailor_user', null);
  const workshopId = getActiveWorkshopId();
  if (!user?.id || !workshopId) return '';
  return `${user.id}:${workshopId}`;
}

/**
 * Indique si l'erreur justifie une nouvelle tentative plus tard : absence de
 * réponse (hors ligne, délai dépassé), limitation de débit (429) ou erreur
 * serveur 5xx. Les autres refus métier (4xx) ne sont jamais retentés.
 */
export function isRetryableError(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.status === 0 || err.status === TOO_MANY_REQUESTS || err.status >= 500;
  }
  return err instanceof TypeError;
}

/** Vrai si le navigateur se déclare hors ligne. */
export function isBrowserOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/** Nombre de mutations en attente et « à vérifier » du propriétaire courant. */
export async function listOwnerMutations(ownerKey = getOwnerKey()): Promise<PendingMutation[]> {
  if (!ownerKey) return [];
  const mutations = await db.pendingMutations.where('ownerKey').equals(ownerKey).toArray();
  return mutations.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/**
 * Écrit une mutation dans la file. L'identifiant de file est le
 * `clientMutationId` (ou l'id local) : une double soumission remplace la même
 * entrée au lieu d'en créer une seconde.
 */
export async function enqueueMutation<T extends QueuedMutationType>(
  type: T,
  payload: QueuedPayload<T>,
  optimistic?: PendingMutation['optimistic'],
): Promise<PendingMutation> {
  const key = ('clientMutationId' in payload && payload.clientMutationId) || payload.id || uuidv4();
  const mutation = {
    id: `${type}:${key}`,
    type,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    ownerKey: getOwnerKey(),
    status: 'pending',
    optimistic,
  } as PendingMutation;
  await db.pendingMutations.put(mutation);
  return mutation;
}

/** Résultat d'une mutation : exécutée en ligne, ou mise en file (optimiste). */
export interface MutationOutcome<R> {
  result: R;
  queued: boolean;
}

/**
 * Exécute l'appel réseau, ou met la mutation en file si l'appareil est hors
 * ligne / si l'erreur est réseau ou 5xx. Les erreurs 4xx sont propagées telles
 * quelles (affichées à l'utilisateur, comme avant).
 */
export async function runOrQueue<T extends QueuedMutationType, R>(
  type: T,
  payload: QueuedPayload<T>,
  call: () => Promise<R>,
  buildOptimistic: () => R,
): Promise<MutationOutcome<R>> {
  const queue = async (): Promise<MutationOutcome<R>> => {
    const optimistic = buildOptimistic();
    await enqueueMutation(type, payload, optimistic as PendingMutation['optimistic']);
    return { result: optimistic, queued: true };
  };

  if (isBrowserOffline()) return queue();
  try {
    return { result: await call(), queued: false };
  } catch (err: unknown) {
    if (isRetryableError(err)) return queue();
    throw err;
  }
}

/* ------------------------------------------------------------------------- */
/* Entités optimistes (affichées tant que la synchronisation n'a pas eu lieu) */
/* ------------------------------------------------------------------------- */

export function buildOptimisticClient(dto: CreateClientDto & { id: string }): Client {
  return {
    id: dto.id,
    workshopId: getActiveWorkshopId(),
    fullName: dto.fullName,
    phone: dto.phone,
    gender: dto.gender,
    notes: dto.notes,
    measurements: dto.measurements || {},
    createdAt: new Date().toISOString(),
    isSynced: false,
  };
}

export function buildOptimisticOrder(
  dto: CreateOrderDto & { id: string },
  client?: Pick<Client, 'id' | 'fullName' | 'phone'>,
): Order {
  const totalPaid = Number(dto.depositAmount) || 0;
  return {
    id: dto.id,
    workshopId: getActiveWorkshopId(),
    clientId: dto.clientId,
    clientMutationId: dto.clientMutationId,
    orderNumber: '',
    modelName: dto.modelName,
    fabricPhotoUrl: dto.fabricPhotoUrl,
    totalAmount: dto.totalAmount,
    totalPaid,
    remainingBalance: Math.max(0, dto.totalAmount - totalPaid),
    status: 'EN_COURS',
    fittingDate: dto.fittingDate,
    deliveryDeadline: dto.deliveryDeadline,
    measurementSnapshot: dto.measurementSnapshot,
    client: client ? { id: client.id, fullName: client.fullName, phone: client.phone } : undefined,
    createdAt: new Date().toISOString(),
    isSynced: false,
  };
}

export function buildOptimisticPayment(
  dto: RecordPaymentDto & { id: string },
  order?: Order,
): PaymentEntry {
  return {
    id: dto.id,
    workshopId: getActiveWorkshopId(),
    orderId: dto.orderId,
    clientMutationId: dto.clientMutationId,
    receiptNumber: '',
    amount: dto.amount,
    method: dto.method,
    channel: dto.channel,
    paidAt: new Date().toISOString(),
    order: order
      ? {
          id: order.id,
          orderNumber: order.orderNumber,
          modelName: order.modelName,
          totalAmount: order.totalAmount,
          client: order.client,
        }
      : undefined,
    isSynced: false,
  };
}

/* ------------------------------------------------------------------------- */
/* Fusion des entités en attente dans les listes venant du serveur            */
/* ------------------------------------------------------------------------- */

/** Ajoute en tête les entités optimistes absentes de la liste serveur. */
function prependMissing<E extends { id: string }>(list: E[], pending: E[]): E[] {
  const known = new Set(list.map((e) => e.id));
  return [...pending.filter((e) => !known.has(e.id)), ...list];
}

async function pendingOptimistic<E>(type: QueuedMutationType): Promise<E[]> {
  const mutations = await listOwnerMutations();
  return mutations.filter((m) => m.type === type && m.optimistic).map((m) => m.optimistic as E);
}

/** Liste des clientes + clientes créées hors ligne. */
export async function mergePendingClients(list: Client[]): Promise<Client[]> {
  return prependMissing(list, await pendingOptimistic<Client>('CREATE_CLIENT'));
}

/** Liste des encaissements + encaissements enregistrés hors ligne. */
export async function mergePendingPayments(list: PaymentEntry[]): Promise<PaymentEntry[]> {
  return prependMissing(list, await pendingOptimistic<PaymentEntry>('RECORD_PAYMENT'));
}

/**
 * Liste des commandes + commandes créées hors ligne, avec les changements de
 * statut et les encaissements en attente appliqués.
 */
export async function mergePendingOrders(list: Order[]): Promise<Order[]> {
  const mutations = await listOwnerMutations();
  if (mutations.length === 0) return list;
  const created = mutations
    .filter((m) => m.type === 'CREATE_ORDER' && m.optimistic)
    .map((m) => m.optimistic as Order);

  return prependMissing(list, created).map((order) =>
    mutations.reduce<Order>((acc, m) => applyPendingToOrder(acc, m), order),
  );
}

/**
 * Applique aux commandes d'une page les changements en attente (statut,
 * encaissements), sans y ajouter les créations hors ligne.
 */
export async function applyPendingOrderChanges(list: Order[]): Promise<Order[]> {
  const mutations = await listOwnerMutations();
  if (mutations.length === 0) return list;
  return list.map((order) => mutations.reduce<Order>((acc, m) => applyPendingToOrder(acc, m), order));
}

/** Applique à une commande l'effet d'une mutation en attente (statut, paiement). */
export function applyPendingToOrder(order: Order, mutation: PendingMutation): Order {
  if (mutation.type === 'UPDATE_ORDER_STATUS' && mutation.payload.id === order.id) {
    return { ...order, status: mutation.payload.status as OrderStatus };
  }
  if (
    mutation.type === 'RECORD_PAYMENT' &&
    mutation.payload.orderId === order.id &&
    mutation.optimistic
  ) {
    const totalPaid = (Number(order.totalPaid) || 0) + mutation.payload.amount;
    return {
      ...order,
      totalPaid,
      remainingBalance: Math.max(0, (Number(order.totalAmount) || 0) - totalPaid),
    };
  }
  return order;
}
