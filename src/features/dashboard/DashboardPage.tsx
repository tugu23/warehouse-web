import { useEffect, useState, useCallback } from 'react';
import { Box, Grid, Card, CardContent, Typography } from '@mui/material';
import {
  People as PeopleIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { productsApi, customersApi, ordersApi, employeesApi } from '../../api';
import { Product, Order } from '../../types';
import { CardSkeleton } from '../../components/LoadingSkeletons';
import DataTable from '../../components/DataTable';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: `${color}.light`,
              color: `${color}.main`,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user, isAdmin, canManage } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    employees: 0,
    products: 0,
    customers: 0,
    orders: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  // Compute isAdmin result to avoid function reference in dependencies
  const userIsAdmin = isAdmin();

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, customersRes, ordersRes] = await Promise.all([
        productsApi.getAll(),
        customersApi.getAll(),
        ordersApi.getAll(),
      ]);

      let employeesCount = 0;
      if (userIsAdmin) {
        const employeesRes = await employeesApi.getAll();
        employeesCount = employeesRes.data.data?.employees?.length || 0;
      }

      const products = productsRes.data.data?.products || [];
      const customers = customersRes.data.data?.customers || [];
      const orders = ordersRes.data.data?.orders || [];

      // Use pagination total if available, otherwise fallback to array length
      const productsTotal = productsRes.data.data?.pagination?.total || products.length;
      const customersTotal = customersRes.data.data?.pagination?.total || customers.length;
      const ordersTotal = ordersRes.data.data?.pagination?.total || orders.length;

      setStats({
        employees: employeesCount,
        products: productsTotal,
        customers: customersTotal,
        orders: ordersTotal,
      });

      // Get low stock products (stock < 20)
      const lowStock = products.filter((p: Product) => p.stockQuantity < 20);
      setLowStockProducts(lowStock);

      // Get recent orders (last 5)
      const sorted = [...orders].sort(
        (a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRecentOrders(sorted.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [userIsAdmin]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.name}!
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {[...Array(4)].map((_, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <CardSkeleton />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Welcome back, {user?.name}!
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Таны агуулахын өнөөдрийн үйл ажиллагаа
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {userIsAdmin && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Employees"
              value={stats.employees}
              icon={<PeopleIcon />}
              color="primary"
            />
          </Grid>
        )}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Products"
            value={stats.products}
            icon={<InventoryIcon />}
            color="secondary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Customers"
            value={stats.customers}
            icon={<PeopleIcon />}
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Orders"
            value={stats.orders}
            icon={<ShoppingCartIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {canManage() && lowStockProducts.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <DataTable
            title="⚠️ Low Stock Alert"
            columns={[
              {
                id: 'productCode',
                label: 'Product Code',
                minWidth: 120,
              },
              {
                id: 'nameEnglish',
                label: 'Product Name',
                minWidth: 150,
              },
              {
                id: 'stockQuantity',
                label: 'Stock',
                align: 'center',
                format: (row: Record<string, unknown>) => (
                  <Typography
                    color={
                      (row as unknown as Product).stockQuantity < 10 ? 'error' : 'warning.main'
                    }
                    fontWeight="bold"
                  >
                    {(row as unknown as Product).stockQuantity}
                  </Typography>
                ),
              },
              {
                id: 'priceRetail',
                label: 'Retail Price',
                align: 'right',
                format: (row: Record<string, unknown>) =>
                  `₮${Number((row as unknown as Product).priceRetail).toLocaleString()}`,
              },
            ]}
            data={lowStockProducts.map((p) => ({
              productCode: p.productCode,
              nameEnglish: p.nameEnglish,
              stockQuantity: p.stockQuantity,
              priceRetail: p.priceRetail,
            }))}
          />
        </Box>
      )}

      <Box sx={{ mt: 4 }}>
        <DataTable
          title="Recent Orders"
          columns={[
            {
              id: 'id',
              label: 'Order ID',
              minWidth: 80,
              format: (row: Record<string, unknown>) => `#${(row as unknown as Order).id}`,
            },
            {
              id: 'customer',
              label: 'Customer',
              minWidth: 150,
              format: (row: Record<string, unknown>) =>
                (row as unknown as Order).customer?.name || 'N/A',
            },
            {
              id: 'totalAmount',
              label: 'Total Amount',
              align: 'right',
              format: (row: Record<string, unknown>) =>
                `₮${Number((row as unknown as Order).totalAmount).toLocaleString()}`,
            },
            {
              id: 'status',
              label: 'Status',
              align: 'center',
              format: (row: Record<string, unknown>) => {
                const colors: Record<string, string> = {
                  Pending: 'warning.main',
                  Fulfilled: 'success.main',
                  Cancelled: 'error.main',
                };
                return (
                  <Typography color={colors[(row as unknown as Order).status]} fontWeight="600">
                    {(row as unknown as Order).status}
                  </Typography>
                );
              },
            },
            {
              id: 'createdAt',
              label: 'Date',
              minWidth: 150,
              format: (row: Record<string, unknown>) =>
                new Date((row as unknown as Order).createdAt).toLocaleString(),
            },
          ]}
          data={recentOrders.map((o) => ({
            id: o.id,
            customer: o.customer?.name,
            totalAmount: o.totalAmount,
            status: o.status,
            createdAt: o.createdAt,
          }))}
        />
      </Box>
    </Box>
  );
}
