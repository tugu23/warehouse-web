import { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  TextField,
  Grid,
  FormControl,
  FormLabel,
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
  Radio,
  RadioGroup,
  CircularProgress,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { addDays, format } from 'date-fns';
import { orderSchema } from '../../utils/validation';
import {
  CreateOrderRequest,
  Customer,
  Product,
  Employee,
  Order,
  OrderType,
  ProductPrice,
} from '../../types';
import { EbarimtParams } from '../../types/ebarimt';
import { customersApi, productsApi, employeesApi, productPricesApi, ordersApi } from '../../api';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { createEbarimtRequest } from '../../api/ebarimt';
import { generateReceiptPDF } from '../../utils/receiptPdf';

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderFormProps {
  onSubmit: (data: CreateOrderRequest) => Promise<Order>;
  onCancel: () => void;
}

interface RegLookupResult {
  name: string;
  registrationNumber: string;
  vatPayer?: boolean;
  customerId?: number;
}

export default function OrderForm({ onSubmit, onCancel }: OrderFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('Market');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [deliveryDate, setDeliveryDate] = useState<string | null>(null);
  const [productPricesCache, setProductPricesCache] = useState<Record<number, ProductPrice[]>>({});
  const [regNumber, setRegNumber] = useState<string>('');
  const [regLookupResult, setRegLookupResult] = useState<RegLookupResult | null>(null);
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [regError, setRegError] = useState<string>('');
  const [individualRegNo, setIndividualRegNo] = useState('');
  const [ebarimtResult, setEbarimtResult] = useState<{
    success: boolean;
    billId?: string;
    lottery?: string;
    qrData?: string;
    error?: string;
  } | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerKind: 'organization',
      customerId: 0,
      distributorId: undefined,
      paymentMethod: 'Cash',
      isCredit: false,
      paidAmount: 0,
      creditTermDays: 7,
      items: [{ productId: 0, quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const items = watch('items');
  const isCredit = watch('isCredit');
  const creditTermDays = watch('creditTermDays');
  const paidAmount = watch('paidAmount');
  const customerKind = watch('customerKind');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!regLookupResult) return;
    if (regLookupResult.customerId) {
      setValue('customerId', regLookupResult.customerId);
    }
    if (regLookupResult.vatPayer) {
      setOrderType('Store');
      setDeliveryDate(null);
    } else {
      setOrderType('Market');
      const tomorrow = addDays(new Date(), 1);
      setDeliveryDate(format(tomorrow, 'yyyy-MM-dd'));
    }
  }, [regLookupResult, setValue]);

  const fetchData = async () => {
    try {
      const [productsRes, customersRes, employeesRes] = await Promise.all([
        productsApi.getAll({ limit: 'all', include: 'prices,category' }),
        customersApi.getAll({ limit: 'all' }),
        employeesApi.getAll({ limit: 'all' }),
      ]);
      setProducts(productsRes.data.data?.products || []);
      setCustomers(customersRes.data.data?.customers || []);
      setEmployees(employeesRes.data.data?.employees || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleRegNumberLookup = async () => {
    const trimmed = regNumber.trim();
    if (!trimmed) {
      setRegError('Регистрийн дугаар оруулна уу');
      return;
    }
    setIsLookingUp(true);
    setRegError('');
    setRegLookupResult(null);
    setValue('customerId', 0);
    try {
      const res = await customersApi.getAll({ limit: 'all' });
      const allCustomers: Customer[] = res.data.data?.customers || [];
      const found = allCustomers.find(
        (c) => (c.registrationNumber || '').trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (found) {
        setRegLookupResult({
          name: found.name,
          registrationNumber: found.registrationNumber || trimmed,
          vatPayer: found.isVatPayer ?? false,
          customerId: found.id,
        });
        toast.success(`Байгууллага олдлоо: ${found.name}`);
        return;
      }
      const tinRes = await fetch(
        `https://api.ebarimt.mn/api/info/check/getTinInfo?regNo=${trimmed}`
      );
      const tinData = await tinRes.json();
      if (!tinData || tinData.status !== 200) {
        setRegError('TIN олдсонгүй');
        return;
      }
      const tin = tinData.data;
      const infoRes = await fetch(`https://api.ebarimt.mn/api/info/check/getInfo?tin=${tin}`);
      const infoData = await infoRes.json();
      console.log('infoData:', infoData);
      if (!infoData || infoData.status !== 200) {
        setRegError('Байгууллагын мэдээлэл олдсонгүй');
        return;
      }
      const company = infoData.data;
      setRegLookupResult({
        name: company.name,
        registrationNumber: trimmed,
        vatPayer: company.vatpayer ?? false,
        customerId: undefined,
      });
      toast('Системд бүртгэлгүй байгууллага. eBarimt-с мэдээлэл авлаа.', { icon: 'ℹ️' });
    } catch (error) {
      console.error('Регистр хайхад алдаа:', error);
      setRegError('Хайлт амжилтгүй. Дахин оролдоно уу.');
    } finally {
      setIsLookingUp(false);
    }
  };

  const customerIdWatch = watch('customerId');
  const selectedCustomer = customers.find((c) => c.id === customerIdWatch);
  const customerTypeIdForPrice = selectedCustomer?.customerTypeId ?? null;

  const getProductBasePrice = (product: Product, ctId: number | null): number => {
    if (ctId != null && product.prices?.length) {
      const row = product.prices.find((p) => p.customerTypeId === ctId);
      if (row && Number(row.price) > 0) return Number(row.price);
    }
    return Number(product.defaultPrice) || 0;
  };

  const fetchProductPrices = async (productId: number): Promise<ProductPrice[]> => {
    if (productPricesCache[productId]) return productPricesCache[productId];
    const product = products.find((p) => p.id === productId);
    if (product?.prices && product.prices.length > 0) {
      setProductPricesCache((prev) => ({ ...prev, [productId]: product.prices as ProductPrice[] }));
      return product.prices as ProductPrice[];
    }
    try {
      const response = await productPricesApi.getByProductId(productId);
      const prices = response.data.data?.productPrices || response.data.data?.prices || [];
      setProductPricesCache((prev) => ({ ...prev, [productId]: prices }));
      return prices;
    } catch (error) {
      console.warn(`Could not fetch prices for product ${productId}:`, error);
      return [];
    }
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        const price = getProductBasePrice(product, customerTypeIdForPrice);
        return total + price * item.quantity;
      }
      return total;
    }, 0);
  };

  const totalAmount = calculateTotal();
  const vatRate = 0.1;
  const vatAmount = orderType === 'Store' ? totalAmount * vatRate : 0;
  const totalWithVat = orderType === 'Store' ? totalAmount + vatAmount : totalAmount;
  const remainingAmount = isCredit ? totalWithVat - (paidAmount || 0) : 0;
  const creditDueDate =
    isCredit && creditTermDays ? format(addDays(new Date(), creditTermDays), 'yyyy-MM-dd') : null;

  const handleFormSubmit = async (data: OrderFormData) => {
    if (customerKind === 'organization' && (!data.customerId || data.customerId < 1)) {
      toast.error('Байгууллагыг эхлээд Харилцагч хэсэгт бүртгэнэ үү');
      return;
    }

    try {
      const submitData: CreateOrderRequest = {
        ...(data.customerId && data.customerId > 0 ? { customerId: data.customerId } : {}),
        distributorId: data.distributorId,
        paymentMethod: data.paymentMethod,
        paidAmount: data.paidAmount || 0,
        creditTermDays: data.creditTermDays,
        orderType,
        items: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      const orderResponse = await onSubmit(submitData);

      toast.success('Захиалга амжилттай үүслээ');

      if (orderType === 'Store') {
        try {
          const ebarimtItems = data.items.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            return {
              name: product?.nameMongolian || `Product ${item.productId}`,
              barCode: product?.barcode || undefined,
              classificationCode: product?.classificationCode || undefined,
              unitPrice: getProductBasePrice(product!),
              qty: item.quantity,
            };
          });

          const paymentTypeMap: Record<string, string> = {
            Cash: 'CASH',
            BankTransfer: 'BANK_TRANSFER',
            Card: 'PAYMENT_CARD',
          };

          const isB2B = customerKind === 'organization';

          const ebarimtPayload = await createEbarimtRequest({
            items: ebarimtItems,
            paymentType: (paymentTypeMap[data.paymentMethod] ||
              'CASH') as EbarimtParams['paymentType'],
            type: isB2B ? 'B2B_RECEIPT' : 'B2C_RECEIPT',
            consumerNo: !isB2B && individualRegNo ? individualRegNo : null,
            customerTin: null,
            regNo:
              isB2B && regLookupResult?.registrationNumber
                ? Number(regLookupResult.registrationNumber)
                : undefined,
          });

          const ebarimtRes = await fetch('http://localhost:7080/rest/receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ebarimtPayload),
          });

          const posResult = await ebarimtRes.json();

          if (posResult?.id) {
            setEbarimtResult({
              success: true,
              billId: posResult.id,
              lottery: posResult.lottery,
              qrData: posResult.qrData,
            });

            // Save eBarimt info to backend
            try {
              await ordersApi.updateEbarimt(orderResponse.id, {
                ebarimtId: posResult.id,
                ebarimtBillId: posResult.billId || posResult.id,
                ebarimtDate: posResult.date || new Date().toISOString(),
              });
            } catch (saveErr) {
              console.error('eBarimt мэдээлэл хадгалахад алдаа:', saveErr);
            }

            // Generate and print PDF receipt
            await generateReceiptPDF(
              {
                id: posResult.id,
                lottery: posResult.lottery,
                qrData: posResult.qrData,
                date: posResult.date,
                totalAmount: posResult.totalAmount || totalAmount,
                totalVAT: posResult.totalVAT || vatAmount,
                totalCityTax: posResult.totalCityTax,
              },
              data.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
              products,
              regLookupResult
                ? { name: regLookupResult.name, regNo: regLookupResult.registrationNumber }
                : undefined,
              data.paymentMethod
            );
          } else {
            setEbarimtResult({
              success: false,
              error: posResult?.message || 'Тодорхойгүй алдаа',
            });
          }
        } catch (ebarimtError) {
          console.error('eBarimt бүртгэлд алдаа гарлаа:', ebarimtError);
          setEbarimtResult({
            success: false,
            error: 'Захиалга үүслээ, гэвч eBarimt бүртгэхэд алдаа гарлаа.',
          });
        }
      }
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Захиалга үүсгэхэд алдаа гарлаа');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
      <Grid container spacing={3}>
        {/* Байгууллага / Хувь хүн сонголт */}
        <Grid size={{ xs: 12 }}>
          <FormControl>
            <FormLabel>Байгууллага уу? Хувь хүн үү?</FormLabel>
            <RadioGroup
              row
              value={customerKind}
              onChange={(_, value) => {
                const next = value === 'individual' ? 'individual' : 'organization';
                setValue('customerKind', next, { shouldValidate: true });
                setValue('customerId', 0);
                setRegNumber('');
                setRegLookupResult(null);
                setRegError('');
              }}
            >
              <FormControlLabel value="organization" control={<Radio />} label="Байгууллага" />
              <FormControlLabel value="individual" control={<Radio />} label="Хувь хүн" />
              {customerKind === 'individual' && (
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Хувь хүний регистр/утасны дугаар *"
                    value={individualRegNo}
                    onChange={(e) => setIndividualRegNo(e.target.value)}
                    fullWidth
                    helperText="Баримт хэвлэхэд заавал шаардлагатай"
                  />
                </Grid>
              )}
            </RadioGroup>
          </FormControl>
        </Grid>

        {customerKind === 'organization' && (
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                label="Байгууллагын регистрийн дугаар *"
                value={regNumber}
                onChange={(e) => {
                  setRegNumber(e.target.value);
                  setRegError('');
                  if (regLookupResult) {
                    setRegLookupResult(null);
                    setValue('customerId', 0);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleRegNumberLookup();
                  }
                }}
                error={!!regError}
                helperText={regError || 'Регистрийн дугаар бичээд Enter эсвэл Хайх товч дарна уу'}
                placeholder="Жишээ: 1234567"
                fullWidth
                InputProps={{
                  endAdornment: regLookupResult ? (
                    <InputAdornment position="end">
                      <CheckCircleIcon color="success" />
                    </InputAdornment>
                  ) : null,
                }}
              />
              <Button
                variant="outlined"
                onClick={handleRegNumberLookup}
                disabled={isLookingUp || !regNumber.trim()}
                sx={{ mt: 0.5, minWidth: 100, height: 56 }}
                startIcon={isLookingUp ? <CircularProgress size={16} /> : <SearchIcon />}
              >
                {isLookingUp ? 'Хайж байна...' : 'Хайх'}
              </Button>
            </Box>

            {regLookupResult && (
              <Paper
                sx={{
                  p: 2,
                  mt: 1,
                  bgcolor: regLookupResult.customerId ? 'success.light' : 'warning.light',
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold">
                  {regLookupResult.customerId
                    ? '✅ Байгууллага олдлоо'
                    : '⚠️ eBarimt-д бүртгэлтэй, системд байхгүй'}
                </Typography>
                <Typography variant="body2">Нэр: {regLookupResult.name}</Typography>
                <Typography variant="body2">
                  Регистр: {regLookupResult.registrationNumber}
                </Typography>
                {!regLookupResult.customerId && (
                  <Typography variant="body2" color="warning.dark" sx={{ mt: 0.5 }}>
                    Захиалга үүсгэхийн өмнө энэ байгууллагыг Харилцагч хэсэгт бүртгэнэ үү.
                  </Typography>
                )}
              </Paper>
            )}
          </Grid>
        )}

        {customerKind === 'individual' && (
          <Grid size={{ xs: 12 }}>
            <Alert severity="info">Хувь хүний захиалга — eBarimt хувь хүн баримт хэвлэгдэнэ.</Alert>
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
                    const displayPrice = selectedProduct ? getProductBasePrice(selectedProduct) : 0;
                    return (
                      <Box>
                        <TextField
                          select
                          label="Бараа *"
                          value={field.value || ''}
                          onChange={async (e) => {
                            const productId = Number(e.target.value);
                            field.onChange(productId);
                            if (!productId) return;
                            try {
                              const res = await productsApi.getById(productId);
                              const fresh = res.data.data?.product;
                              if (fresh) {
                                setProducts((prev) =>
                                  prev.map((p) => (p.id === fresh.id ? { ...p, ...fresh } : p))
                                );
                              }
                            } catch (error) {
                              console.warn('Could not refresh product details:', error);
                            }
                            const product = products.find((p) => p.id === productId);
                            if (!product?.prices?.length) {
                              await fetchProductPrices(productId);
                            }
                          }}
                          fullWidth
                          error={!!errors.items?.[index]?.productId}
                          helperText={errors.items?.[index]?.productId?.message}
                          SelectProps={{ MenuProps: { PaperProps: { style: { maxHeight: 250 } } } }}
                        >
                          <MenuItem value="">Бараа сонгоно уу</MenuItem>
                          {products.map((product) => (
                            <MenuItem key={product.id} value={product.id}>
                              {product.nameMongolian} — Үлдэгдэл: {product.stockQuantity}
                              {product.unitsPerBox ? ` (${product.unitsPerBox} ш/хайрцаг)` : ''} |
                              Үнэ: ₮{getProductBasePrice(product).toLocaleString()}
                            </MenuItem>
                          ))}
                        </TextField>
                        {selectedProduct && (
                          <FormHelperText>
                            <span>Үнэ: ₮{displayPrice.toLocaleString()}</span>
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

      {/* eBarimt Result Dialog */}
      <Dialog
        open={!!ebarimtResult}
        onClose={() => {
          setEbarimtResult(null);
          if (ebarimtResult?.success) onCancel();
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          {ebarimtResult?.success ? 'eBarimt амжилттай' : 'eBarimt алдаа'}
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          {ebarimtResult?.success ? (
            <>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: 'success.main',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  color: 'white',
                  fontSize: 28,
                }}
              >
                &#10003;
              </Box>
              <Typography variant="h6" gutterBottom>
                Баримт амжилттай бүртгэгдлээ
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ДДТД: {ebarimtResult.billId}
              </Typography>
              {ebarimtResult.lottery && (
                <Typography variant="body1" fontWeight="bold" sx={{ mt: 1 }}>
                  Сугалааны дугаар: {ebarimtResult.lottery}
                </Typography>
              )}
            </>
          ) : (
            <>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: 'error.main',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  color: 'white',
                  fontSize: 28,
                }}
              >
                &#10007;
              </Box>
              <Typography variant="h6" gutterBottom>
                Алдаа гарлаа
              </Typography>
              <Typography variant="body2" color="error">
                {ebarimtResult?.error}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button
            variant="contained"
            onClick={() => {
              setEbarimtResult(null);
              if (ebarimtResult?.success) onCancel();
            }}
          >
            Хаах
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
