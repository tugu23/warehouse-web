import { useState } from 'react';
import { Box, Button, Card, CardContent, Typography, Grid, TextField, Alert } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import DataTable from '../../components/DataTable';
import { ordersApi } from '../../api';
import { Order } from '../../types';
import { exportSalesReportToExcel } from '../../utils/excelExport';
import { TableSkeleton } from '../../components/LoadingSkeletons';

export default function SalesReportPage() {
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const response = await ordersApi.getAll();
      const allOrders = response.data.data?.orders || [];
      const filtered = allOrders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
      });
      setOrders(filtered);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      toast.error('Мэдээлэл татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (orders.length === 0) {
      toast.error('Экспорт хийх мэдээлэл байхгүй байна');
      return;
    }

    setExporting(true);
    try {
      await exportSalesReportToExcel(orders, startDate, endDate);
      toast.success('Excel файл амжилттай татагдлаа');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Экспорт хийхэд алдаа гарлаа');
    } finally {
      setExporting(false);
    }
  };

  const totalSales = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  const completedOrders = orders.filter((o) => o.status === 'Fulfilled').length;

  // Chart data
  const paymentMethodData = [
    { name: 'Бэлэн', value: orders.filter((o) => o.paymentMethod === 'Бэлэн').length },
    { name: 'Данс', value: orders.filter((o) => o.paymentMethod === 'Данс').length },
    { name: 'Борлуулалт', value: orders.filter((o) => o.paymentMethod === 'Борлуулалт').length },
    { name: 'Падаан', value: orders.filter((o) => o.paymentMethod === 'Падаан').length },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const columns = [
    {
      id: 'id',
      label: 'Захиалгын №',
      minWidth: 100,
      format: (row: Order) => `#${row.id}`,
    },
    {
      id: 'customer',
      label: 'Харилцагч',
      minWidth: 150,
      format: (row: Order) => row.customer?.name || 'N/A',
    },
    {
      id: 'totalAmount',
      label: 'Дүн',
      align: 'right' as const,
      minWidth: 120,
      format: (row: Order) => `₮${Number(row.totalAmount).toLocaleString()}`,
    },
    {
      id: 'paymentMethod',
      label: 'Төлбөр',
      minWidth: 120,
    },
    {
      id: 'status',
      label: 'Төлөв',
      minWidth: 100,
    },
    {
      id: 'createdBy',
      label: 'Агент',
      minWidth: 130,
      format: (row: Order) => row.createdBy?.name || 'N/A',
    },
    {
      id: 'createdAt',
      label: 'Огноо',
      minWidth: 150,
      format: (row: Order) => format(new Date(row.createdAt), 'yyyy-MM-dd HH:mm'),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Борлуулалтын Тайлан
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Сонгосон хугацааны борлуулалтын дэлгэрэнгүй тайлан, график, Excel экспорт
      </Alert>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label="Эхлэх огноо"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Дуусах огноо"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="contained" onClick={fetchSalesData} disabled={loading}>
              {loading ? 'Татаж байна...' : 'Тайлан үүсгэх'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={exporting || orders.length === 0}
            >
              {exporting ? 'Экспорт хийж байна...' : 'Excel татах'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {orders.length > 0 && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h5">₮{totalSales.toLocaleString()}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Нийт борлуулалт
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h5">{totalOrders}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Нийт захиалга
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h5">₮{avgOrderValue.toLocaleString()}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Дундаж захиалга
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h5">{completedOrders}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Гүйцэтгэсэн
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Төлбөрийн хэлбэрээр
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {loading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          title="Дэлгэрэнгүй"
          columns={columns}
          data={orders}
          searchable
          searchPlaceholder="Захиалга хайх..."
        />
      )}
    </Box>
  );
}

