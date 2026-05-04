// eBarimt API - PosAPI 3.0 Integration
// Бодит backend API-тай холбогдоно

import api from '../lib/axios';

// ==================== TYPES ====================

export interface EBarimtStatus {
  online: boolean;
  message: string;
  info?: {
    lotteryCount?: number;
    billCount?: number;
    lastSentDate?: string;
    warningMessage?: string;
  };
  timestamp: string;
}

export interface EBarimtInformation {
  success: boolean;
  posNo?: string;
  branchNo?: string;
  lastSentDate?: string;
  lotteryCount?: number; // normalized from leftLotteries by backend route
  leftLotteries?: number; // raw POS API field
  billCount?: number;
  billAmount?: number;
  warningMessage?: string;
  shouldSendNow?: boolean;
  message?: string;
}

export interface SendDataResult {
  success: boolean;
  sentBillCount?: number;
  sentAmount?: number;
  message?: string;
}

export interface TinCheckResult {
  success: boolean;
  found: boolean;
  name?: string;
  tin?: string;
  message?: string;
}

export interface DistrictCode {
  code: string;
  name: string;
}

export interface VatFreeCode {
  code: string;
  name: string;
  type: string;
}

export interface ClassificationCode {
  code: string;
  name: string;
}

export interface EBarimtRegisterResult {
  success: boolean;
  orderId?: number;
  ebarimtId?: string;
  billId?: string;
  date?: string;
  lottery?: string;
  qrData?: string;
  isB2B?: boolean;
  totalVAT?: number;
  totalAmount?: number;
  message?: string;
}

export interface EBarimtReturnResult {
  success: boolean;
  orderId?: number;
  returnId?: string;
  message?: string;
}

export interface EBarimtEditResult {
  status: string;
  data: {
    orderId: number;
    newBillId: string;
    lottery?: string;
    qrData?: string;
    message: string;
  };
}

export interface EBarimtSupplementResult {
  status: string;
  data: {
    orderId: number;
    billId: string;
    lottery?: string;
    qrData?: string;
    message: string;
  };
}

export interface UnregisteredOrder {
  id: number;
  orderNumber?: string;
  orderDate: string;
  totalAmount?: number;
  status: string;
  customer: {
    name: string;
    organizationName?: string;
    registrationNumber?: string;
  };
  agent?: {
    name: string;
  };
}

export interface RegisteredOrder {
  id: number;
  orderNumber?: string;
  orderDate: string;
  ebarimtDate?: string;
  ebarimtBillId?: string;
  totalAmount?: number;
  customer: {
    name: string;
    organizationName?: string;
    registrationNumber?: string;
  };
}

export interface CityTaxResult {
  amount: number;
  districtCode: string;
  cityTax: number;
  isUlaanbaatar: boolean;
}

// ==================== API ====================

