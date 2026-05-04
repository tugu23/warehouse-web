import api from '../lib/axios';
import {
  AuthResponse,
  LoginRequest,
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  InventoryAdjustmentRequest,
  MonthlyInventory,
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  Order,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  RecordPaymentRequest,
  PaymentRecord,
  Return,
  CreateReturnRequest,
  RecordLocationRequest,
  AgentRoute,
  AllAgentLocations,
  VisitPlan,
  CreateVisitPlanRequest,
  UpdateVisitPlanRequest,
  WorkTask,
  CreateWorkTaskRequest,
  UpdateWorkTaskRequest,
  SalesTarget,
  CreateSalesTargetRequest,
  UpdateSalesTargetRequest,
  DeliveryPlan,
  CreateDeliveryPlanRequest,
  UpdateDeliveryPlanRequest,
  SalesReportData,
  CreditStatusReport,
  InventoryReportData,
  DeliveryScheduleReport,
  ApiResponse,
  ProductSalesAnalytics,
  SalesReportGrouped,
  SalesGroupBy,
  EmployeeLocationFiltered,
  InventoryForecast,
  CalculateAnalyticsRequest,
  CalculateAllAnalyticsRequest,
  GenerateForecastRequest,
  GenerateAllForecastsRequest,
  SalesByPeriodParams,
  SalesByPeriodResponse,
  PaginationInfo,
  ProductPrice,
  CreateProductPriceRequest,
  UpdateProductPriceRequest,
  CustomerType,
  AgentKpiSummaryData,
  AgentKpiProductRow,
  AgentKpiMultiAgentRow,
  AgentKpiTarget,
  CreateAgentKpiTargetRequest,
  UpdateAgentKpiTargetRequest,
  AgentKpiGranularity,
  SalesKpiData,
} from '../types';

// Authentication API
export const authApi = {
  login: (credentials: LoginRequest) => api.post<AuthResponse>('/api/auth/login', credentials),
};

// Employees API
export const employeesApi = {
  getAll: (params?: { limit?: number | string; page?: number }) =>
    api.get<ApiResponse<{ employees: Employee[] }>>('/api/employees', { params }),
  getById: (id: number) => api.get<ApiResponse<{ employee: Employee }>>(`/api/employees/${id}`),
  create: (data: CreateEmployeeRequest) =>
    api.post<ApiResponse<{ employee: Employee }>>('/api/employees', data),
  update: (id: number, data: UpdateEmployeeRequest) =>
    api.put<ApiResponse<{ employee: Employee }>>(`/api/employees/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/api/employees/${id}`),
};

// Products API
export const productsApi = {
  getAll: (params?: {
    search?: string;
    categoryId?: number;
    limit?: number | string;
    page?: number;
    include?: string;
  }) =>
    api.get<ApiResponse<{ products: Product[]; pagination?: PaginationInfo }>>('/api/products', {
      params,
    }),
  getById: (id: number) => api.get<ApiResponse<{ product: Product }>>(`/api/products/${id}`),
  getByBarcode: (barcode: string) =>
    api.get<ApiResponse<{ product: Product }>>(`/api/products/barcode/${barcode}`),
  create: (data: CreateProductRequest) =>
    api.post<ApiResponse<{ product: Product }>>('/api/products', data),
  update: (id: number, data: UpdateProductRequest) =>
    api.put<ApiResponse<{ product: Product }>>(`/api/products/${id}`, data),
  adjustInventory: (data: InventoryAdjustmentRequest) =>
    api.post<ApiResponse<{ product: Product }>>('/api/products/inventory/adjust', data),
  getMonthlyInventory: (month: string) =>
    api.get<ApiResponse<{ inventory: MonthlyInventory[] }>>('/api/products/inventory/monthly', {
      params: { month },
    }),
};

