/**
 * Adaptateur « ancien format d'API » (« Couche 2 ») pour les tests visuels.
 *
 * Ce module est le SEUL endroit du dossier `e2e/` qui connaît la forme exacte des
 * réponses HTTP attendues par le front actuel (`apps/web/src/services/api/*.ts`) :
 * routes, verbes HTTP, enveloppe JSON. Il transforme le jeu de données neutre de
 * `data.ts` en réponses conformes à ce format.
 *
 * Pourquoi cette séparation ? Le plan de refonte (section 10.5, D10) prévoit qu'un
 * futur agent adaptera ces mocks au nouveau format d'API du back-end. Ce futur
 * agent n'aura besoin de modifier QUE ce fichier (ou un fichier frère `new-api.ts`) :
 * `data.ts` reste inchangé, et les captures d'écran de référence doivent rester
 * strictement identiques puisque le rendu visuel ne dépend que des données, pas du
 * format de transport.
 */

import type { Page, Route } from '@playwright/test';
import {
  FixtureDataset,
  FROZEN_NOW_ISO,
  NeutralClient,
  NeutralMember,
  NeutralOrder,
  NeutralPayment,
} from './data';

/** Base URL factice utilisée par le front pendant les tests (voir `VITE_API_URL`). */
export const API_BASE_URL = 'http://api.test.local';

/** Jeton d'invitation accepté par la route simulée `POST /workshops/join`. */
export const VALID_INVITE_TOKEN = 'fixture-invite-token';

/** Numéro dont l'invitation est refusée (403 : forfait plein). */
export const FULL_PLAN_INVITE_PHONE = '770000099';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const MONTH_MS = 30 * DAY_MS;

function findClient(dataset: FixtureDataset, clientId: string): NeutralClient {
  const client = dataset.clients.find((c) => c.id === clientId);
  if (!client) {
    throw new Error(`[fixtures] Cliente introuvable pour l'id: ${clientId}`);
  }
  return client;
}

function findOrder(dataset: FixtureDataset, orderId: string | undefined): NeutralOrder | undefined {
  if (!orderId) return undefined;
  return dataset.orders.find((o) => o.id === orderId);
}

/** Renvoie le premier élément d'un tableau non vide, ou lève une erreur explicite sinon. */
function firstOrThrow<T>(items: T[], label: string): T {
  const item = items[0];
  if (!item) {
    throw new Error(`[fixtures] Tableau vide inattendu : ${label}`);
  }
  return item;
}

/** Construit la forme `Client` (ancien format) à partir d'une cliente neutre. */
function toApiClient(dataset: FixtureDataset, client: NeutralClient): Record<string, unknown> {
  return {
    id: client.id,
    workshopId: dataset.workshop.workshopId,
    fullName: client.fullName,
    phone: client.phone,
    gender: client.gender,
    notes: client.notes,
    measurements: client.measurements,
    createdAt: client.createdAtIso,
    isSynced: true,
  };
}

/** Construit la forme `Order` (ancien format), avec le résumé de la cliente et le reliquat calculé. */
function toApiOrder(dataset: FixtureDataset, order: NeutralOrder): Record<string, unknown> {
  const client = findClient(dataset, order.clientId);
  const remainingBalance = Math.max(0, order.totalAmount - order.totalPaid);
  return {
    id: order.id,
    workshopId: dataset.workshop.workshopId,
    clientId: order.clientId,
    orderNumber: order.orderNumber,
    modelName: order.modelName,
    fabricPhotoUrl: order.fabricPhotoUrl,
    totalAmount: order.totalAmount,
    totalPaid: order.totalPaid,
    remainingBalance,
    status: order.status,
    fittingDate: order.fittingDateIso,
    deliveryDeadline: order.deliveryDeadlineIso,
    measurementSnapshot: order.measurementSnapshot,
    client: {
      id: client.id,
      fullName: client.fullName,
      phone: client.phone,
    },
    createdAt: order.createdAtIso,
    isSynced: true,
  };
}

