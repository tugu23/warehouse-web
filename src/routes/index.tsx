import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import ProtectedRoute from '../features/auth/ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';

// Lazy load pages
const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'));
const ProductsPage = lazy(() => import('../features/products/ProductsPage'));
const CustomersPage = lazy(() => import('../features/customers/CustomersPage'));
const OrdersPage = lazy(() => import('../features/orders/OrdersPage'));
const ReturnsPage = lazy(() => import('../features/returns/ReturnsPage'));
const EmployeesPage = lazy(() => import('../features/employees/EmployeesPage'));
const AgentsPage = lazy(() => import('../features/agents/AgentsPage'));
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
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/orders" element={<OrdersPage />} />

              {/* Manager and Admin only */}
              <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager']} />}>
                <Route path="/returns" element={<ReturnsPage />} />
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
