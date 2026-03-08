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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
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
  PlayArrow as RegisterIcon,
  Undo as ReturnIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import {
  ebarimtApi,
  EBarimtInformation,
  UnregisteredOrder,
  RegisteredOrder,
  getLotteryWarningLevel,
} from '../../api/ebarimtApi';
import EBarimtResultModal, { EBarimtResultData } from '../../components/EBarimtResultModal';

export default function EBarimtPage() {
  // State
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<EBarimtInformation | null>(null);
  const [unregisteredOrders, setUnregisteredOrders] = useState<UnregisteredOrder[]>([]);
  const [registeredOrders, setRegisteredOrders] = useState<RegisteredOrder[]>([]);
  const [sendingData, setSendingData] = useState(false);
  const [registeringOrderId, setRegisteringOrderId] = useState<number | null>(null);

  // Return dialog state
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState<number | null>(null);
  const [returnReason, setReturnReason] = useState('');

  // Result modal state
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultModalData, setResultModalData] = useState<EBarimtResultData | null>(null);

  // Fetch data
  const fetchInfo = useCallback(async () => {
    try {
      const response = await ebarimtApi.getInformation();
      setInfo(response.data.data);
    } catch (error) {
      console.error('Error fetching eBarimt info:', error);
    }
  }, []);

  const fetchUnregisteredOrders = useCallback(async () => {
    try {
      const response = await ebarimtApi.getUnregisteredOrders(50);
      setUnregisteredOrders(response.data.data.orders);
    } catch (error) {
      console.error('Error fetching unregistered orders:', error);
    }
  }, []);

  const fetchRegisteredOrders = useCallback(async () => {
    try {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const response = await ebarimtApi.getRegisteredOrders({
        startDate,
        limit: 50,
      });
      setRegisteredOrders(response.data.data.orders);
    } catch (error) {
      console.error('Error fetching registered orders:', error);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchInfo(), fetchUnregisteredOrders(), fetchRegisteredOrders()]);
    setLoading(false);
  }, [fetchInfo, fetchUnregisteredOrders, fetchRegisteredOrders]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handle send data to central system
  const handleSendData = async () => {
    setSendingData(true);
    try {
      const response = await ebarimtApi.sendData();
      const result = response.data.data;

      if (result.success) {
        toast.success(
          `${result.sentBillCount || 0} баримт амжилттай илгээгдлээ! (${result.sentAmount?.toLocaleString() || 0}₮)`
        );
        fetchInfo();
      } else {
        toast.error(result.message || 'Илгээлт амжилтгүй боллоо');
      }
    } catch (error) {
      console.error('Error sending data:', error);
      toast.error('Мэдээлэл илгээхэд алдаа гарлаа');
    } finally {
      setSendingData(false);
    }
  };

  // Handle register order with eBarimt
  const handleRegisterOrder = async (orderId: number) => {
    setRegisteringOrderId(orderId);
    try {
      const response = await ebarimtApi.registerOrder(orderId);
      const result = response.data.data;

      if (result.success) {
        toast.success('И-баримт амжилттай бүртгэгдлээ!');

        setResultModalData({
          orderId: result.orderId,
          billId: result.billId,
          lottery: result.lottery,
          qrData: result.qrData,
          isB2B: result.isB2B,
          message: result.message,
        });
        setResultModalOpen(true);

        fetchUnregisteredOrders();
        fetchRegisteredOrders();
        fetchInfo();
      } else {
        toast.error(result.message || 'Бүртгэл амжилтгүй');
      }
    } catch (error) {
      console.error('Error registering order:', error);
      toast.error('И-баримт бүртгэхэд алдаа гарлаа');
    } finally {
      setRegisteringOrderId(null);
    }
  };

  // Handle return order
  const handleReturnOrder = async () => {
    if (!returnOrderId) return;

    try {
      const response = await ebarimtApi.returnOrder(returnOrderId, returnReason);
      const result = response.data.data;

      if (result.success) {
        toast.success('И-баримт буцаалт амжилттай');
        setReturnDialogOpen(false);
        setReturnOrderId(null);
        setReturnReason('');
        fetchRegisteredOrders();
      } else {
        toast.error(result.message || 'Буцаалт амжилтгүй');
      }
    } catch (error) {
      console.error('Error returning order:', error);
      toast.error('И-баримт буцаахад алдаа гарлаа');
    }
  };

  // Get lottery warning color
  const getLotteryWarningColor = (level: 'ok' | 'warning' | 'critical') => {
    switch (level) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'success';
    }
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

      {/* Warning Messages */}
      {info?.warningMessage && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
          {info.warningMessage}
        </Alert>
      )}

      {/* Status Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Lottery Count */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              borderLeft: 4,
              borderColor: `${getLotteryWarningColor(lotteryLevel)}.main`,
            }}
          >
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

        {/* Pending Bills */}
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

        {/* Last Sent Date */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Сүүлд илгээсэн
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                {info?.lastSentDate
                  ? format(new Date(info.lastSentDate), 'yyyy-MM-dd HH:mm')
                  : 'Хэзээ ч илгээгээгүй'}
              </Typography>
              {info?.shouldSendNow && (
                <Chip label="Илгээх шаардлагатай" color="warning" size="small" sx={{ mt: 1 }} />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Send Data Button */}
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
                disabled={sendingData || (info?.billCount || 0) === 0}
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

      {/* Unregistered Orders */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <ReceiptIcon />
            Бүртгэлгүй дэлгүүрийн захиалгууд
            <Chip label={unregisteredOrders.length} size="small" color="warning" />
          </Typography>

          {loading ? (
            <LinearProgress />
          ) : unregisteredOrders.length === 0 ? (
            <Alert severity="success" icon={<CheckCircleIcon />}>
              Бүх дэлгүүрийн захиалгууд и-баримтанд бүртгэгдсэн байна
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Дугаар</TableCell>
                    <TableCell>Огноо</TableCell>
                    <TableCell>Харилцагч</TableCell>
                    <TableCell>ТТД</TableCell>
                    <TableCell align="right">Дүн</TableCell>
                    <TableCell align="center">Үйлдэл</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {unregisteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.id}</TableCell>
                      <TableCell>{order.orderNumber || '-'}</TableCell>
                      <TableCell>{format(new Date(order.orderDate), 'MM/dd HH:mm')}</TableCell>
                      <TableCell>
                        {order.customer.organizationName || order.customer.name}
                      </TableCell>
                      <TableCell>
                        {order.customer.registrationNumber ? (
                          <Chip
                            label={order.customer.registrationNumber}
                            size="small"
                            color="info"
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="right">{order.totalAmount?.toLocaleString()}₮</TableCell>
                      <TableCell align="center">
                        <Tooltip title="И-баримт бүртгэх">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleRegisterOrder(order.id)}
                            disabled={registeringOrderId === order.id}
                          >
                            {registeringOrderId === order.id ? (
                              <CircularProgress size={20} />
                            ) : (
                              <RegisterIcon />
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

      {/* Registered Orders (This Month) */}
      <Card>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <CheckCircleIcon color="success" />
            Энэ сарын бүртгэгдсэн баримтууд
            <Chip label={registeredOrders.length} size="small" color="success" />
          </Typography>

          {loading ? (
            <LinearProgress />
          ) : registeredOrders.length === 0 ? (
            <Alert severity="info">Энэ сард бүртгэгдсэн баримт байхгүй</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>ДДТД</TableCell>
                    <TableCell>Огноо</TableCell>
                    <TableCell>Харилцагч</TableCell>
                    <TableCell>ТТД</TableCell>
                    <TableCell align="right">Дүн</TableCell>
                    <TableCell align="center">Үйлдэл</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {registeredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.id}</TableCell>
                      <TableCell>
                        <Typography variant="caption" fontFamily="monospace">
                          {order.ebarimtBillId || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {order.ebarimtDate
                          ? format(new Date(order.ebarimtDate), 'MM/dd HH:mm')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {order.customer.organizationName || order.customer.name}
                      </TableCell>
                      <TableCell>
                        {order.customer.registrationNumber ? (
                          <Chip
                            label={order.customer.registrationNumber}
                            size="small"
                            color="info"
                          />
                        ) : (
                          <Chip label="B2C" size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell align="right">{order.totalAmount?.toLocaleString()}₮</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Буцаах">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => {
                              setReturnOrderId(order.id);
                              setReturnDialogOpen(true);
                            }}
                          >
                            <ReturnIcon />
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

      {/* Return Dialog */}
      <Dialog open={returnDialogOpen} onClose={() => setReturnDialogOpen(false)}>
        <DialogTitle>И-баримт буцаах</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Захиалга #{returnOrderId}-ийн и-баримтыг буцаахдаа итгэлтэй байна уу?
          </Typography>
          <TextField
            label="Буцаах шалтгаан"
            fullWidth
            multiline
            rows={2}
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            placeholder="Жишээ: Бараа буцаалт"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDialogOpen(false)}>Цуцлах</Button>
          <Button variant="contained" color="error" onClick={handleReturnOrder}>
            Буцаах
          </Button>
        </DialogActions>
      </Dialog>

      {/* E-Barimt Result Modal */}
      <EBarimtResultModal
        open={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        result={resultModalData}
      />
    </Box>
  );
}
