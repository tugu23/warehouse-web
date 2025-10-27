import { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Typography,
  Divider,
  Paper,
  FormHelperText,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { orderSchema } from '../../utils/validation';
import { CreateOrderRequest, Customer, Product } from '../../types';
import { customersApi, productsApi } from '../../api';
import { z } from 'zod';

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderFormProps {
  onSubmit: (data: CreateOrderRequest) => Promise<void>;
  onCancel: () => void;
}

export default function OrderForm({ onSubmit, onCancel }: OrderFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerId: 0,
      items: [{ productId: 0, quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const items = watch('items');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [customersRes, productsRes] = await Promise.all([
        customersApi.getAll(),
        productsApi.getAll(),
      ]);
      setCustomers(customersRes.data.data?.customers || []);
      setProducts(productsRes.data.data?.products || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        const customer = customers.find((c) => c.id === watch('customerId'));
        const price =
          customer?.customerType.name === 'Wholesale'
            ? Number(product.priceWholesale)
            : Number(product.priceRetail);
        return total + price * item.quantity;
      }
      return total;
    }, 0);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Controller
            name="customerId"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.customerId}>
                <InputLabel>Customer *</InputLabel>
                <Select
                  {...field}
                  label="Customer *"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                >
                  <MenuItem value={0}>Select a customer</MenuItem>
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.name} ({customer.customerType.name})
                    </MenuItem>
                  ))}
                </Select>
                {errors.customerId && <FormHelperText>{errors.customerId.message}</FormHelperText>}
              </FormControl>
            )}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Order Items
      </Typography>

      {fields.map((field, index) => (
        <Paper key={field.id} sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={7}>
              <Controller
                name={`items.${index}.productId`}
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.items?.[index]?.productId}>
                    <InputLabel>Product *</InputLabel>
                    <Select
                      {...field}
                      label="Product *"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    >
                      <MenuItem value={0}>Select a product</MenuItem>
                      {products.map((product) => (
                        <MenuItem key={product.id} value={product.id}>
                          {product.nameEnglish} (Stock: {product.stockQuantity})
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.items?.[index]?.productId && (
                      <FormHelperText>{errors.items[index]?.productId?.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={8} sm={3}>
              <Controller
                name={`items.${index}.quantity`}
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Quantity *"
                    type="number"
                    fullWidth
                    error={!!errors.items?.[index]?.quantity}
                    helperText={errors.items?.[index]?.quantity?.message}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                )}
              />
            </Grid>

            <Grid item xs={4} sm={2}>
              {fields.length > 1 && (
                <IconButton color="error" onClick={() => remove(index)} size="large">
                  <DeleteIcon />
                </IconButton>
              )}
            </Grid>
          </Grid>
        </Paper>
      ))}

      <Button
        startIcon={<AddIcon />}
        onClick={() => append({ productId: 0, quantity: 1 })}
        sx={{ mb: 3 }}
      >
        Add Item
      </Button>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Typography variant="h6">Total: ₮{calculateTotal().toLocaleString()}</Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Order'}
        </Button>
      </Box>
    </Box>
  );
}
