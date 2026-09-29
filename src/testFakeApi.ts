/**
 * API simulée pour les tests d'intégration (Vitest) : remplace `fetch` par un
 * routeur en mémoire qui répond comme le back (mêmes routes, mêmes formats).
 * Exclu de la couverture.
 */
import { vi } from 'vitest';
import type {
  Client,
  DashboardMetrics,
  Order,
  PaymentEntry,
  Workshop,
  WorkshopMember,
} from '@types';

export const TEST_WORKSHOP = {
  workshopId: 'ws-1',
  name: 'Atelier Awa Couture',
  codePrefix: 'AW',
  role: 'OWNER' as const,
  subscription: {
    plan: 'SOLO' as const,
    status: 'TRIAL' as const,
    currentPeriodEnd: '2026-10-09T00:00:00Z',
  },
};

/** Identifiants du super-administrateur simulé. */
export const ADMIN_EMAIL = 'admin@samawaay.sn';
export const ADMIN_PASSWORD = 'Secret123!';

export const TEST_USER = {
  id: 'u1',
  phone: '771112233',
  fullName: 'Awa Ndiaye',
  systemRole: 'USER' as const,
};

export interface FakeDb {
  clients: Client[];
  orders: Order[];
  payments: PaymentEntry[];
  members: WorkshopMember[];
  /** Demandes « J'ai déjà payé » (abonnement). */
  subscriptionPayments: Array<{
    id: string;
    clientMutationId: string;
    reference: string;
    plan: string;
    months: number;
    amount: number;
    method: string;
    status: string;
    createdAt: string;
  }>;
  subscriptionReadOnly: boolean;
  /** Demandes vues par l'administrateur (avec atelier et demandeur). */
  adminPayments: Array<Record<string, unknown> & { id: string; status: string }>;
  adminWorkshops: Array<Record<string, unknown> & { id: string }>;
  activations: Array<Record<string, unknown>>;
  /** Forfait plein : `POST /workshops/invite` répond 403. */
  inviteLimitReached: boolean;
  /** Invitations valides (jeton → nom de l'atelier) ; consommées à l'acceptation. */
  invitations: Record<string, string>;
  /** Ateliers rejoints, ajoutés à la réponse de connexion. */
  joinedWorkshops: Workshop[];
  /** Employé : le tableau de bord masque le chiffre d'affaires (`revenueHidden`). */
  revenueHidden: boolean;
}

/** Jeton d'invitation valide de l'API simulée. */
export const INVITE_TOKEN = 'invite-token-valide-0001';

