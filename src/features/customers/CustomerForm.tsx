import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { customerSchema } from '../../utils/validation';
import { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '../../types';
import { z } from 'zod';
import MapPicker from '../../components/MapPicker';
import { etaxApi } from '../../api';
import { toast } from 'react-hot-toast';

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customer: Customer | null;
  onSubmit: (data: CreateCustomerRequest | UpdateCustomerRequest) => Promise<void>;
  onCancel: () => void;
}

export default function CustomerForm({ customer, onSubmit, onCancel }: CustomerFormProps) {
  const [searchingRegno, setSearchingRegno] = useState(false);
  const [regnoSearchResult, setRegnoSearchResult] = useState<string | null>(null);
  
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      name2: '',
      organizationType: '',
      registrationNumber: '',
      address: '',
      district: '',
      phoneNumber: '',
      isVatPayer: false,
      locationLatitude: 47.9186,
      locationLongitude: 106.9177,
      customerTypeId: 1,
      assignedAgentId: undefined,
    },
  });

  const registrationNumber = watch('registrationNumber');

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        name2: customer.name2 || '',
        organizationType: customer.organizationType || '',
        registrationNumber: customer.registrationNumber || '',
        address: customer.address,
        district: customer.district || '',
        phoneNumber: customer.phoneNumber,
        isVatPayer: customer.isVatPayer || false,
        locationLatitude: customer.locationLatitude,
        locationLongitude: customer.locationLongitude,
        customerTypeId: customer.customerType.id,
        assignedAgentId: customer.assignedAgent?.id,
      });
    }
  }, [customer, reset]);

  const handleSearchByRegno = async () => {
    if (!registrationNumber || registrationNumber.length !== 7) {
      toast.error('7 оронтой регистрийн дугаар оруулна уу');
      return;
    }

    setSearchingRegno(true);
    setRegnoSearchResult(null);

    try {
      const response = await etaxApi.getOrganizationByRegno(registrationNumber);
      const orgInfo = response.data.data?.organization;

      if (orgInfo) {
        // Auto-fill form with e-Tax data
        setValue('name', orgInfo.name);
        setValue('isVatPayer', orgInfo.vatPayer || false);
        
        if (orgInfo.address) {
          setValue('address', orgInfo.address);
        }

        setRegnoSearchResult(`✅ Олдлоо: ${orgInfo.name}`);
        toast.success(`Байгууллагын мэдээлэл амжилттай татагдлаа: ${orgInfo.name}`);
      }
    } catch (error: any) {
      console.error('Error fetching organization info:', error);
      
      if (error.response?.status === 404) {
        setRegnoSearchResult('❌ Татварын системд бүртгэлгүй регистр');
        toast.error('Татварын системд байгууллага олдсонгүй');
      } else {
        setRegnoSearchResult('⚠️ Системд алдаа гарлаа');
        toast.error('Алдаа гарлаа. Дахин оролдоно уу.');
      }
    } finally {
      setSearchingRegno(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Байгууллагын нэр *"
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="name2"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Хоёр дахь нэр"
                fullWidth
                error={!!errors.name2}
                helperText={errors.name2?.message || 'Нэмэлт нэр байвал оруулна уу'}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="registrationNumber"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="⭐ Байгууллагын регистр"
                fullWidth
                error={!!errors.registrationNumber}
                helperText={errors.registrationNumber?.message || 'Байгууллагын регистрийн дугаар (7 орон)'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleSearchByRegno}
                        disabled={searchingRegno || !field.value || field.value.length !== 7}
                        edge="end"
                        color="primary"
                        title="Татварын системээс хайх"
                      >
                        {searchingRegno ? <CircularProgress size={24} /> : <SearchIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
          {regnoSearchResult && (
            <Alert 
              severity={regnoSearchResult.startsWith('✅') ? 'success' : regnoSearchResult.startsWith('❌') ? 'error' : 'warning'}
              sx={{ mt: 1 }}
            >
              {regnoSearchResult}
            </Alert>
          )}
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="organizationType"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.organizationType}>
                <InputLabel>Байгууллагын төрөл</InputLabel>
                <Select {...field} label="Байгууллагын төрөл">
                  <MenuItem value="">Сонгох</MenuItem>
                  <MenuItem value="Market Warehouse">Захын лангуу (Market Warehouse)</MenuItem>
                  <MenuItem value="Store">Дэлгүүр (Store)</MenuItem>
                  <MenuItem value="Restaurant">Ресторан (Restaurant)</MenuItem>
                  <MenuItem value="Chain">Сүлжээ (Chain)</MenuItem>
                  <MenuItem value="Other">Бусад (Other)</MenuItem>
                </Select>
                <FormHelperText>
                  {errors.organizationType?.message ||
                    'Захын лангуу: Өмнөх өдөр захиалга, дараа өдөр хүргэлт. Дэлгүүр: Шууд захиалга ба НӨАТ.'}
                </FormHelperText>
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="phoneNumber"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Утас *"
                fullWidth
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="customerTypeId"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.customerTypeId}>
                <InputLabel>Харилцагчийн төрөл *</InputLabel>
                <Select
                  {...field}
                  label="Харилцагчийн төрөл *"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                >
                  <MenuItem value={1}>Жижиглэнгийн (Retail)</MenuItem>
                  <MenuItem value={2}>Бөөний (Wholesale)</MenuItem>
                </Select>
                {errors.customerTypeId && (
                  <FormHelperText>{errors.customerTypeId.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="district"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.district}>
                <InputLabel>Дүүрэг</InputLabel>
                <Select {...field} label="Дүүрэг">
                  <MenuItem value="">Сонгох</MenuItem>
                  <MenuItem value="Баянзүрх">Баянзүрх</MenuItem>
                  <MenuItem value="Баянгол">Баянгол</MenuItem>
                  <MenuItem value="Сүхбаатар">Сүхбаатар</MenuItem>
                  <MenuItem value="Хан-Уул">Хан-Уул</MenuItem>
                  <MenuItem value="Чингэлтэй">Чингэлтэй</MenuItem>
                  <MenuItem value="Сонгинохайрхан">Сонгинохайрхан</MenuItem>
                  <MenuItem value="Налайх">Налайх</MenuItem>
                  <MenuItem value="Багануур">Багануур</MenuItem>
                  <MenuItem value="Багахангай">Багахангай</MenuItem>
                </Select>
                {errors.district && <FormHelperText>{errors.district.message}</FormHelperText>}
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="isVatPayer"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>НӨАТ төлөгч эсэх</InputLabel>
                <Select
                  {...field}
                  label="НӨАТ төлөгч эсэх"
                  value={field.value ? 'true' : 'false'}
                  onChange={(e) => field.onChange(e.target.value === 'true')}
                >
                  <MenuItem value="false">Үгүй</MenuItem>
                  <MenuItem value="true">Тийм</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Дэлгэрэнгүй хаяг *"
                fullWidth
                multiline
                rows={2}
                error={!!errors.address}
                helperText={errors.address?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="locationLatitude"
            control={control}
            render={() => (
              <MapPicker
                latitude={watch('locationLatitude')}
                longitude={watch('locationLongitude')}
                onChange={(lat, lng) => {
                  setValue('locationLatitude', lat);
                  setValue('locationLongitude', lng);
                }}
                label="Байршил (Location)"
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="assignedAgentId"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Хариуцсан борлуулагч (Agent ID)"
                type="number"
                fullWidth
                error={!!errors.assignedAgentId}
                helperText={
                  errors.assignedAgentId?.message || 'Борлуулагч томилохгүй бол хоосон үлдээнэ'
                }
                onChange={(e) =>
                  field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                }
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
          {isSubmitting ? 'Хадгалж байна...' : customer ? 'Засах' : 'Үүсгэх'}
        </Button>
      </Box>
    </Box>
  );
}
