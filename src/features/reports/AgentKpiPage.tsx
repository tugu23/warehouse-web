import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import ExcelJS from 'exceljs';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FileDownload as FileDownloadIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import toast from 'react-hot-toast';
import { agentKpiApi, employeesApi } from '../../api';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { TableSkeleton } from '../../components/LoadingSkeletons';
import { useAuth } from '../../hooks/useAuth';
import {
  AgentKpiCategoryRow,
  AgentKpiDashboardSummary,
  AgentKpiGranularity,
  AgentKpiMultiAgentRow,
  AgentKpiProductRow,
  AgentKpiRankingRow,
  AgentKpiSummaryData,
  AgentKpiSummaryRow,
  AgentKpiTarget,
  AgentKpiTrendRow,
  SalesByBrandGranularity,
  CreateAgentKpiTargetRequest,
  Employee,
  SalesByBrandResult,
} from '../../types';

type AgentKpiTab =
  | 'dashboard'
  | 'summary'
  | 'products'
  | 'categories'
  | 'trend'
  | 'ranking'
  | 'daily'
  | 'targets'
  | 'sales-report';

type RankingSort = 'amount' | 'boxes' | 'orders';

type TargetFormState = {
  employeeId: number;
  periodType: CreateAgentKpiTargetRequest['periodType'];
  periodStart: string;
  targetAmount: string;
  targetBoxQty: string;
};

const SALES_ROLES = ['SalesAgent', 'MarketSalesperson', 'StoreSalesperson'];

