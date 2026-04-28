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
  const [info, setInfo] = useState<EBarimtInformation | null>(null);
  const [sendingData, setSendingData] = useState(false);

  // Захиалгын жагсаалт
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [registeredOrders, setRegisteredOrders] = useState<Order[]>([]);

  // eBarimt хэвлэх modal
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [loadingOrderId, setLoadingOrderId] = useState<number | null>(null);

  // eBarimt буцаалт
  const [returningId, setReturningId] = useState<number | null>(null);

  const fetchInfo = useCallback(async () => {
    try {
      const res = await ebarimtApi.getInformation();
      setInfo(res.data.data);
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

  // B2B: хадгалагдсан баримтын төрөл эсвэл байгууллагын нэр (registrationNumber дангаар нь биш)
  const isB2BOrder = (order: Order) => {
    const kind = order.ebarimtReceiptType || order.ebarimtType;
    if (kind === 'B2B') return true;
    if (kind === 'B2C') return false;
    const c = order.customer;
    return !!c?.organizationName?.trim();
  };

  // eBarimt буцаалт — frontend-ээс POS API-руу шууд DELETE
  const handleEbarimtReturn = async (order: Order) => {
    if (isB2BOrder(order)) {
      toast.error('B2B баримт буцаалт хийх боломжгүй');
      return;
    }
    if (
      !window.confirm(
        `Захиалга #${order.id}-ийн eBarimt баримтыг буцаах уу?\nBill ID: ${order.ebarimtBillId}`
      )
    )
      return;

    setReturningId(order.id);
    try {
      // POS API-руу DELETE хүсэлт — { id, date } body-тай
      // POS API: "2006-01-02 15:04:05" форматыг шаарддаг
      const posDate = order.ebarimtDate
        ? format(new Date(order.ebarimtDate), 'yyyy-MM-dd HH:mm:ss')
        : undefined;

      const posRes = await fetch(`http://43.231.115.209:7080/rest/receipt`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: order.ebarimtBillId,
          ...(posDate ? { date: posDate } : {}),
        }),
      });

      interface PosDeleteBody {
        message?: string;
        id?: string;
        success?: boolean;
      }
      let posData: PosDeleteBody | null = null;
      const rawText = await posRes.text();
      try {
        posData = rawText ? (JSON.parse(rawText) as PosDeleteBody) : null;
      } catch {
        /* non-JSON response */
      }

      const errMessage = posData?.message || '';
      const alreadyReturned = errMessage.toLowerCase().includes('unique constraint');
      const isSuccess = posRes.ok || alreadyReturned;

      if (isSuccess) {
        // DB шинэчлэх
        const returnId = posData?.id || order.ebarimtBillId!;
        await ordersApi.ebarimtReturnDone(order.id, returnId);
        toast.success(
          alreadyReturned
            ? 'eBarimt-д аль хэдийн буцаагдсан байсан. Систем шинэчлэгдлээ.'
            : 'eBarimt буцаалт амжилттай!'
        );
        fetchOrders();
      } else {
        toast.error(`eBarimt буцаалт амжилтгүй: ${errMessage || `HTTP ${posRes.status}`}`);
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

  const lotteryLevel = getLotteryWarningLevel(info?.lotteryCount);

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
      {info?.warningMessage && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
          {info.warningMessage}
        </Alert>
      )}
      {info?.shouldSendNow && !info?.warningMessage && (
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
                {info?.lotteryCount ?? '-'}
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
              borderColor: (info?.billCount || 0) > 0 ? 'warning.main' : 'grey.300',
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
                {info?.billCount ?? 0}
              </Typography>
              {(info?.billAmount || 0) > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {info?.billAmount?.toLocaleString()}₮
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

          {loading ? (
            <LinearProgress />
          ) : registeredOrders.length === 0 ? (
            <Alert severity="info">eBarimt бүртгэгдсэн захиалга байхгүй</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>ДДТД (сүүлийн 12)</TableCell>
                    <TableCell>eBarimt огноо</TableCell>
                    <TableCell>Харилцагч</TableCell>
                    <TableCell>Төрөл</TableCell>
                    <TableCell align="right">Дүн</TableCell>
                    <TableCell align="center">Төлөв</TableCell>
                    <TableCell align="center">Үйлдэл</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {registeredOrders.map((order) => {
                    const isB2B = isB2BOrder(order);
                    const isReturned = !!order.ebarimtReturnId;
                    const isProcessing = returningId === order.id;
                    return (
                      <TableRow key={order.id} hover>
                        <TableCell>{order.id}</TableCell>
                        <TableCell>
                          <Typography variant="caption" fontFamily="monospace">
                            {order.ebarimtBillId?.slice(-12) || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {order.ebarimtId ||
                            (order.ebarimtDate
                              ? format(new Date(order.ebarimtDate), 'MM/dd HH:mm')
                              : '-')}
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
                              isB2B
                                ? 'B2B баримт буцаалт хийх боломжгүй'
                                : isReturned
                                  ? 'Аль хэдийн буцаагдсан'
                                  : 'eBarimt буцаах'
                            }
                          >
                            <span>
                              <IconButton
                                color="error"
                                size="small"
                                disabled={isReturned || isB2B || isProcessing}
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