/** Construit la forme `PaymentEntry` (ancien format), avec le résumé de commande imbriqué. */
function toApiPayment(dataset: FixtureDataset, payment: NeutralPayment): Record<string, unknown> {
  const order = findOrder(dataset, payment.orderId);
  const client = order ? findClient(dataset, order.clientId) : undefined;
  return {
    id: payment.id,
    workshopId: dataset.workshop.workshopId,
    orderId: payment.orderId,
    receiptNumber: payment.receiptNumber,
    amount: payment.amount,
    method: payment.method,
    channel: payment.channel,
    paidAt: payment.paidAtIso,
    order: order
      ? {
          id: order.id,
          orderNumber: order.orderNumber,
          modelName: order.modelName,
          totalAmount: order.totalAmount,
          client: client ? { id: client.id, fullName: client.fullName, phone: client.phone } : undefined,
        }
      : undefined,
    isSynced: true,
  };
}

/** Construit la forme `WorkshopMember` (ancien format). */
function toApiMember(dataset: FixtureDataset, member: NeutralMember): Record<string, unknown> {
  return {
    id: member.id,
    workshopId: dataset.workshop.workshopId,
    userId: member.userId,
    role: member.role,
    joinedAt: member.joinedAtIso,
    user: {
      id: member.userId,
      phone: member.phone,
      fullName: member.fullName,
      systemRole: 'USER',
    },
  };
}

/** Construit la forme `Workshop` (résumé imbriqué dans `AuthResponse.workshops`). */
function toApiWorkshopSummary(dataset: FixtureDataset): Record<string, unknown> {
  return {
    workshopId: dataset.workshop.workshopId,
    name: dataset.workshop.name,
    codePrefix: dataset.workshop.codePrefix,
    logoUrl: dataset.workshop.logoUrl,
    role: 'OWNER',
    subscription: {
      plan: dataset.workshop.subscriptionPlan,
      status: dataset.workshop.subscriptionStatus,
      currentPeriodEnd: dataset.workshop.subscriptionPeriodEndIso,
    },
  };
}

/** Construit la forme `DashboardMetrics` (ancien format), calculée à partir du jeu de données. */
function toApiDashboard(dataset: FixtureDataset): Record<string, unknown> {
  const now = new Date(FROZEN_NOW_ISO).getTime();
  const today = FROZEN_NOW_ISO.slice(0, 10);

  const activeOrders = dataset.orders.filter((o) => o.status === 'EN_COURS');
  const urgentOrders = activeOrders.filter(
    (o) => new Date(o.deliveryDeadlineIso).getTime() <= now + 2 * DAY_MS,
  );
  const fittingTodayCount = dataset.orders.filter(
    (o) => o.fittingDateIso && o.fittingDateIso.slice(0, 10) === today,
  ).length;
  const totalRemainingDue = activeOrders.reduce(
    (sum, o) => sum + Math.max(0, o.totalAmount - o.totalPaid),
    0,
  );
  const weeklyRevenue = dataset.payments
    .filter((p) => now - new Date(p.paidAtIso).getTime() <= WEEK_MS)
    .reduce((sum, p) => sum + p.amount, 0);
  const monthlyRevenue = dataset.payments
    .filter((p) => now - new Date(p.paidAtIso).getTime() <= MONTH_MS)
    .reduce((sum, p) => sum + p.amount, 0);

  const recentPayments = [...dataset.payments]
    .sort((a, b) => new Date(b.paidAtIso).getTime() - new Date(a.paidAtIso).getTime())
    .slice(0, 3)
    .map((p) => toApiPayment(dataset, p));

  return {
    activeOrdersCount: activeOrders.length,
    urgentOrdersCount: urgentOrders.length,
    fittingTodayCount,
    totalRemainingDue,
    weeklyRevenue: dataset.revenueHidden ? 0 : weeklyRevenue,
    monthlyRevenue: dataset.revenueHidden ? 0 : monthlyRevenue,
    ...(dataset.revenueHidden ? { revenueHidden: true } : {}),
    recentPayments,
    urgentOrders: urgentOrders.map((o) => toApiOrder(dataset, o)),
  };
}

