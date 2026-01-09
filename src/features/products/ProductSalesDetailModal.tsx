import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ProductSalesAnalytics } from '../../types';

interface ProductSalesDetailModalProps {
  open: boolean;
  onClose: () => void;
  analytics: ProductSalesAnalytics;
}

export default function ProductSalesDetailModal({
  open,
  onClose,
  analytics,
}: ProductSalesDetailModalProps) {
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon color="success" />;
      case 'down':
        return <TrendingDownIcon color="error" />;
      case 'stable':
        return <TrendingFlatIcon color="disabled" />;
    }
  };

  const monthlySalesData = analytics.monthlySales || [];
  const chartData = monthlySalesData.map((item) => ({
    month: item.month,
    sales: item.sales,
    isOutlier: item.isOutlier,
  }));

  const outlierMonths = monthlySalesData.filter((item) => item.isOutlier);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">{analytics.product?.nameMongolian}</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {getTrendIcon(analytics.trend)}
            <Typography variant="body1">
              {analytics.trendPercentage > 0 ? '+' : ''}
              {analytics.trendPercentage.toFixed(1)}%
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          <Grid size={12}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Одоогийн үлдэгдэл
                    </Typography>
                    <Typography variant="h6">{analytics.currentStock.toLocaleString()}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      1 сарын дундаж
                    </Typography>
                    <Typography variant="h6">{analytics.salesAverage1Month.toFixed(1)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      3 сарын дундаж
                    </Typography>
                    <Typography variant="h6">{analytics.salesAverage3Month.toFixed(1)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      6 сарын дундаж
                    </Typography>
                    <Typography variant="h6">{analytics.salesAverage6Month.toFixed(1)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {analytics.recommendedOrderQuantity && (
            <Grid size={12}>
              <Alert severity="info">
                <Typography variant="body1" fontWeight="bold">
                  Санал болгох захиалгын хэмжээ:{' '}
                  {analytics.recommendedOrderQuantity.toLocaleString()} ширхэг
                </Typography>
                <Typography variant="body2">
                  Энэ нь 3 сарын дундаж борлуулалт дээр үндэслэн тооцоолсон болно.
                </Typography>
              </Alert>
            </Grid>
          )}

          {outlierMonths.length > 0 && (
            <Grid size={12}>
              <Alert severity="warning" icon={<WarningIcon />}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  Дундаж тооцоололд хамаарагаагүй сарууд:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                  {outlierMonths.map((month) => (
                    <Chip
                      key={month.month}
                      label={`${month.month}: ${month.sales} ширхэг`}
                      size="small"
                      color="warning"
                    />
                  ))}
                </Box>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Эдгээр сарууд 50%-аас илүү огцом өөрчлөлттэй байсан тул дундаж тооцоололд
                  оруулаагүй.
                </Typography>
              </Alert>
            </Grid>
          )}

          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Сар бүрийн борлуулалт
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#8884d8" name="Борлуулалт (ширхэг)" />
                    <ReferenceLine
                      y={analytics.salesAverage3Month}
                      stroke="red"
                      strokeDasharray="3 3"
                      label={{ value: '3 сарын дундаж', position: 'insideTopRight' }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Чиг хандлага
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#8884d8"
                      name="Борлуулалт"
                      strokeWidth={2}
                      dot={(props: {
                        cx?: number;
                        cy?: number;
                        payload?: { isOutlier?: boolean };
                      }) => {
                        const { cx, cy, payload } = props;
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={payload?.isOutlier ? 6 : 4}
                            fill={payload?.isOutlier ? '#ff7300' : '#8884d8'}
                            stroke={payload?.isOutlier ? '#ff7300' : '#8884d8'}
                          />
                        );
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={12}>
            <Card sx={{ bgcolor: 'background.default' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Тооцоолох томьёо
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>1 сарын дундаж:</strong> Сүүлийн 1 сарын нийт борлуулалт
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>3 сарын дундаж:</strong> Сүүлийн 3 сарын нийт борлуулалтын дундаж (огцом
                  өөрчлөлттэй сарууд хамаарахгүй)
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>6 сарын дундаж:</strong> Сүүлийн 6 сарын нийт борлуулалтын дундаж (огцом
                  өөрчлөлттэй сарууд хамаарахгүй)
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Огцом өөрчлөлт:</strong> Өмнөх сарын борлуулалтаас 50%-аас илүү буурсан
                  эсвэл өссөн тохиолдол
                </Typography>
                <Typography variant="body2">
                  <strong>Санал болгох захиалга:</strong> 3 сарын дундаж × 1.2 (нөөц хэмжээ)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Хаах</Button>
      </DialogActions>
    </Dialog>
  );
}
