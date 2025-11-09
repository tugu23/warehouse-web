import { useState, useEffect } from 'react';
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
  TextField,
  Divider,
} from '@mui/material';
import {
  Sync as SyncIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { posApi, SyncHistory, EReceiptRequest } from '../../api/posApi';
import { format } from 'date-fns';

export default function PosIntegrationPage() {
  const [loading, setLoading] = useState(false);
  const [syncType, setSyncType] = useState<'products' | 'orders' | 'sales' | 'ereceipt' | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [lastSync, setLastSync] = useState<Record<string, { timestamp: string | null }>>({});
  
  // И-баримт тестлэх хэсэг
  const [testAmount, setTestAmount] = useState('10000');
  const [testCustomerName, setTestCustomerName] = useState('Test Customer');

  useEffect(() => {
    fetchSyncHistory();
    fetchLastSyncTimes();
  }, []);

  const fetchSyncHistory = async () => {
    try {
      const history = await posApi.getSyncHistory(20);
      setSyncHistory(history);
    } catch (error) {
      console.error('Error fetching sync history:', error);
    }
  };

  const fetchLastSyncTimes = async () => {
    try {
      const [products, orders, sales, ereceipt] = await Promise.all([
        posApi.getLastSync('products'),
        posApi.getLastSync('orders'),
        posApi.getLastSync('sales'),
        posApi.getLastSync('ereceipt'),
      ]);
      setLastSync({
        products: { timestamp: products.timestamp },
        orders: { timestamp: orders.timestamp },
        sales: { timestamp: sales.timestamp },
        ereceipt: { timestamp: ereceipt.timestamp },
      });
    } catch (error) {
      console.error('Error fetching last sync times:', error);
    }
  };

  const handleSync = async (type: 'products' | 'orders' | 'sales') => {
    setLoading(true);
    setSyncType(type);

    try {
      let result;
      switch (type) {
        case 'products':
          result = await posApi.syncProducts();
          break;
        case 'orders':
          result = await posApi.syncOrders();
          break;
        case 'sales':
          result = await posApi.sendSalesData();
          break;
      }

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error('Синхрончлолт амжилтгүй боллоо');
      }

      fetchSyncHistory();
      fetchLastSyncTimes();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Синхрончлолтын үед алдаа гарлаа');
    } finally {
      setLoading(false);
      setSyncType(null);
    }
  };

  const handleTestEReceipt = async () => {
    setLoading(true);
    setSyncType('ereceipt');

    try {
      const testRequest: EReceiptRequest = {
        orderId: 999,
        amount: parseFloat(testAmount),
        customerName: testCustomerName,
        items: [
          {
            name: 'Тест бараа 1',
            quantity: 2,
            unitPrice: parseFloat(testAmount) / 3,
            totalPrice: (parseFloat(testAmount) / 3) * 2,
            barCode: '1234567890',
          },
          {
            name: 'Тест бараа 2',
            quantity: 1,
            unitPrice: parseFloat(testAmount) / 3,
            totalPrice: parseFloat(testAmount) / 3,
          },
        ],
        paymentMethod: 'Бэлэн',
        cashierId: 1,
        cashierName: 'Test Cashier',
      };

      const result = await posApi.printEReceipt(testRequest);

      if (result.success) {
        toast.success(
          <Box>
            <Typography variant="body2" fontWeight="bold">
              И-баримт амжилттай хэвлэгдлээ!
            </Typography>
            <Typography variant="caption">Дугаар: {result.receiptNumber}</Typography>
            <Typography variant="caption" display="block">
              Сугалааны дугаар: {result.lottery}
            </Typography>
            <Typography variant="caption" display="block">
              URL: {result.receiptUrl}
            </Typography>
          </Box>,
          { duration: 8000 }
        );
      }

      fetchSyncHistory();
      fetchLastSyncTimes();
    } catch (error) {
      console.error('E-Receipt error:', error);
      toast.error('И-баримт хэвлэхэд алдаа гарлаа');
    } finally {
      setLoading(false);
      setSyncType(null);
    }
  };

  const handleClearHistory = async () => {
    try {
      await posApi.clearSyncHistory();
      setSyncHistory([]);
      toast.success('Түүх амжилттай арилгагдлаа');
    } catch (error) {
      console.error('Error clearing history:', error);
      toast.error('Түүх арилгахад алдаа гарлаа');
    }
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Хэзээ ч синхрончлоогоогүй';
    return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');
  };

  const getSyncTypeLabel = (type: string) => {
    const labels = {
      products: 'Бараа',
      orders: 'Захиалга',
      sales: 'Борлуулалт',
      ereceipt: 'И-баримт',
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        PosAPI 3.0 Холболт
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Энэ хуудас нь PosAPI 3.0 системтэй холбогдож мэдээлэл солилцоход ашиглагдана. Одоогоор энэ нь
        mock горимд ажиллаж байна. Бодит API холболтыг .env файлд VITE_POSAPI_URL болон VITE_POSAPI_TOKEN тохируулснаар идэвхжүүлнэ.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Бараа Синхрончлох
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                PosAPI-с барааны мэдээллийг татаж синхрончлоно
              </Typography>
              <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                Сүүлд: {formatTimestamp(lastSync.products?.timestamp || null)}
              </Typography>
              <Button
                variant="contained"
                fullWidth
                startIcon={
                  loading && syncType === 'products' ? <CircularProgress size={20} /> : <SyncIcon />
                }
                onClick={() => handleSync('products')}
                disabled={loading}
              >
                {loading && syncType === 'products' ? 'Синхрончилж байна...' : 'Синхрончлох'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Захиалга Синхрончлох
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Захиалгын мэдээллийг PosAPI руу илгээнэ
              </Typography>
              <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                Сүүлд: {formatTimestamp(lastSync.orders?.timestamp || null)}
              </Typography>
              <Button
                variant="contained"
                fullWidth
                startIcon={
                  loading && syncType === 'orders' ? <CircularProgress size={20} /> : <SyncIcon />
                }
                onClick={() => handleSync('orders')}
                disabled={loading}
              >
                {loading && syncType === 'orders' ? 'Синхрончилж байна...' : 'Синхрончлох'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Борлуулалт Илгээх
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Борлуулалтын мэдээллийг PosAPI руу илгээнэ
              </Typography>
              <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                Сүүлд: {formatTimestamp(lastSync.sales?.timestamp || null)}
              </Typography>
              <Button
                variant="contained"
                fullWidth
                startIcon={
                  loading && syncType === 'sales' ? <CircularProgress size={20} /> : <SyncIcon />
                }
                onClick={() => handleSync('sales')}
                disabled={loading}
              >
                {loading && syncType === 'sales' ? 'Илгээж байна...' : 'Илгээх'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'primary.light' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                И-баримт
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                PosAPI 3.0 И-баримт хэвлэх систем
              </Typography>
              <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                Сүүлд: {formatTimestamp(lastSync.ereceipt?.timestamp || null)}
              </Typography>
              <Chip label="ШИНЭ" color="error" size="small" sx={{ mb: 2 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* И-баримт тестлэх хэсэг */}
      <Card sx={{ mb: 4, borderColor: 'primary.main', borderWidth: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon />
            И-баримт Тестлэх
          </Typography>
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Дүн (₮)"
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Харилцагчийн нэр"
                value={testCustomerName}
                onChange={(e) => setTestCustomerName(e.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>

          <Alert severity="warning" sx={{ mb: 2 }}>
            Энэ нь тестийн и-баримт юм. Бодит борлуулалтын и-баримт хэвлэхийн тулд захиалгын дэлгэрэнгүй хэсэгт орж "И-баримт хэвлэх" товчийг дарна уу.
          </Alert>

          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={
              loading && syncType === 'ereceipt' ? <CircularProgress size={20} /> : <ReceiptIcon />
            }
            onClick={handleTestEReceipt}
            disabled={loading}
            color="primary"
          >
            {loading && syncType === 'ereceipt' ? 'И-баримт хэвлэж байна...' : 'Тест И-баримт Хэвлэх'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Синхрончлолтын Түүх</Typography>
            <Button
              startIcon={<DeleteIcon />}
              onClick={handleClearHistory}
              disabled={syncHistory.length === 0}
            >
              Түүх Арилгах
            </Button>
          </Box>

          {syncHistory.length === 0 ? (
            <Alert severity="info">Синхрончлолтын түүх байхгүй байна</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Төрөл</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell align="right">Амжилттай</TableCell>
                    <TableCell align="right">Алдаатай</TableCell>
                    <TableCell>Мессеж</TableCell>
                    <TableCell>Огноо</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {syncHistory.map((history) => (
                    <TableRow key={history.id}>
                      <TableCell>
                        <Chip 
                          label={getSyncTypeLabel(history.type)} 
                          size="small"
                          color={history.type === 'ereceipt' ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {history.result.success ? (
                            <CheckIcon color="success" fontSize="small" />
                          ) : (
                            <ErrorIcon color="error" fontSize="small" />
                          )}
                          <Typography variant="body2">
                            {history.result.success ? 'Амжилттай' : 'Алдаатай'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">{history.result.syncedCount}</TableCell>
                      <TableCell align="right">{history.result.failedCount}</TableCell>
                      <TableCell>{history.result.message}</TableCell>
                      <TableCell>{formatTimestamp(history.result.timestamp)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
