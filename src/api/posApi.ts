// Mock PosAPI Integration
// This is a mock implementation of PosAPI sync functions
// Will be replaced with real API endpoints when PosAPI is available

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  message: string;
  timestamp: string;
}

export interface SyncHistory {
  id: number;
  type: 'products' | 'orders' | 'sales';
  result: SyncResult;
}

// Mock sync history storage
let syncHistoryStorage: SyncHistory[] = [];
let nextId = 1;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const posApi = {
  /**
   * Синхрончлох бараа
   * Sync products from PosAPI to local system
   */
  syncProducts: async (): Promise<SyncResult> => {
    // Simulate API delay
    await delay(1500);

    // Simulate random success/failure
    const syncedCount = Math.floor(Math.random() * 50) + 20;
    const failedCount = Math.floor(Math.random() * 5);

    const result: SyncResult = {
      success: true,
      syncedCount,
      failedCount,
      message: `${syncedCount} бараа амжилттай синхрончлогдлоо. ${failedCount} бараа алдаатай.`,
      timestamp: new Date().toISOString(),
    };

    // Store in history
    syncHistoryStorage.push({
      id: nextId++,
      type: 'products',
      result,
    });

    return result;
  },

  /**
   * Синхрончлох захиалга
   * Sync orders to PosAPI
   */
  syncOrders: async (): Promise<SyncResult> => {
    await delay(2000);

    const syncedCount = Math.floor(Math.random() * 30) + 10;
    const failedCount = Math.floor(Math.random() * 3);

    const result: SyncResult = {
      success: true,
      syncedCount,
      failedCount,
      message: `${syncedCount} захиалга амжилттай синхрончлогдлоо. ${failedCount} захиалга алдаатай.`,
      timestamp: new Date().toISOString(),
    };

    syncHistoryStorage.push({
      id: nextId++,
      type: 'orders',
      result,
    });

    return result;
  },

  /**
   * Илгээх борлуулалтын мэдээлэл
   * Send sales data to PosAPI
   */
  sendSalesData: async (): Promise<SyncResult> => {
    await delay(1800);

    const syncedCount = Math.floor(Math.random() * 40) + 15;
    const failedCount = Math.floor(Math.random() * 2);

    const result: SyncResult = {
      success: true,
      syncedCount,
      failedCount,
      message: `${syncedCount} борлуулалтын мэдээлэл амжилттай илгээгдлээ. ${failedCount} алдаатай.`,
      timestamp: new Date().toISOString(),
    };

    syncHistoryStorage.push({
      id: nextId++,
      type: 'sales',
      result,
    });

    return result;
  },

  /**
   * Get sync history
   */
  getSyncHistory: async (limit = 20): Promise<SyncHistory[]> => {
    await delay(300);
    return syncHistoryStorage.slice(-limit).reverse();
  },

  /**
   * Clear sync history
   */
  clearSyncHistory: async (): Promise<void> => {
    await delay(200);
    syncHistoryStorage = [];
  },

  /**
   * Get last sync timestamp by type
   */
  getLastSync: async (
    type: 'products' | 'orders' | 'sales'
  ): Promise<{ timestamp: string | null; success: boolean }> => {
    await delay(200);
    const lastSync = syncHistoryStorage
      .filter((h) => h.type === type)
      .sort((a, b) => b.id - a.id)[0];

    return {
      timestamp: lastSync?.result.timestamp || null,
      success: lastSync?.result.success || false,
    };
  },
};

export default posApi;

