import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import ProtectedRoute from '../features/auth/ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';

// Lazy load pages
const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'));
const ProductsPage = lazy(() => import('../features/products/ProductsPage'));
const ProductBatchesPage = lazy(() => import('../features/products/ProductBatchesPage'));
const MonthlyInventoryPage = lazy(() => import('../features/products/MonthlyInventoryPage'));
const CustomersPage = lazy(() => import('../features/customers/CustomersPage'));
const OrdersPage = lazy(() => import('../features/orders/OrdersPage'));
const EmployeesPage = lazy(() => import('../features/employees/EmployeesPage'));
const AgentsPage = lazy(() => import('../features/agents/AgentsPage'));
const VisitPlansPage = lazy(() => import('../features/workplan/VisitPlansPage'));
const WorkTasksPage = lazy(() => import('../features/workplan/WorkTasksPage'));
const SalesTargetsPage = lazy(() => import('../features/workplan/SalesTargetsPage'));
const PosIntegrationPage = lazy(() => import('../features/pos/PosIntegrationPage'));
const EBarimtPage = lazy(() => import('../features/pos/EBarimtPage'));
const SalesReportPage = lazy(() => import('../features/reports/SalesReportPage'));
const AgentKpiPage = lazy(() => import('../features/reports/AgentKpiPage'));
const CreditStatusReportPage = lazy(() => import('../features/reports/CreditStatusReportPage'));
const CategoriesPage = lazy(() => import('../features/categories/CategoriesPage'));
const DeliveryPlansPage = lazy(() => import('../features/delivery/DeliveryPlansPage'));
const ForbiddenPage = lazy(() => import('../features/auth/ForbiddenPage'));
const NotFoundPage = lazy(() => import('../features/auth/NotFoundPage'));

const LoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
    }}
  >
    <CircularProgress />
  </Box>
);

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Products & Inventory */}
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/batches" element={<ProductBatchesPage />} />
              <Route path="/products/inventory/monthly" element={<MonthlyInventoryPage />} />

              {/* Categories */}
              <Route path="/categories" element={<CategoriesPage />} />

              {/* Customers & Orders */}
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/orders" element={<OrdersPage />} />

              {/* Work Plans */}
              <Route path="/work-plans/visits" element={<VisitPlansPage />} />
              <Route path="/work-plans/tasks" element={<WorkTasksPage />} />
              <Route path="/work-plans/targets" element={<SalesTargetsPage />} />

              {/* Delivery Plans */}
              <Route path="/delivery-plans" element={<DeliveryPlansPage />} />

              {/* Reports */}
              <Route path="/reports/sales" element={<SalesReportPage />} />
              <Route path="/reports/credit-status" element={<CreditStatusReportPage />} />
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      'Admin',
                      'Manager',
                      'SalesAgent',
                      'MarketSalesperson',
                      'StoreSalesperson',
                    ]}
                  />
                }
              >
                <Route path="/reports/agent-kpi" element={<AgentKpiPage />} />
              </Route>

              {/* PosAPI Integration */}
              <Route path="/pos-integration" element={<PosIntegrationPage />} />

              {/* E-Barimt - Admin/Manager only */}
              <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager']} />}>
                <Route path="/ebarimt" element={<EBarimtPage />} />
              </Route>

              {/* Manager and Admin only */}
              <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager']} />}>
                <Route path="/agents" element={<AgentsPage />} />
              </Route>

              {/* Admin only */}
              <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                <Route path="/employees" element={<EmployeesPage />} />
              </Route>
            </Route>
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