// Product Prices API
export const productPricesApi = {
  getAll: () =>
    api.get<ApiResponse<{ prices: ProductPrice[]; productPrices?: ProductPrice[] }>>(
      '/api/product-prices'
    ),
  getById: (id: number) =>
    api.get<ApiResponse<{ productPrice: ProductPrice }>>(`/api/product-prices/${id}`),
  getByProductId: (productId: number) =>
    api.get<ApiResponse<{ prices: ProductPrice[]; productPrices?: ProductPrice[] }>>(
      `/api/product-prices/products/${productId}/prices`
    ),
  upsertByProduct: (productId: number, data: { customerTypeId: number; price: number }) =>
    api.post<ApiResponse<{ productPrice?: ProductPrice; price?: ProductPrice }>>(
      `/api/product-prices/products/${productId}/prices`,
      data
    ),
  deleteByProduct: (productId: number, customerTypeId: number) =>
    api.delete<ApiResponse<void>>(
      `/api/product-prices/products/${productId}/prices/${customerTypeId}`
    ),
  create: (data: CreateProductPriceRequest) =>
    api.post<ApiResponse<{ productPrice: ProductPrice }>>('/api/product-prices', data),
  update: (id: number, data: UpdateProductPriceRequest) =>
    api.put<ApiResponse<{ productPrice: ProductPrice }>>(`/api/product-prices/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/api/product-prices/${id}`),
};

// Customers API
export const customersApi = {
  getAll: (params?: {
    search?: string;
    limit?: string;
    page?: number;
    district?: string;
    forOrder?: boolean;
  }) =>
    api.get<ApiResponse<{ customers: Customer[]; pagination?: PaginationInfo }>>('/api/customers', {
      params,
    }),
  getById: (id: number) => api.get<ApiResponse<{ customer: Customer }>>(`/api/customers/${id}`),
  create: (data: CreateCustomerRequest) =>
    api.post<ApiResponse<{ customer: Customer }>>('/api/customers', data),
  update: (id: number, data: UpdateCustomerRequest) =>
    api.put<ApiResponse<{ customer: Customer }>>(`/api/customers/${id}`, data),
};

export const customerTypesApi = {
  getAll: () => api.get<ApiResponse<{ customerTypes: CustomerType[] }>>('/api/customer-types'),
};

