import { useState, useEffect } from 'react';
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
  Chip,
} from '@mui/material';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { salesKpiApi, employeesApi, productsApi } from '../../api';
import { Employee, Product, SalesKpiData } from '../../types';
import { TableSkeleton } from '../../components/LoadingSkeletons';

type Granularity = 'day' | 'week' | 'month' | 'year';

function fmtNum(n: number | null | undefined, frac = 2) {
  if (n == null || Number.isNaN(n)) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: frac, minimumFractionDigits: 0 });
}

export default function SalesKpiPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | ''>('');
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [from, setFrom] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  );
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [data, setData] = useState<SalesKpiData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    employeesApi
      .getAll({ limit: 500 })
      .then((r) => setEmployees(r.data.data?.employees || []))
      .catch(() => {});

    productsApi
      .getAll({ limit: 1000 })
      .then((r) => setProducts(r.data.data?.products || []))
      .catch(() => {});
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await salesKpiApi.getTransactions({
        from,
        to,
        agentId: selectedAgentId === '' ? undefined : selectedAgentId,
        productId: selectedProductId === '' ? undefined : selectedProductId,
        granularity,
      });
      setData(res.data.data ?? null);
    } catch {
      toast.error('Өгөгдөл татахад алдаа гарлаа');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const granularityLabel = {
    day: 'Өдөр',
    week: 'Долоо хоног',
    month: 'Сар',
    year: 'Жил',
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Борлуулалтын KPI
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Зөвхөн <strong>Төлбөр төлөгдсөн (Paid)</strong> захиалгын мэдээлэл харагдана.
      </Alert>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Борлуулагч</InputLabel>
          <Select
            label="Борлуулагч"
            value={selectedAgentId === '' ? '' : String(selectedAgentId)}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedAgentId(v === '' ? '' : Number(v));
            }}
          >
            <MenuItem value="">Бүгд</MenuItem>
            {employees.map((e) => (
              <MenuItem key={e.id} value={String(e.id)}>
                {e.name} ({e.role?.name})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Бараа</InputLabel>
          <Select
            label="Бараа"
            value={selectedProductId === '' ? '' : String(selectedProductId)}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedProductId(v === '' ? '' : Number(v));
            }}
          >
            <MenuItem value="">Бүгд</MenuItem>
            {products.map((p) => (
              <MenuItem key={p.id} value={String(p.id)}>
                {p.nameMongolian}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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
            onChange={(e) => setGranularity(e.target.value as Granularity)}
          >
            <MenuItem value="day">Өдөр</MenuItem>
            <MenuItem value="week">Долоо хоног</MenuItem>
            <MenuItem value="month">Сар</MenuItem>
            <MenuItem value="year">Жил</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" onClick={fetchData} disabled={loading}>
          Ачаалах
        </Button>
      </Box>

      <Card>
        <CardContent>
          {loading && !data ? (
            <TableSkeleton />
          ) : data ? (
            <>
              <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={`Нийт захиалга: ${fmtNum(data.totals.orderCount, 0)}`}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={`Нийт тоо ширхэг: ${fmtNum(data.totals.totalQuantity, 0)}`}
                  color="secondary"
                  variant="outlined"
                />
                <Chip
                  label={`Нийт дүн: ${fmtNum(data.totals.totalAmount)} ₮`}
                  color="success"
                  variant="outlined"
                />
              </Box>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Борлуулалтын жагсаалт
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Хугацаа</TableCell>
                    <TableCell>Захиалга №</TableCell>
                    <TableCell>Борлуулагч</TableCell>
                    <TableCell>Харилцагч</TableCell>
                    <TableCell>Бараа</TableCell>
                    <TableCell>Ангилал</TableCell>
                    <TableCell align="right">Тоо ширхэг</TableCell>
                    <TableCell align="right">Нэгж үнэ</TableCell>
                    <TableCell align="right">Нийт дүн</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.transactions.map((t, idx) => (
                    <TableRow key={`${t.orderId}-${t.productId}-${idx}`}>
                      <TableCell>{format(new Date(t.orderDate), 'yyyy-MM-dd HH:mm')}</TableCell>
                      <TableCell>{t.orderNumber || `#${t.orderId}`}</TableCell>
                      <TableCell>{t.agentName}</TableCell>
                      <TableCell>{t.customerName}</TableCell>
                      <TableCell>{t.productName}</TableCell>
                      <TableCell>{t.categoryName || '—'}</TableCell>
                      <TableCell align="right">{fmtNum(t.quantity, 0)}</TableCell>
                      <TableCell align="right">{fmtNum(t.unitPrice)}</TableCell>
                      <TableCell align="right">{fmtNum(t.totalPrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {data.periodTotals.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                    {granularityLabel[granularity]} тайлан
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Хугацаа</TableCell>
                        <TableCell align="right">Захиалга</TableCell>
                        <TableCell align="right">Тоо ширхэг</TableCell>
                        <TableCell align="right">Нийт дүн (₮)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.periodTotals.map((p) => (
                        <TableRow key={p.bucket}>
                          <TableCell>{p.bucket}</TableCell>
                          <TableCell align="right">{fmtNum(p.orderCount, 0)}</TableCell>
                          <TableCell align="right">{fmtNum(p.totalQuantity, 0)}</TableCell>
                          <TableCell align="right">{fmtNum(p.totalAmount)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ fontWeight: 'bold', bgcolor: 'action.hover' }}>
                        <TableCell>Нийт</TableCell>
                        <TableCell align="right">{fmtNum(data.totals.orderCount, 0)}</TableCell>
                        <TableCell align="right">{fmtNum(data.totals.totalQuantity, 0)}</TableCell>
                        <TableCell align="right">{fmtNum(data.totals.totalAmount)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </>
              )}
            </>
          ) : (
            <Typography color="text.secondary">Өгөгдөл байхгүй</Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
