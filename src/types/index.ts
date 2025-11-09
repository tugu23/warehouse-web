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
  nameKorean?: string;
  nameEnglish: string;
  productCode: string;
  barcode?: string;
  category?: string;
  supplierId: number;
  supplier?: Supplier;
  stockQuantity: number;
  unitsPerBox?: number; // Нэг хайрцагт байх тоо ширхэг
  netWeight?: number; // Цэвэр жин (kg)
  grossWeight?: number; // Бохир жин (kg)
  priceWholesale: string | number;
  priceRetail: string | number;
  pricePerBox?: number; // Хайрцагны үнэ
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductRequest {
  nameMongolian: string;
  nameKorean?: string;
  nameEnglish: string;
  productCode: string;
  barcode?: string;
  category?: string;
  supplierId: number;
  stockQuantity: number;
  unitsPerBox?: number;
  netWeight?: number;
  grossWeight?: number;
  priceWholesale: number;
  priceRetail: number;
  pricePerBox?: number;
}

export interface UpdateProductRequest {
  nameMongolian?: string;
  nameKorean?: string;
  nameEnglish?: string;
  productCode?: string;
  barcode?: string;
  category?: string;
  supplierId?: number;
  stockQuantity?: number;
  unitsPerBox?: number;
  netWeight?: number;
  grossWeight?: number;
  priceWholesale?: number;
  priceRetail?: number;
  pricePerBox?: number;
}

export interface InventoryAdjustmentRequest {
  productId: number;
  adjustment: number;
  reason: string;
}

// Product Batch Types
export interface ProductBatch {
  id: number;
  productId: number;
  product?: Product;
  batchNumber: string;
  quantity: number;
  receivedDate: string;
  expiryDate: string;
  supplierId: number;
  supplier?: Supplier;
  priceWholesale: number;
  priceRetail: number;
  createdAt?: string;
}

export interface CreateProductBatchRequest {
  productId: number;
  batchNumber: string;
  quantity: number;
  receivedDate: string;
  expiryDate: string;
  supplierId: number;
  priceWholesale: number;
  priceRetail: number;
}

export interface UpdateProductBatchRequest {
  batchNumber?: string;
  quantity?: number;
  receivedDate?: string;
  expiryDate?: string;
  supplierId?: number;
  priceWholesale?: number;
  priceRetail?: number;
}

export interface MonthlyInventory {
  id: number;
  productId: number;
  product?: Product;
  month: string; // 'YYYY-MM'
  openingStock: number;
  closingStock: number;
  received: number;
  sold: number;
  returned: number;
  adjusted: number;
}

// Supplier Types
export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  createdAt?: string;
}

export interface CreateSupplierRequest {
  name: string;
  contactPerson?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
}

export interface UpdateSupplierRequest {
  name?: string;
  contactPerson?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
}

// Category Types
export interface Category {
  id: number;
  nameMongolian: string;
  nameEnglish?: string;
  description?: string;
  createdAt?: string;
}

export interface CreateCategoryRequest {
  nameMongolian: string;
  nameEnglish?: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  nameMongolian?: string;
  nameEnglish?: string;
  description?: string;
}

// Customer Types
export interface Customer {
  id: number;
  name: string; // Байгууллагын нэр
  organizationType?: string; // Дэлгүүр, Сүлжээ, Ресторан
  contactPerson?: string; // Үндсэн нэр (хариуцсан хүний нэр)
  registrationNumber?: string; // Регистрийн дугаар
  address: string;
  district?: string; // Дүүрэг
  phoneNumber: string;
  isVatPayer?: boolean; // НӨАТ төлөгч эсэх
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
  organizationType?: string;
  contactPerson?: string;
  registrationNumber?: string;
  address: string;
  district?: string;
  phoneNumber: string;
  isVatPayer?: boolean;
  locationLatitude: number;
  locationLongitude: number;
  customerTypeId: number;
  assignedAgentId?: number;
}

export interface UpdateCustomerRequest {
  name?: string;
  organizationType?: string;
  contactPerson?: string;
  registrationNumber?: string;
  address?: string;
  district?: string;
  phoneNumber?: string;
  isVatPayer?: boolean;
  locationLatitude?: number;
  locationLongitude?: number;
  customerTypeId?: number;
  assignedAgentId?: number;
}

// Payment Types
export type PaymentMethod = 'Cash' | 'Credit' | 'BankTransfer' | 'Sales' | 'Padan';
export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid' | 'Overdue';

export interface PaymentRecord {
  id: number;
  orderId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdById: number;
  createdBy?: User;
}

// Order Types
export interface Order {
  id: number;
  customerId: number;
  customer?: Customer;
  distributorId?: number; // Түгээгч
  distributor?: User;
  totalAmount: string | number;
  status: 'Pending' | 'Fulfilled' | 'Cancelled';
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  remainingAmount: number;
  creditDueDate?: string;
  creditTermDays?: number;
  paymentRecords?: PaymentRecord[];
  createdById: number;
  createdBy?: User; // Борлуулагч
  orderItems?: OrderItem[];
  createdAt: string;
  updatedAt?: string;
  // И-баримтын мэдээлэл
  eReceiptId?: string; // PosAPI-аас ирсэн И-баримтын ID
  eReceiptNumber?: string; // И-баримтын дугаар
  eReceiptStatus?: 'pending' | 'printed' | 'failed'; // И-баримтын төлөв
  eReceiptUrl?: string; // И-баримт татах линк
  eReceiptPrintedAt?: string; // Хэвлэсэн огноо
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
  distributorId?: number;
  paymentMethod: PaymentMethod;
  paidAmount?: number;
  creditTermDays?: number;
  items: {
    productId: number;
    quantity: number;
  }[];
}

