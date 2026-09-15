import { db } from './db';

/**
 * Migration et intégrité du cache IndexedDB local
 */
export async function verifyAndMigrateLocalDb() {
  try {
    const clientCount = await db.clients.count();
    const orderCount = await db.orders.count();
    const pendingCount = await db.pendingMutations.count();

    console.info(`📦 [Dexie DB] Initialisation réussie : ${clientCount} clients, ${orderCount} commandes, ${pendingCount} en attente.`);
    return true;
  } catch (error) {
    console.error('❌ Erreur initialisation Dexie DB:', error);
    return false;
  }
}
