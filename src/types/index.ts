// User & Authentication Types
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'SalesAgent' | 'MarketSalesperson' | 'StoreSalesperson';
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
    name: 'Admin' | 'Manager' | 'SalesAgent' | 'MarketSalesperson' | 'StoreSalesperson';
  };
  isActive: boolean;
  createdAt: string;
}

export interface CreateEmployeeRequest {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  roleName: 'Admin' | 'Manager' | 'SalesAgent' | 'MarketSalesperson' | 'StoreSalesperson';
}

export interface UpdateEmployeeRequest {
  name?: string;
  phoneNumber?: string;
  roleName?: 'Admin' | 'Manager' | 'SalesAgent' | 'MarketSalesperson' | 'StoreSalesperson';
  isActive?: boolean;
}

// Product Types
export interface Product {
  id: number;
  nameMongolian: string;
  productCode: string;
  barcode?: string;
  classificationCode?: string; // БҮНА код
  categoryId?: number;
  category?: Category;
  stockQuantity: number;
  unitsPerBox?: number; // Нэг хайрцагт байх тоо ширхэг
  netWeight?: number; // Цэвэр жин (kg)
  grossWeight?: number; // Бохир жин (kg)
  /** Төрлийн тусгай үнэ байхгүй үед */
  defaultPrice: string | number;
  pricePerBox?: number; // Хайрцагны үнэ
  isActive?: boolean; // Идэвхтэй эсэх
  prices?: ProductPrice[]; // Үнийн жагсаалт
  promotions?: Promotion[]; // Идэвхтэй урамшууллын жагсаалт
  createdAt?: string;
  updatedAt?: string;
}

// Promotion Types
export type PromotionType = 'PERCENT_DISCOUNT' | 'BUY_X_GET_Y';

