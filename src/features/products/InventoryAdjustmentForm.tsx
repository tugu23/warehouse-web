import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';
import { toast } from 'react-hot-toast';
import { inventoryAdjustmentSchema } from '../../utils/validation';
import { Product } from '../../types';
import { productsApi } from '../../api';
import { z } from 'zod';

type InventoryAdjustmentFormData = z.infer<typeof inventoryAdjustmentSchema>;

interface InventoryAdjustmentFormProps {
  product: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function InventoryAdjustmentForm({
  product,
  onSuccess,
  onCancel,
}: InventoryAdjustmentFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InventoryAdjustmentFormData>({
    resolver: zodResolver(inventoryAdjustmentSchema),
    defaultValues: {
      productId: product?.id || 0,
      adjustment: 0,
      reason: '',
    },
  });

  const onSubmit = async (data: InventoryAdjustmentFormData) => {
    try {
      await productsApi.adjustInventory(data);
      toast.success('Inventory adjusted successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error adjusting inventory:', error);
    }
  };

  if (!product) return null;

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Alert severity="info" sx={{ mb: 3 }}>
        Current Stock: <strong>{product.stockQuantity} units</strong>
      </Alert>

      <Controller
        name="adjustment"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Adjustment Amount"
            type="number"
            fullWidth
            margin="normal"
            helperText={
              errors.adjustment?.message || 'Use positive numbers to add stock, negative to remove'
            }
            error={!!errors.adjustment}
            onChange={(e) => field.onChange(parseInt(e.target.value))}
          />
        )}
      />

      <Controller
        name="reason"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Reason"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            error={!!errors.reason}
            helperText={errors.reason?.message}
          />
        )}
      />

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Adjusting...' : 'Adjust Inventory'}
        </Button>
      </Box>
    </Box>
  );
}
