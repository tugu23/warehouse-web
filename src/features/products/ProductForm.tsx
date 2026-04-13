import { useEffect, useState } from 'react';
import { Controller, FieldErrors, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  TextField,
} from '@mui/material';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import ProductPrices from '../../components/ProductPrices';
import { categoriesApi, productsApi } from '../../api';
import { Product, CreateProductRequest, UpdateProductRequest, Category } from '../../types';
import { productSchema } from '../../utils/validation';

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product: Product | null;
  onSubmit: (data: CreateProductRequest | UpdateProductRequest) => Promise<void>;
  onCancel: () => void;
}

function getFirstErrorMessage(formErrors: FieldErrors<ProductFormData>): string | undefined {
  for (const error of Object.values(formErrors)) {
    if (error && typeof error === 'object' && 'message' in error) {
      const message = error.message;
      if (typeof message === 'string' && message.length > 0) {
        return message;
      }
    }
  }

  return undefined;
}

export default function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const [barcodeWarning, setBarcodeWarning] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nameMongolian: '',
      productCode: '',
      barcode: '',
      categoryId: undefined,
      stockQuantity: 0,
      unitsPerBox: 1,
      netWeight: undefined,
      grossWeight: undefined,
      defaultPrice: undefined,
      pricePerBox: undefined,
      isActive: true,
    },
  });

  const barcodeValue = watch('barcode');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesApi.getAll({ limit: 'all' });
        setCategories(response.data.data?.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!product) {
      return;
    }

    reset({
      nameMongolian: product.nameMongolian ?? '',
      productCode: product.productCode ?? '',
      barcode: product.barcode ?? '',
      categoryId: product.categoryId ?? undefined,
      stockQuantity: product.stockQuantity ?? 0,
      unitsPerBox: product.unitsPerBox ?? 1,
      netWeight: product.netWeight != null ? Number(product.netWeight) : undefined,
      grossWeight: product.grossWeight != null ? Number(product.grossWeight) : undefined,
      defaultPrice: product.defaultPrice != null ? Number(product.defaultPrice) : undefined,
      pricePerBox: product.pricePerBox != null ? Number(product.pricePerBox) : undefined,
      isActive: product.isActive ?? true,
    });
  }, [product, reset]);

  useEffect(() => {
    const checkBarcode = async () => {
      if (!barcodeValue || barcodeValue.trim().length === 0) {
        setBarcodeWarning(null);
        return;
      }

      try {
        const response = await productsApi.getByBarcode(barcodeValue);
        const existingProduct = response.data.data?.product;

        if (existingProduct && existingProduct.id !== product?.id) {
          setBarcodeWarning(
            `⚠️ Энэ barcode "${existingProduct.nameMongolian}" бараанд бүртгэлтэй байна. Давхардсан barcode зөвшөөрөгдөнө.`
          );
        } else {
          setBarcodeWarning(null);
        }
      } catch {
        setBarcodeWarning(null);
      }
    };

    const timeoutId = setTimeout(checkBarcode, 500);
    return () => clearTimeout(timeoutId);
  }, [barcodeValue, product]);

  const handleFormSubmit = async (data: ProductFormData) => {
    await onSubmit({
      ...data,
      nameMongolian: data.nameMongolian.trim(),
      productCode: data.productCode?.trim() ? data.productCode.trim() : undefined,
      barcode: data.barcode?.trim() ? data.barcode.trim() : undefined,
      categoryId: data.categoryId,
      unitsPerBox: data.unitsPerBox,
      netWeight: data.netWeight,
      grossWeight: data.grossWeight,
      defaultPrice: data.defaultPrice,
      pricePerBox: data.pricePerBox,
      isActive: data.isActive,
    });
  };

  const handleInvalidSubmit = (formErrors: FieldErrors<ProductFormData>) => {
    toast.error(getFirstErrorMessage(formErrors) || 'Маягтын мэдээллээ шалгана уу');
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit, handleInvalidSubmit)}>
      {product && (
        <>
          <ProductPrices productId={product.id} />
          <Divider sx={{ my: 3 }} />
        </>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="nameMongolian"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                label="Нэр (Монгол) *"
                fullWidth
                error={!!errors.nameMongolian}
                helperText={errors.nameMongolian?.message}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="barcode"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                label="Бар код"
                fullWidth
                error={!!errors.barcode}
                helperText={errors.barcode?.message}
              />
            )}
          />
          {barcodeWarning && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              {barcodeWarning}
            </Alert>
          )}
        </Grid>

        {!barcodeValue?.trim() && (
          <Grid size={12}>
            <Alert severity="info">
              И-Баримт бүртгэхэд barcode эсвэл БҮНА код шаардлагатай. БҮНА кодыг барааны{' '}
              <strong>ангиллын тохиргоо</strong>-оос оруулна уу.
            </Alert>
          </Grid>
        )}

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="productCode"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                label="Барааны код"
                fullWidth
                error={!!errors.productCode}
                helperText={errors.productCode?.message}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Төрөл/Ангилал"
                fullWidth
                value={field.value ?? ''}
                onChange={(e) =>
                  field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)
                }
                error={!!errors.categoryId}
                helperText={errors.categoryId?.message}
              >
                <MenuItem value="">
                  <em>Сонгох...</em>
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.nameMongolian}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="stockQuantity"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Үлдэгдэл тоо ширхэг *"
                type="number"
                value={field.value ?? ''}
                fullWidth
                error={!!errors.stockQuantity}
                helperText={errors.stockQuantity?.message}
                onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="unitsPerBox"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Нэг хайрцагт байх тоо ширхэг"
                type="number"
                value={field.value ?? ''}
                fullWidth
                error={!!errors.unitsPerBox}
                helperText={errors.unitsPerBox?.message}
                onChange={(e) => {
                  const value = e.target.value;
                  field.onChange(value === '' ? undefined : parseInt(value, 10));
                }}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="netWeight"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Цэвэр жин (kg)"
                type="number"
                value={field.value ?? ''}
                fullWidth
                error={!!errors.netWeight}
                helperText={errors.netWeight?.message}
                inputProps={{ step: '0.01' }}
                onChange={(e) => {
                  const value = e.target.value;
                  field.onChange(value === '' ? undefined : parseFloat(value));
                }}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="grossWeight"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Бохир жин (kg)"
                type="number"
                value={field.value ?? ''}
                fullWidth
                error={!!errors.grossWeight}
                helperText={errors.grossWeight?.message}
                inputProps={{ step: '0.01' }}
                onChange={(e) => {
                  const value = e.target.value;
                  field.onChange(value === '' ? undefined : parseFloat(value));
                }}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="defaultPrice"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                label="Үндсэн үнэ (₮) *"
                type="number"
                fullWidth
                error={!!errors.defaultPrice}
                helperText={
                  errors.defaultPrice?.message || 'Төрлийн тусгай үнэ байхгүй үед ашиглагдана'
                }
                onChange={(e) => {
                  const value = e.target.value;
                  field.onChange(value === '' ? undefined : parseFloat(value));
                }}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="pricePerBox"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                label="Хайрцагны үнэ (₮)"
                type="number"
                fullWidth
                error={!!errors.pricePerBox}
                helperText={errors.pricePerBox?.message}
                onChange={(e) => {
                  const value = e.target.value;
                  field.onChange(value === '' ? undefined : parseFloat(value));
                }}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
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
