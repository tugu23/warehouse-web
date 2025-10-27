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
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  Order,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  Return,
  CreateReturnRequest,
  RecordLocationRequest,
  AgentRoute,
  AllAgentLocations,
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
  getAll: (params?: { status?: string; customerId?: number }) =>
    api.get<ApiResponse<{ orders: Order[] }>>('/api/orders', { params }),
  getById: (id: number) => api.get<ApiResponse<{ order: Order }>>(`/api/orders/${id}`),
  create: (data: CreateOrderRequest) =>
    api.post<ApiResponse<{ order: Order }>>('/api/orders', data),
  updateStatus: (id: number, data: UpdateOrderStatusRequest) =>
    api.put<ApiResponse<{ order: Order }>>(`/api/orders/${id}/status`, data),
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

export default {
  auth: authApi,
  employees: employeesApi,
  products: productsApi,
  customers: customersApi,
  orders: ordersApi,
  returns: returnsApi,
  agents: agentsApi,
};
