import Dexie, { Table } from 'dexie';
import { Client, Order, PaymentEntry, PendingMutation } from '@types';

export class TailorDatabase extends Dexie {
  clients!: Table<Client, string>;
  orders!: Table<Order, string>;
  payments!: Table<PaymentEntry, string>;
  pendingMutations!: Table<PendingMutation, string>;

  constructor() {
    super('TailorDatabase_v2');
    this.version(1).stores({
      clients: 'id, workshopId, phone, fullName, isSynced',
      orders: 'id, workshopId, clientId, clientMutationId, orderNumber, status, deliveryDeadline, isSynced',
      payments: 'id, workshopId, orderId, clientMutationId, receiptNumber, isSynced',
      pendingMutations: 'id, type, createdAt',
    });
  }
}

export const db = new TailorDatabase();
