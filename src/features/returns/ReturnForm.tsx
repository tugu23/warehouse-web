import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { returnSchema } from '../../utils/validation';
import { CreateReturnRequest, Order, Product } from '../../types';
import { ordersApi, productsApi } from '../../api';
import { z } from 'zod';

type ReturnFormData = z.infer<typeof returnSchema>;

interface ReturnFormProps {
  onSubmit: (data: CreateReturnRequest) => Promise<void>;
  onCancel: () => void;
}

export default function ReturnForm({ onSubmit, onCancel }: ReturnFormProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReturnFormData>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      orderId: 0,
      productId: 0,
      quantity: 1,
      reason: '',
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        ordersApi.getAll({ status: 'Fulfilled' }),
        productsApi.getAll(),
      ]);
      setOrders(ordersRes.data.data?.orders || []);
      setProducts(productsRes.data.data?.products || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="orderId"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth margin="normal" error={!!errors.orderId}>
            <InputLabel>Order *</InputLabel>
            <Select
              {...field}
              label="Order *"
              onChange={(e) => field.onChange(Number(e.target.value))}
            >
              <MenuItem value={0}>Select an order</MenuItem>
              {orders.map((order) => (
                <MenuItem key={order.id} value={order.id}>
                  Order #{order.id} - {order.customer?.name}
                </MenuItem>
              ))}
            </Select>
            {errors.orderId && <FormHelperText>{errors.orderId.message}</FormHelperText>}
          </FormControl>
        )}
      />

      <Controller
        name="productId"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth margin="normal" error={!!errors.productId}>
            <InputLabel>Product *</InputLabel>
            <Select
              {...field}
              label="Product *"
              onChange={(e) => field.onChange(Number(e.target.value))}
            >
              <MenuItem value={0}>Select a product</MenuItem>
              {products.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.nameEnglish}
                </MenuItem>
              ))}
            </Select>
            {errors.productId && <FormHelperText>{errors.productId.message}</FormHelperText>}
          </FormControl>
        )}
      />

      <Controller
        name="quantity"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Quantity *"
            type="number"
            fullWidth
            margin="normal"
            error={!!errors.quantity}
            helperText={errors.quantity?.message}
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
            label="Reason *"
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
          {isSubmitting ? 'Creating...' : 'Create Return'}
        </Button>
      </Box>
    </Box>
  );
}
