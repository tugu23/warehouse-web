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
  Typography,
  Divider,
} from '@mui/material';
import { returnSchema } from '../../utils/validation';
import { CreateReturnRequest, Order, Product, Customer } from '../../types';
import { ordersApi, productsApi, customersApi } from '../../api';
import { z } from 'zod';

type ReturnFormData = z.infer<typeof returnSchema>;

interface ReturnFormProps {
  onSubmit: (data: CreateReturnRequest) => Promise<void>;
  onCancel: () => void;
}

export default function ReturnForm({ onSubmit, onCancel }: ReturnFormProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

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
      customerId: undefined,
      unitPrice: undefined,
      expiryDate: '',
      notes: '',
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes, customersRes] = await Promise.all([
        ordersApi.getAll({ status: 'Fulfilled' }),
        productsApi.getAll(),
        customersApi.getAll({ limit: 1000 }),
      ]);
      setOrders(ordersRes.data.data?.orders || []);
      setProducts(productsRes.data.data?.products || []);
      setCustomers(customersRes.data.data?.customers || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="h6" gutterBottom>
        Үндсэн мэдээлэл
      </Typography>

      <Controller
        name="orderId"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth margin="normal" error={!!errors.orderId}>
            <InputLabel>Захиалга *</InputLabel>
            <Select
              {...field}
              label="Захиалга *"
              onChange={(e) => field.onChange(Number(e.target.value))}
            >
              <MenuItem value={0}>Захиалга сонгох</MenuItem>
              {orders.map((order) => (
                <MenuItem key={order.id} value={order.id}>
                  Захиалга #{order.id} - {order.customer?.name}
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
            <InputLabel>Бараа *</InputLabel>
            <Select
              {...field}
              label="Бараа *"
              onChange={(e) => field.onChange(Number(e.target.value))}
            >
              <MenuItem value={0}>Бараа сонгох</MenuItem>
              {products.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.nameEnglish} - {product.nameMongolian}
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
            label="Тоо ширхэг *"
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
            label="Шалтгаан *"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            error={!!errors.reason}
            helperText={errors.reason?.message}
          />
        )}
      />

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Нэмэлт мэдээлэл (Заавал биш)
      </Typography>

      <Controller
        name="customerId"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth margin="normal" error={!!errors.customerId}>
            <InputLabel>Харилцагч</InputLabel>
            <Select
              {...field}
              label="Харилцагч"
              value={field.value || ''}
              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
            >
              <MenuItem value="">Харилцагч сонгохгүй байх</MenuItem>
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.name}
                </MenuItem>
              ))}
            </Select>
            {errors.customerId && <FormHelperText>{errors.customerId.message}</FormHelperText>}
          </FormControl>
        )}
      />

      <Controller
        name="unitPrice"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Нэгж үнэ (₮)"
            type="number"
            fullWidth
            margin="normal"
            error={!!errors.unitPrice}
            helperText={errors.unitPrice?.message}
            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
            inputProps={{ step: '0.01' }}
          />
        )}
      />

      <Controller
        name="expiryDate"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Дуусах хугацаа"
            type="date"
            fullWidth
            margin="normal"
            error={!!errors.expiryDate}
            helperText={errors.expiryDate?.message}
            InputLabelProps={{ shrink: true }}
          />
        )}
      />

      <Controller
        name="notes"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Тэмдэглэл"
            fullWidth
            margin="normal"
            multiline
            rows={2}
            error={!!errors.notes}
            helperText={errors.notes?.message}
          />
        )}
      />

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={isSubmitting}>
          Болих
        </Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Үүсгэж байна...' : 'Буцаалт үүсгэх'}
        </Button>
      </Box>
    </Box>
  );
}
