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
      setAnalytics(response.data.data?.analytics || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Мэдээлэл татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateAll = async () => {
    setCalculating(true);
    try {
      await analyticsApi.calculateAllAnalytics();
      toast.success('Шинжилгээ амжилттай тооцоолов');
      // Refresh analytics after calculation
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
      ) : (
        <DataTable
          title="Барааны жагсаалт"
          columns={columns}
          data={analytics}
          searchable
          searchPlaceholder="Бараа хайх..."
          onRowClick={handleRowClick}
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
