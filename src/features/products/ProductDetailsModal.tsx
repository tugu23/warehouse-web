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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Edit as EditIcon,
  Inventory2 as InventoryIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { Product } from '../../types';
import ExpiryBadge from '../../components/ExpiryBadge';
import PriceList from '../../components/PriceList';
import { formatExpiryDate } from '../../utils/expiry.utils';

interface ProductDetailsModalProps {
  product: Product | null;
  onEdit: () => void;
  onManageInventory: () => void;
  onManagePrices: () => void;
  canManage: boolean;
}

export default function ProductDetailsModal({
  product,
  onEdit,
  onManageInventory,
  onManagePrices,
  canManage,
}: ProductDetailsModalProps) {
  if (!product) return null;

  return (
    <Box>
      <Stack spacing={3}>
        {/* Basic Information */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Product Code
                </Typography>
                <Typography variant="body1">{product.productCode || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Barcode
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
                  Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={product.isActive ? 'Active' : 'Inactive'}
                    color={product.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Inventory Information */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Inventory Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  Stock Quantity
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
                  Units Per Box
                </Typography>
                <Typography variant="body1">{product.unitsPerBox || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  Net Weight
                </Typography>
                <Typography variant="body1">
                  {product.netWeight ? `${product.netWeight} kg` : '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  Gross Weight
                </Typography>
                <Typography variant="body1">
                  {product.grossWeight ? `${product.grossWeight} kg` : '-'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Price Information */}
        {product.prices && product.prices.length > 0 && <PriceList prices={product.prices} />}

        {/* Batch Information */}
        {product.batches && product.batches.length > 0 && (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Багцын мэдээлэл
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Багцын дугаар</TableCell>
                      <TableCell align="center">Тоо ширхэг</TableCell>
                      <TableCell>Ирсэн огноо</TableCell>
                      <TableCell>Дуусах огноо</TableCell>
                      <TableCell>Статус</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {product.batches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {batch.batchNumber}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={batch.quantity} size="small" color="primary" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatExpiryDate(batch.receivedDate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatExpiryDate(batch.expiryDate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <ExpiryBadge batch={batch} showDate={false} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Нийт {product.batches.length} багц бүртгэлтэй
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Pricing Information */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Pricing Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  Wholesale Price
                </Typography>
                <Typography variant="h6" color="primary">
                  ₮{Number(product.priceWholesale).toLocaleString()}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  Retail Price
                </Typography>
                <Typography variant="h6" color="secondary">
                  ₮{Number(product.priceRetail).toLocaleString()}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">
                  Price Per Box
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  ₮{product.pricePerBox ? Number(product.pricePerBox).toLocaleString() : '-'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Actions */}
        {canManage && (
          <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Actions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={onEdit}
                >
                  Edit Product
                </Button>
                <Button
                  variant="contained"
                  color="info"
                  startIcon={<InventoryIcon />}
                  onClick={onManageInventory}
                >
                  Adjust Inventory
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<MoneyIcon />}
                  onClick={onManagePrices}
                >
                  Manage Prices
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