export interface RecordPaymentRequest {
  orderId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
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

// Work Plan Types
// Agent Visit Plans
export interface VisitPlan {
  id: number;
  agentId: number;
  agent?: User;
  customerId: number;
  customer?: Customer;
  plannedDate: string;
  plannedTime: string;
  status: 'Planned' | 'Completed' | 'Cancelled' | 'Rescheduled';
  notes?: string;
  actualVisitTime?: string;
  orderId?: number;
  createdAt?: string;
}

export interface CreateVisitPlanRequest {
  agentId: number;
  customerId: number;
  plannedDate: string;
  plannedTime: string;
  notes?: string;
}

export interface UpdateVisitPlanRequest {
  agentId?: number;
  customerId?: number;
  plannedDate?: string;
  plannedTime?: string;
  status?: 'Planned' | 'Completed' | 'Cancelled' | 'Rescheduled';
  notes?: string;
  actualVisitTime?: string;
  orderId?: number;
}

// General Work Tasks
export interface WorkTask {
  id: number;
  title: string;
  description: string;
  assignedToId: number;
  assignedTo?: User;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Todo' | 'InProgress' | 'Completed' | 'Cancelled';
  dueDate: string;
  createdById: number;
  createdBy?: User;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWorkTaskRequest {
  title: string;
  description: string;
  assignedToId: number;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  dueDate: string;
}

export interface UpdateWorkTaskRequest {
  title?: string;
  description?: string;
  assignedToId?: number;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  status?: 'Todo' | 'InProgress' | 'Completed' | 'Cancelled';
  dueDate?: string;
}

// Sales Targets
export interface SalesTarget {
  id: number;
  agentId: number;
  agent?: User;
  targetPeriod: string; // 'YYYY-MM' or 'YYYY-Q1'
  targetAmount: number;
  achievedAmount: number;
  targetOrders: number;
  achievedOrders: number;
  status: 'Active' | 'Completed' | 'Failed';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSalesTargetRequest {
  agentId: number;
  targetPeriod: string;
  targetAmount: number;
  targetOrders: number;
}

export interface UpdateSalesTargetRequest {
  targetAmount?: number;
  targetOrders?: number;
  achievedAmount?: number;
  achievedOrders?: number;
  status?: 'Active' | 'Completed' | 'Failed';
}

// Delivery Plans (per specification)
export interface DeliveryPlan {
  id: number;
  planDate: string;
  agentId: number;
  agent?: User;
  customerId: number;
  customer?: Customer;
  orderId?: number;
  order?: Order;
  scheduledTime?: string;
  status: 'Planned' | 'InProgress' | 'Completed' | 'Cancelled';
  description?: string;
  targetArea?: string;
  estimatedOrders?: number;
  deliveryNotes?: string;
  actualDeliveryTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDeliveryPlanRequest {
  planDate: string;
  agentId: number;
  customerId: number;
  orderId?: number;
  scheduledTime?: string;
  description?: string;
  targetArea?: string;
  estimatedOrders?: number;
  deliveryNotes?: string;
}

export interface UpdateDeliveryPlanRequest {
  planDate?: string;
  agentId?: number;
  customerId?: number;
  orderId?: number;
  scheduledTime?: string;
  status?: 'Planned' | 'InProgress' | 'Completed' | 'Cancelled';
  description?: string;
  targetArea?: string;
  estimatedOrders?: number;
  deliveryNotes?: string;
  actualDeliveryTime?: string;
}

// Report Types
export interface SalesReportData {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalOrders: number;
    totalRevenue: number;
    totalPaid: number;
    totalUnpaid: number;
    byPaymentMethod: Record<string, number>;
    byPaymentStatus: Record<string, number>;
  };
  orders: Order[];
}

export interface CreditStatusReport {
  overduePayments: Array<{
    order: Order;
    customer: Customer;
    daysOverdue: number;
    overdueAmount: number;
  }>;
  creditCustomers: Array<{
    customer: Customer;
    totalCredit: number;
    paidAmount: number;
    remainingAmount: number;
    orders: Order[];
  }>;
  summary: {
    totalOverdueAmount: number;
    totalCreditCustomers: number;
    totalOverdueOrders: number;
  };
}

export interface InventoryReportData {
  lowStockProducts: Product[];
  byCategory: Array<{
    category: string;
    products: Product[];
    totalStock: number;
    totalValue: number;
  }>;
  bySupplier: Array<{
    supplier: Supplier;
    products: Product[];
    totalStock: number;
    totalValue: number;
  }>;
  summary: {
    totalProducts: number;
    totalStockValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
}

export interface DeliveryScheduleReport {
  deliveryPlans: DeliveryPlan[];
  summary: {
    planned: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    totalOrders: number;
  };
}
