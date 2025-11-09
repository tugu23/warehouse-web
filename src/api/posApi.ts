// PosAPI 3.0 Integration
// Монгол Улсын И-баримтын систем (PosAPI 3.0)

// PosAPI base URL - үүнийг .env файлд тохируулна

// PosAPI client

// Response Types
export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  message: string;
  timestamp: string;
}

export interface SyncHistory {
  id: number;
  type: 'products' | 'orders' | 'sales' | 'ereceipt';
  result: SyncResult;
}

// И-баримтын Types
export interface EReceiptRequest {
  orderId: number;
  amount: number;
  customerTin?: string; // Харилцагчийн регистр (НӨАТ төлөгч бол)
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    barCode?: string;
  }>;
  paymentMethod: string;
  cashierId: number;
  cashierName: string;
}

export interface EReceiptResponse {
  success: boolean;
  receiptId: string;
  receiptNumber: string;
  qrCode: string; // QR код base64
  receiptUrl: string; // И-баримт татах URL
  lottery: string; // Сугалааны дугаар
  message: string;
  timestamp: string;
}

// Mock sync history storage (development only)
let syncHistoryStorage: SyncHistory[] = [];
let nextId = 1;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const posApi = {
  /**
   * И-баримт хэвлэх
   * Print E-Receipt via PosAPI 3.0
   */
  printEReceipt: async (): Promise<EReceiptResponse> => {
    try {
      // Бодит PosAPI дуудах
      // const response = await posApiClient.post('/receipts/print', request);
      // return response.data;

      // MOCK Implementation - Бодит API холбогдохоос өмнө
      await delay(1500);

      const receiptNumber = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const mockResponse: EReceiptResponse = {
        success: true,
        receiptId: `RCP${Date.now()}`,
        receiptNumber: receiptNumber,
        qrCode:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        receiptUrl: `https://receipt.posapi.mn/${receiptNumber}`,
        lottery: `LT${Math.floor(Math.random() * 1000000)
          .toString()
          .padStart(8, '0')}`,
        message: 'И-баримт амжилттай хэвлэгдлээ',
        timestamp: new Date().toISOString(),
      };

      // Store in history
      syncHistoryStorage.push({
        id: nextId++,
        type: 'ereceipt',
        result: {
          success: true,
          syncedCount: 1,
          failedCount: 0,
          message: `И-баримт ${receiptNumber} амжилттай хэвлэгдлээ`,
          timestamp: new Date().toISOString(),
        },
      });

      return mockResponse;
    } catch (error) {
      console.error('И-баримт хэвлэх алдаа:', error);
      throw new Error('И-баримт хэвлэхэд алдаа гарлаа');
    }
  },

  /**
   * И-баримт буцаах
   * Refund E-Receipt
   */
  refundEReceipt: async (receiptId: string): Promise<EReceiptResponse> => {
    try {
      // const response = await posApiClient.post('/receipts/refund', { receiptId, amount });
      // return response.data;

      await delay(1200);

      return {
        success: true,
        receiptId: `REF${Date.now()}`,
        receiptNumber: `REF-${receiptId}`,
        qrCode: '',
        receiptUrl: `https://receipt.posapi.mn/refund/${receiptId}`,
        lottery: '',
        message: 'И-баримт буцаалт амжилттай',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('И-баримт буцаах алдаа:', error);
      throw new Error('И-баримт буцаахад алдаа гарлаа');
    }
  },

  /**
   * И-баримт шалгах
   * Check E-Receipt Status
   */
  checkEReceipt: async (): Promise<{ status: string; verified: boolean }> => {
    try {
      // const response = await posApiClient.get(`/receipts/${receiptId}/status`);
      // return response.data;

      await delay(500);

      return {
        status: 'verified',
        verified: true,
      };
    } catch (error) {
      console.error('И-баримт шалгах алдаа:', error);
      throw new Error('И-баримт шалгахад алдаа гарлаа');
    }
  },

  /**
   * Синхрончлох бараа
   * Sync products from PosAPI to local system
   */
  syncProducts: async (): Promise<SyncResult> => {
    try {
      // const response = await posApiClient.get('/products');
      // return response.data;

      await delay(1500);
      const syncedCount = Math.floor(Math.random() * 50) + 20;
      const failedCount = Math.floor(Math.random() * 5);

      const result: SyncResult = {
        success: true,
        syncedCount,
        failedCount,
        message: `${syncedCount} бараа амжилттай синхрончлогдлоо. ${failedCount} бараа алдаатай.`,
        timestamp: new Date().toISOString(),
      };

      syncHistoryStorage.push({
        id: nextId++,
        type: 'products',
        result,
      });

      return result;
    } catch (error) {
      console.error('Бараа синхрончлох алдаа:', error);
      throw new Error('Бараа синхрончлоход алдаа гарлаа');
    }
  },

  /**
   * Синхрончлох захиалга
   * Sync orders to PosAPI
   */
  syncOrders: async (): Promise<SyncResult> => {
    try {
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
    } catch (error) {
      console.error('Захиалга синхрончлох алдаа:', error);
      throw new Error('Захиалга синхрончлоход алдаа гарлаа');
    }
  },

  /**
   * Илгээх борлуулалтын мэдээлэл
   * Send sales data to PosAPI
   */
  sendSalesData: async (): Promise<SyncResult> => {
    try {
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
    } catch (error) {
      console.error('Борлуулалт илгээх алдаа:', error);
      throw new Error('Борлуулалт илгээхэд алдаа гарлаа');
    }
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
    type: 'products' | 'orders' | 'sales' | 'ereceipt'
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
