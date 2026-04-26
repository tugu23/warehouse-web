import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import toast from 'react-hot-toast';
import { agentKpiApi, employeesApi } from '../../api';
import {
  AgentKpiGranularity,
  AgentKpiProductRow,
  AgentKpiSummaryData,
  AgentKpiSummaryRow,
  AgentKpiTarget,
  AgentKpiMultiAgentRow,
  Employee,
  CreateAgentKpiTargetRequest,
} from '../../types';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { TableSkeleton } from '../../components/LoadingSkeletons';

function fmtNum(n: number | null | undefined, frac = 2) {
  if (n == null || Number.isNaN(n)) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: frac, minimumFractionDigits: 0 });
}

function fmtPct(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return '—';
  return `${n.toFixed(2)}%`;
}

interface ProductRow {
  brand: string;
  productName: string;
  totalBoxes: number;
  totalAmount: number;
}

interface AgentGoal {
  goal: number;
  paid: number;
  percent: number;
}

function AgentKpiReportTab({ effectiveAgentId }: { effectiveAgentId: number | null }) {
  const [from, setFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [productRows, setProductRows] = useState<ProductRow[]>([]);
  const [agentGoal, setAgentGoal] = useState<AgentGoal | null>(null);

  const fetchReport = async () => {
    if (!effectiveAgentId) {
      toast.error('Ажилтан сонгоно уу');
      return;
    }
    setLoading(true);
    try {
      const res = await agentKpiApi.getByProduct({ from, to, agentId: effectiveAgentId });
      const products = res.data.data?.products || [];

      const grouped = new Map<string, ProductRow>();
      products.forEach((p) => {
        const key = `${p.categoryName || 'Бусад'}_${p.productName}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            brand: p.categoryName || 'Бусад',
            productName: p.productName,
            totalBoxes: 0,
            totalAmount: 0,
          });
        }
        const row = grouped.get(key)!;
        row.totalBoxes += p.boxes;
        row.totalAmount += p.amount;
      });

      setProductRows(Array.from(grouped.values()));

      const summaryRes = await agentKpiApi.getSummary({
        from,
        to,
        agentId: effectiveAgentId,
        granularity: 'month',
      });
      const summary = summaryRes.data.data;
      if (summary) {
        const totalGoal = summary.totals.sumTargetAmount || 0;
        const totalPaid = summary.totals.sumActualAmount || 0;
        const percent = totalGoal > 0 ? (totalPaid / totalGoal) * 100 : 0;
        setAgentGoal({ goal: totalGoal, paid: totalPaid, percent });
      }
    } catch (error) {
      toast.error('Тайлан татахад алдаа гарлаа');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          type="date"
          label="Эхлэх"
          InputLabelProps={{ shrink: true }}
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <TextField
          size="small"
          type="date"
          label="Дуусах"
          InputLabelProps={{ shrink: true }}
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <Button variant="contained" onClick={fetchReport} disabled={loading}>
          Ачаалах
        </Button>
      </Box>

      {agentGoal && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Зорилтын биелэлт
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Goal (Зорилт)
                </Typography>
                <Typography variant="h6">{fmtNum(agentGoal.goal, 2)} ₮</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Amount (Төлөгдсөн)
                </Typography>
                <Typography variant="h6">{fmtNum(agentGoal.paid, 2)} ₮</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Биелэлт
                </Typography>
                <Chip
                  label={fmtPct(agentGoal.percent)}
                  color={agentGoal.percent >= 100 ? 'success' : 'warning'}
                  sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          {loading ? (
            <TableSkeleton />
          ) : productRows.length > 0 ? (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }}>
                      Байраа
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }}>
                      Бараа
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      Box
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }}
                    >
                      Amount
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productRows.map((row, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>
                        {row.brand}
                      </TableCell>
                      <TableCell sx={{ borderRight: 1, borderColor: 'divider' }}>
                        {row.productName}
                      </TableCell>
                      <TableCell align="right">{fmtNum(row.totalBoxes, 0)}</TableCell>
                      <TableCell align="right" sx={{ borderRight: 1, borderColor: 'divider' }}>
                        {fmtNum(row.totalAmount, 2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ bgcolor: 'action.hover', fontWeight: 'bold' }}>
                    <TableCell
                      colSpan={2}
                      sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }}
                    >
                      Total
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {fmtNum(
                        productRows.reduce((sum, r) => sum + r.totalBoxes, 0),
                        0
                      )}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 'bold', borderRight: 1, borderColor: 'divider' }}
                    >
                      {fmtNum(
                        productRows.reduce((sum, r) => sum + r.totalAmount, 0),
                        2
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Typography color="text.secondary">Өгөгдөл байхгүй</Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default function AgentKpiPage() {
  const { user, canManage } = useAuth();
  const [tab, setTab] = useState(0);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | ''>('');
  const [from, setFrom] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  );
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [granularity, setGranularity] = useState<AgentKpiGranularity>('day');
  const [summary, setSummary] = useState<AgentKpiSummaryData | null>(null);
  const [products, setProducts] = useState<AgentKpiProductRow[]>([]);
  const [multiDate, setMultiDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [multiAgents, setMultiAgents] = useState<AgentKpiMultiAgentRow[]>([]);
  const [targets, setTargets] = useState<AgentKpiTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [targetModal, setTargetModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingTarget, setEditingTarget] = useState<AgentKpiTarget | null>(null);
  const [form, setForm] = useState<CreateAgentKpiTargetRequest>({
    employeeId: 0,
    periodType: 'DAY',
    periodStart: format(new Date(), 'yyyy-MM-dd'),
    targetAmount: '',
    targetBoxQty: '',
  });

  const effectiveAgentId = useMemo(() => {
    if (canManage()) {
      return selectedAgentId === '' ? null : Number(selectedAgentId);
    }
    return user?.id ?? null;
  }, [canManage, selectedAgentId, user?.id]);

  useEffect(() => {
    employeesApi
      .getAll({ limit: 500 })
      .then((r) => setEmployees(r.data.data?.employees || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const first = employees[0];
    if (canManage() && first && selectedAgentId === '') {
      setSelectedAgentId(first.id);
    }
  }, [canManage, employees, selectedAgentId]);

  const fetchSummary = async () => {
    if (!effectiveAgentId) {
      toast.error('Ажилтан сонгоно уу');
      return;
    }
    setLoading(true);
    try {
      const res = await agentKpiApi.getSummary({
        from,
        to,
        agentId: effectiveAgentId,
        granularity,
      });
      setSummary(res.data.data ?? null);
    } catch {
      toast.error('KPI татахад алдаа');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!effectiveAgentId) {
      toast.error('Ажилтан сонгоно уу');
      return;
    }
    setLoading(true);
    try {
      const res = await agentKpiApi.getByProduct({ from, to, agentId: effectiveAgentId });
      setProducts(res.data.data?.products || []);
    } catch {
      toast.error('Барааны KPI татахад алдаа');
    } finally {
      setLoading(false);
    }
  };

  const fetchMulti = async () => {
    setLoading(true);
    try {
      const res = await agentKpiApi.getMultiAgentDaily({ date: multiDate });
      setMultiAgents(res.data.data?.agents || []);
    } catch {
      toast.error('Өдрийн нийлбэр татахад алдаа');
    } finally {
      setLoading(false);
    }
  };

  const fetchTargets = async () => {
    if (!effectiveAgentId) return;
    try {
      const res = await agentKpiApi.getTargets(effectiveAgentId);
      setTargets(res.data.data?.targets || []);
    } catch {
      toast.error('Зорилт татахад алдаа');
    }
  };

  useEffect(() => {
    if (tab === 3 && effectiveAgentId) fetchTargets();
  }, [tab, effectiveAgentId, fetchTargets]);

  const openCreateTarget = () => {
    if (!effectiveAgentId) {
      toast.error('Эхлээд ажилтан сонгоно уу');
      return;
    }
    setEditingTarget(null);
    setForm({
      employeeId: effectiveAgentId,
      periodType: 'DAY',
      periodStart: format(new Date(), 'yyyy-MM-dd'),
      targetAmount: '',
      targetBoxQty: '',
    });
    setTargetModal(true);
  };

  const openEditTarget = (t: AgentKpiTarget) => {
    setEditingTarget(t);
    setForm({
      employeeId: t.employeeId,
      periodType: t.periodType,
      periodStart: t.periodStart,
      targetAmount: t.targetAmount,
      targetBoxQty: t.targetBoxQty ?? '',
    });
    setTargetModal(true);
  };

  const saveTarget = async () => {
    try {
      if (editingTarget) {
        await agentKpiApi.updateTarget(editingTarget.id, {
          targetAmount: form.targetAmount,
          targetBoxQty:
            form.targetBoxQty === '' || form.targetBoxQty == null ? null : form.targetBoxQty,
        });
        toast.success('Зорилт шинэчлэгдлээ');
      } else {
        await agentKpiApi.createTarget({
          ...form,
          targetBoxQty:
            form.targetBoxQty === '' || form.targetBoxQty == null ? undefined : form.targetBoxQty,
        });
        toast.success('Зорилт үүслээ');
      }
      setTargetModal(false);
      fetchTargets();
    } catch {
      toast.error('Хадгалахад алдаа');
    }
  };

  const confirmDelete = async () => {
    if (deleteId == null) return;
    try {
      await agentKpiApi.deleteTarget(deleteId);
      toast.success('Устгагдлаа');
      setDeleteId(null);
      fetchTargets();
    } catch {
      toast.error('Устгахад алдаа');
    }
  };

  const summaryColumns: {
    key: keyof AgentKpiSummaryRow | 'extra';
    label: string;
    width?: number;
  }[] = [
    { key: 'bucket', label: 'Хугацаа' },
    { key: 'actualAmount', label: 'Борлуулалт (₮)' },
    { key: 'actualBoxes', label: 'Хайрцаг' },
    { key: 'actualUnits', label: 'Ширхэг' },
    { key: 'targetAmount', label: 'Зорилт (₮)' },
    { key: 'achievementPercent', label: '%' },
    { key: 'runningAvgPercent', label: 'Накопитель дундаж %' },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Агент KPI
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Борлуулалт: зөвхөн <strong>Төлбөр төлөгдсөн (Paid)</strong> захиалга. Хайрцаг: ширхэг ÷{' '}
        <strong>unitsPerBox</strong> (бүхэл). Огноо: <strong>APP_TIMEZONE</strong> (сервер).
      </Alert>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
        {canManage() && (
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Ажилтан</InputLabel>
            <Select
              label="Ажилтан"
              value={selectedAgentId === '' ? '' : String(selectedAgentId)}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedAgentId(v === '' ? '' : Number(v));
              }}
            >
              {employees.map((e) => (
                <MenuItem key={e.id} value={String(e.id)}>
                  {e.name} ({e.role?.name})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <TextField
          size="small"
          type="date"
          label="Эхлэх"
          InputLabelProps={{ shrink: true }}
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <TextField
          size="small"
          type="date"
          label="Дуусах"
          InputLabelProps={{ shrink: true }}
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Нарийвчлал</InputLabel>
          <Select
            label="Нарийвчлал"
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as AgentKpiGranularity)}
          >
            <MenuItem value="day">Өдөр</MenuItem>
            <MenuItem value="month">Сар</MenuItem>
            <MenuItem value="year">Жил</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Хураангуй" />
        <Tab label="Бараа бүтээгдэхүүн" />
        {canManage() && <Tab label="Бүх агент (өдөр)" />}
        {canManage() && <Tab label="Зорилт" />}
        <Tab label="Тайлан" />
      </Tabs>

      {tab === 0 && (
        <Card>
          <CardContent>
            <Box sx={{ mb: 2 }}>
              <Button variant="contained" onClick={fetchSummary} disabled={loading}>
                Ачаалах
              </Button>
            </Box>
            {loading && !summary ? (
              <TableSkeleton />
            ) : summary ? (
              <>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Timezone: {summary.timezone} · Агент #{summary.agentId}
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {summaryColumns.map((c) => (
                        <TableCell key={String(c.key)}>{c.label}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.rows.map((r) => (
                      <TableRow key={r.bucket}>
                        <TableCell>{r.bucket}</TableCell>
                        <TableCell>{fmtNum(r.actualAmount)}</TableCell>
                        <TableCell>{fmtNum(r.actualBoxes, 0)}</TableCell>
                        <TableCell>{fmtNum(r.actualUnits, 0)}</TableCell>
                        <TableCell>{fmtNum(r.targetAmount)}</TableCell>
                        <TableCell>{fmtPct(r.achievementPercent)}</TableCell>
                        <TableCell>{fmtPct(r.runningAvgPercent)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ fontWeight: 'bold', bgcolor: 'action.hover' }}>
                      <TableCell>Нийлбэр</TableCell>
                      <TableCell>{fmtNum(summary.totals.sumActualAmount)}</TableCell>
                      <TableCell>{fmtNum(summary.totals.sumActualBoxes, 0)}</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell>{fmtNum(summary.totals.sumTargetAmount)}</TableCell>
                      <TableCell>{fmtPct(summary.totals.overallAchievementPercent)}</TableCell>
                      <TableCell>—</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </>
            ) : (
              <Typography color="text.secondary">Өгөгдөл байхгүй</Typography>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Card>
          <CardContent>
            <Button variant="contained" onClick={fetchProducts} disabled={loading} sx={{ mb: 2 }}>
              Ачаалах
            </Button>
            {loading && products.length === 0 ? (
              <TableSkeleton />
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ангилал</TableCell>
                    <TableCell>Бараа</TableCell>
                    <TableCell align="right">Ширхэг</TableCell>
                    <TableCell align="right">Хайрцаг</TableCell>
                    <TableCell align="right">Дүн (₮)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.productId}>
                      <TableCell>{p.categoryName || '—'}</TableCell>
                      <TableCell>{p.productName}</TableCell>
                      <TableCell align="right">{fmtNum(p.units, 0)}</TableCell>
                      <TableCell align="right">{fmtNum(p.boxes, 0)}</TableCell>
                      <TableCell align="right">{fmtNum(p.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 2 && canManage() && (
        <Card>
          <CardContent>
            <TextField
              size="small"
              type="date"
              label="Огноо"
              InputLabelProps={{ shrink: true }}
              value={multiDate}
              onChange={(e) => setMultiDate(e.target.value)}
              sx={{ mr: 2, mb: 2 }}
            />
            <Button variant="contained" onClick={fetchMulti} disabled={loading}>
              Ачаалах
            </Button>
            <Table size="small" sx={{ mt: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Агент</TableCell>
                  <TableCell align="right">Дүн (₮)</TableCell>
                  <TableCell align="right">Хайрцаг</TableCell>
                  <TableCell align="right">Ширхэг</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {multiAgents.map((a) => (
                  <TableRow key={a.agentId}>
                    <TableCell>{a.agentName}</TableCell>
                    <TableCell align="right">{fmtNum(a.amount)}</TableCell>
                    <TableCell align="right">{fmtNum(a.boxes, 0)}</TableCell>
                    <TableCell align="right">{fmtNum(a.units, 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {tab === 3 && canManage() && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateTarget}>
                Зорилт нэмэх
              </Button>
              <Button variant="outlined" onClick={fetchTargets}>
                Сэргээх
              </Button>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Төрөл</TableCell>
                  <TableCell>Эхлэх өдөр</TableCell>
                  <TableCell align="right">Дүн (₮)</TableCell>
                  <TableCell align="right">Хайрцаг зорилт</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {targets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.periodType}</TableCell>
                    <TableCell>{t.periodStart}</TableCell>
                    <TableCell align="right">{t.targetAmount}</TableCell>
                    <TableCell align="right">{t.targetBoxQty ?? '—'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEditTarget(t)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteId(t.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {tab === 4 && <AgentKpiReportTab effectiveAgentId={effectiveAgentId} />}

      <Modal
        open={targetModal}
        onClose={() => setTargetModal(false)}
        title={editingTarget ? 'Зорилт засах' : 'Зорилт нэмэх'}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1, minWidth: 320 }}>
          {editingTarget && (
            <Typography variant="body2" color="text.secondary">
              {editingTarget.periodType} · {editingTarget.periodStart}
            </Typography>
          )}
          {!editingTarget && (
            <>
              <FormControl size="small">
                <InputLabel>Төрөл</InputLabel>
                <Select
                  label="Төрөл"
                  value={form.periodType}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      periodType: e.target.value as CreateAgentKpiTargetRequest['periodType'],
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
                onChange={(e) => setForm((f) => ({ ...f, periodStart: e.target.value }))}
              />
            </>
          )}
          <TextField
            size="small"
            label="Зорилт (төгрөг)"
            value={form.targetAmount}
            onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
          />
          <TextField
            size="small"
            label="Хайрцаг зорилт (сонголттой)"
            value={form.targetBoxQty ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, targetBoxQty: e.target.value }))}
          />
          <Button variant="contained" onClick={saveTarget}>
            Хадгалах
          </Button>
        </Box>
      </Modal>

      <ConfirmDialog
        open={deleteId != null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Зорилт устгах"
        message="Энэ зорилтыг устгахдаа итгэлтэй байна уу?"
        confirmText="Устгах"
        cancelText="Болих"
        danger
      />
    </Box>
  );
}
