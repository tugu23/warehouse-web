import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  TextField,
  Grid,
  FormControlLabel,
  Checkbox,
  Divider,
  Alert,
  MenuItem,
} from '@mui/material';
import { productSchema } from '../../utils/validation';
import { Product, CreateProductRequest, UpdateProductRequest, Category } from '../../types';
import { z } from 'zod';
import ProductPrices from '../../components/ProductPrices';
import { productsApi, categoriesApi } from '../../api';

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product: Product | null;
  onSubmit: (data: CreateProductRequest | UpdateProductRequest) => Promise<void>;
  onCancel: () => void;
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
      classificationCode: '',
      categoryId: undefined,
      stockQuantity: 0,
      unitsPerBox: 1,
      netWeight: 0,
      grossWeight: 0,
      priceWholesale: undefined,
      priceRetail: undefined,
      pricePerBox: 0,
      isActive: true,
    },
  });

  const barcodeValue = watch('barcode');
  const classificationCodeValue = watch('classificationCode');
  const showEbarimtWarning = !barcodeValue?.trim() && !classificationCodeValue?.trim();

  // Fetch categories on mount
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
    if (product) {
      reset({
        nameMongolian: product.nameMongolian,
        productCode: product.productCode,
        barcode: product.barcode || '',
        classificationCode: product.classificationCode || '',
        categoryId: product.categoryId || undefined,
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

  // Check for duplicate barcodes (just a warning, not blocking)
  useEffect(() => {
    const checkBarcode = async () => {
      if (barcodeValue && barcodeValue.trim().length > 0) {
        try {
          const response = await productsApi.getByBarcode(barcodeValue);
          const existingProduct = response.data.data?.product;

          // If found and it's not the current product being edited
          if (existingProduct && existingProduct.id !== product?.id) {
            setBarcodeWarning(
              `⚠️ Энэ barcode "${existingProduct.nameMongolian}" барааны кодонд бүртгэлтэй байна. Давхардсан barcode зөвшөөрөгдөнө.`
            );
          } else {
            setBarcodeWarning(null);
          }
        } catch {
          // No duplicate found or API error
          setBarcodeWarning(null);
        }
      } else {
        setBarcodeWarning(null);
      }
    };

    const timeoutId = setTimeout(checkBarcode, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [barcodeValue, product]);

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      {/* Show ProductPrices when editing existing product */}
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

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="classificationCode"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="БҮНА код (Classification Code)"
                fullWidth
                error={!!errors.classificationCode}
                helperText={
                  errors.classificationCode?.message || 'Бараа, үйлчилгээний нэгдсэн ангиллын код'
                }
              />
            )}
          />
        </Grid>

        {showEbarimtWarning && (
          <Grid size={12}>
            <Alert severity="warning">
              И-Баримт бүртгэхэд barcode эсвэл БҮНА код аль нэг нь заавал шаардлагатай. Аль нэгийг
              бөглөнө үү.
            </Alert>
          </Grid>
        )}

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
                value={field.value || ''}
                onChange={(e) =>
                  field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
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
                fullWidth
                error={!!errors.stockQuantity}
                helperText={errors.stockQuantity?.message}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                fullWidth
                error={!!errors.unitsPerBox}
                helperText={errors.unitsPerBox?.message}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
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
                fullWidth
                error={!!errors.netWeight}
                helperText={errors.netWeight?.message}
                inputProps={{ step: '0.01' }}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                fullWidth
                error={!!errors.grossWeight}
                helperText={errors.grossWeight?.message}
                inputProps={{ step: '0.01' }}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="priceWholesale"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                label="Бөөний үнэ (₮) *"
                type="number"
                fullWidth
                error={!!errors.priceWholesale}
                helperText={errors.priceWholesale?.message}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  field.onChange(isNaN(val) ? undefined : val);
                }}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="priceRetail"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                label="Жижиглэн үнэ (₮) *"
                type="number"
                fullWidth
                error={!!errors.priceRetail}
                helperText={errors.priceRetail?.message}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  field.onChange(isNaN(val) ? undefined : val);
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
