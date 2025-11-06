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
} from '@mui/material';
import {
  Sync as SyncIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { posApi, SyncHistory } from '../../api/posApi';
import { format } from 'date-fns';

export default function PosIntegrationPage() {
  const [loading, setLoading] = useState(false);
  const [syncType, setSyncType] = useState<'products' | 'orders' | 'sales' | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [lastSync, setLastSync] = useState<Record<string, { timestamp: string | null }>>({});

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
      const [products, orders, sales] = await Promise.all([
        posApi.getLastSync('products'),
        posApi.getLastSync('orders'),
        posApi.getLastSync('sales'),
      ]);
      setLastSync({
        products: { timestamp: products.timestamp },
        orders: { timestamp: orders.timestamp },
        sales: { timestamp: sales.timestamp },
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
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        PosAPI Холболт
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Энэ хуудас нь PosAPI системтэй холбогдож мэдээлэл солилцоход ашиглагдана. Одоогоор энэ нь
        mock горимд ажиллаж байна. Бодит API холболт дараа нь нэмэгдэнэ.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Бараа Синхрончлох
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                PosAPI-с барааны мэдээллийг татаж синхрончлоно
              </Typography>
              <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                Сүүлд синхрончлосон: {formatTimestamp(lastSync.products?.timestamp || null)}
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

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Захиалга Синхрончлох
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Захиалгын мэдээллийг PosAPI руу илгээнэ
              </Typography>
              <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                Сүүлд синхрончлосон: {formatTimestamp(lastSync.orders?.timestamp || null)}
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

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Борлуулалт Илгээх
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Борлуулалтын мэдээллийг PosAPI руу илгээнэ
              </Typography>
              <Typography variant="caption" display="block" sx={{ mb: 2 }}>
                Сүүлд синхрончлосон: {formatTimestamp(lastSync.sales?.timestamp || null)}
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
      </Grid>

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
                        <Chip label={getSyncTypeLabel(history.type)} size="small" />
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

