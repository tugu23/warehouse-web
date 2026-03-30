import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { Edit as EditIcon, Inventory2 as InventoryIcon } from '@mui/icons-material';
import { Product } from '../../types';

interface ProductDetailsModalProps {
  product: Product | null;
  onEdit: () => void;
  onManageInventory: () => void;
  canManage: boolean;
}

export default function ProductDetailsModal({
  product,
  onEdit,
  onManageInventory,
  canManage,
}: ProductDetailsModalProps) {
  if (!product) return null;

  return (
    <Box>
      <Stack spacing={3}>
        {/* Үндсэн мэдээлэл */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Үндсэн мэдээлэл
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Бараа код
                </Typography>
                <Typography variant="body1">{product.productCode || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Бар код
                </Typography>
                <Typography variant="body1">{product.barcode || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Нэр (Монгол)
                </Typography>
                <Typography variant="body1">{product.nameMongolian}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Ангилал
                </Typography>
                <Typography variant="body1">{product.category?.nameMongolian || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Төлөв
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={product.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                    color={product.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Агуулахын мэдээлэл */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Агуулахын мэдээлэл
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  Үлдэгдэл
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={product.stockQuantity}
                    color={
                      product.stockQuantity < 10
                        ? 'error'
                        : product.stockQuantity < 20
                          ? 'warning'
                          : 'success'
                    }
                    size="medium"
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  Хайрцагт ширхэг
                </Typography>
                <Typography variant="body1">{product.unitsPerBox || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  Цэвэр жин
                </Typography>
                <Typography variant="body1">
                  {product.netWeight ? `${product.netWeight} кг` : '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  Бохир жин
                </Typography>
                <Typography variant="body1">
                  {product.grossWeight ? `${product.grossWeight} кг` : '-'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Үнийн мэдээлэл */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              💰 Үнийн мэдээлэл
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  Бөөний үнэ
                </Typography>
                <Typography variant="h6" color="primary">
                  ₮{Number(product.priceWholesale).toLocaleString()}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  Жижиглэн үнэ
                </Typography>
                <Typography variant="h6" color="secondary">
                  ₮{Number(product.priceRetail).toLocaleString()}
                </Typography>
              </Grid>
              {product.pricePerBox && (
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Хайрцагны үнэ
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    ₮{Number(product.pricePerBox).toLocaleString()}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Үйлдлүүд */}
        {canManage && (
          <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Үйлдлүүд
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={onEdit}
                >
                  Засах
                </Button>
                <Button
                  variant="contained"
                  color="info"
                  startIcon={<InventoryIcon />}
                  onClick={onManageInventory}
                >
                  Үлдэгдэл засах
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
