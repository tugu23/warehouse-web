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
import {
  Edit as EditIcon,
  Inventory2 as InventoryIcon,
  MonetizationOn as PriceIcon,
  LocalOffer as PromotionIcon,
} from '@mui/icons-material';
import ProductPrices from '../../components/ProductPrices';
import { Product, Promotion } from '../../types';

interface ProductDetailsModalProps {
  product: Product | null;
  onEdit: () => void;
  onManageInventory: () => void;
  onManagePrices: () => void;
  onManagePromotions: () => void;
  canManage: boolean;
}

function describePromotion(p: Promotion): string {
  if (p.type === 'PERCENT_DISCOUNT') {
    return `${Number(p.discountPercent ?? 0)}% хөнгөлөлт`;
  }
  return `${p.buyQty ?? 0}+${p.freeQty ?? 0}`;
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('mn-MN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function ProductDetailsModal({
  product,
  onEdit,
  onManageInventory,
  onManagePrices,
  onManagePromotions,
  canManage,
}: ProductDetailsModalProps) {
  if (!product) return null;

  const now = Date.now();
  const activePromotions = (product.promotions || []).filter((p) => {
    const start = new Date(p.startDate).getTime();
    const end = new Date(p.endDate).getTime();
    return p.isActive && start <= now && end >= now;
  });

  return (
    <Box>
      <Stack spacing={3}>
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

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Үнийн мэдээлэл
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  Үндсэн үнэ
                </Typography>
                <Typography variant="h6" color="primary">
                  ₮{Number(product.defaultPrice ?? 0).toLocaleString()}
                </Typography>
              </Grid>
              {product.pricePerBox ? (
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Хайрцагны үнэ
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    ₮{Number(product.pricePerBox).toLocaleString()}
                  </Typography>
                </Grid>
              ) : null}
            </Grid>
            <ProductPrices productId={product.id} />
            {activePromotions.length > 0 && (
              <Box mt={2}>
                <Typography variant="caption" color="text.secondary">
                  Идэвхтэй урамшуулал
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" mt={0.5}>
                  {activePromotions.map((p) => (
                    <Chip
                      key={p.id}
                      icon={<PromotionIcon />}
                      color="success"
                      size="small"
                      label={`${describePromotion(p)} • ${formatDateShort(p.endDate)} хүртэл`}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>

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
                  color="secondary"
                  startIcon={<PriceIcon />}
                  onClick={onManagePrices}
                >
                  Үнэ засах
                </Button>
                <Button
                  variant="contained"
                  color="info"
                  startIcon={<InventoryIcon />}
                  onClick={onManageInventory}
                >
                  Үлдэгдэл засах
                </Button>
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<PromotionIcon />}
                  onClick={onManagePromotions}
                >
                  Урамшуулал нэмэх
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