/**
 * Réponse de liste comme l'API : avec `?limit=` (et `?cursor=`), page
 * `{ data, nextCursor }` ; sans ces paramètres, tableau complet (ancien format).
 */
function paginate(items: Array<Record<string, unknown>>, requestUrl: string): unknown {
  const params = new URL(requestUrl).searchParams;
  const limit = Number(params.get('limit'));
  if (!limit) return items;
  const cursor = params.get('cursor');
  const start = cursor ? items.findIndex((item) => item.id === cursor) + 1 : 0;
  const data = items.slice(start, start + limit);
  const last = data[data.length - 1];
  return { data, nextCursor: start + limit < items.length && last ? last.id : null };
}

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

/** Résultat de l'installation des routes : permet de vérifier qu'aucun appel n'est resté non mocké. */
export interface LegacyApiRoutesHandle {
  /** Liste des URLs interceptées par la route « attrape-tout » (donc non mockées explicitement). */
  getUnmockedRequests(): string[];
}

/**
 * Installe l'ensemble des mocks HTTP reproduisant le format de l'ancienne API sur `page`.
 *
 * Toute requête vers `API_BASE_URL` qui ne correspond à aucune route connue reçoit une
 * réponse d'erreur explicite (statut 599) ET est enregistrée dans `getUnmockedRequests()`.
 * Les tests appellent `assertNoUnmockedRequests()` (voir `tests/support/routes.ts`) pour
 * échouer avec un message clair listant l'URL non interceptée.
 */