export interface Promotion {
  id: number;
  productId: number;
  name: string;
  type: PromotionType;
  /** PERCENT_DISCOUNT үед 0-100 хооронд */
  discountPercent: number | null;
  /** BUY_X_GET_Y үед: хэдэн ширхэг авбал */
  buyQty: number | null;
  /** BUY_X_GET_Y үед: хэдэн ширхэг үнэгүй авах */
  freeQty: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePromotionRequest {
  name: string;
  type: PromotionType;
  discountPercent?: number | null;
  buyQty?: number | null;
  freeQty?: number | null;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface UpdatePromotionRequest {
  name?: string;
  type?: PromotionType;
  discountPercent?: number | null;
  buyQty?: number | null;
  freeQty?: number | null;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface CreateProductRequest {
  nameMongolian: string;
  productCode: string;
  barcode?: string;
  classificationCode?: string;
  categoryId?: number;
  stockQuantity: number;
  unitsPerBox?: number;
  netWeight?: number;
  grossWeight?: number;
  defaultPrice: number;
  pricePerBox?: number;
  isActive?: boolean;
}

export interface UpdateProductRequest {
  nameMongolian?: string;
  productCode?: string;
  barcode?: string;
  classificationCode?: string;
  categoryId?: number;
  stockQuantity?: number;
  unitsPerBox?: number;
  netWeight?: number;
  grossWeight?: number;
  defaultPrice?: number;
  pricePerBox?: number;
  isActive?: boolean;
}

export interface InventoryAdjustmentRequest {
  productId: number;
  adjustment: number;
  reason: string;
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

// Category Types
export interface Category {
  id: number;
  nameMongolian: string;
  description?: string;
  classificationCode?: string;
  createdAt?: string;
}

export interface CreateCategoryRequest {
  nameMongolian: string;
  description?: string;
  classificationCode?: string;
}

export interface UpdateCategoryRequest {
  nameMongolian?: string;
  description?: string;
  classificationCode?: string;
}

// Customer Types
export interface Customer {
  id: number;
  name: string; // Байгууллагын нэр
  name2?: string; // Хоёр дахь нэр (нэмэлт нэр)
  organizationName?: string;
  organizationType?: string; // Дэлгүүр, Сүлжээ, Ресторан
  registrationNumber?: string; // Регистрийн дугаар ⭐
  ebarimtConsumerNo?: string; // E-Barimt апп бүртгэлийн дугаар (8 орон)
  address: string;
  district?: string; // Дүүрэг
  phoneNumber: string;
  email?: string; // Имэйл хаяг
  contactPerson?: string; // Холбоо барих хүн
  isVatPayer?: boolean; // НӨАТ төлөгч эсэх
  locationLatitude: number;
  locationLongitude: number;
  customerType?: CustomerType | null;
  /** Prisma scalar — nested `customerType` дутуу үед ч ирнэ */
  customerTypeId?: number | null;
  assignedAgent?: User;
  creditLimit?: number; // Зээлийн лимит
  createdAt?: string;
}

export interface CustomerType {
  id: number;
  typeName: string;
  /** @deprecated Prisma зөвхөн typeName буцаана */
  name?: string;
}

export interface CreateCustomerRequest {
  name: string;
  name2?: string;
  organizationType?: string;
  registrationNumber?: string;
  ebarimtConsumerNo?: string;
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
  name2?: string;
  organizationType?: string;
  registrationNumber?: string;
  ebarimtConsumerNo?: string;
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
export type OrderType = 'Market' | 'Store';

export interface Order {
  id: number;
  customerId: number;
  customer?: Customer;
  distributorId?: number; // Түгээгч
  distributor?: User;
  orderType?: OrderType; // Захын лангуу эсвэл дэлгүүр
  totalAmount: string | number;
  /** НӨАТ-аас өмнөх нийт (backend-ийн subtotalAmount) */
  subtotalAmount?: string | number;
  vatAmount?: number; // НӨАТ дүн (зөвхөн дэлгүүрийн захиалгад)
  status: 'Pending' | 'Fulfilled' | 'Cancelled';
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  remainingAmount: number;
  creditDueDate?: string;
  creditTermDays?: number;
  deliveryDate?: string; // Хүргэх огноо (захын лангуу захиалгад)
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
  ebarimtBillId?: string;
  ebarimtId?: string;
  ebarimtRegistered?: boolean;
  ebarimtDate?: string;
  ebarimtReturnId?: string;
  /** Backend: orders.ebarimt_receipt_type (B2B | B2C) */
  ebarimtReceiptType?: 'B2B' | 'B2C';
  ebarimtType?: string;
  orderDate?: string;
  agentId?: number;
  agent?: { name: string; phoneNumber?: string };
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
  customerId?: number;
  distributorId?: number;
  orderType?: OrderType;
  paymentMethod: PaymentMethod;
  paidAmount?: number;
  creditTermDays?: number;
  deliveryDate?: string;
  items: {
    productId: number;
    quantity: number;
    priceMode?: 'auto' | 'wholesale' | 'retail' | 'defaultPrice' | 'custom' | 'customerType';
    customUnitPrice?: number;
    unitPrice?: number;
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
  customerId?: number; // Optional: Which customer returned the product
  customer?: Customer;
  unitPrice?: number; // Optional: Unit price at time of return
  notes?: string; // Optional: Additional notes
  createdById: number;
  createdBy?: User;
  createdAt: string;
}

export interface CreateReturnRequest {
  orderId: number;
  productId: number;
  quantity: number;
  reason: string;
  customerId?: number; // Optional
  unitPrice?: number; // Optional
  notes?: string; // Optional
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

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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

// Product Sales Analytics Types
export interface ProductSalesAnalytics {
  productId: number;
  product?: Product;
  currentStock: number;
  salesAverage1Month: number;
  salesAverage3Month: number;
  salesAverage6Month: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  stockStatus: 'ok' | 'low' | 'critical' | 'out';
  monthlySales?: MonthlySalesData[];
  recommendedOrderQuantity?: number;
}

export interface MonthlySalesData {
  month: string; // 'YYYY-MM'
  sales: number;
  isOutlier?: boolean; // Дундаж тооцоололд хамаарахгүй эсэх
  outlierReason?: string;
}

// Inventory Forecast Types
export interface InventoryForecast {
  id: number;
  productId: number;
  product?: Product;
  month: number;
  year: number;
  predictedDemand: number;
  recommendedOrderQuantity: number;
  confidence?: number;
  baselineStock?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CalculateAnalyticsRequest {
  productId: number;
  month?: number;
  year?: number;
}

export interface CalculateAllAnalyticsRequest {
  month?: number;
  year?: number;
}

export interface GenerateForecastRequest {
  productId: number;
  month?: number;
  year?: number;
}

export interface GenerateAllForecastsRequest {
  month?: number;
  year?: number;
}

// Sales by Period Types
export type SalesPeriod = 'week' | 'month' | 'year';

export interface SalesByPeriodParams {
  startDate: string;
  endDate: string;
  period: SalesPeriod;
}

export interface SalesByPeriodData {
  period: string; // Date string based on period (e.g., '2025-11', 'Week 45', '2025')
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  periodStart: string;
  periodEnd: string;
}

export interface SalesByPeriodResponse {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  period: SalesPeriod;
  data: SalesByPeriodData[];
  summary: {
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
  };
}

// Grouped Sales Report Types
export type SalesGroupBy = 'month' | 'week' | 'year';

export interface SalesReportGrouped {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  groupBy: SalesGroupBy;
  groups: SalesGroupData[];
  summary: {
    totalOrders: number;
    totalRevenue: number;
    totalPaid: number;
    totalUnpaid: number;
    byOrderType?: {
      market: number;
      store: number;
    };
  };
}

export interface SalesGroupData {
  period: string; // e.g., '2024-01', '2024-W01', '2024'
  periodLabel: string; // Human-readable label
  orders: Order[];
  totalOrders: number;
  totalRevenue: number;
  ordersByType?: {
    market: number;
    store: number;
  };
}

// Employee Location Filtering Types
export interface EmployeeLocationFiltered {
  employee: Employee;
  storeVisits: StoreVisit[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalVisits: number;
    uniqueStores: number;
    totalDuration: number; // minutes
  };
}

export interface StoreVisit {
  location: AgentLocation;
  customer?: Customer;
  storeName: string;
  storeAddress: string;
  arrivalTime: string;
  departureTime?: string;
  duration?: number; // minutes
  orderId?: number;
}

// Product Price Types
export interface ProductPrice {
  id: number;
  productId: number;
  product?: Product;
  customerTypeId: number;
  customerType: {
    id: number;
    typeName: string;
  };
  price: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductPriceRequest {
  productId: number;
  customerTypeId: number;
  price: number;
}

export interface UpdateProductPriceRequest {
  price?: number;
  customerTypeId?: number;
}

// Agent KPI
export type AgentKpiGranularity = 'day' | 'month' | 'year';

export interface AgentKpiSummaryRow {
  bucket: string;
  bucketDate: string;
  actualAmount: number;
  actualBoxes: number;
  actualUnits: number;
  targetAmount: number | null;
  targetBoxQty: number | null;
  achievementPercent: number | null;
  runningAvgPercent: number | null;
}

export interface AgentKpiSummaryData {
  timezone: string;
  granularity: AgentKpiGranularity;
  agentId: number;
  from: string;
  to: string;
  rows: AgentKpiSummaryRow[];
  totals: {
    sumActualAmount: number;
    sumTargetAmount: number;
    sumActualBoxes: number;
    sumTargetBoxQty: number | null;
    overallAchievementPercent: number | null;
  };
}

export interface AgentKpiProductRow {
  productId: number;
  productName: string;
  categoryName: string | null;
  units: number;
  boxes: number;
  amount: number;
}

export interface AgentKpiMultiAgentRow {
  agentId: number;
  agentName: string;
  amount: number;
  boxes: number;
  units: number;
}

export interface AgentKpiTarget {
  id: number;
  employeeId: number;
  periodType: 'DAY' | 'MONTH' | 'YEAR';
  periodStart: string;
  targetAmount: string;
  targetBoxQty: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentKpiTargetRequest {
  employeeId: number;
  periodType: 'DAY' | 'MONTH' | 'YEAR';
  periodStart: string;
  targetAmount: string | number;
  targetBoxQty?: string | number | null;
}

export interface UpdateAgentKpiTargetRequest {
  targetAmount?: string | number;
  targetBoxQty?: string | number | null;
}

// Sales KPI Types
export interface SalesTransaction {
  orderId: number;
  orderNumber: string | null;
  orderDate: string;
  agentId: number;
  agentName: string;
  customerId: number;
  customerName: string;
  productId: number;
  productName: string;
  categoryName: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  bucket: string;
}

export interface SalesKpiData {
  transactions: SalesTransaction[];
  totals: {
    totalQuantity: number;
    totalAmount: number;
    orderCount: number;
  };
  periodTotals: Array<{
    bucket: string;
    totalQuantity: number;
    totalAmount: number;
    orderCount: number;
  }>;
}
