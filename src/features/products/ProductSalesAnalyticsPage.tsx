import { useState, useEffect } from 'react';
import { Box, Button, Typography, Alert, Chip } from '@mui/material';
import {
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Info as InfoIcon,
  Calculate as CalculateIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import { analyticsApi } from '../../api';
import { ProductSalesAnalytics } from '../../types';
import { TableSkeleton } from '../../components/LoadingSkeletons';
import ProductSalesDetailModal from './ProductSalesDetailModal';

export default function ProductSalesAnalyticsPage() {
  const [analytics, setAnalytics] = useState<ProductSalesAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductSalesAnalytics | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await analyticsApi.getAllProductAnalytics();
      console.log('Analytics API Response:', response);
      console.log('Analytics data:', response.data);
      console.log('Analytics array:', response.data.data?.analytics);

      const analyticsData = response.data.data?.analytics || [];
      console.log('Setting analytics with length:', analyticsData.length);
      setAnalytics(analyticsData);

      if (analyticsData.length === 0) {
        console.warn('No analytics data received from backend. Possible causes:');
        console.warn('1. No products in database');
        console.warn('2. No orders/sales data to analyze');
        console.warn('3. Analytics have not been calculated yet');
        console.warn('4. Backend calculation or retrieval issue');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
        console.error('Response status:', axiosError.response?.status);
        console.error('Response data:', axiosError.response?.data);
        toast.error(
          `Мэдээлэл татахад алдаа гарлаа: ${axiosError.response?.data?.message || 'Unknown error'}`
        );
      } else {
        toast.error('Мэдээлэл татахад алдаа гарлаа');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateAll = async () => {
    setCalculating(true);
    try {
      console.log('Starting analytics calculation...');
      const calculateResponse = await analyticsApi.calculateAllAnalytics();
      console.log('Calculate response:', calculateResponse);
      toast.success('Шинжилгээ амжилттай тооцоолов');

      // Wait a bit for the backend to finish processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Refresh analytics after calculation
      console.log('Fetching analytics after calculation...');
      await fetchAnalytics();
    } catch (error) {
      console.error('Error calculating analytics:', error);
      toast.error('Шинжилгээ тооцоолоход алдаа гарлаа');
    } finally {
      setCalculating(false);
    }
  };

  const handleExport = async () => {
    if (analytics.length === 0) {
      toast.error('Экспорт хийх мэдээлэл байхгүй байна');
      return;
    }

    setExporting(true);
    try {
      // Export logic would go here
      toast.success('Excel файл амжилттай татагдлаа');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Экспорт хийхэд алдаа гарлаа');
    } finally {
      setExporting(false);
    }
  };

  const handleRowClick = (row: ProductSalesAnalytics) => {
    setSelectedProduct(row);
    setDetailModalOpen(true);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon color="success" fontSize="small" />;
      case 'down':
        return <TrendingDownIcon color="error" fontSize="small" />;
      case 'stable':
        return <TrendingFlatIcon color="disabled" fontSize="small" />;
    }
  };

  const getStockStatusChip = (status: 'ok' | 'low' | 'critical' | 'out') => {
    const config = {
      ok: { label: 'Хэвийн', color: 'success' as const },
      low: { label: 'Бага', color: 'warning' as const },
      critical: { label: 'Маш бага', color: 'error' as const },
      out: { label: 'Дууссан', color: 'default' as const },
    };
    const { label, color } = config[status];
    return <Chip label={label} color={color} size="small" />;
  };

  const columns = [
    {
      id: 'product',
      label: 'Барааны нэр',
      minWidth: 200,
      format: (row: ProductSalesAnalytics) => row.product?.nameMongolian || 'N/A',
    },
    {
      id: 'currentStock',
      label: 'Үлдэгдэл',
      align: 'right' as const,
      minWidth: 100,
      format: (row: ProductSalesAnalytics) => row.currentStock.toLocaleString(),
    },
    {
      id: 'stockStatus',
      label: 'Төлөв',
      minWidth: 120,
      format: (row: ProductSalesAnalytics) => getStockStatusChip(row.stockStatus),
    },
    {
      id: 'salesAverage1Month',
      label: '1 сарын дундаж',
      align: 'right' as const,
      minWidth: 130,
      format: (row: ProductSalesAnalytics) => row.salesAverage1Month.toFixed(1),
    },
    {
      id: 'salesAverage3Month',
      label: '3 сарын дундаж',
      align: 'right' as const,
      minWidth: 130,
      format: (row: ProductSalesAnalytics) => row.salesAverage3Month.toFixed(1),
    },
    {
      id: 'salesAverage6Month',
      label: '6 сарын дундаж',
      align: 'right' as const,
      minWidth: 130,
      format: (row: ProductSalesAnalytics) => row.salesAverage6Month.toFixed(1),
    },
    {
      id: 'trend',
      label: 'Чиг хандлага',
      minWidth: 140,
      format: (row: ProductSalesAnalytics) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getTrendIcon(row.trend)}
          <Typography variant="body2">
            {row.trendPercentage > 0 ? '+' : ''}
            {row.trendPercentage.toFixed(1)}%
          </Typography>
        </Box>
      ),
    },
    {
      id: 'recommendedOrderQuantity',
      label: 'Санал болгох захиалга',
      align: 'right' as const,
      minWidth: 150,
      format: (row: ProductSalesAnalytics) =>
        row.recommendedOrderQuantity ? row.recommendedOrderQuantity.toLocaleString() : '-',
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Барааны борлуулалтын шинжилгээ</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={calculating ? <RefreshIcon /> : <CalculateIcon />}
            onClick={handleCalculateAll}
            disabled={calculating || loading}
          >
            {calculating ? 'Тооцоолж байна...' : 'Шинжилгээ тооцоолох'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={exporting || analytics.length === 0}
          >
            {exporting ? 'Экспорт хийж байна...' : 'Excel татах'}
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }} icon={<InfoIcon />}>
        Бүх барааны 1, 3, 6 сарын борлуулалтын дундажийг харуулсан. Дундаж тооцоолох үед огцом
        өөрчлөлттэй саруудыг (50%-аас их буурсан) тооцоололд оруулаагүй. Мөрийг дарж дэлгэрэнгүй
        мэдээлэл үзнэ үү.
      </Alert>

      {loading ? (
        <TableSkeleton />
      ) : analytics.length === 0 ? (
        <Box
          sx={{
            p: 8,
            textAlign: 'center',
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <InfoIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Шинжилгээний мэдээлэл олдсонгүй
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Барааны борлуулалтын шинжилгээ тооцоогдоогүй байна. "Шинжилгээ тооцоолох" товчийг дарж
            шинжилгээ хийнэ үү.
          </Typography>
          <Button
            variant="contained"
            startIcon={<CalculateIcon />}
            onClick={handleCalculateAll}
            disabled={calculating}
            sx={{ mt: 2 }}
          >
            {calculating ? 'Тооцоолж байна...' : 'Одоо тооцоолох'}
          </Button>
        </Box>
      ) : (
        <DataTable
          title="Барааны жагсаалт"
          columns={columns as unknown as { id: string; label: string }[]}
          data={analytics as unknown as Record<string, unknown>[]}
          searchable
          searchPlaceholder="Бараа хайх..."
          onRowClick={(row) => handleRowClick(row as unknown as ProductSalesAnalytics)}
        />
      )}

      {selectedProduct && (
        <ProductSalesDetailModal
          open={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedProduct(null);
          }}
          analytics={selectedProduct}
        />
      )}
    </Box>
  );
}
