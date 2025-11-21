import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'react-hot-toast';
import { format, startOfWeek, parseISO } from 'date-fns';
import DataTable from '../../components/DataTable';
import { ordersApi, employeesApi } from '../../api';
import { Order, SalesGroupBy, Employee, OrderType } from '../../types';
import { exportSalesReportToExcel } from '../../utils/excelExport';
import { TableSkeleton } from '../../components/LoadingSkeletons';

export default function SalesReportPage() {
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [orders, setOrders] = useState<Order[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [groupBy, setGroupBy] = useState<SalesGroupBy>('month');
  const [selectedEmployee, setSelectedEmployee] = useState<number | ''>('');
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType | ''>('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await employeesApi.getAll();
      setEmployees(response.data.data?.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const response = await ordersApi.getAll();
      const allOrders = response.data.data?.orders || [];
      let filtered = allOrders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
      });

      // Filter by employee
      if (selectedEmployee) {
        filtered = filtered.filter((order) => order.createdById === selectedEmployee);
      }

      // Filter by order type
      if (selectedOrderType) {
        filtered = filtered.filter((order) => order.orderType === selectedOrderType);
      }

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

  // Order type breakdown
  const marketOrders = orders.filter((o) => o.orderType === 'Market').length;
  const storeOrders = orders.filter((o) => o.orderType === 'Store').length;
  const marketSales = orders
    .filter((o) => o.orderType === 'Market')
    .reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const storeSales = orders
    .filter((o) => o.orderType === 'Store')
    .reduce((sum, order) => sum + Number(order.totalAmount), 0);

  // Group orders by period
  const groupOrders = () => {
    const grouped: Record<string, { orders: Order[]; total: number; count: number }> = {};

    orders.forEach((order) => {
      const date = parseISO(order.createdAt);
      let key: string;

      switch (groupBy) {
        case 'week': {
          const weekStart = startOfWeek(date);
          key = format(weekStart, 'yyyy-MM-dd');
          break;
        }
        case 'month':
          key = format(date, 'yyyy-MM');
          break;
        case 'year':
          key = format(date, 'yyyy');
          break;
        default:
          key = format(date, 'yyyy-MM');
      }

      if (!grouped[key]) {
        grouped[key] = { orders: [], total: 0, count: 0 };
      }

      grouped[key].orders.push(order);
      grouped[key].total += Number(order.totalAmount);
      grouped[key].count += 1;
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({
        period,
        periodLabel: groupBy === 'week' ? `Долоо хоног ${period}` : period,
        total: data.total,
        count: data.count,
        orders: data.orders,
      }));
  };

  const groupedData = groupOrders();

  // Chart data
  const paymentMethodData = [
    { name: 'Бэлэн', value: orders.filter((o) => o.paymentMethod === 'Cash').length },
    { name: 'Данс', value: orders.filter((o) => o.paymentMethod === 'BankTransfer').length },
    { name: 'Борлуулалт', value: orders.filter((o) => o.paymentMethod === 'Sales').length },
    { name: 'Падаан', value: orders.filter((o) => o.paymentMethod === 'Padan').length },
    { name: 'Зээл', value: orders.filter((o) => o.paymentMethod === 'Credit').length },
  ].filter((item) => item.value > 0);

  const orderTypeData = [
    { name: 'Захын лангуу', value: marketOrders, sales: marketSales },
    { name: 'Дэлгүүр', value: storeOrders, sales: storeSales },
  ].filter((item) => item.value > 0);

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
      id: 'orderType',
      label: 'Төрөл',
      minWidth: 120,
      format: (row: Order) =>
        row.orderType === 'Market' ? 'Захын лангуу' : row.orderType === 'Store' ? 'Дэлгүүр' : 'N/A',
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
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Эхлэх огноо"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Дуусах огноо"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Бүлэглэх</InputLabel>
                <Select
                  value={groupBy}
                  label="Бүлэглэх"
                  onChange={(e) => setGroupBy(e.target.value as SalesGroupBy)}
                >
                  <MenuItem value="month">Сараар</MenuItem>
                  <MenuItem value="week">7 хоногоор</MenuItem>
                  <MenuItem value="year">Жилээр</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Ажилтан</InputLabel>
                <Select
                  value={selectedEmployee}
                  label="Ажилтан"
                  onChange={(e) =>
                    setSelectedEmployee(e.target.value === '' ? '' : Number(e.target.value))
                  }
                >
                  <MenuItem value="">Бүгд</MenuItem>
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Захиалгын төрөл</InputLabel>
                <Select
                  value={selectedOrderType}
                  label="Захиалгын төрөл"
                  onChange={(e) => setSelectedOrderType(e.target.value as OrderType | '')}
                >
                  <MenuItem value="">Бүгд</MenuItem>
                  <MenuItem value="Market">Захын лангуу</MenuItem>
                  <MenuItem value="Store">Дэлгүүр</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                onClick={fetchSalesData}
                disabled={loading}
                fullWidth
                sx={{ height: '56px' }}
              >
                {loading ? 'Татаж байна...' : 'Тайлан үүсгэх'}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
                disabled={exporting || orders.length === 0}
                fullWidth
                sx={{ height: '56px' }}
              >
                {exporting ? 'Экспорт хийж байна...' : 'Excel татах'}
              </Button>
            </Grid>
          </Grid>
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
                  {(marketOrders > 0 || storeOrders > 0) && (
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      {marketOrders > 0 && (
                        <Chip
                          label={`Захын лангуу: ${marketOrders}`}
                          size="small"
                          color="primary"
                        />
                      )}
                      {storeOrders > 0 && (
                        <Chip label={`Дэлгүүр: ${storeOrders}`} size="small" color="success" />
                      )}
                    </Box>
                  )}
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
                    Хугацааны бүлэглэл (
                    {groupBy === 'month' ? 'Сар' : groupBy === 'week' ? '7 хоног' : 'Жил'})
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={groupedData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="periodLabel" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" fill="#8884d8" name="Нийт дүн (₮)" />
                      <Bar dataKey="count" fill="#82ca9d" name="Захиалгын тоо" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
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
            {orderTypeData.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Захиалгын төрлөөр
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={orderTypeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="value" fill="#8884d8" name="Захиалгын тоо" />
                        <Bar
                          yAxisId="right"
                          dataKey="sales"
                          fill="#82ca9d"
                          name="Борлуулалтын дүн (₮)"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Борлуулалтын чиг хандлага
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={groupedData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="periodLabel" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="#8884d8" name="Нийт дүн (₮)" />
                      <Line type="monotone" dataKey="count" stroke="#82ca9d" name="Захиалгын тоо" />
                    </LineChart>
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
