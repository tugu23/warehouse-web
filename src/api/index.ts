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
  ProductBatch,
  CreateProductBatchRequest,
  UpdateProductBatchRequest,
  MonthlyInventory,
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
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
} from '../types';

// Authentication API
export const authApi = {
  login: (credentials: LoginRequest) => api.post<AuthResponse>('/api/auth/login', credentials),
};

// Employees API
export const employeesApi = {
  getAll: () => api.get<ApiResponse<{ employees: Employee[] }>>('/api/employees'),
  getById: (id: number) => api.get<ApiResponse<{ employee: Employee }>>(`/api/employees/${id}`),
  create: (data: CreateEmployeeRequest) =>
    api.post<ApiResponse<{ employee: Employee }>>('/api/employees', data),
  update: (id: number, data: UpdateEmployeeRequest) =>
    api.put<ApiResponse<{ employee: Employee }>>(`/api/employees/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/api/employees/${id}`),
};

// Products API
export const productsApi = {
  getAll: (params?: { search?: string; supplierId?: number; categoryId?: number }) =>
    api.get<ApiResponse<{ products: Product[] }>>('/api/products', { params }),
  getById: (id: number) => api.get<ApiResponse<{ product: Product }>>(`/api/products/${id}`),
  getByBarcode: (barcode: string) =>
    api.get<ApiResponse<{ product: Product }>>(`/api/products/barcode/${barcode}`),
  create: (data: CreateProductRequest) =>
    api.post<ApiResponse<{ product: Product }>>('/api/products', data),
  update: (id: number, data: UpdateProductRequest) =>
    api.put<ApiResponse<{ product: Product }>>(`/api/products/${id}`, data),
  adjustInventory: (data: InventoryAdjustmentRequest) =>
    api.post<ApiResponse<{ product: Product }>>('/api/products/inventory/adjust', data),
  // Batch management
  getBatches: (productId: number) =>
    api.get<ApiResponse<{ batches: ProductBatch[] }>>(`/api/products/${productId}/batches`),
  createBatch: (data: CreateProductBatchRequest) =>
    api.post<ApiResponse<{ batch: ProductBatch }>>(`/api/products/${data.productId}/batches`, data),
  updateBatch: (id: number, data: UpdateProductBatchRequest) =>
    api.put<ApiResponse<{ batch: ProductBatch }>>(`/api/products/batches/${id}`, data),
  deleteBatch: (id: number) => api.delete<ApiResponse<void>>(`/api/products/batches/${id}`),
  getMonthlyInventory: (month: string) =>
    api.get<ApiResponse<{ inventory: MonthlyInventory[] }>>('/api/products/inventory/monthly', {
      params: { month },
    }),
};

// Customers API
export const customersApi = {
  getAll: () => api.get<ApiResponse<{ customers: Customer[] }>>('/api/customers'),
  getById: (id: number) => api.get<ApiResponse<{ customer: Customer }>>(`/api/customers/${id}`),
  create: (data: CreateCustomerRequest) =>
    api.post<ApiResponse<{ customer: Customer }>>('/api/customers', data),
  update: (id: number, data: UpdateCustomerRequest) =>
    api.put<ApiResponse<{ customer: Customer }>>(`/api/customers/${id}`, data),
};

// Orders API
export const ordersApi = {
  getAll: (params?: { status?: string; customerId?: number; paymentStatus?: string }) =>
    api.get<ApiResponse<{ orders: Order[] }>>('/api/orders', { params }),
  getById: (id: number) => api.get<ApiResponse<{ order: Order }>>(`/api/orders/${id}`),
  create: (data: CreateOrderRequest) =>
    api.post<ApiResponse<{ order: Order }>>('/api/orders', data),
  updateStatus: (id: number, data: UpdateOrderStatusRequest) =>
    api.put<ApiResponse<{ order: Order }>>(`/api/orders/${id}/status`, data),
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
};

// Returns API
export const returnsApi = {
  getAll: (params?: { orderId?: number; productId?: number }) =>
    api.get<ApiResponse<{ returns: Return[] }>>('/api/returns', { params }),
  getById: (id: number) => api.get<ApiResponse<{ return: Return }>>(`/api/returns/${id}`),
  create: (data: CreateReturnRequest) =>
    api.post<ApiResponse<{ return: Return }>>('/api/returns', data),
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
  getAll: () => api.get<ApiResponse<{ categories: Category[] }>>('/api/categories'),
  getById: (id: number) => api.get<ApiResponse<{ category: Category }>>(`/api/categories/${id}`),
  create: (data: CreateCategoryRequest) =>
    api.post<ApiResponse<{ category: Category }>>('/api/categories', data),
  update: (id: number, data: UpdateCategoryRequest) =>
    api.put<ApiResponse<{ category: Category }>>(`/api/categories/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/api/categories/${id}`),
};

// Suppliers API
export const suppliersApi = {
  getAll: () => api.get<ApiResponse<{ suppliers: Supplier[] }>>('/api/suppliers'),
  getById: (id: number) => api.get<ApiResponse<{ supplier: Supplier }>>(`/api/suppliers/${id}`),
  create: (data: CreateSupplierRequest) =>
    api.post<ApiResponse<{ supplier: Supplier }>>('/api/suppliers', data),
  update: (id: number, data: UpdateSupplierRequest) =>
    api.put<ApiResponse<{ supplier: Supplier }>>(`/api/suppliers/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/api/suppliers/${id}`),
};

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
  getInventoryReport: (params?: { categoryId?: number; supplierId?: number; lowStock?: boolean }) =>
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
  exportProducts: (params?: { categoryId?: number; supplierId?: number }) =>
    api.get('/api/reports/products/export', { params, responseType: 'blob' }),
  exportInventory: (params?: { categoryId?: number; supplierId?: number; lowStock?: boolean }) =>
    api.get('/api/reports/inventory/export', { params, responseType: 'blob' }),
};

export default {
  auth: authApi,
  employees: employeesApi,
  products: productsApi,
  customers: customersApi,
  orders: ordersApi,
  returns: returnsApi,
  agents: agentsApi,
  visitPlans: visitPlansApi,
  workTasks: workTasksApi,
  salesTargets: salesTargetsApi,
  categories: categoriesApi,
  suppliers: suppliersApi,
  deliveryPlans: deliveryPlansApi,
  reports: reportsApi,
  analytics: analyticsApi,
};
