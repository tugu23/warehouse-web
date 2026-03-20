import { useState } from 'react';
import { Box, Button, TextField, Card, CardContent, Typography, Alert } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import DataTable from '../../components/DataTable';
import { productsApi } from '../../api';
import { MonthlyInventory } from '../../types';
import { exportMonthlyInventoryToExcel } from '../../utils/excelExport';
import { TableSkeleton } from '../../components/LoadingSkeletons';

export default function MonthlyInventoryPage() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [inventory, setInventory] = useState<MonthlyInventory[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await productsApi.getMonthlyInventory(month);
      setInventory(response.data.data?.inventory || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Мэдээлэл татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (inventory.length === 0) {
      toast.error('Экспорт хийх мэдээлэл байхгүй байна');
      return;
    }

    setExporting(true);
    try {
      await exportMonthlyInventoryToExcel(inventory, month);
      toast.success('Excel файл амжилттай татагдлаа');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Экспорт хийхэд алдаа гарлаа');
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    {
      id: 'product',
      label: 'Бараа',
      minWidth: 200,
      format: (row: MonthlyInventory) => row.product?.nameMongolian || 'N/A',
    },
    {
      id: 'openingStock',
      label: 'Эхлэх үлдэгдэл',
      align: 'right' as const,
      minWidth: 120,
    },
    {
      id: 'received',
      label: 'Орлого',
      align: 'right' as const,
      minWidth: 100,
    },
    {
      id: 'sold',
      label: 'Зарагдсан',
      align: 'right' as const,
      minWidth: 100,
    },
    {
      id: 'returned',
      label: 'Буцаалт',
      align: 'right' as const,
      minWidth: 100,
    },
    {
      id: 'adjusted',
      label: 'Тохиргоо',
      align: 'right' as const,
      minWidth: 100,
    },
    {
      id: 'closingStock',
      label: 'Эцсийн үлдэгдэл',
      align: 'right' as const,
      minWidth: 120,
      format: (row: MonthlyInventory) => (
        <Typography fontWeight="bold">{row.closingStock}</Typography>
      ),
    },
  ];

  const totals =
    inventory.length > 0
      ? {
          openingStock: inventory.reduce((sum, item) => sum + item.openingStock, 0),
          received: inventory.reduce((sum, item) => sum + item.received, 0),
          sold: inventory.reduce((sum, item) => sum + item.sold, 0),
          returned: inventory.reduce((sum, item) => sum + item.returned, 0),
          adjusted: inventory.reduce((sum, item) => sum + item.adjusted, 0),
          closingStock: inventory.reduce((sum, item) => sum + item.closingStock, 0),
        }
      : null;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Сарын Үлдэгдлийн Тайлан
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Сонгосон сарын барааны эхлэх болон эцсийн үлдэгдэл, хөдөлгөөний дэлгэрэнгүй мэдээллийг
        харуулна.
      </Alert>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label="Сар сонгох"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 200 }}
            />
            <Button variant="contained" onClick={fetchInventory} disabled={loading}>
              {loading ? 'Татаж байна...' : 'Мэдээлэл татах'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={exporting || inventory.length === 0}
            >
              {exporting ? 'Экспорт хийж байна...' : 'Excel татах'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {totals && (
        <Card sx={{ mb: 2, bgcolor: 'primary.light' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Нийт
            </Typography>
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Эхлэх үлдэгдэл
                </Typography>
                <Typography variant="h6">{totals.openingStock}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Орлого
                </Typography>
                <Typography variant="h6">{totals.received}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Зарагдсан
                </Typography>
                <Typography variant="h6">{totals.sold}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Буцаалт
                </Typography>
                <Typography variant="h6">{totals.returned}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Эцсийн үлдэгдэл
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {totals.closingStock}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          title={`Сарын тайлан - ${month}`}
          columns={columns}
          data={inventory}
          searchable
          searchPlaceholder="Бараа хайх..."
        />
      )}
    </Box>
  );
}
