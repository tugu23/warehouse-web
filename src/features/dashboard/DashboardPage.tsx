import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  LinearProgress,
  Avatar,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Inventory as StockIcon,
  Receipt as ReceiptIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  HourglassEmpty as PendingIcon,
  AttachMoney as RevenueIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { productsApi, customersApi, ordersApi, employeesApi } from '../../api';
import { Product, Order } from '../../types';
import { CardSkeleton } from '../../components/LoadingSkeletons';
import { useNavigate } from 'react-router-dom';

// ── Helpers ───────────────────────────────────────────────────────────────
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatMNT = (v: number) =>
  v >= 1_000_000 ? `₮${(v / 1_000_000).toFixed(1)}сая` : `₮${v.toLocaleString()}`;

// ── KPI Card ─────────────────────────────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'primary' | 'success' | 'warning' | 'error' | 'info';
  trend?: { value: number; label: string };
  onClick?: () => void;
}

function KpiCard({ title, value, subtitle, icon, color, trend, onClick }: KpiCardProps) {
  const colorMap = {
    primary: { bg: 'primary.50', icon: 'primary.main', border: 'primary.200' },
    success: { bg: 'success.50', icon: 'success.main', border: 'success.200' },
    warning: { bg: 'warning.50', icon: 'warning.main', border: 'warning.200' },
    error: { bg: 'error.50', icon: 'error.main', border: 'error.200' },
    info: { bg: 'info.50', icon: 'info.main', border: 'info.200' },
  };
  const c = colorMap[color];
  return (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s',
        '&:hover': onClick ? { boxShadow: 4 } : {},
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
              sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, lineHeight: 1.2 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
            {trend !== undefined && (
              <Stack direction="row" alignItems="center" gap={0.5} sx={{ mt: 1 }}>
                {trend.value >= 0 ? (
                  <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                )}
                <Typography
                  variant="caption"
                  color={trend.value >= 0 ? 'success.main' : 'error.main'}
                  fontWeight={600}
                >
                  {trend.value >= 0 ? '+' : ''}
                  {trend.value}% {trend.label}
                </Typography>
              </Stack>
            )}
          </Box>
          <Avatar sx={{ bgcolor: c.bg, color: c.icon, width: 52, height: 52 }}>{icon}</Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ── Status Chip ───────────────────────────────────────────────────────────
function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; color: 'warning' | 'success' | 'error' | 'default' }> =
    {
      Pending: { label: 'Хүлээгдэж буй', color: 'warning' },
      Fulfilled: { label: 'Гүйцэтгэсэн', color: 'success' },
      Cancelled: { label: 'Цуцлагдсан', color: 'error' },
    };
  const s = map[status] ?? { label: status, color: 'default' };
  return <Chip label={s.label} color={s.color} size="small" />;
}

