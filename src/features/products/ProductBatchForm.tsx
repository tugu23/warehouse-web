import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, Button, TextField, Grid, FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import { CreateProductBatchRequest, UpdateProductBatchRequest, Product, Supplier } from '../../types';
import { productsApi } from '../../api';

interface ProductBatchFormProps {
  batch: any | null;
  onSubmit: (data: CreateProductBatchRequest | UpdateProductBatchRequest) => Promise<void>;
  onCancel: () => void;
}

export default function ProductBatchForm({ batch, onSubmit, onCancel }: ProductBatchFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      productId: batch?.productId || 0,
      batchNumber: batch?.batchNumber || '',
      quantity: batch?.quantity || 0,
      receivedDate: batch?.receivedDate || '',
      expiryDate: batch?.expiryDate || '',
      supplierId: batch?.supplierId || 0,
      priceWholesale: batch?.priceWholesale || 0,
      priceRetail: batch?.priceRetail || 0,
    },
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsApi.getAll();
      setProducts(response.data.data?.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Controller
            name="batchNumber"
            control={control}
            rules={{ required: 'Багцын дугаар шаардлагатай' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Багцын дугаар *"
                fullWidth
                error={!!errors.batchNumber}
                helperText={errors.batchNumber?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="quantity"
            control={control}
            rules={{ required: 'Тоо ширхэг шаардлагатай', min: { value: 1, message: 'Тоо ширхэг 0-ээс их байх ёстой' } }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Тоо ширхэг *"
                type="number"
                fullWidth
                error={!!errors.quantity}
                helperText={errors.quantity?.message}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="receivedDate"
            control={control}
            rules={{ required: 'Ирсэн огноо шаардлагатай' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Ирсэн огноо *"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!errors.receivedDate}
                helperText={errors.receivedDate?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="expiryDate"
            control={control}
            rules={{ required: 'Дуусах хугацаа шаардлагатай' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Дуусах хугацаа *"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!errors.expiryDate}
                helperText={errors.expiryDate?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="priceWholesale"
            control={control}
            rules={{ required: 'Бөөний үнэ шаардлагатай', min: { value: 0, message: 'Үнэ 0-ээс их байх ёстой' } }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Бөөний үнэ *"
                type="number"
                fullWidth
                error={!!errors.priceWholesale}
                helperText={errors.priceWholesale?.message}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="priceRetail"
            control={control}
            rules={{ required: 'Жижиглэн үнэ шаардлагатай', min: { value: 0, message: 'Үнэ 0-ээс их байх ёстой' } }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Жижиглэн үнэ *"
                type="number"
                fullWidth
                error={!!errors.priceRetail}
                helperText={errors.priceRetail?.message}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            )}
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
        <Button onClick={onCancel} disabled={isSubmitting}>
          Болих
        </Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Хадгалж байна...' : batch ? 'Засах' : 'Үүсгэх'}
        </Button>
      </Box>
    </Box>
  );
}