export async function installLegacyApiRoutes(
  page: Page,
  dataset: FixtureDataset,
): Promise<LegacyApiRoutesHandle> {
  const unmockedRequests: string[] = [];

  // Route « attrape-tout » enregistrée en premier : les routes spécifiques,
  // enregistrées ensuite, sont prioritaires (comportement documenté de Playwright).
  await page.route(`${API_BASE_URL}/**`, async (route) => {
    const req = route.request();
    unmockedRequests.push(`${req.method()} ${req.url()}`);
    await route.fulfill({
      status: 599,
      contentType: 'application/json',
      body: JSON.stringify({
        message: `[fixtures] Requête API non mockée : ${req.method()} ${req.url()}`,
      }),
    });
  });

  await page.route(`${API_BASE_URL}/auth/login`, async (route) => {
    await fulfillJson(route, {
      user: {
        id: dataset.user.id,
        phone: dataset.user.phone,
        fullName: dataset.user.fullName,
        systemRole: 'USER',
      },
      token: 'fixture-jwt-token',
      workshops: [toApiWorkshopSummary(dataset)],
    });
  });

  await page.route(`${API_BASE_URL}/auth/register`, async (route) => {
    await fulfillJson(route, {
      user: {
        id: dataset.user.id,
        phone: dataset.user.phone,
        fullName: dataset.user.fullName,
        systemRole: 'USER',
      },
      token: 'fixture-jwt-token',
      workshops: [toApiWorkshopSummary(dataset)],
    });
  });

  await page.route(`${API_BASE_URL}/orders/dashboard`, async (route) => {
    await fulfillJson(route, toApiDashboard(dataset));
  });

  await page.route(new RegExp(`^${API_BASE_URL}/orders(\\?.*)?$`), async (route) => {
    if (route.request().method() === 'POST') {
      const payload = route.request().postDataJSON() as { modelName?: string } | null;
      const created = firstOrThrow(dataset.orders, 'dataset.orders');
      await fulfillJson(
        route,
        {
          ...toApiOrder(dataset, created),
          id: 'or-fixture-created',
          orderNumber: 'CMD-2026-999',
          modelName: payload?.modelName || created.modelName,
        },
        201,
      );
      return;
    }
    await fulfillJson(
      route,
      paginate(
        dataset.orders.map((o) => toApiOrder(dataset, o)),
        route.request().url(),
      ),
    );
  });

  await page.route(new RegExp(`^${API_BASE_URL}/orders/[^/?]+/status$`), async (route) => {
    const id = new URL(route.request().url()).pathname.split('/')[2];
    const order = dataset.orders.find((o) => o.id === id) || firstOrThrow(dataset.orders, 'dataset.orders');
    const body = route.request().postDataJSON() as { status?: string } | null;
    await fulfillJson(route, {
      ...toApiOrder(dataset, order),
      status: body?.status || order.status,
    });
  });

  // (?!dashboard) : sans cette exclusion, /orders/dashboard était capturé ici (404)
  // et le tableau de bord des captures restait vide.
  await page.route(new RegExp(`^${API_BASE_URL}/orders/(?!dashboard$)[^/?]+$`), async (route) => {
    const id = new URL(route.request().url()).pathname.split('/')[2];
    const order = dataset.orders.find((o) => o.id === id);
    if (!order) {
      await fulfillJson(route, { message: 'Commande introuvable' }, 404);
      return;
    }
    await fulfillJson(route, toApiOrder(dataset, order));
  });

  await page.route(new RegExp(`^${API_BASE_URL}/clients(\\?.*)?$`), async (route) => {
    if (route.request().method() === 'POST') {
      const payload = route.request().postDataJSON() as { fullName?: string } | null;
      const created = firstOrThrow(dataset.clients, 'dataset.clients');
      await fulfillJson(
        route,
        {
          ...toApiClient(dataset, created),
          id: 'cl-fixture-created',
          fullName: payload?.fullName || created.fullName,
        },
        201,
      );
      return;
    }
    await fulfillJson(
      route,
      paginate(
        dataset.clients.map((c) => toApiClient(dataset, c)),
        route.request().url(),
      ),
    );
  });

  await page.route(new RegExp(`^${API_BASE_URL}/clients/[^/?]+$`), async (route) => {
    const id = new URL(route.request().url()).pathname.split('/')[2];
    if (route.request().method() === 'PATCH') {
      const client =
        dataset.clients.find((c) => c.id === id) || firstOrThrow(dataset.clients, 'dataset.clients');
      await fulfillJson(route, toApiClient(dataset, client));
      return;
    }
    const client = dataset.clients.find((c) => c.id === id);
    if (!client) {
      await fulfillJson(route, { message: 'Cliente introuvable' }, 404);
      return;
    }
    await fulfillJson(route, toApiClient(dataset, client));
  });

  await page.route(new RegExp(`^${API_BASE_URL}/payments(\\?.*)?$`), async (route) => {
    if (route.request().method() === 'POST') {
      const payload = route.request().postDataJSON() as {
        amount?: number;
        orderId?: string;
      } | null;
      const order = findOrder(dataset, payload?.orderId);
      const client = order
        ? findClient(dataset, order.clientId)
        : firstOrThrow(dataset.clients, 'dataset.clients');
      const cleanPhone = client.phone.replace(/[^0-9]/g, '');
      await fulfillJson(
        route,
        {
          id: 'pay-fixture-created',
          workshopId: dataset.workshop.workshopId,
          orderId: payload?.orderId,
          receiptNumber: 'REC-2026-0099',
          amount: payload?.amount || 10000,
          method: 'CASH',
          channel: 'ORDER_DEPOSIT',
          paidAt: FROZEN_NOW_ISO,
          whatsAppLink: `https://wa.me/${cleanPhone}?text=Re%C3%A7u`,
        },
        201,
      );
      return;
    }
    await fulfillJson(
      route,
      paginate(
        dataset.payments.map((p) => toApiPayment(dataset, p)),
        route.request().url(),
      ),
    );
  });

  await page.route(`${API_BASE_URL}/workshops/members`, async (route) => {
    await fulfillJson(
      route,
      dataset.members.map((m) => toApiMember(dataset, m)),
    );
  });

  await page.route(`${API_BASE_URL}/workshops/invite`, async (route) => {
    const body = route.request().postDataJSON() as { phone?: string } | null;
    if (body?.phone === FULL_PLAN_INVITE_PHONE) {
      await fulfillJson(
        route,
        {
          statusCode: 403,
          message: 'Le forfait SOLO est limité à 1 employé. Passez au forfait EQUIPE pour inviter davantage.',
          error: 'Forbidden',
        },
        403,
      );
      return;
    }
    await fulfillJson(route, {
      message: 'Invitation générée avec succès',
      inviteLink: `https://app.samawaay.sn/invite/fixture-token`,
      whatsAppLink: 'https://wa.me/221770000000?text=Invitation',
    });
  });

  // Invitation (lot 3) : seul `VALID_INVITE_TOKEN` est accepté ; tout autre jeton est expiré.
  await page.route(`${API_BASE_URL}/workshops/join`, async (route) => {
    const body = route.request().postDataJSON() as { token?: string } | null;
    if (body?.token !== VALID_INVITE_TOKEN) {
      await fulfillJson(route, { statusCode: 400, message: "Lien d'invitation invalide ou expiré.", error: 'Bad Request' }, 400);
      return;
    }
    await fulfillJson(route, { message: `Vous avez rejoint l'Atelier ${dataset.workshop.name} avec succès` }, 201);
  });

  await page.route(new RegExp(`^${API_BASE_URL}/workshops/members/[^/]+/revoke$`), async (route) => {
    await fulfillJson(route, { message: 'Accès révoqué avec succès.' });
  });

  await page.route(`${API_BASE_URL}/storage/image`, async (route) => {
    // Image factice en data URI : aucune requête réseau externe (voir data.ts).
    await fulfillJson(route, {
      url:
        'data:image/svg+xml;base64,' +
        Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">' +
            '<rect width="400" height="400" fill="#E2E8F0"/>' +
            '</svg>',
        ).toString('base64'),
    });
  });

  // --- Abonnement (lot 3) -------------------------------------------------

  await page.route(`${API_BASE_URL}/public/config`, async (route) => {
    await fulfillJson(route, {
      subscriptionTransferPhone: '+221776723136',
      currency: 'XOF',
      prices: { SOLO: 3000, EQUIPE: 5000 },
      maxSubscriptionMonths: 12,
      onlinePaymentEnabled: false,
    });
  });

  await page.route(`${API_BASE_URL}/subscriptions/current`, async (route) => {
    const endMs = new Date(dataset.workshop.subscriptionPeriodEndIso).getTime();
    const nowMs = new Date(FROZEN_NOW_ISO).getTime();
    const isReadOnly = dataset.workshop.subscriptionStatus === 'SUSPENDED' || endMs < nowMs;
    await fulfillJson(route, {
      subscription: {
        plan: dataset.workshop.subscriptionPlan,
        status: dataset.workshop.subscriptionStatus,
        currentPeriodEnd: dataset.workshop.subscriptionPeriodEndIso,
        daysRemaining: Math.max(0, Math.ceil((endMs - nowMs) / DAY_MS)),
        isReadOnly,
      },
      pendingPayments: [],
      onlinePaymentEnabled: false,
    });
  });

  await page.route(`${API_BASE_URL}/subscriptions/manual-payments`, async (route) => {
    const body = route.request().postDataJSON() as { plan: 'SOLO' | 'EQUIPE'; months: number } | null;
    const prices = { SOLO: 3000, EQUIPE: 5000 };
    await fulfillJson(
      route,
      {
        id: 'sp-fixture',
        reference: 'SW-ABO-2026-0001',
        amount: body ? prices[body.plan] * body.months : 3000,
        status: 'PENDING',
        whatsAppUrl: 'https://wa.me/221776723136?text=Abonnement',
      },
      201,
    );
  });

  // --- Back-office (lot 3) -----------------------------------------------

  await page.route(`${API_BASE_URL}/auth/admin/login`, async (route) => {
    const body = route.request().postDataJSON() as { email?: string; password?: string } | null;
    if (body?.email !== 'admin@samawaay.sn' || body?.password !== 'Secret123!') {
      await fulfillJson(route, { statusCode: 401, message: 'Identifiants invalides', error: 'Unauthorized' }, 401);
      return;
    }
    await fulfillJson(route, {
      accessToken: 'fixture-admin-token',
      user: { id: 'usr-admin', phone: '', fullName: 'Équipe Sama Waay', email: 'admin@samawaay.sn', systemRole: 'SUPER_ADMIN' },
      workshops: [],
    });
  });

  const adminPayments = [
    {
      id: '0f8fad5b-d9cb-469f-a165-70867728950e',
      reference: 'SW-ABO-2026-0042',
      plan: 'EQUIPE',
      months: 3,
      amount: 15000,
      method: 'WAVE',
      status: 'PENDING',
      transactionRef: 'WV-778899',
      createdAt: '2026-09-24T10:00:00.000Z',
      workshop: { id: dataset.workshop.workshopId, name: dataset.workshop.name, codePrefix: dataset.workshop.codePrefix, phoneContact: null },
      requestedBy: { id: dataset.user.id, fullName: dataset.user.fullName, phone: dataset.user.phone },
    },
    {
      id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      reference: 'SW-ABO-2026-0039',
      plan: 'SOLO',
      months: 1,
      amount: 3000,
      method: 'ORANGE_MONEY',
      status: 'CONFIRMED',
      createdAt: '2026-09-18T15:30:00.000Z',
      workshop: { id: 'ws-keur-couture', name: 'Keur Serigne Couture', codePrefix: 'KSC', phoneContact: null },
      requestedBy: { id: 'usr-modou', fullName: 'Modou Fall', phone: '221781112233' },
    },
  ];

  await page.route(new RegExp(`^${API_BASE_URL}/super-admin/subscription-payments(\\?.*)?$`), async (route) => {
    const status = new URL(route.request().url()).searchParams.get('status');
    await fulfillJson(route, status ? adminPayments.filter((p) => p.status === status) : adminPayments);
  });

  await page.route(new RegExp(`^${API_BASE_URL}/super-admin/subscription-payments/[^/]+/(confirm|reject)$`), async (route) => {
    const [, , , id, action] = new URL(route.request().url()).pathname.split('/');
    const payment = adminPayments.find((p) => p.id === id);
    if (payment) payment.status = action === 'confirm' ? 'CONFIRMED' : 'REJECTED';
    await fulfillJson(route, payment ?? {});
  });

  await page.route(new RegExp(`^${API_BASE_URL}/super-admin/workshops(\\?.*)?$`), async (route) => {
    await fulfillJson(route, [
      {
        id: dataset.workshop.workshopId,
        name: dataset.workshop.name,
        codePrefix: dataset.workshop.codePrefix,
        subscription: { plan: dataset.workshop.subscriptionPlan, status: dataset.workshop.subscriptionStatus, currentPeriodEnd: dataset.workshop.subscriptionPeriodEndIso },
        members: [{ user: { id: dataset.user.id, fullName: dataset.user.fullName, phone: dataset.user.phone } }],
        _count: { members: dataset.members.length, clients: dataset.clients.length, orders: dataset.orders.length },
      },
      {
        id: 'ws-keur-couture',
        name: 'Keur Serigne Couture',
        codePrefix: 'KSC',
        subscription: { plan: 'EQUIPE', status: 'SUSPENDED', currentPeriodEnd: '2026-09-01T23:59:59.000Z' },
        members: [{ user: { id: 'usr-modou', fullName: 'Modou Fall', phone: '221781112233' } }],
        _count: { members: 3, clients: 41, orders: 87 },
      },
    ]);
  });

  await page.route(`${API_BASE_URL}/super-admin/activate-subscription`, async (route) => {
    const body = route.request().postDataJSON() as { plan?: string; durationMonths?: number } | null;
    await fulfillJson(route, { message: `Abonnement ${body?.plan} activé pour ${body?.durationMonths} mois.`, subscription: {} }, 201);
  });

  return {
    getUnmockedRequests: () => [...unmockedRequests],
  };
}