export const ebarimtApi = {
  // ==================== STATUS & INFO ====================

  /**
   * Get eBarimt system status
   */
  getStatus: () => api.get<{ status: string; data: EBarimtStatus }>('/api/ebarimt/status'),

  /**
   * Get POS API information (lottery count, pending bills, etc.)
   */
  getInformation: () =>
    api.get<{ status: string; data: EBarimtInformation }>('/api/ebarimt/information'),

  /**
   * Send pending bills to central system
   */
  sendData: () => api.post<{ status: string; data: SendDataResult }>('/api/ebarimt/send-data'),

  // ==================== REFERENCE DATA ====================

  /**
   * Check taxpayer identification number (TIN)
   */
  checkTin: (tin: string) =>
    api.get<{ status: string; data: TinCheckResult }>(`/api/ebarimt/check-tin/${tin}`),

  /**
   * Get district codes
   */
  getDistrictCodes: () =>
    api.get<{ status: string; data: DistrictCode[] }>('/api/ebarimt/district-codes'),

  /**
   * Get VAT-free product codes
   */
  getVatFreeCodes: () =>
    api.get<{ status: string; data: VatFreeCode[]; message?: string }>(
      '/api/ebarimt/vat-free-codes'
    ),

  /**
   * Get classification codes (BUNA)
   */
  getClassificationCodes: (search?: string) =>
    api.get<{ status: string; data: ClassificationCode[]; message?: string }>(
      '/api/ebarimt/classification-codes',
      { params: { search } }
    ),

  // ==================== RECEIPT OPERATIONS ====================

  /**
   * Register order with eBarimt
   */
  registerOrder: (orderId: number) =>
    api.post<{ status: string; data: EBarimtRegisterResult }>(`/api/ebarimt/register/${orderId}`),

  /**
   * Return/cancel eBarimt bill
   */
  returnOrder: (orderId: number, reason?: string) =>
    api.post<{ status: string; data: EBarimtReturnResult }>(`/api/ebarimt/return/${orderId}`, {
      reason,
    }),

  /**
   * Edit/correct eBarimt bill
   */
  editOrder: (orderId: number, reason: string) =>
    api.post<{ status: string; data: EBarimtRegisterResult }>(`/api/ebarimt/edit/${orderId}`, {
      reason,
    }),

  /**
   * Issue supplementary bill for previous month
   */
  supplementOrder: (orderId: number) =>
    api.post<{ status: string; data: EBarimtRegisterResult }>(`/api/ebarimt/supplement/${orderId}`),

  /**
   * Get bill details
   */
  getBill: (billId: string) =>
    api.get<{ status: string; data: unknown }>(`/api/ebarimt/bill/${billId}`),

  // ==================== LISTING ====================

  /**
   * Get unregistered Store orders
   */
  getUnregisteredOrders: (limit?: number) =>
    api.get<{ status: string; data: { count: number; orders: UnregisteredOrder[] } }>(
      '/api/ebarimt/orders/unregistered',
      { params: { limit } }
    ),

  /**
   * Get registered orders
   */
  getRegisteredOrders: (params?: { startDate?: string; endDate?: string; limit?: number }) =>
    api.get<{
      status: string;
      data: {
        count: number;
        totals: { totalAmount: number; totalVat: number; count: number };
        orders: RegisteredOrder[];
      };
    }>('/api/ebarimt/orders/registered', { params }),

  // ==================== DEVICE ====================

  /**
   * Register POS device
   */
  registerDevice: (deviceInfo: {
    macAddress: string;
    latitude?: number;
    longitude?: number;
    location?: string;
  }) =>
    api.post<{ status: string; data: { message: string } }>(
      '/api/ebarimt/register-device',
      deviceInfo
    ),

  // ==================== UTILITY ====================

  /**
   * Calculate city tax (NHAT)
   */
  calculateCityTax: (amount: number, districtCode?: string) =>
    api.post<{ status: string; data: CityTaxResult }>('/api/ebarimt/calculate-city-tax', {
      amount,
      districtCode,
    }),
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate VAT (10%)
 */
export const calculateVAT = (amount: number): number => {
  return Math.round(amount * 0.1 * 100) / 100;
};

/**
 * Calculate City Tax for Ulaanbaatar (2%)
 */
export const calculateCityTax = (amount: number): number => {
  return Math.round(amount * 0.02 * 100) / 100;
};

/**
 * Format lottery number for display
 */
export const formatLotteryNumber = (lottery?: string | null): string => {
  if (!lottery) return '';
  return lottery;
};

/**
 * Check if order is B2B — registrationNumber нь хувь хүний ТТД байж болно тул дангаар нь битгий ашиглаарай
 */
export const isB2BOrder = (order?: {
  ebarimtReceiptType?: string | null;
  ebarimtType?: string | null;
  customer?: { organizationName?: string | null; registrationNumber?: string | null } | null;
}): boolean => {
  const kind = order?.ebarimtReceiptType || order?.ebarimtType;
  if (kind === 'B2B') return true;
  if (kind === 'B2C') return false;
  return !!order?.customer?.organizationName?.trim();
};

/**
 * Get lottery warning status
 */
export const getLotteryWarningLevel = (count?: number): 'ok' | 'warning' | 'critical' => {
  if (count === undefined) return 'ok';
  if (count < 50) return 'critical';
  if (count < 100) return 'warning';
  return 'ok';
};

export default ebarimtApi;
