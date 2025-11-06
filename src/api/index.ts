import api from '../lib/axios';
import {
  AuthResponse,
  LoginRequest,
  User,
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
  ApiResponse,
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
  getAll: (params?: { search?: string; supplierId?: number }) =>
    api.get<ApiResponse<{ products: Product[] }>>('/api/products', { params }),
  getById: (id: number) => api.get<ApiResponse<{ product: Product }>>(`/api/products/${id}`),
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
};
