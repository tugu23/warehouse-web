import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { productPricesApi } from '../../api';
import { ProductPrice, CreateProductPriceRequest, UpdateProductPriceRequest } from '../../types';

interface PriceManagementProps {
  productId: number;
  onUpdate?: () => void;
}

interface CustomerTypeOption {
  id: number;
  name: string;
}

// Common customer types - you might want to fetch these from backend in the future
const CUSTOMER_TYPES: CustomerTypeOption[] = [
  { id: 1, name: 'Retail' },
  { id: 2, name: 'Wholesale' },
  { id: 3, name: 'Market' },
  { id: 4, name: 'Special' },
];

export default function PriceManagement({ productId, onUpdate }: PriceManagementProps) {
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductPriceRequest | UpdateProductPriceRequest>({
    defaultValues: {
      productId,
      customerTypeId: 0,
      price: 0,
    },
  });

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await productPricesApi.getByProductId(productId);
      setPrices(response.data.data?.productPrices || []);
    } catch (error) {
      console.error('Error fetching prices:', error);
      toast.error('Үнийн мэдээлэл татахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const handleCreate = async (data: CreateProductPriceRequest | UpdateProductPriceRequest) => {
    try {
      const createData = data as CreateProductPriceRequest;
      await productPricesApi.create({ ...createData, productId });
      toast.success('Үнэ амжилттай нэмэгдлээ!');
      setShowAddForm(false);
      reset();
      fetchPrices();
      onUpdate?.();
    } catch (error) {
      console.error('Error creating price:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Үнэ нэмэхэд алдаа гарлаа');
    }
  };

  const handleUpdate = async (id: number, data: UpdateProductPriceRequest) => {
    try {
      await productPricesApi.update(id, data);
      toast.success('Үнэ амжилттай шинэчлэгдлээ!');
      setEditingId(null);
      reset();
      fetchPrices();
      onUpdate?.();
    } catch (error) {
      console.error('Error updating price:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Үнэ шинэчлэхэд алдаа гарлаа');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Энэ үнийг устгахдаа итгэлтэй байна уу?')) return;

    try {
      await productPricesApi.delete(id);
      toast.success('Үнэ амжилттай устгагдлаа!');
      fetchPrices();
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting price:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Үнэ устгахад алдаа гарлаа');
    }
  };

  const handleEdit = (price: ProductPrice) => {
    setEditingId(price.id);
    reset({
      customerTypeId: price.customerTypeId,
      price: price.price,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    reset();
  };

  const handleAddNew = () => {
    setShowAddForm(true);
    reset({
      productId,
      customerTypeId: 0,
      price: 0,
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Харилцагчийн төрөл бүрт зориулсан үнэ</Typography>
        {!showAddForm && (
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAddNew}>
            Үнэ нэмэх
          </Button>
        )}
      </Box>

      {prices.length === 0 && !showAddForm && (
        <Alert severity="info">
          Одоогоор харилцагчийн төрөл бүрт зориулсан үнэ тохируулаагүй байна.
        </Alert>
      )}

      {/* Add New Price Form */}
      {showAddForm && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'action.hover' }}>
          <Typography variant="subtitle2" gutterBottom>
            Шинэ үнэ нэмэх
          </Typography>
          <Box component="form" onSubmit={handleSubmit(handleCreate)}>
            <Grid container spacing={2} alignItems="flex-start">
              <Grid size={{ xs: 12, sm: 5 }}>
                <Controller
                  name="customerTypeId"
                  control={control}
                  rules={{
                    validate: (value) => (value && value > 0) || 'Харилцагчийн төрөл сонгоно уу',
                  }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.customerTypeId} size="small">
                      <InputLabel>Харилцагчийн төрөл *</InputLabel>
                      <Select
                        {...field}
                        label="Харилцагчийн төрөл *"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      >
                        <MenuItem value={0}>Сонгох</MenuItem>
                        {CUSTOMER_TYPES.map((type) => (
                          <MenuItem key={type.id} value={type.id}>
                            {type.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.customerTypeId && (
                        <FormHelperText>{errors.customerTypeId.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <Controller
                  name="price"
                  control={control}
                  rules={{
                    validate: (value) => (value && value > 0) || 'Үнэ оруулна уу',
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Үнэ (₮) *"
                      type="number"
                      fullWidth
                      size="small"
                      error={!!errors.price}
                      helperText={errors.price?.message}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      inputProps={{ step: '0.01' }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="small"
                    fullWidth
                    disabled={isSubmitting}
                  >
                    <SaveIcon fontSize="small" />
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={() => {
                      setShowAddForm(false);
                      reset();
                    }}
                    disabled={isSubmitting}
                  >
                    Болих
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}

      {/* Existing Prices List */}
      {prices.map((price) => (
        <Paper key={price.id} sx={{ p: 2, mb: 1 }}>
          {editingId === price.id ? (
            // Edit Mode
            <Box component="form" onSubmit={handleSubmit((data) => handleUpdate(price.id, data))}>
              <Grid container spacing={2} alignItems="flex-start">
                <Grid size={{ xs: 12, sm: 5 }}>
                  <Controller
                    name="customerTypeId"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth size="small">
                        <InputLabel>Харилцагчийн төрөл *</InputLabel>
                        <Select
                          {...field}
                          label="Харилцагчийн төрөл *"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        >
                          {CUSTOMER_TYPES.map((type) => (
                            <MenuItem key={type.id} value={type.id}>
                              {type.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 5 }}>
                  <Controller
                    name="price"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Үнэ (₮) *"
                        type="number"
                        fullWidth
                        size="small"
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        inputProps={{ step: '0.01' }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="small"
                      fullWidth
                      disabled={isSubmitting}
                    >
                      <SaveIcon fontSize="small" />
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                    >
                      Болих
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          ) : (
            // View Mode
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body1" fontWeight="bold">
                  {price.customerType.typeName}
                </Typography>
                <Typography variant="h6" color="primary">
                  ₮{price.price.toLocaleString()}
                </Typography>
                {price.updatedAt && (
                  <Typography variant="caption" color="text.secondary">
                    Сүүлд шинэчилсэн: {new Date(price.updatedAt).toLocaleString('mn-MN')}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton size="small" color="primary" onClick={() => handleEdit(price)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(price.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          )}
        </Paper>
      ))}

      <Divider sx={{ my: 3 }} />
      <Alert severity="info">
        <strong>Анхаар:</strong> Бараа бүрт харилцагчийн төрөл бүрт зориулсан үнэ тохируулж болно.
        Жишээ нь: Retail (Жижиглэн), Wholesale (Бөөний), Market (Захын лангуу) гэх мэт.
      </Alert>
    </Box>
  );
}
