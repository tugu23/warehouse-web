import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, TextField, Grid } from '@mui/material';
import { productSchema } from '../../utils/validation';
import { Product, CreateProductRequest, UpdateProductRequest } from '../../types';
import { z } from 'zod';

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product: Product | null;
  onSubmit: (data: CreateProductRequest | UpdateProductRequest) => Promise<void>;
  onCancel: () => void;
}

export default function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nameMongolian: '',
      nameEnglish: '',
      productCode: '',
      supplierId: 1,
      stockQuantity: 0,
      priceWholesale: 0,
      priceRetail: 0,
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        nameMongolian: product.nameMongolian,
        nameEnglish: product.nameEnglish,
        productCode: product.productCode,
        supplierId: product.supplierId,
        stockQuantity: product.stockQuantity,
        priceWholesale: Number(product.priceWholesale),
        priceRetail: Number(product.priceRetail),
      });
    }
  }, [product, reset]);

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Controller
            name="nameEnglish"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Name (English)"
                fullWidth
                error={!!errors.nameEnglish}
                helperText={errors.nameEnglish?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="nameMongolian"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Name (Mongolian)"
                fullWidth
                error={!!errors.nameMongolian}
                helperText={errors.nameMongolian?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="productCode"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Product Code"
                fullWidth
                error={!!errors.productCode}
                helperText={errors.productCode?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="supplierId"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Supplier ID"
                type="number"
                fullWidth
                error={!!errors.supplierId}
                helperText={errors.supplierId?.message}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Controller
            name="stockQuantity"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Stock Quantity"
                type="number"
                fullWidth
                error={!!errors.stockQuantity}
                helperText={errors.stockQuantity?.message}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Controller
            name="priceWholesale"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Wholesale Price (₮)"
                type="number"
                fullWidth
                error={!!errors.priceWholesale}
                helperText={errors.priceWholesale?.message}
                onChange={(e) => field.onChange(parseFloat(e.target.value))}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Controller
            name="priceRetail"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Retail Price (₮)"
                type="number"
                fullWidth
                error={!!errors.priceRetail}
                helperText={errors.priceRetail?.message}
                onChange={(e) => field.onChange(parseFloat(e.target.value))}
              />
            )}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : product ? 'Update' : 'Create'}
        </Button>
      </Box>
    </Box>
  );
}