export function buildFakeDb(): FakeDb {
  const clients: Client[] = [
    {
      id: 'c1',
      workshopId: 'ws-1',
      fullName: 'Fatou Diop',
      phone: '+221771234567',
      gender: 'F',
      notes: 'Coupe ample',
      measurements: {
        longueurRobe: 140,
        epaule: 42,
        tourPoitrine: 96,
        tourTaille: 78,
        tourBassin: 104,
        manche: 60,
      },
      createdAt: '2026-09-01T10:00:00Z',
    },
    {
      id: 'c2',
      workshopId: 'ws-1',
      fullName: 'Moussa Sarr',
      phone: '+221781234567',
      gender: 'M',
      measurements: {},
      createdAt: '2026-09-02T10:00:00Z',
    },
  ];
  const orders: Order[] = [
    {
      id: 'o1',
      workshopId: 'ws-1',
      clientId: 'c1',
      orderNumber: 'AW-001',
      modelName: 'Robe marinière',
      fabricPhotoUrl: 'https://cdn.test/tissu.jpg',
      totalAmount: 25000,
      totalPaid: 10000,
      remainingBalance: 15000,
      status: 'EN_COURS',
      fittingDate: '2026-09-25T00:00:00Z',
      deliveryDeadline: '2026-09-26T00:00:00Z',
      measurementSnapshot: { longueurRobe: 140, epaule: 42 },
      client: { id: 'c1', fullName: 'Fatou Diop', phone: '+221771234567' },
      createdAt: '2026-09-10T10:00:00Z',
    },
    {
      id: 'o2',
      workshopId: 'ws-1',
      clientId: 'c2',
      orderNumber: 'AW-002',
      modelName: 'Grand boubou',
      totalAmount: 40000,
      totalPaid: 40000,
      remainingBalance: 0,
      status: 'TERMINE',
      deliveryDeadline: '2026-10-05T00:00:00Z',
      client: { id: 'c2', fullName: 'Moussa Sarr', phone: '+221781234567' },
      createdAt: '2026-09-11T10:00:00Z',
    },
  ];
  const payments: PaymentEntry[] = [
    {
      id: 'p1',
      workshopId: 'ws-1',
      orderId: 'o1',
      receiptNumber: 'REC-2026-001',
      amount: 10000,
      method: 'WAVE',
      channel: 'ORDER_DEPOSIT',
      paidAt: '2026-09-10T11:00:00Z',
      whatsAppLink: 'https://wa.me/221771234567?text=recu',
      order: {
        id: 'o1',
        orderNumber: 'AW-001',
        modelName: 'Robe marinière',
        totalAmount: 25000,
        client: { fullName: 'Fatou Diop', phone: '+221771234567' },
      },
    },
  ];
  const members: WorkshopMember[] = [
    {
      id: 'm1',
      workshopId: 'ws-1',
      userId: 'u1',
      role: 'OWNER',
      joinedAt: '2026-09-01',
      user: TEST_USER,
    },
    {
      id: 'm2',
      workshopId: 'ws-1',
      userId: 'u2',
      role: 'EMPLOYEE',
      joinedAt: '2026-09-05',
      user: { id: 'u2', phone: '761112233', fullName: 'Ibrahima Fall', systemRole: 'USER' },
    },
  ];
  const adminPayments = [
    {
      id: '11111111-1111-4111-8111-111111111111',
      reference: 'SW-ABO-2026-0042',
      plan: 'EQUIPE',
      months: 3,
      amount: 15000,
      method: 'WAVE',
      status: 'PENDING',
      transactionRef: 'WV-778899',
      createdAt: '2026-09-24T10:00:00Z',
      workshop: { id: 'ws-1', name: 'Atelier Awa Couture', codePrefix: 'AW', phoneContact: null },
      requestedBy: { id: 'u1', fullName: 'Awa Ndiaye', phone: '771112233' },
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      reference: 'SW-ABO-2026-0040',
      plan: 'SOLO',
      months: 1,
      amount: 3000,
      method: 'ORANGE_MONEY',
      status: 'CONFIRMED',
      createdAt: '2026-09-20T10:00:00Z',
      workshop: { id: 'ws-2', name: 'Keur Couture', codePrefix: 'KC', phoneContact: null },
      requestedBy: { id: 'u3', fullName: 'Modou Fall', phone: '781112233' },
    },
  ];
  const adminWorkshops = [
    {
      id: 'ws-1',
      name: 'Atelier Awa Couture',
      codePrefix: 'AW',
      subscription: { plan: 'SOLO', status: 'TRIAL', currentPeriodEnd: '2099-10-09T00:00:00Z' },
      members: [{ user: { id: 'u1', fullName: 'Awa Ndiaye', phone: '771112233' } }],
      _count: { members: 2, clients: 12, orders: 30 },
    },
    {
      id: 'ws-2',
      name: 'Keur Couture',
      codePrefix: 'KC',
      subscription: {
        plan: 'EQUIPE',
        status: 'SUSPENDED',
        currentPeriodEnd: '2026-01-01T00:00:00Z',
      },
      members: [{ user: { id: 'u3', fullName: 'Modou Fall', phone: '781112233' } }],
      _count: { members: 4, clients: 40, orders: 90 },
    },
  ];
  return {
    clients,
    orders,
    payments,
    members,
    subscriptionPayments: [],
    subscriptionReadOnly: false,
    adminPayments,
    adminWorkshops,
    activations: [],
    inviteLimitReached: false,
    invitations: { [INVITE_TOKEN]: 'Keur Couture' },
    joinedWorkshops: [],
    revenueHidden: false,
  };
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function metrics(db: FakeDb): DashboardMetrics {
  return {
    activeOrdersCount: db.orders.filter((o) => o.status === 'EN_COURS').length,
    urgentOrdersCount: 1,
    fittingTodayCount: 1,
    totalRemainingDue: db.orders.reduce((acc, o) => acc + (o.remainingBalance || 0), 0),
    weeklyRevenue: db.revenueHidden ? 0 : 10000,
    monthlyRevenue: db.revenueHidden ? 0 : 50000,
    revenueHidden: db.revenueHidden,
    recentPayments: db.payments,
    urgentOrders: db.orders.filter((o) => o.status === 'EN_COURS'),
  };
}

/**
 * Réponse de liste comme l'API : avec `?limit=` (et `?cursor=`), page
 * `{ data, nextCursor }` ; sans, tableau complet (ancien format).
 */
function listResponse<T extends { id: string }>(
  list: T[],
  url: URL,
): T[] | { data: T[]; nextCursor: string | null } {
  const limit = Number(url.searchParams.get('limit'));
  if (!limit) return list;
  const cursor = url.searchParams.get('cursor');
  const start = cursor ? list.findIndex((item) => item.id === cursor) + 1 : 0;
  const data = list.slice(start, start + limit);
  const hasMore = start + limit < list.length;
  return { data, nextCursor: hasMore ? data[data.length - 1].id : null };
}

/** Enregistre la session de test dans le `localStorage`. */
export function seedSession(): void {
  localStorage.setItem('tailor_token', 'jwt');
  localStorage.setItem('tailor_user', JSON.stringify(TEST_USER));
  localStorage.setItem('tailor_workshops', JSON.stringify([TEST_WORKSHOP]));
  localStorage.setItem('tailor_workshop', JSON.stringify(TEST_WORKSHOP));
  localStorage.setItem('tailor_workshop_id', TEST_WORKSHOP.workshopId);
}

/**
 * Installe l'API simulée. Renvoie la base en mémoire (modifiable) et le mock
 * de `fetch` pour inspecter les appels.
 */
export function installFakeApi(db: FakeDb = buildFakeDb()) {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = new URL(typeof input === 'string' ? input : input.toString());
      const method = (init?.method || 'GET').toUpperCase();
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      const path = url.pathname;

      if (method === 'GET' && path === '/orders/dashboard') return json(200, metrics(db));
      if (method === 'GET' && path === '/orders') {
        const status = url.searchParams.get('status');
        return json(
          200,
          listResponse(status ? db.orders.filter((o) => o.status === status) : db.orders, url),
        );
      }
      if (method === 'POST' && path === '/orders') {
        const client = db.clients.find((c) => c.id === body.clientId);
        const order: Order = {
          ...body,
          workshopId: 'ws-1',
          orderNumber: `AW-00${db.orders.length + 1}`,
          totalPaid: body.depositAmount || 0,
          remainingBalance: body.totalAmount - (body.depositAmount || 0),
          status: 'EN_COURS',
          client: client && { id: client.id, fullName: client.fullName, phone: client.phone },
          createdAt: '2026-09-25T09:00:00Z',
        };
        db.orders.push(order);
        return json(201, order);
      }
      const statusMatch = path.match(/^\/orders\/([^/]+)\/status$/);
      if (method === 'PATCH' && statusMatch) {
        const order = db.orders.find((o) => o.id === statusMatch[1]);
        if (!order) return json(404, { message: 'Commande introuvable' });
        order.status = body.status;
        return json(200, order);
      }
      if (method === 'GET' && path === '/clients') {
        const q = url.searchParams.get('q')?.toLowerCase();
        return json(
          200,
          listResponse(
            q ? db.clients.filter((c) => c.fullName.toLowerCase().includes(q)) : db.clients,
            url,
          ),
        );
      }
      if (method === 'POST' && path === '/clients') {
        const client: Client = {
          ...body,
          workshopId: 'ws-1',
          createdAt: '2026-09-25T09:00:00Z',
          measurements: body.measurements || {},
        };
        db.clients.push(client);
        return json(201, client);
      }
      const clientMatch = path.match(/^\/clients\/([^/]+)$/);
      if (method === 'PATCH' && clientMatch) {
        const client = db.clients.find((c) => c.id === clientMatch[1]);
        if (!client) return json(404, { message: 'Cliente introuvable' });
        Object.assign(client, body);
        return json(200, client);
      }
      if (method === 'GET' && path === '/payments')
        return json(200, listResponse(db.payments, url));
      if (method === 'POST' && path === '/payments') {
        if (!body.orderId) return json(400, { message: 'La commande est obligatoire.' });
        const payment: PaymentEntry = {
          ...body,
          workshopId: 'ws-1',
          receiptNumber: `REC-2026-00${db.payments.length + 1}`,
          paidAt: '2026-09-25T09:00:00Z',
          whatsAppLink: 'https://wa.me/221771234567?text=recu',
        };
        db.payments.push(payment);
        return json(201, payment);
      }
      // --- Back-office -------------------------------------------------------
      if (method === 'POST' && path === '/auth/admin/login') {
        if (body.email !== ADMIN_EMAIL || body.password !== ADMIN_PASSWORD) {
          return json(401, {
            statusCode: 401,
            message: 'Identifiants invalides',
            error: 'Unauthorized',
          });
        }
        return json(200, {
          accessToken: 'admin-jwt',
          user: {
            id: 'adm',
            phone: '',
            fullName: 'Admin Sama Waay',
            email: ADMIN_EMAIL,
            systemRole: 'SUPER_ADMIN',
          },
          workshops: [],
        });
      }
      if (path.startsWith('/super-admin/')) {
        const auth = (init?.headers as Record<string, string> | undefined)?.Authorization;
        if (auth !== 'Bearer admin-jwt')
          return json(401, { statusCode: 401, message: 'Session expirée', error: 'Unauthorized' });
        if (method === 'GET' && path === '/super-admin/subscription-payments') {
          const status = url.searchParams.get('status');
          return json(
            200,
            status ? db.adminPayments.filter((p) => p.status === status) : db.adminPayments,
          );
        }
        const review = path.match(
          /^\/super-admin\/subscription-payments\/([^/]+)\/(confirm|reject)$/,
        );
        if (method === 'POST' && review) {
          const payment = db.adminPayments.find((p) => p.id === review[1]);
          if (!payment)
            return json(404, {
              statusCode: 404,
              message: 'Demande introuvable',
              error: 'Not Found',
            });
          payment.status = review[2] === 'confirm' ? 'CONFIRMED' : 'REJECTED';
          if (review[2] === 'reject') payment.rejectionReason = body.reason;
          return json(200, payment);
        }
        if (method === 'GET' && path === '/super-admin/workshops') {
          return url.searchParams.has('limit')
            ? json(200, { data: db.adminWorkshops, nextCursor: null })
            : json(200, db.adminWorkshops);
        }
        if (method === 'POST' && path === '/super-admin/activate-subscription') {
          db.activations.push(body);
          return json(201, {
            message: `Abonnement ${body.plan} activé pour ${body.durationMonths} mois.`,
            subscription: {},
          });
        }
      }
      if (method === 'GET' && path === '/public/config') {
        return json(200, {
          subscriptionTransferPhone: '+221776723136',
          currency: 'XOF',
          prices: { SOLO: 3000, EQUIPE: 5000 },
          maxSubscriptionMonths: 12,
          onlinePaymentEnabled: false,
        });
      }
      if (method === 'GET' && path === '/subscriptions/current') {
        return json(200, {
          subscription: {
            ...TEST_WORKSHOP.subscription,
            status: db.subscriptionReadOnly ? 'SUSPENDED' : 'TRIAL',
            daysRemaining: db.subscriptionReadOnly ? 0 : 14,
            isReadOnly: db.subscriptionReadOnly,
          },
          pendingPayments: db.subscriptionPayments.filter((p) => p.status === 'PENDING'),
          onlinePaymentEnabled: false,
        });
      }
      if (method === 'POST' && path === '/subscriptions/manual-payments') {
        const existing = db.subscriptionPayments.find(
          (p) => p.clientMutationId === body.clientMutationId,
        );
        if (existing)
          return json(201, { ...existing, whatsAppUrl: 'https://wa.me/221776723136?text=abo' });
        if (db.subscriptionPayments.filter((p) => p.status === 'PENDING').length >= 3) {
          return json(409, {
            statusCode: 409,
            message: 'Vous avez déjà 3 demandes en attente de validation.',
            error: 'Conflict',
          });
        }
        const prices: Record<string, number> = { SOLO: 3000, EQUIPE: 5000 };
        const created = {
          id: `sp${db.subscriptionPayments.length + 1}`,
          clientMutationId: body.clientMutationId,
          reference: `SW-ABO-00${db.subscriptionPayments.length + 1}`,
          plan: body.plan,
          months: body.months,
          amount: prices[body.plan] * body.months,
          method: body.method,
          status: 'PENDING',
          createdAt: '2026-09-25T09:00:00Z',
        };
        db.subscriptionPayments.push(created);
        return json(201, {
          id: created.id,
          reference: created.reference,
          amount: created.amount,
          status: 'PENDING',
          whatsAppUrl: 'https://wa.me/221776723136?text=abo',
        });
      }
      if (method === 'GET' && path === '/workshops/members') return json(200, db.members);
      if (method === 'POST' && path === '/workshops/invite') {
        if (db.inviteLimitReached) {
          return json(403, {
            statusCode: 403,
            message:
              'Le forfait SOLO est limité à 1 employé. Passez au forfait EQUIPE pour inviter davantage.',
            error: 'Forbidden',
          });
        }
        return json(201, {
          message: 'ok',
          inviteLink: 'https://app.test/invite/x',
          whatsAppLink: 'https://wa.me/221761112233?text=invite',
        });
      }
      if (method === 'POST' && /^\/workshops\/members\/[^/]+\/revoke$/.test(path))
        return json(200, { message: 'Accès révoqué' });
      if (method === 'POST' && path === '/workshops/join') {
        const workshopName = db.invitations[body.token];
        if (!workshopName)
          return json(400, {
            statusCode: 400,
            message: "Lien d'invitation invalide ou expiré.",
            error: 'Bad Request',
          });
        delete db.invitations[body.token];
        db.joinedWorkshops.push({
          ...TEST_WORKSHOP,
          workshopId: 'ws-2',
          name: workshopName,
          codePrefix: 'KC',
          role: 'EMPLOYEE',
        });
        return json(201, { message: `Vous avez rejoint l'Atelier ${workshopName} avec succès` });
      }
      if (method === 'POST' && path === '/auth/login') {
        if (body.pin !== '1234') return json(401, { message: 'Téléphone ou code PIN incorrect' });
        return json(200, {
          user: TEST_USER,
          token: 'jwt',
          workshops: [TEST_WORKSHOP, ...db.joinedWorkshops],
        });
      }
      if (method === 'POST' && path === '/auth/register') {
        return json(201, {
          user: { ...TEST_USER, fullName: body.fullName },
          accessToken: 'jwt',
          workshops: [{ ...TEST_WORKSHOP, name: body.workshopName }],
        });
      }
      return json(404, { message: `Route non simulée : ${method} ${path}` });
    },
  );
  vi.stubGlobal('fetch', fetchMock);
  return { db, fetchMock };
}
