import { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Paper } from '@mui/material';
import {
  People as PeopleIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { productsApi, customersApi, ordersApi, employeesApi } from '../../api';
import { Product, Order, Customer } from '../../types';
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [productsRes, customersRes, ordersRes] = await Promise.all([
        productsApi.getAll(),
        customersApi.getAll(),
        ordersApi.getAll(),
      ]);

      let employeesCount = 0;
      if (isAdmin()) {
        const employeesRes = await employeesApi.getAll();
        employeesCount = employeesRes.data.data?.employees?.length || 0;
      }

      const products = productsRes.data.data?.products || [];
      const customers = customersRes.data.data?.customers || [];
      const orders = ordersRes.data.data?.orders || [];

      setStats({
        employees: employeesCount,
        products: products.length,
        customers: customers.length,
        orders: orders.length,
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
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.name}!
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {[...Array(4)].map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
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
        {isAdmin() && (
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Employees"
              value={stats.employees}
              icon={<PeopleIcon />}
              color="primary"
            />
          </Grid>
        )}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Products"
            value={stats.products}
            icon={<InventoryIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={stats.customers}
            icon={<PeopleIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
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
                format: (row: Product) => (
                  <Typography
                    color={row.stockQuantity < 10 ? 'error' : 'warning.main'}
                    fontWeight="bold"
                  >
                    {row.stockQuantity}
                  </Typography>
                ),
              },
              {
                id: 'priceRetail',
                label: 'Retail Price',
                align: 'right',
                format: (row: Product) => `₮${Number(row.priceRetail).toLocaleString()}`,
              },
            ]}
            data={lowStockProducts}
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
              format: (row: Order) => `#${row.id}`,
            },
            {
              id: 'customer',
              label: 'Customer',
              minWidth: 150,
              format: (row: Order) => row.customer?.name || 'N/A',
            },
            {
              id: 'totalAmount',
              label: 'Total Amount',
              align: 'right',
              format: (row: Order) => `₮${Number(row.totalAmount).toLocaleString()}`,
            },
            {
              id: 'status',
              label: 'Status',
              align: 'center',
              format: (row: Order) => {
                const colors: Record<string, string> = {
                  Pending: 'warning.main',
                  Fulfilled: 'success.main',
                  Cancelled: 'error.main',
                };
                return (
                  <Typography color={colors[row.status]} fontWeight="600">
                    {row.status}
                  </Typography>
                );
              },
            },
            {
              id: 'createdAt',
              label: 'Date',
              minWidth: 150,
              format: (row: Order) => new Date(row.createdAt).toLocaleString(),
            },
          ]}
          data={recentOrders}
        />
      </Box>
    </Box>
  );
}
