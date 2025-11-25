import { useState, useEffect, useCallback } from 'react';
import { Box, Button, Typography, TextField, MenuItem, Grid, Chip, Alert } from '@mui/material';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import DataTable from '../../components/DataTable';
import { analyticsApi } from '../../api';
import { InventoryForecast } from '../../types';
import { TableSkeleton } from '../../components/LoadingSkeletons';
import ForecastDetailModal from './ForecastDetailModal';

export default function InventoryForecastPage() {
  const [forecasts, setForecasts] = useState<InventoryForecast[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedForecast, setSelectedForecast] = useState<InventoryForecast | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Filters
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [monthFilter, setMonthFilter] = useState<number | ''>('');
  const [yearFilter, setYearFilter] = useState<number | ''>(new Date().getFullYear());

  const fetchForecasts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, number | string> = { page, limit };
      if (monthFilter) params.month = monthFilter;
      if (yearFilter) params.year = yearFilter;

      const response = await analyticsApi.getForecast(params);
      setForecasts(response.data.data?.forecasts || []);
    } catch (error) {
      console.error('Error fetching forecasts:', error);
      toast.error('Таамаглал татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, [page, limit, monthFilter, yearFilter]);

  useEffect(() => {
    fetchForecasts();
  }, [fetchForecasts]);

  const handleGenerateAll = async () => {
    setGenerating(true);
    try {
      const data: Record<string, number> = {};
      if (monthFilter) data.month = Number(monthFilter);
      if (yearFilter) data.year = Number(yearFilter);

      await analyticsApi.generateAllForecasts(data);
      toast.success('Таамаглал амжилттай үүслээ');
      // Refresh forecasts after generation
      await fetchForecasts();
    } catch (error) {
      console.error('Error generating forecasts:', error);
      toast.error('Таамаглал үүсгэхэд алдаа гарлаа');
    } finally {
      setGenerating(false);
    }
  };

  const handleRowClick = (row: InventoryForecast) => {
    setSelectedForecast(row);
    setDetailModalOpen(true);
  };

  const getConfidenceChip = (confidence?: number) => {
    if (!confidence) return <Chip label="Тодорхойгүй" size="small" />;

    if (confidence >= 0.8) {
      return (
        <Chip label={`${(confidence * 100).toFixed(0)}% - Өндөр`} color="success" size="small" />
      );
    } else if (confidence >= 0.6) {
      return (
        <Chip label={`${(confidence * 100).toFixed(0)}% - Дунд`} color="warning" size="small" />
      );
    } else {
      return <Chip label={`${(confidence * 100).toFixed(0)}% - Бага`} color="error" size="small" />;
    }
  };

  const columns = [
    {
      id: 'product',
      label: 'Барааны нэр',
      minWidth: 200,
      format: (row: InventoryForecast & Record<string, unknown>) =>
        row.product?.nameMongolian || 'N/A',
    },
    {
      id: 'period',
      label: 'Хугацаа',
      minWidth: 120,
      format: (row: InventoryForecast & Record<string, unknown>) =>
        `${row.year}-${String(row.month).padStart(2, '0')}`,
    },
    {
      id: 'predictedDemand',
      label: 'Таамагласан эрэлт',
      align: 'right' as const,
      minWidth: 150,
      format: (row: InventoryForecast & Record<string, unknown>) =>
        row.predictedDemand.toLocaleString(),
    },
    {
      id: 'recommendedOrderQuantity',
      label: 'Санал болгох захиалга',
      align: 'right' as const,
      minWidth: 180,
      format: (row: InventoryForecast & Record<string, unknown>) =>
        row.recommendedOrderQuantity.toLocaleString(),
    },
    {
      id: 'confidence',
      label: 'Итгэлцүүр',
      minWidth: 140,
      format: (row: InventoryForecast & Record<string, unknown>) =>
        getConfidenceChip(row.confidence),
    },
    {
      id: 'baselineStock',
      label: 'Үндсэн нөөц',
      align: 'right' as const,
      minWidth: 120,
      format: (row: InventoryForecast & Record<string, unknown>) =>
        row.baselineStock ? row.baselineStock.toLocaleString() : '-',
    },
  ];

  const months = [
    { value: 1, label: '1-р сар' },
    { value: 2, label: '2-р сар' },
    { value: 3, label: '3-р сар' },
    { value: 4, label: '4-р сар' },
    { value: 5, label: '5-р сар' },
    { value: 6, label: '6-р сар' },
    { value: 7, label: '7-р сар' },
    { value: 8, label: '8-р сар' },
    { value: 9, label: '9-р сар' },
    { value: 10, label: '10-р сар' },
    { value: 11, label: '11-р сар' },
    { value: 12, label: '12-р сар' },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Бараа нөөцлөх таамаглал</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={generating ? <RefreshIcon /> : <AddIcon />}
            onClick={handleGenerateAll}
            disabled={generating || loading}
          >
            {generating ? 'Үүсгэж байна...' : 'Таамаглал үүсгэх'}
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} disabled={forecasts.length === 0}>
            Excel татах
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Бараа нөөцлөх таамаглал нь өнгөрсөн хугацааны борлуулалтын дундаж дээр үндэслэн ирээдүйн
        эрэлтийг тооцоолдог. Таамагласан үр дүн нь зөвхөн санал болгох шинжтэй бөгөөд гэнэтийн
        өөрчлөлтийг тооцохгүй.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            select
            fullWidth
            label="Сар"
            value={monthFilter}
            onChange={(e) => {
              setMonthFilter(e.target.value ? Number(e.target.value) : '');
              setPage(1);
            }}
          >
            <MenuItem value="">Бүгд</MenuItem>
            {months.map((month) => (
              <MenuItem key={month.value} value={month.value}>
                {month.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            select
            fullWidth
            label="Жил"
            value={yearFilter}
            onChange={(e) => {
              setYearFilter(e.target.value ? Number(e.target.value) : '');
              setPage(1);
            }}
          >
            <MenuItem value="">Бүгд</MenuItem>
            {years.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {loading ? (
        <TableSkeleton />
      ) : (
        <DataTable<InventoryForecast & Record<string, unknown>>
          title="Таамагласан мэдээлэл"
          columns={columns}
          data={forecasts as (InventoryForecast & Record<string, unknown>)[]}
          searchable
          searchPlaceholder="Бараа хайх..."
          onRowClick={(row) => handleRowClick(row as InventoryForecast)}
        />
      )}

      {selectedForecast && (
        <ForecastDetailModal
          open={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedForecast(null);
          }}
          forecast={selectedForecast}
        />
      )}
    </Box>
  );
}