// ── Main Dashboard ────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);

  const userIsAdmin = isAdmin();

  // ── Fetch ────────────────────────────────────────────────────────────
  const fetchData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const [prodRes, custRes, ordRes] = await Promise.all([
          productsApi.getAll({ limit: 'all' }),
          customersApi.getAll(),
          ordersApi.getAll({ limit: 'all' }),
        ]);
        setAllProducts(prodRes.data.data?.products || []);
        setCustomerCount(
          custRes.data.data?.pagination?.total ?? (custRes.data.data?.customers?.length || 0)
        );
        setAllOrders(ordRes.data.data?.orders || []);

        if (userIsAdmin) {
          const empRes = await employeesApi.getAll();
          setEmployeeCount(empRes.data.data?.employees?.length || 0);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userIsAdmin]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Derived stats ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    const today = allOrders.filter((o) => isSameDay(new Date(o.createdAt), now));
    const yesterday = allOrders.filter((o) => {
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      return isSameDay(new Date(o.createdAt), d);
    });
    const thisMonth = allOrders.filter((o) => {
      const d = new Date(o.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const todayRevenue = today
      .filter((o) => o.status === 'Fulfilled')
      .reduce((s, o) => s + Number(o.totalAmount), 0);
    const yestRevenue = yesterday
      .filter((o) => o.status === 'Fulfilled')
      .reduce((s, o) => s + Number(o.totalAmount), 0);
    const revTrend =
      yestRevenue > 0 ? Math.round(((todayRevenue - yestRevenue) / yestRevenue) * 100) : 0;

    const pendingOrders = allOrders.filter((o) => o.status === 'Pending');
    const ebarimtPending = allOrders.filter(
      (o) => o.status === 'Fulfilled' && !o.ebarimtRegistered
    );
    const lowStock = allProducts
      .filter((p) => p.isActive && p.stockQuantity < 20)
      .sort((a, b) => a.stockQuantity - b.stockQuantity);
    const outOfStock = allProducts.filter((p) => p.isActive && p.stockQuantity === 0);

    const monthRevenue = thisMonth
      .filter((o) => o.status === 'Fulfilled')
      .reduce((s, o) => s + Number(o.totalAmount), 0);

    return {
      today,
      todayRevenue,
      revTrend,
      monthRevenue,
      monthOrders: thisMonth.length,
      pendingOrders,
      ebarimtPending,
      lowStock,
      outOfStock,
    };
  }, [allOrders, allProducts]);

  // ── 7-хоногийн борлуулалт ─────────────────────────────────────────────
  const salesChart = useMemo(() => {
    const days = 7;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const dayOrders = allOrders.filter((o) => isSameDay(new Date(o.createdAt), d));
      const revenue = dayOrders
        .filter((o) => o.status === 'Fulfilled')
        .reduce((s, o) => s + Number(o.totalAmount), 0);
      return {
        day: d.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' }),
        Захиалга: dayOrders.length,
        Орлого: revenue,
      };
    });
  }, [allOrders]);

  // ── Status breakdown ──────────────────────────────────────────────────
  const statusChart = useMemo(() => {
    const counts = { Pending: 0, Fulfilled: 0, Cancelled: 0 };
    allOrders.forEach((o) => {
      if (o.status in counts) counts[o.status as keyof typeof counts]++;
    });
    return [
      { name: 'Хүлээгдэж буй', value: counts.Pending, color: '#f59e0b' },
      { name: 'Гүйцэтгэсэн', value: counts.Fulfilled, color: '#22c55e' },
      { name: 'Цуцлагдсан', value: counts.Cancelled, color: '#ef4444' },
    ].filter((s) => s.value > 0);
  }, [allOrders]);

  // ── Recent 6 orders ───────────────────────────────────────────────────
  const recentOrders = useMemo(
    () =>
      [...allOrders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6),
    [allOrders]
  );

  // ─────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Сайн байна уу, {user?.name}!
        </Typography>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {[...Array(4)].map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={i}>
              <CardSkeleton />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Сайн байна уу, {user?.name}! 👋
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {new Date().toLocaleDateString('mn-MN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </Typography>
        </Box>
        <Tooltip title="Шинэчлэх">
          <IconButton onClick={() => fetchData(true)} disabled={refreshing}>
            <RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* ── Critical Alerts ───────────────────────────────────────────── */}
      {(stats.outOfStock.length > 0 || stats.ebarimtPending.length > 0) && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {stats.outOfStock.length > 0 && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card sx={{ borderLeft: 4, borderColor: 'error.main', bgcolor: 'error.50' }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Stack direction="row" alignItems="center" gap={1}>
                    <WarningIcon color="error" fontSize="small" />
                    <Typography variant="body2" fontWeight={700} color="error.main">
                      {stats.outOfStock.length} бараа дууссан байна
                    </Typography>
                    <Button
                      size="small"
                      color="error"
                      endIcon={<ArrowIcon />}
                      onClick={() => navigate('/products')}
                      sx={{ ml: 'auto', textTransform: 'none' }}
                    >
                      Харах
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}
          {stats.ebarimtPending.length > 0 && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card sx={{ borderLeft: 4, borderColor: 'warning.main', bgcolor: 'warning.50' }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Stack direction="row" alignItems="center" gap={1}>
                    <ReceiptIcon color="warning" fontSize="small" />
                    <Typography variant="body2" fontWeight={700} color="warning.main">
                      {stats.ebarimtPending.length} захиалганд eBarimt хэвлэгдээгүй
                    </Typography>
                    <Button
                      size="small"
                      color="warning"
                      endIcon={<ArrowIcon />}
                      onClick={() => navigate('/ebarimt')}
                      sx={{ ml: 'auto', textTransform: 'none' }}
                    >
                      Харах
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* ── KPI Cards ────────────────────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard
            title="Өнөөдрийн орлого"
            value={formatMNT(stats.todayRevenue)}
            subtitle={`${stats.today.length} захиалга`}
            icon={<RevenueIcon />}
            color="success"
            trend={stats.revTrend !== 0 ? { value: stats.revTrend, label: 'өчигдрөөс' } : undefined}
            onClick={() => navigate('/orders')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard
            title="Сарын орлого"
            value={formatMNT(stats.monthRevenue)}
            subtitle={`${stats.monthOrders} захиалга`}
            icon={<TrendingUpIcon />}
            color="primary"
            onClick={() => navigate('/orders')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard
            title="Хүлээгдэж буй"
            value={stats.pendingOrders.length}
            subtitle="Гүйцэтгэгдэх захиалга"
            icon={<PendingIcon />}
            color={stats.pendingOrders.length > 10 ? 'warning' : 'info'}
            onClick={() => navigate('/orders')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <KpiCard
            title="Бараа бага үлдэгдэлтэй"
            value={stats.lowStock.length}
            subtitle={`${stats.outOfStock.length} нэр дууссан`}
            icon={<StockIcon />}
            color={
              stats.outOfStock.length > 0
                ? 'error'
                : stats.lowStock.length > 5
                  ? 'warning'
                  : 'success'
            }
            onClick={() => navigate('/products')}
          />
        </Grid>
      </Grid>

      {/* ── Secondary stats ───────────────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" fontWeight={800}>
                {allOrders.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Нийт захиалга
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" fontWeight={800}>
                {customerCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Харилцагч
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" fontWeight={800}>
                {allProducts.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Нийт бараа
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {userIsAdmin && (
          <Grid size={{ xs: 6, sm: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h5" fontWeight={800}>
                  {employeeCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Ажилтан
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* ── Charts ───────────────────────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Sales bar chart */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Сүүлийн 7 хоногийн захиалга
              </Typography>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={salesChart} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) =>
                      v >= 1_000_000
                        ? `${(v / 1_000_000).toFixed(1)}с`
                        : `${(v / 1000).toFixed(0)}к`
                    }
                  />
                  <ChartTooltip
                    formatter={(val, name) =>
                      name === 'Орлого' ? [formatMNT(Number(val)), name] : [val, name]
                    }
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar yAxisId="left" dataKey="Захиалга" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="Орлого" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <Stack direction="row" gap={2} sx={{ mt: 1, justifyContent: 'center' }}>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: '#3b82f6' }} />
                  <Typography variant="caption">Захиалга (тоо)</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: '#22c55e' }} />
                  <Typography variant="caption">Орлого (₮)</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Status pie chart */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Захиалгын төлөв
              </Typography>
              {statusChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {statusChart.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip contentStyle={{ fontSize: 12 }} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">Захиалга байхгүй</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Bottom row ───────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        {/* Recent orders */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="subtitle1" fontWeight={700}>
                  Сүүлийн захиалгууд
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowIcon />}
                  onClick={() => navigate('/orders')}
                  sx={{ textTransform: 'none' }}
                >
                  Бүгдийг харах
                </Button>
              </Stack>
              <Stack gap={1}>
                {recentOrders.length === 0 ? (
                  <Typography
                    color="text.secondary"
                    variant="body2"
                    sx={{ py: 2, textAlign: 'center' }}
                  >
                    Захиалга байхгүй
                  </Typography>
                ) : (
                  recentOrders.map((o) => (
                    <Box
                      key={o.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        py: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:last-child': { borderBottom: 'none' },
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          fontSize: 13,
                          bgcolor: 'primary.50',
                          color: 'primary.main',
                          fontWeight: 700,
                        }}
                      >
                        #{o.id}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {o.customer?.name || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(o.createdAt).toLocaleString('mn-MN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                      </Box>
                      <Stack alignItems="flex-end" gap={0.5}>
                        <Typography variant="body2" fontWeight={700}>
                          {formatMNT(Number(o.totalAmount))}
                        </Typography>
                        <StatusChip status={o.status} />
                      </Stack>
                    </Box>
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Low stock */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Бага үлдэгдэлтэй бараа
                  </Typography>
                  {stats.lowStock.length > 0 && (
                    <Chip
                      label={stats.lowStock.length}
                      size="small"
                      color={stats.outOfStock.length > 0 ? 'error' : 'warning'}
                    />
                  )}
                </Stack>
                <Button
                  size="small"
                  endIcon={<ArrowIcon />}
                  onClick={() => navigate('/products')}
                  sx={{ textTransform: 'none' }}
                >
                  Бүгд
                </Button>
              </Stack>
              {stats.lowStock.length === 0 ? (
                <Stack direction="row" alignItems="center" gap={1} sx={{ py: 2 }}>
                  <CheckIcon color="success" />
                  <Typography variant="body2" color="success.main">
                    Бүх бараа хангалттай үлдэгдэлтэй байна
                  </Typography>
                </Stack>
              ) : (
                <Stack gap={1}>
                  {stats.lowStock.slice(0, 6).map((p) => (
                    <Box key={p.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {p.nameMongolian}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((p.stockQuantity / 20) * 100, 100)}
                          color={
                            p.stockQuantity === 0
                              ? 'error'
                              : p.stockQuantity < 10
                                ? 'warning'
                                : 'success'
                          }
                          sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                        />
                      </Box>
                      <Chip
                        label={p.stockQuantity === 0 ? 'Дууссан' : p.stockQuantity}
                        size="small"
                        color={
                          p.stockQuantity === 0
                            ? 'error'
                            : p.stockQuantity < 10
                              ? 'warning'
                              : 'default'
                        }
                        sx={{ minWidth: 54, fontWeight: 700 }}
                      />
                    </Box>
                  ))}
                  {stats.lowStock.length > 6 && (
                    <Typography variant="caption" color="text.secondary" sx={{ pt: 0.5 }}>
                      + бусад {stats.lowStock.length - 6} нэр бараа
                    </Typography>
                  )}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
