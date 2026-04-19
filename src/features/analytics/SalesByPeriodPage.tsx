import { useState, useEffect, useCallback } from 'react';
import { Box, Button, Typography, TextField, MenuItem, Grid, Paper, Alert } from '@mui/material';
import { Download as DownloadIcon, Search as SearchIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import DataTable from '../../components/DataTable';
import { analyticsApi } from '../../api';
import { SalesByPeriodData, SalesByPeriodResponse, SalesPeriod } from '../../types';
import { TableSkeleton } from '../../components/LoadingSkeletons';

export default function SalesByPeriodPage() {
  const [data, setData] = useState<SalesByPeriodData[]>([]);
  const [summary, setSummary] = useState<{
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const [startDate, setStartDate] = useState<string>(lastMonth.toISOString().split('T')[0] ?? '');
  const [endDate, setEndDate] = useState<string>(today.toISOString().split('T')[0] ?? '');
  const [period, setPeriod] = useState<SalesPeriod>('month');

  const fetchData = useCallback(async () => {
    if (!startDate || !endDate) {
      toast.error('Эхлэх болон дуусах огноо оруулна уу');
      return;
    }

    setLoading(true);
    try {
      const response = await analyticsApi.getSalesByPeriod({
        startDate,
        endDate,
        period,
      });

      const responseData = response.data.data as SalesByPeriodResponse;
      setData(responseData.data || []);
      setSummary(responseData.summary || null);
    } catch (error) {
      console.error('Error fetching sales by period:', error);
      toast.error('Мэдээлэл татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    fetchData();
  };

  const columns = [
    {
      id: 'period',
      label: 'Хугацаа',
      minWidth: 150,
      format: (row: SalesByPeriodData) => row.period,
    },
    {
      id: 'totalOrders',
      label: 'Нийт захиалга',
      align: 'right' as const,
      minWidth: 130,
      format: (row: SalesByPeriodData) => row.totalOrders.toLocaleString(),
    },
    {
      id: 'totalSales',
      label: 'Нийт борлуулалт',
      align: 'right' as const,
      minWidth: 150,
      format: (row: SalesByPeriodData) => `₮${row.totalSales.toLocaleString()}`,
    },
    {
      id: 'averageOrderValue',
      label: 'Дундаж захиалгын үнэ',
      align: 'right' as const,
      minWidth: 180,
      format: (row: SalesByPeriodData) => `₮${row.averageOrderValue.toLocaleString()}`,
    },
    {
      id: 'dateRange',
      label: 'Хугацааны интервал',
      minWidth: 200,
      format: (row: SalesByPeriodData) => {
        const start = new Date(row.periodStart).toLocaleDateString('mn-MN');
        const end = new Date(row.periodEnd).toLocaleDateString('mn-MN');
        return `${start} - ${end}`;
      },
    },
  ];

  const periodOptions: { value: SalesPeriod; label: string }[] = [
    { value: 'week', label: '7 хоног' },
    { value: 'month', label: 'Сар' },
    { value: 'year', label: 'Жил' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Хугацаагаар борлуулалтын шинжилгээ</Typography>
        <Button variant="outlined" startIcon={<DownloadIcon />} disabled={data.length === 0}>
          Excel татах
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Борлуулалтын мэдээллийг 7 хоног, сар эсвэл жилээр бүлэглэн харуулна. Огноо болон хугацааны
        төрлийг сонгоод "Хайх" товчийг дарна уу.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            label="Эхлэх огноо"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            label="Дуусах огноо"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            select
            fullWidth
            label="Хугацааны төрөл"
            value={period}
            onChange={(e) => setPeriod(e.target.value as SalesPeriod)}
          >
            {periodOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={loading}
            sx={{ height: '56px' }}
          >
            {loading ? 'Хайж байна...' : 'Хайх'}
          </Button>
        </Grid>
      </Grid>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Нийт борлуулалт
              </Typography>
              <Typography variant="h4" color="primary">
                ₮{summary.totalSales.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Нийт захиалга
              </Typography>
              <Typography variant="h4" color="success.main">
                {summary.totalOrders.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Дундаж захиалгын үнэ
              </Typography>
              <Typography variant="h4" color="secondary.main">
                ₮{summary.averageOrderValue.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Charts */}
      {data.length > 0 && !loading && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Борлуулалтын чиг хандлага
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => `₮${Number(value ?? 0).toLocaleString()}`}
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalSales"
                    stroke="#1976d2"
                    name="Нийт борлуулалт"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Захиалгын тоо
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip labelStyle={{ color: '#000' }} />
                  <Legend />
                  <Bar dataKey="totalOrders" fill="#2e7d32" name="Захиалгын тоо" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Data Table */}
      {loading ? (
        <TableSkeleton />
      ) : (
        <DataTable title="Дэлгэрэнгүй мэдээлэл" columns={columns} data={data} />
      )}
    </Box>
  );
}