// Orders API
export const ordersApi = {
  getAll: (params?: {
    status?: string;
    customerId?: number;
    paymentStatus?: string;
    limit?: string;
    page?: number;
  }) =>
    api.get<ApiResponse<{ orders: Order[]; pagination?: PaginationInfo }>>('/api/orders', {
      params,
    }),
  getById: (id: number) => api.get<ApiResponse<{ order: Order }>>(`/api/orders/${id}`),
  create: (data: CreateOrderRequest) =>
    api.post<ApiResponse<{ order: Order }>>('/api/orders', data),
  update: (id: number, data: CreateOrderRequest) =>
    api.put<ApiResponse<{ order: Order }>>(`/api/orders/${id}`, data),
  updateStatus: (id: number, data: UpdateOrderStatusRequest) =>
    api.put<ApiResponse<{ order: Order }>>(`/api/orders/${id}/status`, data),
  updateEbarimt: (
    id: number,
    data: { ebarimtId: string; ebarimtBillId: string; ebarimtDate: string }
  ) => api.put<ApiResponse<{ order: Order }>>(`/api/orders/${id}/ebarimt`, data),
  recordPayment: (data: RecordPaymentRequest) =>
    api.post<ApiResponse<{ payment: PaymentRecord; order: Order }>>(
      `/api/orders/${data.orderId}/payments`,
      data
    ),
  getPayments: (orderId: number) =>
    api.get<ApiResponse<{ payments: PaymentRecord[] }>>(`/api/orders/${orderId}/payments`),
  getReceipt: (id: number) => api.get(`/api/orders/${id}/receipt`),
  getDocument: (id: number) => api.get(`/api/orders/${id}/document`),
  exportToExcel: (id: number) => api.get(`/api/orders/${id}/export`, { responseType: 'blob' }),
  // PDF Receipt API
  viewReceiptPDF: async (id: number, showVat: boolean = true) => {
    try {
      const response = await api.get(`/api/orders/${id}/receipt/pdf?showVat=${showVat}`, {
        responseType: 'blob',
      });

      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });

      // Create blob URL and open in new tab
      const pdfUrl = window.URL.createObjectURL(blob);
      const newWindow = window.open(pdfUrl, '_blank');

      // Clean up blob URL after window opens
      if (newWindow) {
        newWindow.onload = () => {
          window.URL.revokeObjectURL(pdfUrl);
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error viewing PDF:', error);
      throw error;
    }
  },
  // View non-VAT receipt (НӨАТ-гүй падаан)
  viewNonVatReceiptPDF: async (id: number) => {
    try {
      const response = await api.get(`/api/orders/${id}/receipt/pdf?showVat=false`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const pdfUrl = window.URL.createObjectURL(blob);
      const newWindow = window.open(pdfUrl, '_blank');

      if (newWindow) {
        newWindow.onload = () => {
          window.URL.revokeObjectURL(pdfUrl);
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error viewing non-VAT PDF:', error);
      throw error;
    }
  },
  createEbarimtDirect: (data: {
    customerId?: number;
    items: { productId: number; quantity: number; unitPrice: number }[];
    totalAmount: number;
    paymentMethod?: string;
    ebarimtBillId: string;
    ebarimtDate: string;
    ebarimtId?: string;
  }) => api.post<ApiResponse<{ order: Order }>>('/api/orders/ebarimt-direct', data),
  /** Persists POS eBarimt result; uses PUT /ebarimt (same handler as mark-ebarimt) for compatibility */
  markEbarimt: (
    id: number,
    data: { ebarimtBillId: string; ebarimtDate: string; ebarimtId?: string; ebarimtType?: string }
  ) =>
    api.put<ApiResponse<{ order: Order }>>(`/api/orders/${id}/ebarimt`, {
      ebarimtId: data.ebarimtId ?? data.ebarimtBillId,
      ebarimtBillId: data.ebarimtBillId,
      ebarimtDate: data.ebarimtDate,
      ...(data.ebarimtType ? { ebarimtReceiptType: data.ebarimtType } : {}),
    }),
  /** Register order with eBarimt via backend API */
  registerEbarimt: (id: number, data?: { customerTin?: string }) =>
    api.post<
      ApiResponse<{
        success: boolean;
        orderId: number;
        ebarimtId?: string;
        billId?: string;
        date?: string;
        lottery?: string;
        qrData?: string;
        isB2B?: boolean;
        totalVAT?: number;
        totalAmount?: number;
        message?: string;
      }>
    >(`/api/ebarimt/register/${id}`, data),
  ebarimtReturn: (id: number) =>
    api.post<ApiResponse<{ ebarimtBillId: string; ebarimtDate: string; orderId: number }>>(
      `/api/orders/${id}/ebarimt-return`
    ),
  ebarimtReturnDone: (id: number, returnId: string) =>
    api.post<ApiResponse<void>>(`/api/orders/${id}/ebarimt-return-done`, { returnId }),
  downloadReceiptPDF: async (id: number, showVat: boolean = true) => {
    try {
      const response = await api.get(
        `/api/orders/${id}/receipt/pdf?download=true&showVat=${showVat}`,
        {
          responseType: 'blob',
        }
      );

      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = showVat ? `receipt-order-${id}.pdf` : `padaan-order-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      return { success: true };
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  },
};

// Returns API
export const returnsApi = {
  getAll: (params?: { orderId?: number; productId?: number; limit?: number; page?: number }) =>
    api.get<ApiResponse<{ returns: Return[] }>>('/api/returns', { params }),
  getById: (id: number) => api.get<ApiResponse<{ return: Return }>>(`/api/returns/${id}`),
  create: (data: CreateReturnRequest) =>
    api.post<ApiResponse<{ return: Return }>>('/api/returns', data),
  delete: (id: number) => api.delete<ApiResponse<{ message?: string }>>(`/api/returns/${id}`),
};

// Agents API
export const agentsApi = {
  recordLocation: (agentId: number, data: RecordLocationRequest) =>
    api.post<
      ApiResponse<{ location: { latitude: number; longitude: number; recordedAt: string } }>
    >(`/api/agents/${agentId}/location`, data),
  getRoute: (agentId: number, params: { startDate: string; endDate: string }) =>
    api.get<ApiResponse<AgentRoute>>(`/api/agents/${agentId}/route`, { params }),
  getAllLocations: (params?: { date?: string }) =>
    api.get<ApiResponse<AllAgentLocations>>('/api/agents/locations/all', { params }),
  // Location tracking filtered by store address
  getLocationsByStore: (
    agentId: number,
    params: { storeAddress?: string; startDate: string; endDate: string }
  ) =>
    api.get<ApiResponse<EmployeeLocationFiltered>>(`/api/agents/${agentId}/locations/filtered`, {
      params,
    }),
};

// Visit Plans API
export const visitPlansApi = {
  getAll: (params?: { agentId?: number; customerId?: number; status?: string; date?: string }) =>
    api.get<ApiResponse<{ visitPlans: VisitPlan[] }>>('/api/visit-plans', { params }),
  getById: (id: number) => api.get<ApiResponse<{ visitPlan: VisitPlan }>>(`/api/visit-plans/${id}`),
  create: (data: CreateVisitPlanRequest) =>
    api.post<ApiResponse<{ visitPlan: VisitPlan }>>('/api/visit-plans', data),
  update: (id: number, data: UpdateVisitPlanRequest) =>
    api.put<ApiResponse<{ visitPlan: VisitPlan }>>(`/api/visit-plans/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/api/visit-plans/${id}`),
};

// Work Tasks API
export const workTasksApi = {
  getAll: (params?: { assignedToId?: number; status?: string; priority?: string }) =>
    api.get<ApiResponse<{ workTasks: WorkTask[] }>>('/api/work-tasks', { params }),
  getById: (id: number) => api.get<ApiResponse<{ workTask: WorkTask }>>(`/api/work-tasks/${id}`),
  create: (data: CreateWorkTaskRequest) =>
    api.post<ApiResponse<{ workTask: WorkTask }>>('/api/work-tasks', data),
  update: (id: number, data: UpdateWorkTaskRequest) =>
    api.put<ApiResponse<{ workTask: WorkTask }>>(`/api/work-tasks/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/api/work-tasks/${id}`),
};

// Sales Targets API
export const salesTargetsApi = {
  getAll: (params?: { agentId?: number; period?: string; status?: string }) =>
    api.get<ApiResponse<{ salesTargets: SalesTarget[] }>>('/api/sales-targets', { params }),
  getById: (id: number) =>
    api.get<ApiResponse<{ salesTarget: SalesTarget }>>(`/api/sales-targets/${id}`),
  create: (data: CreateSalesTargetRequest) =>
    api.post<ApiResponse<{ salesTarget: SalesTarget }>>('/api/sales-targets', data),
  update: (id: number, data: UpdateSalesTargetRequest) =>
    api.put<ApiResponse<{ salesTarget: SalesTarget }>>(`/api/sales-targets/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/api/sales-targets/${id}`),
};

// Categories API
export const categoriesApi = {
  getAll: (params?: { search?: string; limit?: number | string; page?: number }) =>
    api.get<ApiResponse<{ categories: Category[] }>>('/api/categories', { params }),
  getById: (id: number) => api.get<ApiResponse<{ category: Category }>>(`/api/categories/${id}`),
  create: (data: CreateCategoryRequest) =>
    api.post<ApiResponse<{ category: Category }>>('/api/categories', data),
  update: (id: number, data: UpdateCategoryRequest) =>
    api.put<ApiResponse<{ category: Category }>>(`/api/categories/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/api/categories/${id}`),
};

// e-Tax API
export const etaxApi = {
  getOrganizationByRegno: (regno: string) =>
    api.get<
      ApiResponse<{
        organization: {
          regno: string;
          name: string;
          address?: string;
          vatPayer?: boolean;
          status?: string;
        };
      }>
    >(`/api/etax/organization/${regno}`),
};

// E-Barimt API (re-export from ebarimtApi.ts)
export { ebarimtApi } from './ebarimtApi';

// Delivery Plans API
export const deliveryPlansApi = {
  getAll: (params?: {
    agentId?: number;
    customerId?: number;
    status?: string;
    planDate?: string;
  }) => api.get<ApiResponse<{ deliveryPlans: DeliveryPlan[] }>>('/api/delivery-plans', { params }),
  getById: (id: number) =>
    api.get<ApiResponse<{ deliveryPlan: DeliveryPlan }>>(`/api/delivery-plans/${id}`),
  create: (data: CreateDeliveryPlanRequest) =>
    api.post<ApiResponse<{ deliveryPlan: DeliveryPlan }>>('/api/delivery-plans', data),
  update: (id: number, data: UpdateDeliveryPlanRequest) =>
    api.put<ApiResponse<{ deliveryPlan: DeliveryPlan }>>(`/api/delivery-plans/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/api/delivery-plans/${id}`),
};

// Analytics API
export const analyticsApi = {
  // Product Sales Analytics
  getProductAnalytics: (productId: number, params?: { months?: number }) =>
    api.get<ApiResponse<{ analytics: ProductSalesAnalytics }>>(
      `/api/analytics/products/${productId}`,
      { params }
    ),
  getAllProductAnalytics: (params?: { months?: number }) =>
    api.get<ApiResponse<{ analytics: ProductSalesAnalytics[] }>>('/api/analytics/products/all', {
      params,
    }),
  // Calculate Analytics
  calculateAnalytics: (data: CalculateAnalyticsRequest) =>
    api.post<ApiResponse<void>>('/api/analytics/calculate', data),
  calculateAllAnalytics: (data?: CalculateAllAnalyticsRequest) =>
    api.post<ApiResponse<void>>('/api/analytics/calculate/all', data || {}),
  // Forecasting
  getForecast: (params?: {
    page?: number;
    limit?: number;
    productId?: number;
    month?: number;
    year?: number;
  }) =>
    api.get<
      ApiResponse<{
        forecasts: InventoryForecast[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>
    >('/api/analytics/forecast', { params }),
  generateForecast: (data: GenerateForecastRequest) =>
    api.post<ApiResponse<void>>('/api/analytics/forecast', data),
  generateAllForecasts: (data?: GenerateAllForecastsRequest) =>
    api.post<ApiResponse<void>>('/api/analytics/forecast/all', data || {}),
  // Sales by Period
  getSalesByPeriod: (params: SalesByPeriodParams) =>
    api.get<ApiResponse<SalesByPeriodResponse>>('/api/analytics/sales-by-period', { params }),
};

// Reports API
export const reportsApi = {
  getSalesReport: (params: {
    startDate: string;
    endDate: string;
    agentId?: number;
    customerId?: number;
  }) => api.get<ApiResponse<SalesReportData>>('/api/reports/sales', { params }),
  // Grouped sales report
  getSalesGrouped: (params: {
    startDate: string;
    endDate: string;
    groupBy: SalesGroupBy;
    agentId?: number;
    orderType?: 'Market' | 'Store';
  }) => api.get<ApiResponse<SalesReportGrouped>>('/api/reports/sales/grouped', { params }),
  getCreditStatus: (params?: { customerId?: number; agentId?: number }) =>
    api.get<ApiResponse<CreditStatusReport>>('/api/reports/credit-status', { params }),
  getInventoryReport: (params?: { categoryId?: number; lowStock?: boolean }) =>
    api.get<ApiResponse<InventoryReportData>>('/api/reports/inventory', { params }),
  getDeliverySchedule: (params: {
    startDate: string;
    endDate: string;
    agentId?: number;
    status?: string;
  }) => api.get<ApiResponse<DeliveryScheduleReport>>('/api/reports/delivery-schedule', { params }),
  // Excel exports
  exportSales: (params: {
    startDate: string;
    endDate: string;
    agentId?: number;
    customerId?: number;
  }) => api.get('/api/reports/sales/export', { params, responseType: 'blob' }),
  exportOrders: (params: {
    startDate?: string;
    endDate?: string;
    status?: string;
    customerId?: number;
    paymentStatus?: string;
    paymentMethod?: string;
  }) => api.get('/api/reports/orders/export', { params, responseType: 'blob' }),
  exportCustomers: (params?: { district?: string; customerTypeId?: number; agentId?: number }) =>
    api.get('/api/reports/customers/export', { params, responseType: 'blob' }),
  exportProducts: (params?: { categoryId?: number }) =>
    api.get('/api/reports/products/export', { params, responseType: 'blob' }),
  exportInventory: (params?: { categoryId?: number; lowStock?: boolean }) =>
    api.get('/api/reports/inventory/export', { params, responseType: 'blob' }),
};

export const agentKpiApi = {
  getSummary: (params: {
    from: string;
    to: string;
    agentId?: number;
    granularity?: AgentKpiGranularity;
  }) => api.get<ApiResponse<AgentKpiSummaryData>>('/api/agent-kpi/summary', { params }),
  getByProduct: (params: { from: string; to: string; agentId?: number }) =>
    api.get<ApiResponse<{ products: AgentKpiProductRow[] }>>('/api/agent-kpi/by-product', {
      params,
    }),
  getMultiAgentDaily: (params: { date: string }) =>
    api.get<ApiResponse<{ date: string; agents: AgentKpiMultiAgentRow[] }>>(
      '/api/agent-kpi/multi-agent-daily',
      { params }
    ),
  getTargets: (employeeId: number) =>
    api.get<ApiResponse<{ targets: AgentKpiTarget[] }>>('/api/agent-kpi/targets', {
      params: { employeeId },
    }),
  createTarget: (data: CreateAgentKpiTargetRequest) =>
    api.post<ApiResponse<{ target: AgentKpiTarget }>>('/api/agent-kpi/targets', data),
  updateTarget: (id: number, data: UpdateAgentKpiTargetRequest) =>
    api.patch<ApiResponse<{ target: AgentKpiTarget }>>(`/api/agent-kpi/targets/${id}`, data),
  deleteTarget: (id: number) => api.delete<ApiResponse<null>>(`/api/agent-kpi/targets/${id}`),
};

export const salesKpiApi = {
  getTransactions: (params: {
    from: string;
    to: string;
    agentId?: number;
    productId?: number;
    granularity?: 'day' | 'week' | 'month' | 'year';
  }) => api.get<ApiResponse<SalesKpiData>>('/api/sales-kpi', { params }),
};

import { ebarimtApi } from './ebarimtApi';

export default {
  auth: authApi,
  employees: employeesApi,
  products: productsApi,
  productPrices: productPricesApi,
  customers: customersApi,
  customerTypes: customerTypesApi,
  orders: ordersApi,
  returns: returnsApi,
  agents: agentsApi,
  visitPlans: visitPlansApi,
  workTasks: workTasksApi,
  salesTargets: salesTargetsApi,
  categories: categoriesApi,
  deliveryPlans: deliveryPlansApi,
  reports: reportsApi,
  analytics: analyticsApi,
  etax: etaxApi,
  ebarimt: ebarimtApi,
  agentKpi: agentKpiApi,
  salesKpi: salesKpiApi,
};
