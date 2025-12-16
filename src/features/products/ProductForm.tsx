import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, TextField, Grid, FormControlLabel, Checkbox } from '@mui/material';
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
      nameKorean: '',
      nameEnglish: '',
      productCode: '',
      barcode: '',
      category: '',
      supplierId: 1,
      stockQuantity: 0,
      unitsPerBox: 1,
      netWeight: 0,
      grossWeight: 0,
      priceWholesale: 0,
      priceRetail: 0,
      pricePerBox: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        nameMongolian: product.nameMongolian,
        nameKorean: product.nameKorean || '',
        nameEnglish: product.nameEnglish,
        productCode: product.productCode,
        barcode: product.barcode || '',
        category: product.category || '',
        supplierId: product.supplierId,
        stockQuantity: product.stockQuantity,
        unitsPerBox: product.unitsPerBox || 1,
        netWeight: product.netWeight || 0,
        grossWeight: product.grossWeight || 0,
        priceWholesale: Number(product.priceWholesale),
        priceRetail: Number(product.priceRetail),
        pricePerBox: product.pricePerBox || 0,
        isActive: product.isActive ?? true,
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
                label="Нэр (Англи) *"
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
                label="Нэр (Монгол) *"
                fullWidth
                error={!!errors.nameMongolian}
                helperText={errors.nameMongolian?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="nameKorean"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Нэр (Солонгос)"
                fullWidth
                error={!!errors.nameKorean}
                helperText={errors.nameKorean?.message}
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
                label="Барааны код *"
                fullWidth
                error={!!errors.productCode}
                helperText={errors.productCode?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="barcode"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Бар код"
                fullWidth
                error={!!errors.barcode}
                helperText={errors.barcode?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Төрөл/Ангилал"
                fullWidth
                error={!!errors.category}
                helperText={errors.category?.message}
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
                label="Нийлүүлэгч ID *"
                type="number"
                fullWidth
                error={!!errors.supplierId}
                helperText={errors.supplierId?.message}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="stockQuantity"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Үлдэгдэл тоо ширхэг *"
                type="number"
                fullWidth
                error={!!errors.stockQuantity}
                helperText={errors.stockQuantity?.message}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="unitsPerBox"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Нэг хайрцагт байх тоо ширхэг"
                type="number"
                fullWidth
                error={!!errors.unitsPerBox}
                helperText={errors.unitsPerBox?.message}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="netWeight"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Цэвэр жин (kg)"
                type="number"
                fullWidth
                error={!!errors.netWeight}
                helperText={errors.netWeight?.message}
                inputProps={{ step: '0.01' }}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="grossWeight"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Бохир жин (kg)"
                type="number"
                fullWidth
                error={!!errors.grossWeight}
                helperText={errors.grossWeight?.message}
                inputProps={{ step: '0.01' }}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                label="Бөөний үнэ (₮) *"
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
                label="Жижиглэн үнэ (₮) *"
                type="number"
                fullWidth
                error={!!errors.priceRetail}
                helperText={errors.priceRetail?.message}
                onChange={(e) => field.onChange(parseFloat(e.target.value))}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Controller
            name="pricePerBox"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Хайрцагны үнэ (₮)"
                type="number"
                fullWidth
                error={!!errors.pricePerBox}
                helperText={errors.pricePerBox?.message}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    {...field}
                    checked={field.value ?? true}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                }
                label="Идэвхтэй (Active)"
              />
            )}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={isSubmitting}>
          Болих
        </Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Хадгалж байна...' : product ? 'Засах' : 'Үүсгэх'}
        </Button>
      </Box>
    </Box>
  );
}
