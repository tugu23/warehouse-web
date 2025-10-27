// User & Authentication Types
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'SalesAgent';
  phoneNumber?: string;
  isActive?: boolean;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface AuthResponse {
  status: string;
  data: {
    token: string;
    user: User;
  };
}

// Employee Types
export interface Employee {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  role: {
    id: number;
    name: 'Admin' | 'Manager' | 'SalesAgent';
  };
  isActive: boolean;
  createdAt: string;
}

export interface CreateEmployeeRequest {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  roleName: 'Admin' | 'Manager' | 'SalesAgent';
}

export interface UpdateEmployeeRequest {
  name?: string;
  phoneNumber?: string;
  roleName?: 'Admin' | 'Manager' | 'SalesAgent';
  isActive?: boolean;
}

// Product Types
export interface Product {
  id: number;
  nameMongolian: string;
  nameEnglish: string;
  productCode: string;
  supplierId: number;
  supplier?: Supplier;
  stockQuantity: number;
  priceWholesale: string | number;
  priceRetail: string | number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductRequest {
  nameMongolian: string;
  nameEnglish: string;
  productCode: string;
  supplierId: number;
  stockQuantity: number;
  priceWholesale: number;
  priceRetail: number;
}

export interface UpdateProductRequest {
  nameMongolian?: string;
  nameEnglish?: string;
  productCode?: string;
  supplierId?: number;
  stockQuantity?: number;
  priceWholesale?: number;
  priceRetail?: number;
}

export interface InventoryAdjustmentRequest {
  productId: number;
  adjustment: number;
  reason: string;
}

// Supplier Types
export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  phoneNumber?: string;
}

// Customer Types
export interface Customer {
  id: number;
  name: string;
  address: string;
  phoneNumber: string;
  locationLatitude: number;
  locationLongitude: number;
  customerType: CustomerType;
  assignedAgent?: User;
  createdAt?: string;
}

export interface CustomerType {
  id: number;
  name: 'Retail' | 'Wholesale';
}

export interface CreateCustomerRequest {
  name: string;
  address: string;
  phoneNumber: string;
  locationLatitude: number;
  locationLongitude: number;
  customerTypeId: number;
  assignedAgentId?: number;
}

export interface UpdateCustomerRequest {
  name?: string;
  address?: string;
  phoneNumber?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  customerTypeId?: number;
  assignedAgentId?: number;
}

// Order Types
export interface Order {
  id: number;
  customerId: number;
  customer?: Customer;
  totalAmount: string | number;
  status: 'Pending' | 'Fulfilled' | 'Cancelled';
  createdById: number;
  createdBy?: User;
  orderItems?: OrderItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  product?: Product;
  quantity: number;
  unitPrice: string | number;
  subtotal: string | number;
}

export interface CreateOrderRequest {
  customerId: number;
  items: {
    productId: number;
    quantity: number;
  }[];
}

export interface UpdateOrderStatusRequest {
  status: 'Pending' | 'Fulfilled' | 'Cancelled';
}

// Return Types
export interface Return {
  id: number;
  orderId: number;
  order?: Order;
  productId: number;
  product?: Product;
  quantity: number;
  reason: string;
  createdById: number;
  createdBy?: User;
  createdAt: string;
}

export interface CreateReturnRequest {
  orderId: number;
  productId: number;
  quantity: number;
  reason: string;
}

// Agent Location Types
export interface AgentLocation {
  id?: number;
  agentId: number;
  agent?: User;
  latitude: number;
  longitude: number;
  recordedAt: string;
}

export interface RecordLocationRequest {
  latitude: number;
  longitude: number;
}

export interface AgentRoute {
  agent: User;
  route: AgentLocation[];
  totalPoints: number;
}

export interface AllAgentLocations {
  agents: {
    agent: User;
    lastLocation: AgentLocation | null;
  }[];
  totalLocations: number;
}

// API Response Types
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

export interface ApiError {
  status: 'error';
  message: string;
  errors?: Record<string, string[]>;
}

// Pagination Types
export interface PaginatedResponse<T> {
  status: 'success';
  data: {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// Dashboard Types
export interface DashboardStats {
  totalEmployees?: number;
  totalProducts?: number;
  totalCustomers?: number;
  totalOrders?: number;
  totalRevenue?: number;
  lowStockProducts?: Product[];
  recentOrders?: Order[];
  agentPerformance?: AgentPerformance[];
}

export interface AgentPerformance {
  agent: User;
  ordersCount: number;
  totalRevenue: number;
}
