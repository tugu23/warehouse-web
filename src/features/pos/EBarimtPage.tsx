import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  LinearProgress,
  TextField,
  TablePagination,
} from '@mui/material';
import {
  Send as SendIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Print as PrintIcon,
  Undo as ReturnIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { ordersApi } from '../../api';
import { Order } from '../../types';
import { ebarimtApi, EBarimtInformation, getLotteryWarningLevel } from '../../api/ebarimtApi';
import EbarimtPrintModal from '../orders/EbarimtPrintModal';

export default function EBarimtPage() {
  const [loading, setLoading] = useState(false);
  const [eBarimtInfo, setEBarimtInfo] = useState<EBarimtInformation | null>(null);
  const [sendingData, setSendingData] = useState(false);

  // Захиалгын жагсаалт
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [registeredOrders, setRegisteredOrders] = useState<Order[]>([]);
  const [registeredSearch, setRegisteredSearch] = useState('');
  const [registeredTypeFilter, setRegisteredTypeFilter] = useState<'all' | 'B2B' | 'B2C' | 'returned'>('all');
  const [registeredPage, setRegisteredPage] = useState(0);
  const [registeredRowsPerPage, setRegisteredRowsPerPage] = useState(10);

  // eBarimt хэвлэх modal
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);

  // eBarimt буцаалт
  const [returningId, setReturningId] = useState<number | null>(null);

  const fetchInfo = useCallback(async () => {
    try {
      const res = await ebarimtApi.getInformation();
      setEBarimtInfo(res.data.data);
    } catch {
      // POS холбогдоогүй бол алдаа харуулахгүй
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await ordersApi.getAll({ limit: 'all' });
      const all = res.data.data?.orders || [];
      // Гүйцэтгэсэн + бүртгэлгүй → eBarimt хэвлэх шаардлагатай
      setPendingOrders(all.filter((o) => o.status === 'Fulfilled' && !o.ebarimtRegistered));
      // eBarimt бүртгэгдсэн
      setRegisteredOrders(all.filter((o) => o.ebarimtRegistered));
    } catch {
      toast.error('Захиалга ачааллахад алдаа гарлаа');
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchInfo(), fetchOrders()]);
    setLoading(false);
  }, [fetchInfo, fetchOrders]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Нэгдсэн системд илгээх
  const handleSendData = async () => {
    setSendingData(true);
    try {
      const res = await ebarimtApi.sendData();
      const result = res.data.data;
      if (result.success) {
        toast.success(
          `${result.sentBillCount || 0} баримт амжилттай илгээгдлээ! (${result.sentAmount?.toLocaleString() || 0}₮)`
        );
        fetchInfo();
      } else {
        toast.error(result.message || 'Илгээлт амжилтгүй боллоо');
      }
    } catch {
      toast.error('Мэдээлэл илгээхэд алдаа гарлаа');
    } finally {
      setSendingData(false);
    }
  };

  // eBarimt хэвлэх — бүтэн захиалга татаж modal нээнэ
  const handleOpenPrint = async (orderId: number) => {
    setLoadingOrderId(orderId);
    try {
      const res = await ordersApi.getById(orderId);
      const order = res.data.data?.order;
      if (!order) {
        toast.error('Захиалга олдсонгүй');
        return;
      }
      setPrintOrder(order);
    } catch {
      toast.error('Захиалга ачааллахад алдаа гарлаа');
    } finally {
      setLoadingOrderId(null);
    }
  };

  // B2B: хадгалагдсан баримтын төрөл эсвэл байгууллагын ТТД байгаа эсэх
  const isB2BOrder = (order: Order) => {
    const kind = order.ebarimtReceiptType || order.ebarimtType;
    if (kind === 'B2B') return true;
    if (kind === 'B2C') return false;
    // Fallback: хэрэв төрөл тогтоогоогүй бол ТТД байвал B2B
    const c = order.customer;
    return !!c?.registrationNumber?.trim();
  };

  const filteredRegisteredOrders = registeredOrders.filter((order) => {
    const isB2B = isB2BOrder(order);
    const isReturned = !!order.ebarimtReturnId;
    const q = registeredSearch.trim().toLowerCase();

    if (registeredTypeFilter === 'B2B' && !isB2B) return false;
    if (registeredTypeFilter === 'B2C' && isB2B) return false;
    if (registeredTypeFilter === 'returned' && !isReturned) return false;

    if (!q) return true;

    const haystack = [
      order.id,
      order.ebarimtBillId,
      order.customer?.name,
      order.totalAmount,
      order.paymentMethod,
      order.status,
      order.ebarimtDate,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(q);
  });

  useEffect(() => {
    setRegisteredPage(0);
  }, [registeredSearch, registeredTypeFilter, registeredOrders.length]);

  const pagedRegisteredOrders = filteredRegisteredOrders.slice(
    registeredPage * registeredRowsPerPage,
    registeredPage * registeredRowsPerPage + registeredRowsPerPage
  );

  // eBarimt буцаалт — backend-ээр дамжуулж POS API руу илгээнэ (B2B, B2C хоёуланд)
  const handleEbarimtReturn = async (order: Order) => {
    // Ask for reason first
    const reason = window.prompt(
      `Захиалга #${order.id}-ийн eBarimt баримтыг буцаах уу?\n\nБуцаалтын шалтгаан оруулна уу (заавал биш):`,
      ''
    );

    // User cancelled
    if (reason === null) return;

    setReturningId(order.id);
    try {
      const res = await ebarimtApi.returnOrder(order.id, reason || undefined);
      const result = res.data.data;

      // Idempotent response — already returned
      if (result?.alreadyReturned) {
        // $FlowFixMe - react-hot-toast overload resolution issue in TypeScript
        (toast as unknown as { (message: Parameters<typeof toast>[0], opts?: Parameters<typeof toast>[1]): string; info: (message: string) => string }).info(result?.message ?? 'Захиалга өмнө нь буцаагдсан байна');
        fetchOrders();
        return;
      }

      // Backend амжилттай бол data.success === true байна
      if (result?.success) {
        const isB2B = result.receiptType === 'B2B';
        toast.success(
          isB2B
            ? 'Байгууллагын баримт амжилттай буцаагдлаа!'
            : 'Баримт амжилттай буцаагдлаа!'
        );
        fetchOrders();
        fetchInfo();
      } else {
        toast.error(result?.message || 'eBarimt буцаалт амжилтгүй');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      toast.error(
        err.response?.data?.message || err.message || 'eBarimt буцаалт хийхэд алдаа гарлаа'
      );
    } finally {
      setReturningId(null);
    }
  };

  const getLotteryWarningColor = (level: 'ok' | 'warning' | 'critical') => {
    if (level === 'critical') return 'error';
    if (level === 'warning') return 'warning';
    return 'success';
  };

  const lotteryLevel = getLotteryWarningLevel(eBarimtInfo?.lotteryCount);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">И-Баримт Удирдлага</Typography>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={fetchAllData}
          disabled={loading}
        >
          Шинэчлэх
        </Button>
      </Box>

      {/* Анхааруулга */}
      {eBarimtInfo?.warningMessage && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
          {eBarimtInfo.warningMessage}
        </Alert>
      )}
      {eBarimtInfo?.shouldSendNow && !eBarimtInfo?.warningMessage && (
        <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 2 }}>
          3 хоногийн хугацаа дуусаж байна — нэгдсэн системд яаралтай илгээнэ үү!
        </Alert>
      )}

      {/* Статус карт */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: 4, borderColor: `${getLotteryWarningColor(lotteryLevel)}.main` }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography color="text.secondary" variant="body2">
                  Сугалааны үлдэгдэл
                </Typography>
                {lotteryLevel === 'critical' ? (
                  <ErrorIcon color="error" />
                ) : lotteryLevel === 'warning' ? (
                  <WarningIcon color="warning" />
                ) : (
                  <CheckCircleIcon color="success" />
                )}
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                {eBarimtInfo?.lotteryCount ?? '-'}
              </Typography>
              {lotteryLevel !== 'ok' && (
                <Typography
                  variant="caption"
                  color={`${getLotteryWarningColor(lotteryLevel)}.main`}
                >
                  {lotteryLevel === 'critical'
                    ? 'Яаралтай нэмэгдүүлэх шаардлагатай!'
                    : 'Нэмэгдүүлэхийг зөвлөж байна'}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              borderLeft: 4,
              borderColor: (eBarimtInfo?.billCount || 0) > 0 ? 'warning.main' : 'grey.300',
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography color="text.secondary" variant="body2">
                  Илгээгээгүй баримт
                </Typography>
                <InfoIcon color="info" />
              </Stack>
              <Typography variant="h4" fontWeight="bold">
                {eBarimtInfo?.billCount ?? 0}
              </Typography>
              {(eBarimtInfo?.billAmount || 0) > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {eBarimtInfo?.billAmount?.toLocaleString()}₮
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                eBarimt хүлээгдэж буй
              </Typography>
              <Typography
                variant="h4"
                fontWeight="bold"
                color={pendingOrders.length > 0 ? 'warning.main' : 'text.primary'}
              >
                {pendingOrders.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Гүйцэтгэсэн, хэвлээгүй
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
            <CardContent sx={{ width: '100%' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                startIcon={
                  sendingData ? <CircularProgress size={20} color="inherit" /> : <SendIcon />
                }
                onClick={handleSendData}
                disabled={sendingData}
              >
                {sendingData ? 'Илгээж байна...' : 'Нэгдсэн системд илгээх'}
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Хуулийн дагуу 3 хоногт нэг удаа илгээх
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* eBarimt хүлээгдэж буй захиалгууд */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <ReceiptIcon />
            eBarimt хэвлэх шаардлагатай захиалгууд
            {pendingOrders.length > 0 && (
              <Chip label={pendingOrders.length} size="small" color="warning" />
            )}
          </Typography>

          {loading ? (
            <LinearProgress />
          ) : pendingOrders.length === 0 ? (
            <Alert severity="success" icon={<CheckCircleIcon />}>
              Бүх гүйцэтгэсэн захиалга eBarimt бүртгэгдсэн байна
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Огноо</TableCell>
                    <TableCell>Харилцагч</TableCell>
                    <TableCell align="right">Дүн</TableCell>
                    <TableCell>Төлбөр</TableCell>
                    <TableCell align="center">Үйлдэл</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingOrders.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell>{order.id}</TableCell>
                      <TableCell>{format(new Date(order.createdAt), 'MM/dd HH:mm')}</TableCell>
                      <TableCell>{order.customer?.name || '-'}</TableCell>
                      <TableCell align="right">
                        {Number(order.totalAmount).toLocaleString()}₮
                      </TableCell>
                      <TableCell>
                        <Chip label={order.paymentMethod} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="eBarimt хэвлэх">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleOpenPrint(order.id)}
                            disabled={loadingOrderId === order.id}
                          >
                            {loadingOrderId === order.id ? (
                              <CircularProgress size={20} />
                            ) : (
                              <PrintIcon />
                            )}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Бүртгэгдсэн баримтууд */}
      <Card>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <CheckCircleIcon color="success" />
            Бүртгэгдсэн eBarimt баримтууд
            <Chip label={registeredOrders.length} size="small" color="success" />
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              alignItems: 'center',
              mb: 2,
              p: 1.5,
              borderRadius: 2,
              bgcolor: 'background.default',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <TextField
              size="small"
              placeholder="ДДТД, харилцагч, дүнгээр хайх"
              value={registeredSearch}
              onChange={(e) => setRegisteredSearch(e.target.value)}
              sx={{ minWidth: { xs: '100%', md: 280 }, flex: 1 }}
            />
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              {[
                { value: 'all', label: 'Бүгд' },
                { value: 'B2B', label: 'B2B' },
                { value: 'B2C', label: 'B2C' },
                { value: 'returned', label: 'Буцаагдсан' },
              ].map((chip) => (
                <Chip
                  key={chip.value}
                  label={chip.label}
                  clickable
                  color={registeredTypeFilter === chip.value ? 'primary' : 'default'}
                  variant={registeredTypeFilter === chip.value ? 'filled' : 'outlined'}
                  onClick={() => setRegisteredTypeFilter(chip.value as typeof registeredTypeFilter)}
                />
              ))}
            </Stack>
          </Box>

          {loading ? (
            <LinearProgress />
          ) : filteredRegisteredOrders.length === 0 ? (
            <Alert severity="info">eBarimt бүртгэгдсэн захиалга байхгүй</Alert>
          ) : (
            <>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>ДДТД</TableCell>
                    <TableCell>Огноо</TableCell>
                    <TableCell>Харилцагч</TableCell>
                    <TableCell>Төрөл</TableCell>
                    <TableCell align="right">Дүн</TableCell>
                    <TableCell align="center">Төлөв</TableCell>
                    <TableCell align="center">Үйлдэл</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedRegisteredOrders.map((order) => {
                    const isB2B = isB2BOrder(order);
                    const isReturned = !!order.ebarimtReturnId;
                    const isProcessing = returningId === order.id;
                    return (
                      <TableRow key={order.id} hover>
                        <TableCell>{order.id}</TableCell>
                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography variant="caption" fontFamily="monospace">
                              {order.ebarimtBillId || '-'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {order.ebarimtId ? `ID: ${order.ebarimtId.slice(-8)}` : ''}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {order.ebarimtDate
                            ? format(new Date(order.ebarimtDate), 'MM/dd HH:mm')
                            : '-'}
                        </TableCell>
                        <TableCell>{order.customer?.name || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={isB2B ? 'B2B' : 'B2C'}
                            size="small"
                            color={isB2B ? 'info' : 'default'}
                            variant={isB2B ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {Number(order.totalAmount).toLocaleString()}₮
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={isReturned ? 'Буцаагдсан' : 'Идэвхтэй'}
                            color={isReturned ? 'default' : 'success'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip
                            title={
                              isReturned
                                ? 'Аль хэдийн буцаагдсан'
                                : isB2B
                                  ? 'B2B eBarimt буцаах'
                                  : 'B2C eBarimt буцаах'
                            }
                          >
                            <span>
                              <IconButton
                                color="error"
                                size="small"
                                disabled={isReturned || isProcessing}
                                onClick={() => handleEbarimtReturn(order)}
                              >
                                {isProcessing ? <CircularProgress size={20} /> : <ReturnIcon />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredRegisteredOrders.length}
              page={registeredPage}
              onPageChange={(_, nextPage) => setRegisteredPage(nextPage)}
              rowsPerPage={registeredRowsPerPage}
              onRowsPerPageChange={(e) => {
                setRegisteredRowsPerPage(parseInt(e.target.value, 10));
                setRegisteredPage(0);
              }}
              rowsPerPageOptions={[5, 10, 20, 50]}
            />
            </>
          )}
        </CardContent>
      </Card>

      {/* EbarimtPrintModal */}
      {printOrder && (
        <EbarimtPrintModal
          order={printOrder}
          onClose={() => setPrintOrder(null)}
          onSuccess={() => {
            setPrintOrder(null);
            fetchOrders();
          }}
        />
      )}
    </Box>
  );
}