function formatNumber(value: number | null | undefined, digits = 0) {
  if (value == null || Number.isNaN(value)) {
    return '-';
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatCurrency(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    return '-';
  }
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ₮`;
}

function formatPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    return '-';
  }
  return `${value.toFixed(2)}%`;
}

// ========== EXCEL EXPORT HELPERS ==========

async function exportToExcel(
  data: Record<string, unknown>[],
  columns: { header: string; key: string; format?: (val: unknown) => string }[],
  filename: string,
  sheetName = 'Sheet1'
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Oasis Warehouse';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName);

  // Header row
  const headerRow = worksheet.addRow(columns.map((c) => c.header));
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2C5282' },
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
  headerRow.height = 22;

  // Data rows
  for (const row of data) {
    const rowObj = columns.map((col) => {
      const raw = row[col.key];
      return col.format ? col.format(raw) : String(raw ?? '');
    });
    const dataRow = worksheet.addRow(rowObj);
    dataRow.eachCell((cell) => {
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    dataRow.height = 18;
  }

  // Auto-width columns
  worksheet.columns.forEach((col) => {
    col.width = Math.max(
      12,
      ...(col.values as string[]).map((v) => Math.min(String(v).length + 2, 40))
    );
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <Card sx={{ minWidth: 220, flex: '1 1 220px' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h6" fontWeight={700}>
          {value}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {subtitle}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Typography color="text.secondary" sx={{ py: 2 }}>
      {message}
    </Typography>
  );
}

export default function AgentKpiPage() {
  const { user, isAdmin, isManager } = useAuth();
  const canViewAllAgents = isAdmin() || isManager();

  const [tab, setTab] = useState<AgentKpiTab>('dashboard');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | ''>('');
  const [from, setFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [summaryGranularity, setSummaryGranularity] = useState<AgentKpiGranularity>('day');
  const [trendGranularity, setTrendGranularity] = useState<'day' | 'month'>('day');
  const [salesGranularity, setSalesGranularity] = useState<SalesByBrandGranularity>('year');
  const [rankingSort, setRankingSort] = useState<RankingSort>('amount');
  const [multiDate, setMultiDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState<AgentKpiDashboardSummary | null>(null);
  const [summary, setSummary] = useState<AgentKpiSummaryData | null>(null);
  const [products, setProducts] = useState<AgentKpiProductRow[]>([]);
  const [categories, setCategories] = useState<AgentKpiCategoryRow[]>([]);
  const [trend, setTrend] = useState<AgentKpiTrendRow[]>([]);
  const [ranking, setRanking] = useState<AgentKpiRankingRow[]>([]);
  const [multiAgents, setMultiAgents] = useState<AgentKpiMultiAgentRow[]>([]);
  const [targets, setTargets] = useState<AgentKpiTarget[]>([]);
  const [salesByBrand, setSalesByBrand] = useState<SalesByBrandResult | null>(null);

  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<AgentKpiTarget | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<TargetFormState>({
    employeeId: 0,
    periodType: 'DAY',
    periodStart: format(new Date(), 'yyyy-MM-dd'),
    targetAmount: '',
    targetBoxQty: '',
  });

  const agentOptions = useMemo(() => {
    const filtered = employees.filter((employee) => SALES_ROLES.includes(employee.role?.name));
    return filtered.length > 0 ? filtered : employees;
  }, [employees]);

  const selectedAgentName = useMemo(() => {
    if (canViewAllAgents) {
      if (selectedAgentId === '') {
        return null;
      }
      return agentOptions.find((employee) => employee.id === selectedAgentId)?.name ?? null;
    }
    return user?.name ?? null;
  }, [agentOptions, canViewAllAgents, selectedAgentId, user?.name]);

  const salesReportGroups = useMemo(() => {
    return salesByBrand?.brands.map((brand) => ({
      ...brand,
      suppliers: brand.suppliers.map((supplier) => ({
        ...supplier,
        products: [...supplier.products].sort((a, b) => a.productName.localeCompare(b.productName)),
      })),
    })) ?? [];
  }, [salesByBrand]);

  const salesReportStats = useMemo(() => {
    if (!salesByBrand) {
      return { categories: 0, suppliers: 0, products: 0 };
    }

    const suppliers = salesByBrand.brands.reduce((acc, brand) => acc + brand.suppliers.length, 0);
    const products = salesByBrand.brands.reduce(
      (acc, brand) => acc + brand.suppliers.reduce((sum, supplier) => sum + supplier.products.length, 0),
      0
    );

    return {
      categories: salesByBrand.brands.length,
      suppliers,
      products,
    };
  }, [salesByBrand]);

  const effectiveAgentId = useMemo(() => {
    if (canViewAllAgents) {
      return selectedAgentId === '' ? null : Number(selectedAgentId);
    }
    return user?.id ?? null;
  }, [canViewAllAgents, selectedAgentId, user?.id]);

  const requireAgentId = useCallback(
    (silent = false) => {
      if (effectiveAgentId != null) {
        return effectiveAgentId;
      }
      if (!silent) {
        toast.error('Агент сонгоно уу.');
      }
      return null;
    },
    [effectiveAgentId]
  );

  const loadEmployees = useCallback(async () => {
    try {
      const response = await employeesApi.getAll({ limit: 500 });
      setEmployees(response.data.data?.employees || []);
    } catch {
      toast.error('Ажилтны жагсаалт ачаалж чадсангүй.');
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    if (!canViewAllAgents || selectedAgentId !== '' || agentOptions.length === 0) {
      return;
    }
    setSelectedAgentId(agentOptions[0].id);
  }, [agentOptions, canViewAllAgents, selectedAgentId]);

  const fetchDashboard = useCallback(
    async (silent = false) => {
      const agentId = canViewAllAgents ? effectiveAgentId ?? undefined : requireAgentId(silent);
      if (!canViewAllAgents && agentId == null) {
        return;
      }

      setLoading(true);
      try {
        const response = await agentKpiApi.getDashboardSummary({
          from,
          to,
          ...(agentId ? { agentId } : {}),
        });
        setDashboard(response.data.data ?? null);
      } catch {
        setDashboard(null);
        if (!silent) {
          toast.error('Тойм ачаалж чадсангүй.');
        }
      } finally {
        setLoading(false);
      }
    },
    [canViewAllAgents, effectiveAgentId, from, requireAgentId, to]
  );

  const fetchSummary = useCallback(
    async (silent = false) => {
      const agentId = requireAgentId(silent);
      if (agentId == null) {
        setSummary(null);
        return;
      }

      setLoading(true);
      try {
        const response = await agentKpiApi.getSummary({
          from,
          to,
          agentId,
          granularity: summaryGranularity,
        });
        setSummary(response.data.data ?? null);
      } catch {
        setSummary(null);
        if (!silent) {
          toast.error('Хураангуй ачаалж чадсангүй.');
        }
      } finally {
        setLoading(false);
      }
    },
    [from, requireAgentId, summaryGranularity, to]
  );

  const fetchProducts = useCallback(
    async (silent = false) => {
      const agentId = requireAgentId(silent);
      if (agentId == null) {
        setProducts([]);
        return;
      }

      setLoading(true);
      try {
        const response = await agentKpiApi.getByProduct({ from, to, agentId });
        setProducts(response.data.data?.products || []);
      } catch {
        setProducts([]);
        if (!silent) {
          toast.error('Барааны KPI ачаалж чадсангүй.');
        }
      } finally {
        setLoading(false);
      }
    },
    [from, requireAgentId, to]
  );

  const fetchCategories = useCallback(
    async (silent = false) => {
      const agentId = canViewAllAgents ? effectiveAgentId ?? undefined : requireAgentId(silent);
      if (!canViewAllAgents && agentId == null) {
        setCategories([]);
        return;
      }

      setLoading(true);
      try {
        const response = await agentKpiApi.getCategoryAnalysis({
          from,
          to,
          ...(agentId ? { agentId } : {}),
        });
        setCategories(response.data.data?.categories || []);
      } catch {
        setCategories([]);
        if (!silent) {
          toast.error('Ангиллын KPI ачаалж чадсангүй.');
        }
      } finally {
        setLoading(false);
      }
    },
    [canViewAllAgents, effectiveAgentId, from, requireAgentId, to]
  );

  const fetchTrend = useCallback(
    async (silent = false) => {
      const agentId = canViewAllAgents ? effectiveAgentId ?? undefined : requireAgentId(silent);
      if (!canViewAllAgents && agentId == null) {
        setTrend([]);
        return;
      }

      setLoading(true);
      try {
        const response = await agentKpiApi.getTrendData({
          from,
          to,
          granularity: trendGranularity,
          ...(agentId ? { agentId } : {}),
        });
        setTrend(response.data.data?.trend || []);
      } catch {
        setTrend([]);
        if (!silent) {
          toast.error('Тренд ачаалж чадсангүй.');
        }
      } finally {
        setLoading(false);
      }
    },
    [canViewAllAgents, effectiveAgentId, from, requireAgentId, to, trendGranularity]
  );

  const fetchRanking = useCallback(
    async (silent = false) => {
      setLoading(true);
      try {
        const response = await agentKpiApi.getRanking({
          from,
          to,
          sortBy: rankingSort,
        });
        setRanking(response.data.data?.ranking || []);
      } catch {
        setRanking([]);
        if (!silent) {
          toast.error('Агентын жагсаалт ачаалж чадсангүй.');
        }
      } finally {
        setLoading(false);
      }
    },
    [from, rankingSort, to]
  );

  const fetchMultiDaily = useCallback(
    async (silent = false) => {
      setLoading(true);
      try {
        const response = await agentKpiApi.getMultiAgentDaily({ date: multiDate });
        setMultiAgents(response.data.data?.agents || []);
      } catch {
        setMultiAgents([]);
        if (!silent) {
          toast.error('Өдрийн агентын нийлбэр ачаалж чадсангүй.');
        }
      } finally {
        setLoading(false);
      }
    },
    [multiDate]
  );

  const fetchTargets = useCallback(
    async (silent = false) => {
      const agentId = requireAgentId(silent);
      if (agentId == null) {
        setTargets([]);
        return;
      }

      setLoading(true);
      try {
        const response = await agentKpiApi.getTargets(agentId);
        setTargets(response.data.data?.targets || []);
      } catch {
        setTargets([]);
        if (!silent) {
          toast.error('Зорилт ачаалж чадсангүй.');
        }
      } finally {
        setLoading(false);
      }
    },
    [requireAgentId]
  );

  const fetchSalesByBrand = useCallback(
    async (silent = false) => {
      const agentId = canViewAllAgents ? effectiveAgentId ?? undefined : requireAgentId(silent);
      if (!canViewAllAgents && agentId == null) {
        setSalesByBrand(null);
        return;
      }

      setLoading(true);
      try {
        const response = await agentKpiApi.getSalesByBrand({
          from,
          to,
          granularity: salesGranularity,
          ...(agentId ? { agentId } : {}),
        });
        setSalesByBrand(response.data.data ?? null);
      } catch {
        setSalesByBrand(null);
        if (!silent) {
          toast.error('Борлуулалтын тайлан ачаалж чадсангүй.');
        }
      } finally {
        setLoading(false);
      }
    },
    [canViewAllAgents, effectiveAgentId, from, requireAgentId, salesGranularity, to]
  );

  const refreshActiveTab = useCallback(
    async (silent = false) => {
      switch (tab) {
        case 'dashboard':
          await fetchDashboard(silent);
          break;
        case 'summary':
          await fetchSummary(silent);
          break;
        case 'products':
          await fetchProducts(silent);
          break;
        case 'categories':
          await fetchCategories(silent);
          break;
        case 'trend':
          await fetchTrend(silent);
          break;
        case 'ranking':
          await fetchRanking(silent);
          break;
        case 'daily':
          await fetchMultiDaily(silent);
          break;
        case 'targets':
          await fetchTargets(silent);
          break;
        case 'sales-report':
          await fetchSalesByBrand(silent);
          break;
      }
    },
    [
      fetchCategories,
      fetchDashboard,
      fetchMultiDaily,
      fetchProducts,
      fetchRanking,
      fetchSummary,
      fetchTargets,
      fetchTrend,
      fetchSalesByBrand,
      tab,
    ]
  );

  useEffect(() => {
    void refreshActiveTab(true);
  }, [refreshActiveTab]);

  const openCreateTarget = () => {
    const agentId = requireAgentId(false);
    if (agentId == null) {
      return;
    }

    setEditingTarget(null);
    setForm({
      employeeId: agentId,
      periodType: 'DAY',
      periodStart: format(new Date(), 'yyyy-MM-dd'),
      targetAmount: '',
      targetBoxQty: '',
    });
    setTargetModalOpen(true);
  };

  const openEditTarget = (target: AgentKpiTarget) => {
    setEditingTarget(target);
    setForm({
      employeeId: target.employeeId,
      periodType: target.periodType,
      periodStart: target.periodStart,
      targetAmount: target.targetAmount,
      targetBoxQty: target.targetBoxQty ?? '',
    });
    setTargetModalOpen(true);
  };

  const saveTarget = async () => {
    if (!form.targetAmount) {
      toast.error('Зорилтын дүн оруулна уу.');
      return;
    }

    try {
      if (editingTarget) {
        await agentKpiApi.updateTarget(editingTarget.id, {
          targetAmount: form.targetAmount,
          targetBoxQty: form.targetBoxQty === '' ? null : form.targetBoxQty,
        });
        toast.success('Зорилт шинэчлэгдлээ.');
      } else {
        await agentKpiApi.createTarget({
          employeeId: form.employeeId,
          periodType: form.periodType,
          periodStart: form.periodStart,
          targetAmount: form.targetAmount,
          ...(form.targetBoxQty !== '' ? { targetBoxQty: form.targetBoxQty } : {}),
        });
        toast.success('Зорилт үүслээ.');
      }

      setTargetModalOpen(false);
      await fetchTargets(true);
    } catch {
      toast.error('Зорилт хадгалж чадсангүй.');
    }
  };

  const confirmDeleteTarget = async () => {
    if (deleteId == null) {
      return;
    }

    try {
      await agentKpiApi.deleteTarget(deleteId);
      toast.success('Зорилт устгагдлаа.');
      setDeleteId(null);
      await fetchTargets(true);
    } catch {
      toast.error('Зорилт устгаж чадсангүй.');
    }
  };

  const summaryUnitTotal = useMemo(
    () => summary?.rows.reduce((acc, row) => acc + row.actualUnits, 0) ?? 0,
    [summary]
  );

  const summaryColumns = useMemo(
    () =>
      [
        { key: 'bucket', label: 'Хугацаа' },
        { key: 'actualAmount', label: 'Борлуулалт' },
        { key: 'actualBoxes', label: 'Хайрцаг' },
        { key: 'actualUnits', label: 'Ширхэг' },
        { key: 'targetAmount', label: 'Зорилт' },
        { key: 'targetBoxQty', label: 'Зорилтот хайрцаг' },
        { key: 'achievementPercent', label: 'Биелэлт' },
        ...(summaryGranularity === 'day'
          ? [{ key: 'runningAvgPercent', label: 'Дундаж биелэлт' }]
          : []),
      ] as Array<{ key: keyof AgentKpiSummaryRow; label: string }>,
    [summaryGranularity]
  );

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Agent KPI
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        KPI тооцоонд зөвхөн `Paid` төлөвтэй захиалга орно. Хайрцаг нь тухайн барааны
        `unitsPerBox` утгаар тооцогдоно.
      </Alert>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
        {canViewAllAgents ? (
          <FormControl size="small" sx={{ minWidth: 260 }}>
            <InputLabel>Агент</InputLabel>
            <Select
              label="Агент"
              value={selectedAgentId === '' ? '' : String(selectedAgentId)}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedAgentId(value === '' ? '' : Number(value));
              }}
            >
              {agentOptions.map((employee) => (
                <MenuItem key={employee.id} value={String(employee.id)}>
                  {employee.name} ({employee.role?.name})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <TextField
            size="small"
            label="Агент"
            value={user?.name || ''}
            InputProps={{ readOnly: true }}
            sx={{ minWidth: 260 }}
          />
        )}

        <TextField
          size="small"
          type="date"
          label="Эхлэх огноо"
          InputLabelProps={{ shrink: true }}
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        />
        <TextField
          size="small"
          type="date"
          label="Дуусах огноо"
          InputLabelProps={{ shrink: true }}
          value={to}
          onChange={(event) => setTo(event.target.value)}
        />
        <Button variant="contained" onClick={() => void refreshActiveTab(false)} disabled={loading}>
          Шинэчлэх
        </Button>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, nextTab) => setTab(nextTab)}
        sx={{ mb: 2 }}
        variant="scrollable"
        allowScrollButtonsMobile
      >
        <Tab value="dashboard" label="Тойм" />
        <Tab value="summary" label="Хураангуй" />
        <Tab value="products" label="Бараагаар" />
        <Tab value="categories" label="Ангиллаар" />
        <Tab value="trend" label="Тренд" />
        {canViewAllAgents ? <Tab value="ranking" label="Агентын жагсаалт" /> : null}
        {canViewAllAgents ? <Tab value="daily" label="Бүх агент (өдөр)" /> : null}
        {canViewAllAgents ? <Tab value="targets" label="Зорилт" /> : null}
        <Tab value="sales-report" label="Борлуулалт/Төлөвлөгөө" />
      </Tabs>

      {tab === 'dashboard' ? (
        <Card>
          <CardContent>
            {loading && !dashboard ? (
              <TableSkeleton />
            ) : dashboard ? (
              <>
                {/* Missed Targets Alerts */}
                {dashboard.missedTargets && dashboard.missedTargets.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Alert
                      severity="warning"
                      icon={<WarningIcon />}
                      sx={{ mb: 2 }}
                    >
                      <AlertTitle>Зорилт буурсан агентууд</AlertTitle>
                      {dashboard.missedTargets.length} агент(-үүд) өөрийн сарын зорилтоо хүрээгүй байна.
                    </Alert>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, ml: 4 }}>
                      {dashboard.missedTargets.slice(0, 5).map((agent) => (
                        <Alert
                          key={agent.agentId}
                          severity="error"
                          variant="outlined"
                          sx={{ minWidth: 200 }}
                        >
                          <AlertTitle>{agent.agentName}</AlertTitle>
                          <Typography variant="body2" color="text.secondary">
                            Зорилт: {formatCurrency(agent.target)} | Гүйцэтгэл: {formatCurrency(agent.actual)}
                          </Typography>
                          <Typography variant="body2" color="error.main" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                            Дутуу: {formatCurrency(agent.shortfall)}
                          </Typography>
                        </Alert>
                      ))}
                      {dashboard.missedTargets.length > 5 && (
                        <Alert severity="info" variant="outlined" sx={{ minWidth: 200 }}>
                          <Typography variant="body2">
                            +{dashboard.missedTargets.length - 5} бусад агент
                          </Typography>
                        </Alert>
                      )}
                    </Box>
                  </Box>
                )}

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                  <StatCard title="Нийт борлуулалт" value={formatCurrency(dashboard.totalAmount)} />
                  <StatCard title="Нийт хайрцаг" value={formatNumber(dashboard.totalBoxes)} />
                  <StatCard title="Нийт захиалга" value={formatNumber(dashboard.totalOrders)} />
                  <StatCard
                    title="Дундаж захиалга"
                    value={formatCurrency(dashboard.avgOrderValue)}
                  />
                </Box>

                {/* Historical Comparison Cards */}
                {dashboard.previousPeriodTotals && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                    {(() => {
                      const prev = dashboard.previousPeriodTotals!;
                      const currAmount = dashboard.totalAmount;
                      const prevAmount = prev.totalAmount;
                      const amountChange = prevAmount > 0 ? ((currAmount - prevAmount) / prevAmount) * 100 : 0;
                      const isPositive = amountChange >= 0;

                      const currBoxes = dashboard.totalBoxes;
                      const prevBoxes = prev.totalBoxes;
                      const boxesChange = prevBoxes > 0 ? ((currBoxes - prevBoxes) / prevBoxes) * 100 : 0;
                      const isBoxesPositive = boxesChange >= 0;

                      return (
                        <>
                          <Card
                            sx={{
                              flex: '1 1 200px',
                              minWidth: 180,
                              bgcolor: isPositive ? 'success.light' : 'error.light',
                              borderRadius: 2,
                            }}
                          >
                            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                              <Typography variant="caption" color="text.secondary">
                                Өмнөх хугацаатай харьцуулалт (борлуулалт)
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                {isPositive ? (
                                  <TrendingUpIcon color="success" fontSize="small" />
                                ) : (
                                  <TrendingDownIcon color="error" fontSize="small" />
                                )}
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                  {isPositive ? '+' : ''}{amountChange.toFixed(1)}%
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                Өмнөх: {formatCurrency(prevAmount)}
                              </Typography>
                            </CardContent>
                          </Card>
                          <Card
                            sx={{
                              flex: '1 1 200px',
                              minWidth: 180,
                              bgcolor: isBoxesPositive ? 'success.light' : 'error.light',
                              borderRadius: 2,
                            }}
                          >
                            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                              <Typography variant="caption" color="text.secondary">
                                Өмнөх хугацаатай харьцуулалт (хайрцаг)
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                {isBoxesPositive ? (
                                  <TrendingUpIcon color="success" fontSize="small" />
                                ) : (
                                  <TrendingDownIcon color="error" fontSize="small" />
                                )}
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                  {isBoxesPositive ? '+' : ''}{boxesChange.toFixed(1)}%
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                Өмнөх: {formatNumber(prevBoxes)}
                              </Typography>
                            </CardContent>
                          </Card>
                        </>
                      );
                    })()}
                  </Box>
                )}

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                  <StatCard
                    title="Топ агент"
                    value={dashboard.topAgent.name}
                    subtitle={formatCurrency(dashboard.topAgent.amount)}
                  />
                  <StatCard
                    title="Топ бараа"
                    value={dashboard.topProduct.name}
                    subtitle={formatCurrency(dashboard.topProduct.amount)}
                  />
                  <StatCard
                    title="Топ ангилал"
                    value={dashboard.topCategory.name}
                    subtitle={formatCurrency(dashboard.topCategory.amount)}
                  />
                </Box>

                <Typography variant="h6" gutterBottom>
                  Өдрийн хөдөлгөөн
                </Typography>
                {dashboard.dailyTrend.length === 0 ? (
                  <EmptyState message="Сонгосон хугацаанд хөдөлгөөн алга." />
                ) : (
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Огноо</TableCell>
                          <TableCell align="right">Борлуулалт</TableCell>
                          <TableCell align="right">Хайрцаг</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dashboard.dailyTrend.map((row) => (
                          <TableRow key={row.date}>
                            <TableCell>{row.date}</TableCell>
                            <TableCell align="right">{formatCurrency(row.amount)}</TableCell>
                            <TableCell align="right">{formatNumber(row.boxes)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </>
            ) : (
              <EmptyState message="Тоймын өгөгдөл олдсонгүй." />
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === 'summary' ? (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Нарийвчлал</InputLabel>
                <Select
                  label="Нарийвчлал"
                  value={summaryGranularity}
                  onChange={(event) =>
                    setSummaryGranularity(event.target.value as AgentKpiGranularity)
                  }
                >
                  <MenuItem value="day">Өдөр</MenuItem>
                  <MenuItem value="month">Сар</MenuItem>
                  <MenuItem value="year">Жил</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownloadIcon />}
                onClick={() => {
                  if (!summary) return;
                  const rows = summary.rows.map((r) => ({
                    bucket: r.bucket,
                    actualAmount: r.actualAmount,
                    actualBoxes: r.actualBoxes,
                    actualUnits: r.actualUnits,
                    targetAmount: r.targetAmount,
                    targetBoxQty: r.targetBoxQty,
                    achievementPercent: r.achievementPercent,
                  }));
                  void exportToExcel(rows, [
                    { header: 'Хугацаа', key: 'bucket' },
                    { header: 'Борлуулалт (₮)', key: 'actualAmount' },
                    { header: 'Хайрцаг', key: 'actualBoxes' },
                    { header: 'Ширхэг', key: 'actualUnits' },
                    { header: 'Зорилт (₮)', key: 'targetAmount' },
                    { header: 'Зорилт Хайрцаг', key: 'targetBoxQty' },
                    { header: 'Гүйцэтгэл %', key: 'achievementPercent', format: formatPercent },
                  ], `kpi-summary-${from}-${to}.xlsx`, 'Хураангуй');
                }}
              >
                Excel
              </Button>
            </Box>

            {loading && !summary ? (
              <TableSkeleton />
            ) : summary ? (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Timezone: {summary.timezone}
                </Typography>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {summaryColumns.map((column) => (
                          <TableCell key={column.key}>{column.label}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {summary.rows.map((row) => (
                        <TableRow key={row.bucket}>
                          <TableCell>{row.bucket}</TableCell>
                          <TableCell>{formatCurrency(row.actualAmount)}</TableCell>
                          <TableCell>{formatNumber(row.actualBoxes)}</TableCell>
                          <TableCell>{formatNumber(row.actualUnits)}</TableCell>
                          <TableCell>{formatCurrency(row.targetAmount)}</TableCell>
                          <TableCell>{formatNumber(row.targetBoxQty, 2)}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={formatPercent(row.achievementPercent)}
                              color={
                                row.achievementPercent != null && row.achievementPercent >= 100
                                  ? 'success'
                                  : 'default'
                              }
                            />
                          </TableCell>
                          {summaryGranularity === 'day' ? (
                            <TableCell>{formatPercent(row.runningAvgPercent)}</TableCell>
                          ) : null}
                        </TableRow>
                      ))}
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Нийт</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {formatCurrency(summary.totals.sumActualAmount)}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {formatNumber(summary.totals.sumActualBoxes)}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{formatNumber(summaryUnitTotal)}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {formatCurrency(summary.totals.sumTargetAmount)}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {formatNumber(summary.totals.sumTargetBoxQty, 2)}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {formatPercent(summary.totals.overallAchievementPercent)}
                        </TableCell>
                        {summaryGranularity === 'day' ? <TableCell>-</TableCell> : null}
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              </>
            ) : (
              <EmptyState message="Хураангуйн өгөгдөл алга." />
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === 'products' ? (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownloadIcon />}
                onClick={() => {
                  if (!products.length) return;
                  void exportToExcel(products.map((p) => ({
                    categoryName: p.categoryName,
                    productName: p.productName,
                    units: p.units,
                    boxes: p.boxes,
                    amount: p.amount,
                  })), [
                    { header: 'Ангилал', key: 'categoryName' },
                    { header: 'Барааны нэр', key: 'productName' },
                    { header: 'Ширхэг', key: 'units' },
                    { header: 'Хайрцаг', key: 'boxes' },
                    { header: 'Дүн (₮)', key: 'amount' },
                  ], `kpi-products-${from}-${to}.xlsx`, 'Бараагаар');
                }}
              >
                Excel
              </Button>
            </Box>
            {loading && products.length === 0 ? (
              <TableSkeleton />
            ) : products.length > 0 ? (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Ангилал</TableCell>
                      <TableCell>Бараа</TableCell>
                      <TableCell align="right">Ширхэг</TableCell>
                      <TableCell align="right">Хайрцаг</TableCell>
                      <TableCell align="right">Дүн</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.productId}>
                        <TableCell>{product.categoryName || '-'}</TableCell>
                        <TableCell>{product.productName}</TableCell>
                        <TableCell align="right">{formatNumber(product.units)}</TableCell>
                        <TableCell align="right">{formatNumber(product.boxes)}</TableCell>
                        <TableCell align="right">{formatCurrency(product.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <EmptyState message="Барааны KPI олдсонгүй." />
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === 'categories' ? (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownloadIcon />}
                onClick={() => {
                  if (!categories.length) return;
                  void exportToExcel(categories.map((c) => ({
                    categoryName: c.categoryName,
                    units: c.units,
                    boxes: c.boxes,
                    amount: c.amount,
                    contributionPct: c.contributionPct,
                  })), [
                    { header: 'Ангилал', key: 'categoryName' },
                    { header: 'Ширхэг', key: 'units' },
                    { header: 'Хайрцаг', key: 'boxes' },
                    { header: 'Дүн (₮)', key: 'amount' },
                    { header: 'Эзлэх хувь %', key: 'contributionPct', format: formatPercent },
                  ], `kpi-categories-${from}-${to}.xlsx`, 'Ангиллаар');
                }}
              >
                Excel
              </Button>
            </Box>
            {loading && categories.length === 0 ? (
              <TableSkeleton />
            ) : categories.length > 0 ? (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Ангилал</TableCell>
                      <TableCell align="right">Ширхэг</TableCell>
                      <TableCell align="right">Хайрцаг</TableCell>
                      <TableCell align="right">Дүн</TableCell>
                      <TableCell align="right">Эзлэх хувь</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.categoryId}>
                        <TableCell>{category.categoryName}</TableCell>
                        <TableCell align="right">{formatNumber(category.units)}</TableCell>
                        <TableCell align="right">{formatNumber(category.boxes)}</TableCell>
                        <TableCell align="right">{formatCurrency(category.amount)}</TableCell>
                        <TableCell align="right">{formatPercent(category.contributionPct)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <EmptyState message="Ангиллын KPI олдсонгүй." />
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === 'trend' ? (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Тренд</InputLabel>
                <Select
                  label="Тренд"
                  value={trendGranularity}
                  onChange={(event) => setTrendGranularity(event.target.value as 'day' | 'month')}
                >
                  <MenuItem value="day">Өдөр</MenuItem>
                  <MenuItem value="month">Сар</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownloadIcon />}
                onClick={() => {
                  if (!trend.length) return;
                  void exportToExcel(trend.map((r) => ({
                    period: r.period,
                    amount: r.amount,
                    boxes: r.boxes,
                    orders: r.orders,
                    target: r.target,
                    achievementPct: r.achievementPct,
                  })), [
                    { header: 'Хугацаа', key: 'period' },
                    { header: 'Борлуулалт (₮)', key: 'amount' },
                    { header: 'Хайрцаг', key: 'boxes' },
                    { header: 'Захиалга', key: 'orders' },
                    { header: 'Зорилт (₮)', key: 'target' },
                    { header: 'Гүйцэтгэл %', key: 'achievementPct', format: formatPercent },
                  ], `kpi-trend-${from}-${to}.xlsx`, 'Тренд');
                }}
              >
                Excel
              </Button>
            </Box>

            {loading && trend.length === 0 ? (
              <TableSkeleton />
            ) : trend.length > 0 ? (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Хугацаа</TableCell>
                      <TableCell align="right">Борлуулалт</TableCell>
                      <TableCell align="right">Хайрцаг</TableCell>
                      <TableCell align="right">Захиалга</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trend.map((row) => (
                      <TableRow key={row.period}>
                        <TableCell>{row.period}</TableCell>
                        <TableCell align="right">{formatCurrency(row.amount)}</TableCell>
                        <TableCell align="right">{formatNumber(row.boxes)}</TableCell>
                        <TableCell align="right">{formatNumber(row.orders)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <EmptyState message="Трендийн өгөгдөл алга." />
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === 'ranking' && canViewAllAgents ? (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Эрэмбэ</InputLabel>
                <Select
                  label="Эрэмбэ"
                  value={rankingSort}
                  onChange={(event) => setRankingSort(event.target.value as RankingSort)}
                >
                  <MenuItem value="amount">Дүнгээр</MenuItem>
                  <MenuItem value="boxes">Хайрцгаар</MenuItem>
                  <MenuItem value="orders">Захиалгаар</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownloadIcon />}
                onClick={() => {
                  if (!ranking.length) return;
                  void exportToExcel(ranking.map((r) => ({
                    rank: r.rank,
                    agentName: r.agentName,
                    amount: r.amount,
                    boxes: r.boxes,
                    orders: r.orders,
                    achievementPct: r.achievementPct,
                  })), [
                    { header: '#', key: 'rank' },
                    { header: 'Агент', key: 'agentName' },
                    { header: 'Борлуулалт (₮)', key: 'amount' },
                    { header: 'Хайрцаг', key: 'boxes' },
                    { header: 'Захиалга', key: 'orders' },
                    { header: 'Гүйцэтгэл %', key: 'achievementPct', format: formatPercent },
                  ], `kpi-ranking-${from}-${to}.xlsx`, 'Агентын жагсаалт');
                }}
              >
                Excel
              </Button>
            </Box>

            {loading && ranking.length === 0 ? (
              <TableSkeleton />
            ) : ranking.length > 0 ? (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Агент</TableCell>
                      <TableCell align="right">Борлуулалт</TableCell>
                      <TableCell align="right">Хайрцаг</TableCell>
                      <TableCell align="right">Захиалга</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ranking.map((row) => (
                      <TableRow key={row.agentId}>
                        <TableCell>{row.rank}</TableCell>
                        <TableCell>{row.agentName}</TableCell>
                        <TableCell align="right">{formatCurrency(row.amount)}</TableCell>
                        <TableCell align="right">{formatNumber(row.boxes)}</TableCell>
                        <TableCell align="right">{formatNumber(row.orders)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <EmptyState message="Эрэмбийн өгөгдөл алга." />
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === 'daily' && canViewAllAgents ? (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                size="small"
                type="date"
                label="Огноо"
                InputLabelProps={{ shrink: true }}
                value={multiDate}
                onChange={(event) => setMultiDate(event.target.value)}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownloadIcon />}
                onClick={() => {
                  if (!multiAgents.length) return;
                  void exportToExcel(multiAgents.map((r) => ({
                    agentName: r.agentName,
                    amount: r.amount,
                    boxes: r.boxes,
                    units: r.units,
                  })), [
                    { header: 'Агент', key: 'agentName' },
                    { header: 'Дүн (₮)', key: 'amount' },
                    { header: 'Хайрцаг', key: 'boxes' },
                    { header: 'Ширхэг', key: 'units' },
                  ], `kpi-daily-${multiDate}.xlsx`, 'Өдрийн');
                }}
              >
                Excel
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownloadIcon />}
                onClick={() => {
                  if (!multiAgents.length) return;
                  const csvRows = [
                    ['Агент', 'Дүн (₮)', 'Хайрцаг', 'Ширхэг'],
                    ...multiAgents.map((r) => [r.agentName, String(r.amount), String(r.boxes), String(r.units)]),
                  ];
                  const csvContent = csvRows.map((row) => row.join(',')).join('\n');
                  const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `kpi-daily-${multiDate}.csv`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                CSV
              </Button>
            </Box>

            {loading && multiAgents.length === 0 ? (
              <TableSkeleton />
            ) : multiAgents.length > 0 ? (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Агент</TableCell>
                      <TableCell align="right">Дүн</TableCell>
                      <TableCell align="right">Хайрцаг</TableCell>
                      <TableCell align="right">Ширхэг</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {multiAgents.map((row) => (
                      <TableRow key={row.agentId}>
                        <TableCell>{row.agentName}</TableCell>
                        <TableCell align="right">{formatCurrency(row.amount)}</TableCell>
                        <TableCell align="right">{formatNumber(row.boxes)}</TableCell>
                        <TableCell align="right">{formatNumber(row.units)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <EmptyState message="Сонгосон өдөрт агентын мэдээлэл алга." />
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === 'targets' && canViewAllAgents ? (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateTarget}>
                Зорилт нэмэх
              </Button>
              <Button variant="outlined" onClick={() => void fetchTargets(false)}>
                Дахин ачаалах
              </Button>
            </Box>

            {loading && targets.length === 0 ? (
              <TableSkeleton />
            ) : targets.length > 0 ? (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Төрөл</TableCell>
                      <TableCell>Эхлэх огноо</TableCell>
                      <TableCell align="right">Дүн</TableCell>
                      <TableCell align="right">Хайрцаг</TableCell>
                      <TableCell align="right" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {targets.map((target) => (
                      <TableRow key={target.id}>
                        <TableCell>{target.periodType}</TableCell>
                        <TableCell>{target.periodStart}</TableCell>
                        <TableCell align="right">{target.targetAmount}</TableCell>
                        <TableCell align="right">{target.targetBoxQty ?? '-'}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => openEditTarget(target)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteId(target.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <EmptyState message="Зорилтын мэдээлэл алга." />
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === 'sales-report' ? (
        <Card>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                mb: 2,
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Хугацаа</InputLabel>
                  <Select
                    label="Хугацаа"
                    value={salesGranularity}
                    onChange={(event) => setSalesGranularity(event.target.value as SalesByBrandGranularity)}
                  >
                    <MenuItem value="day">Өдөр</MenuItem>
                    <MenuItem value="month">Сар</MenuItem>
                    <MenuItem value="year">Он</MenuItem>
                  </Select>
                </FormControl>
                <Typography variant="body2" color="text.secondary">
                  Ажилтан, огноо сонгоод хайхад supplier → product хүснэгт гарна.
                </Typography>
              </Stack>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FileDownloadIcon />}
                  onClick={() => {
                  if (!salesByBrand) return;
                  const rows: {
                    category: string;
                    supplier: string;
                    product: string;
                    [key: string]: number | string;
                  }[] = [];
                  salesReportGroups.forEach((brand) => {
                    brand.suppliers.forEach((supplier) => {
                      supplier.products.forEach((product) => {
                        const row: {
                          category: string;
                          supplier: string;
                          product: string;
                          [key: string]: number | string;
                        } = {
                          category: brand.categoryName,
                          supplier: supplier.supplierName,
                          product: product.productName,
                        };
                        salesByBrand.periods.forEach((period) => {
                          const periodData = product.periodData.find((p) => p.key === period.key);
                          row[`boxes_${period.key}`] = periodData?.boxes ?? 0;
                          row[`amount_${period.key}`] = periodData?.amount ?? 0;
                        });
                        row.totalBoxes = product.totalBoxes;
                        row.totalAmount = product.totalAmount;
                        rows.push(row);
                      });
                    });
                  });
                  const columns: { header: string; key: string; format?: (val: unknown) => string }[] = [
                    { header: 'Ангилал', key: 'category' },
                    { header: 'Нийлүүлэгч', key: 'supplier' },
                    { header: 'Бараа', key: 'product' },
                  ];
                  salesByBrand.periods.forEach((period) => {
                    columns.push({ header: `${period.label} Тоо`, key: `boxes_${period.key}` });
                    columns.push({
                      header: `${period.label} Дүн`,
                      key: `amount_${period.key}`,
                      format: (val) => formatCurrency(val as number | null | undefined),
                    });
                  });
                  columns.push({ header: 'Нийт Тоо', key: 'totalBoxes' });
                  columns.push({
                    header: 'Нийт Дүн',
                    key: 'totalAmount',
                    format: (val) => formatCurrency(val as number | null | undefined),
                  });
                  void exportToExcel(
                    rows,
                    columns as { header: string; key: string; format?: (val: unknown) => string }[],
                    `sales-report-${from}-${to}-${salesGranularity}.xlsx`,
                    'Agent KPI'
                  );
                }}
              >
                Excel
              </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                {selectedAgentName ? `Сонгосон ажилтан: ${selectedAgentName}. ` : 'Ажилтан сонгоно уу. '}
                {from} - {to} · Бүлэглэл: {salesGranularity === 'day' ? 'Өдөр' : salesGranularity === 'month' ? 'Сар' : 'Он'}
              </Typography>
            </Alert>

            {loading && !salesByBrand ? (
              <TableSkeleton />
            ) : salesByBrand ? (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Нийт {salesReportStats.categories} ангилал · {salesReportStats.suppliers} нийлүүлэгч ·{' '}
                    {salesReportStats.products} бараа
                  </Typography>
                </Box>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 1180 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Нийлүүлэгч</TableCell>
                        <TableCell>Бараа</TableCell>
                        {salesByBrand.periods.map((period) => (
                          <TableCell key={period.key} align="center" colSpan={2} sx={{ fontWeight: 700 }}>
                            {period.label}
                          </TableCell>
                        ))}
                        <TableCell align="center" colSpan={2} sx={{ fontWeight: 700, bgcolor: 'action.hover' }}>
                          Нийт
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell />
                        <TableCell />
                        {salesByBrand.periods.flatMap((period) => [
                          <TableCell
                            key={`boxes-${period.key}`}
                            align="right"
                            sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
                          >
                            Тоо
                          </TableCell>,
                          <TableCell
                            key={`amount-${period.key}`}
                            align="right"
                            sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
                          >
                            Дүн
                          </TableCell>,
                        ])}
                        <TableCell
                          align="right"
                          sx={{ fontSize: '0.75rem', color: 'text.secondary', bgcolor: 'action.hover' }}
                        >
                          Тоо
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontSize: '0.75rem', color: 'text.secondary', bgcolor: 'action.hover' }}
                        >
                          Дүн
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {salesReportGroups.map((brand) => (
                        <Fragment key={`brand-${brand.categoryId}`}>
                          <TableRow sx={{ bgcolor: 'grey.100' }}>
                            <TableCell colSpan={2 + salesByBrand.periods.length * 2 + 2} sx={{ fontWeight: 700 }}>
                              {brand.categoryName}
                            </TableCell>
                          </TableRow>

                          {brand.suppliers.map((supplier) => (
                            <Fragment key={`supplier-block-${brand.categoryId}-${supplier.supplierId}`}>
                              <TableRow sx={{ bgcolor: 'primary.main' }}>
                                <TableCell sx={{ fontWeight: 700, color: 'primary.contrastText' }}>
                                  {supplier.supplierName}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, color: 'primary.contrastText' }}>
                                  Нийт
                                </TableCell>
                                {salesByBrand.periods.map((period) => {
                                  const data = supplier.periodData?.find((p) => p.key === period.key);
                                  return (
                                    <Fragment key={`supplier-${supplier.supplierId}-${period.key}`}>
                                      <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.contrastText' }}>
                                        {formatNumber(data?.boxes ?? 0)}
                                      </TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.contrastText' }}>
                                        {formatCurrency(data?.amount ?? 0)}
                                      </TableCell>
                                    </Fragment>
                                  );
                                })}
                                <TableCell
                                  align="right"
                                  sx={{ fontWeight: 700, bgcolor: 'primary.dark', color: 'primary.contrastText' }}
                                >
                                  {formatNumber(supplier.totalBoxes)}
                                </TableCell>
                                <TableCell
                                  align="right"
                                  sx={{ fontWeight: 700, bgcolor: 'primary.dark', color: 'primary.contrastText' }}
                                >
                                  {formatCurrency(supplier.totalAmount)}
                                </TableCell>
                              </TableRow>

                              {supplier.products.map((product) => (
                                <TableRow
                                  key={`product-${product.productId}`}
                                  sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                                >
                                  <TableCell sx={{ pl: 4, color: 'text.secondary' }}>
                                    {supplier.supplierName}
                                  </TableCell>
                                  <TableCell sx={{ pl: 4 }}>{product.productName}</TableCell>
                                  {salesByBrand.periods.map((period) => {
                                    const data = product.periodData.find((p) => p.key === period.key);
                                    return (
                                      <Fragment key={`product-${product.productId}-${period.key}`}>
                                        <TableCell align="right">{formatNumber(data?.boxes ?? 0)}</TableCell>
                                        <TableCell align="right">{formatCurrency(data?.amount ?? 0)}</TableCell>
                                      </Fragment>
                                    );
                                  })}
                                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                                    {formatNumber(product.totalBoxes)}
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                                    {formatCurrency(product.totalAmount)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </Fragment>
                          ))}
                        </Fragment>
                      ))}
                      <TableRow sx={{ bgcolor: 'grey.800', fontWeight: 700 }}>
                        <TableCell sx={{ color: 'white' }}>НИЙТ ДҮН</TableCell>
                        <TableCell sx={{ color: 'white' }} />
                        {salesByBrand.periods.map((period) => {
                          const data = salesByBrand.grandPeriodData?.find((p) => p.key === period.key);
                          return (
                            <Fragment key={`grand-${period.key}`}>
                              <TableCell align="right" sx={{ color: 'white' }}>
                                {formatNumber(data?.boxes ?? 0)}
                              </TableCell>
                              <TableCell align="right" sx={{ color: 'white' }}>
                                {formatCurrency(data?.amount ?? 0)}
                              </TableCell>
                            </Fragment>
                          );
                        })}
                        <TableCell align="right" sx={{ color: 'white' }}>
                          {formatNumber(salesByBrand.grandTotalBoxes)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'white' }}>
                          {formatCurrency(salesByBrand.grandTotalAmount)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              </>
            ) : (
              <EmptyState message="Борлуулалтын мэдээлэл олдсонгүй." />
            )}
          </CardContent>
        </Card>
      ) : null}

      <Modal
        open={targetModalOpen}
        onClose={() => setTargetModalOpen(false)}
        title={editingTarget ? 'Зорилт засах' : 'Зорилт нэмэх'}
        actions={
          <>
            <Button onClick={() => setTargetModalOpen(false)} color="inherit">
              Болих
            </Button>
            <Button variant="contained" onClick={() => void saveTarget()}>
              Хадгалах
            </Button>
          </>
        }
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {editingTarget ? (
            <Typography variant="body2" color="text.secondary">
              {editingTarget.periodType} · {editingTarget.periodStart}
            </Typography>
          ) : (
            <>
              <FormControl size="small">
                <InputLabel>Төрөл</InputLabel>
                <Select
                  label="Төрөл"
                  value={form.periodType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      periodType: event.target.value as TargetFormState['periodType'],
                    }))
                  }
                >
                  <MenuItem value="DAY">Өдөр</MenuItem>
                  <MenuItem value="MONTH">Сар</MenuItem>
                  <MenuItem value="YEAR">Жил</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                type="date"
                label="Эхлэх огноо"
                InputLabelProps={{ shrink: true }}
                value={form.periodStart}
                onChange={(event) =>
                  setForm((current) => ({ ...current, periodStart: event.target.value }))
                }
              />
            </>
          )}

          <TextField
            size="small"
            label="Зорилтын дүн"
            value={form.targetAmount}
            onChange={(event) =>
              setForm((current) => ({ ...current, targetAmount: event.target.value }))
            }
          />
          <TextField
            size="small"
            label="Зорилтот хайрцаг"
            value={form.targetBoxQty}
            onChange={(event) =>
              setForm((current) => ({ ...current, targetBoxQty: event.target.value }))
            }
          />
        </Box>
      </Modal>

      <ConfirmDialog
        open={deleteId != null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => void confirmDeleteTarget()}
        title="Зорилт устгах"
        message="Энэ зорилтыг устгахдаа итгэлтэй байна уу?"
        confirmText="Устгах"
        cancelText="Болих"
        danger
      />
    </Box>
  );
}
