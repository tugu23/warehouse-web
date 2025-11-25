import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  Divider,
  Paper,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
  CalendarMonth as CalendarIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { InventoryForecast } from '../../types';

interface ForecastDetailModalProps {
  open: boolean;
  onClose: () => void;
  forecast: InventoryForecast;
}

export default function ForecastDetailModal({ open, onClose, forecast }: ForecastDetailModalProps) {
  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'default';
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const getConfidenceLabel = (confidence?: number) => {
    if (!confidence) return 'Тодорхойгүй';
    if (confidence >= 0.8) return 'Өндөр итгэлцүүр';
    if (confidence >= 0.6) return 'Дунд итгэлцүүр';
    return 'Бага итгэлцүүр';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5">{forecast.product?.nameMongolian}</Typography>
          <Chip
            label={`${forecast.year}-${String(forecast.month).padStart(2, '0')}`}
            color="primary"
            size="small"
          />
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Predicted Demand */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUpIcon color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  Таамагласан эрэлт
                </Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {forecast.predictedDemand.toLocaleString()} ширхэг
              </Typography>
            </Paper>
          </Grid>

          {/* Recommended Order */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <InventoryIcon color="success" />
                <Typography variant="subtitle2" color="text.secondary">
                  Санал болгох захиалга
                </Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {forecast.recommendedOrderQuantity.toLocaleString()} ширхэг
              </Typography>
            </Paper>
          </Grid>

          {/* Confidence Level */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <InfoIcon color="info" />
                <Typography variant="subtitle2" color="text.secondary">
                  Итгэлцүүр
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h4">
                  {forecast.confidence
                    ? `${(forecast.confidence * 100).toFixed(0)}%`
                    : 'Тодорхойгүй'}
                </Typography>
                <Chip
                  label={getConfidenceLabel(forecast.confidence)}
                  color={getConfidenceColor(forecast.confidence)}
                  size="small"
                />
              </Box>
            </Paper>
          </Grid>

          {/* Baseline Stock */}
          {forecast.baselineStock !== undefined && forecast.baselineStock !== null && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CalendarIcon color="secondary" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Үндсэн нөөц
                  </Typography>
                </Box>
                <Typography variant="h4" color="secondary.main">
                  {forecast.baselineStock.toLocaleString()} ширхэг
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Product Details */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Барааны мэдээлэл
            </Typography>
          </Grid>

          {forecast.product && (
            <>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Монгол нэр:
                </Typography>
                <Typography variant="body1">{forecast.product.nameMongolian}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Англи нэр:
                </Typography>
                <Typography variant="body1">{forecast.product.nameEnglish || 'N/A'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Барааны код:
                </Typography>
                <Typography variant="body1">{forecast.product.productCode || 'N/A'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Одоогийн үлдэгдэл:
                </Typography>
                <Typography variant="body1">
                  {forecast.product.stockQuantity?.toLocaleString() || 0} ширхэг
                </Typography>
              </Grid>
            </>
          )}

          {/* Forecast Metadata */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Таамаглалын мэдээлэл
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Үүсгэсэн огноо:
            </Typography>
            <Typography variant="body1">
              {new Date(forecast.createdAt).toLocaleString('mn-MN')}
            </Typography>
          </Grid>

          {forecast.updatedAt && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Шинэчилсэн огноо:
              </Typography>
              <Typography variant="body1">
                {new Date(forecast.updatedAt).toLocaleString('mn-MN')}
              </Typography>
            </Grid>
          )}

          {/* Explanation */}
          <Grid size={{ xs: 12 }}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'info.lighter' }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Тайлбар:</strong> Таамагласан эрэлт нь өнгөрсөн хугацааны борлуулалтын
                дундаж дээр үндэслэсэн байна. Санал болгох захиалгын тоо нь таамагласан эрэлт болон
                одоогийн үлдэгдэл, үндсэн нөөцийг харгалзан тооцсон байна.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Хаах
        </Button>
      </DialogActions>
    </Dialog>
  );
}
