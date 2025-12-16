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
  Checkbox,
  FormControlLabel,
  Alert,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Store as StoreIcon,
  Warehouse as WarehouseIcon,
} from '@mui/icons-material';
import { addDays, format } from 'date-fns';
import { orderSchema } from '../../utils/validation';
import { CreateOrderRequest, Customer, Product, Employee, OrderType } from '../../types';
import { customersApi, productsApi, employeesApi } from '../../api';
import { z } from 'zod';

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderFormProps {
  onSubmit: (data: CreateOrderRequest) => Promise<void>;
  onCancel: () => void;
}

export default function OrderForm({ onSubmit, onCancel }: OrderFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('Market');
  const [deliveryDate, setDeliveryDate] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerId: 0,
      distributorId: undefined,
      paymentMethod: 'Cash',
      isCredit: false,
      paidAmount: 0,
      creditTermDays: 7,
      items: [{ productId: 0, quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const items = watch('items');
  const isCredit = watch('isCredit');
  const creditTermDays = watch('creditTermDays');
  const paidAmount = watch('paidAmount');
  const selectedCustomerId = watch('customerId');

  useEffect(() => {
    fetchData();
  }, []);

  // Detect order type based on customer organization type
  useEffect(() => {
    const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
    if (selectedCustomer) {
      const orgType = selectedCustomer.organizationType;
      if (orgType === 'Market Warehouse') {
        setOrderType('Market');
        // Set delivery date to next day for market orders
        const tomorrow = addDays(new Date(), 1);
        setDeliveryDate(format(tomorrow, 'yyyy-MM-dd'));
      } else if (orgType === 'Store') {
        setOrderType('Store');
        setDeliveryDate(null); // Store orders are immediate
      } else {
        // Default to Market for other types
        setOrderType('Market');
        const tomorrow = addDays(new Date(), 1);
        setDeliveryDate(format(tomorrow, 'yyyy-MM-dd'));
      }
    }
  }, [selectedCustomerId, customers]);

  const fetchData = async () => {
    try {
      const [customersRes, productsRes, employeesRes] = await Promise.all([
        customersApi.getAll({ limit: 1000 }),
        productsApi.getAll({ limit: 1000 }),
        employeesApi.getAll({ limit: 1000 }),
      ]);
      setCustomers(customersRes.data.data?.customers || []);
      setProducts(productsRes.data.data?.products || []);
      setEmployees(employeesRes.data.data?.employees || []);
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

  const totalAmount = calculateTotal();
  const vatRate = 0.1; // 10% VAT
  const vatAmount = orderType === 'Store' ? totalAmount * vatRate : 0;
  const totalWithVat = orderType === 'Store' ? totalAmount + vatAmount : totalAmount;
  const remainingAmount = isCredit ? totalWithVat - (paidAmount || 0) : 0;
  const creditDueDate =
    isCredit && creditTermDays ? format(addDays(new Date(), creditTermDays), 'yyyy-MM-dd') : null;

  const handleFormSubmit = async (data: OrderFormData) => {
    const submitData: CreateOrderRequest = {
      customerId: data.customerId,
      distributorId: data.distributorId,
      paymentMethod: data.paymentMethod,
      orderType: orderType,
      items: data.items,
    };

    // Add delivery date for market orders
    if (orderType === 'Market' && deliveryDate) {
      submitData.deliveryDate = deliveryDate;
    }

    if (data.isCredit && data.creditTermDays) {
      submitData.paidAmount = data.paidAmount || 0;
      submitData.creditTermDays = data.creditTermDays;
    }

    await onSubmit(submitData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Controller
            name="customerId"
            control={control}
            render={({ field }) => {
              const selectedCustomer = customers.find((c) => c.id === field.value) || null;
              return (
                <Autocomplete
                  value={selectedCustomer}
                  onChange={(_, newValue) => {
                    field.onChange(newValue ? newValue.id : 0);
                  }}
                  options={customers}
                  getOptionLabel={(customer) =>
                    `${customer.name} (${customer.customerType.name})${customer.organizationType ? ` - ${customer.organizationType}` : ''}`
                  }
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  ListboxProps={{
                    style: { maxHeight: '250px' },
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Байгууллага *"
                      error={!!errors.customerId}
                      helperText={errors.customerId?.message}
                    />
                  )}
                  noOptionsText="Байгууллага олдсонгүй"
                />
              );
            }}
          />
        </Grid>

        {selectedCustomerId > 0 && (
          <Grid size={{ xs: 12 }}>
            <Alert
              severity={orderType === 'Store' ? 'success' : 'info'}
              icon={orderType === 'Store' ? <StoreIcon /> : <WarehouseIcon />}
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">
                  {orderType === 'Market' ? 'Захын лангуу захиалга' : 'Дэлгүүрийн захиалга'}
                </Typography>
                <Typography variant="body2">
                  {orderType === 'Market'
                    ? `Хүргэх огноо: ${deliveryDate ? format(new Date(deliveryDate), 'yyyy-MM-dd') : 'Дараа өдөр'} (Өмнөх өдөр захиалга, дараа өдөр хүргэлт)`
                    : 'Шууд захиалга үүсгэж, шууд бараа өгөх. НӨАТ баримт хэвлэгдэнэ.'}
                </Typography>
              </Box>
            </Alert>
          </Grid>
        )}

        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="distributorId"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.distributorId}>
                <InputLabel>Түгээгч</InputLabel>
                <Select
                  {...field}
                  label="Түгээгч"
                  value={field.value || ''}
                  onChange={(e) =>
                    field.onChange(e.target.value ? Number(e.target.value) : undefined)
                  }
                >
                  <MenuItem value="">Түгээгч сонгохгүй байх</MenuItem>
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.name} ({employee.role.name})
                    </MenuItem>
                  ))}
                </Select>
                {errors.distributorId && (
                  <FormHelperText>{errors.distributorId.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="paymentMethod"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.paymentMethod}>
                <InputLabel>Төлбөрийн хэлбэр *</InputLabel>
                <Select {...field} label="Төлбөрийн хэлбэр *">
                  <MenuItem value="Cash">Бэлэн (Cash)</MenuItem>
                  <MenuItem value="BankTransfer">Данс (Bank Transfer)</MenuItem>
                  <MenuItem value="Sales">Борлуулалт (Sales)</MenuItem>
                  <MenuItem value="Padan">Падаан (Padan)</MenuItem>
                  <MenuItem value="Credit">Зээл (Credit)</MenuItem>
                </Select>
                {errors.paymentMethod && (
                  <FormHelperText>{errors.paymentMethod.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="isCredit"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    {...field}
                    checked={field.value || false}
                    onChange={(e) => {
                      field.onChange(e.target.checked);
                      if (!e.target.checked) {
                        setValue('paidAmount', 0);
                        setValue('creditTermDays', 7);
                      }
                    }}
                  />
                }
                label="Зээлээр олгох (эргэн төлөх нөхцөл)"
                sx={{ mt: 1 }}
              />
            )}
          />
        </Grid>

        {isCredit && (
          <>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="paidAmount"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Урьдчилгаа төлбөр (₮)"
                    type="number"
                    fullWidth
                    error={!!errors.paidAmount}
                    helperText={errors.paidAmount?.message}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="creditTermDays"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Зээлийн хугацаа (хоног)"
                    type="number"
                    fullWidth
                    error={!!errors.creditTermDays}
                    helperText={errors.creditTermDays?.message}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 7)}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 2, bgcolor: 'info.light' }}>
                <Typography variant="body2">
                  <strong>Зээлийн мэдээлэл:</strong>
                </Typography>
                <Typography variant="body2">Нийт дүн: ₮{totalAmount.toLocaleString()}</Typography>
                {orderType === 'Store' && (
                  <>
                    <Typography variant="body2" color="primary">
                      НӨАТ (10%): ₮{vatAmount.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      Нийт (НӨАТ орсон): ₮{totalWithVat.toLocaleString()}
                    </Typography>
                  </>
                )}
                <Typography variant="body2">
                  Урьдчилгаа: ₮{(paidAmount || 0).toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  Үлдэгдэл: ₮{remainingAmount.toLocaleString()}
                </Typography>
                <Typography variant="body2">Төлөх огноо: {creditDueDate || 'N/A'}</Typography>
              </Paper>
            </Grid>
          </>
        )}
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Барааны жагсаалт
        </Typography>

        {fields.map((field, index) => (
          <Paper key={field.id} sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="flex-start">
              <Grid size={{ xs: 12, sm: 8 }}>
                <Controller
                  name={`items.${index}.productId`}
                  control={control}
                  render={({ field }) => {
                    const selectedProduct = products.find((p) => p.id === field.value) || null;
                    return (
                      <Box>
                        <Autocomplete
                          value={selectedProduct}
                          onChange={(_, newValue) => {
                            field.onChange(newValue ? newValue.id : 0);
                          }}
                          options={products}
                          getOptionLabel={(product) =>
                            `${product.nameEnglish} - Үлдэгдэл: ${product.stockQuantity}${product.unitsPerBox ? ` (${product.unitsPerBox} ш/хайрцаг)` : ''}`
                          }
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          ListboxProps={{
                            style: { maxHeight: '250px' },
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Бараа *"
                              error={!!errors.items?.[index]?.productId}
                              helperText={errors.items?.[index]?.productId?.message}
                            />
                          )}
                          noOptionsText="Бараа олдсонгүй"
                        />
                        {selectedProduct && (
                          <FormHelperText>
                            Үнэ: ₮{Number(selectedProduct.priceRetail).toLocaleString()} | Бөөний: ₮
                            {Number(selectedProduct.priceWholesale).toLocaleString()}
                          </FormHelperText>
                        )}
                      </Box>
                    );
                  }}
                />
              </Grid>

              <Grid size={{ xs: 10, sm: 3 }}>
                <Controller
                  name={`items.${index}.quantity`}
                  control={control}
                  render={({ field }) => {
                    const selectedProduct = products.find(
                      (p) => p.id === watch(`items.${index}.productId`)
                    );
                    const boxQuantity = selectedProduct?.unitsPerBox
                      ? (field.value / selectedProduct.unitsPerBox).toFixed(2)
                      : null;

                    return (
                      <TextField
                        {...field}
                        label="Тоо ширхэг *"
                        type="number"
                        fullWidth
                        error={!!errors.items?.[index]?.quantity}
                        helperText={
                          boxQuantity
                            ? `${boxQuantity} хайрцаг`
                            : errors.items?.[index]?.quantity?.message
                        }
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    );
                  }}
                />
              </Grid>

              <Grid size={{ xs: 2, sm: 1 }}>
                {fields.length > 1 && (
                  <IconButton
                    color="error"
                    onClick={() => remove(index)}
                    size="large"
                    sx={{ mt: 1 }}
                  >
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
          variant="outlined"
          sx={{ mb: 2 }}
        >
          Бараа нэмэх
        </Button>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body1">Нийт дүн: ₮{totalAmount.toLocaleString()}</Typography>
          {orderType === 'Store' && (
            <>
              <Typography variant="body2" color="primary">
                НӨАТ (10%): ₮{vatAmount.toLocaleString()}
              </Typography>
              <Typography variant="h6" fontWeight="bold">
                Нийт төлөх: ₮{totalWithVat.toLocaleString()}
              </Typography>
            </>
          )}
          {orderType === 'Market' && (
            <Typography variant="h6">Нийт: ₮{totalAmount.toLocaleString()}</Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={isSubmitting}>
          Болих
        </Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Үүсгэж байна...' : 'Захиалга үүсгэх'}
        </Button>
      </Box>
    </Box>
  );
}
