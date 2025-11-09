import { useEffect } from 'react';
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
} from '@mui/material';
import { customerSchema } from '../../utils/validation';
import { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '../../types';
import { z } from 'zod';
import MapPicker from '../../components/MapPicker';

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customer: Customer | null;
  onSubmit: (data: CreateCustomerRequest | UpdateCustomerRequest) => Promise<void>;
  onCancel: () => void;
}

export default function CustomerForm({ customer, onSubmit, onCancel }: CustomerFormProps) {
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
      organizationType: '',
      contactPerson: '',
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

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        organizationType: customer.organizationType || '',
        contactPerson: customer.contactPerson || '',
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
            name="organizationType"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.organizationType}>
                <InputLabel>Байгууллагын төрөл</InputLabel>
                <Select {...field} label="Байгууллагын төрөл">
                  <MenuItem value="">Сонгох</MenuItem>
                  <MenuItem value="Дэлгүүр">Дэлгүүр</MenuItem>
                  <MenuItem value="Сүлжээ">Сүлжээ</MenuItem>
                  <MenuItem value="Ресторан">Ресторан</MenuItem>
                  <MenuItem value="Бусад">Бусад</MenuItem>
                </Select>
                {errors.organizationType && (
                  <FormHelperText>{errors.organizationType.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="contactPerson"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Үндсэн нэр (Хариуцсан хүн)"
                fullWidth
                error={!!errors.contactPerson}
                helperText={errors.contactPerson?.message}
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
                label="Байгууллагын регистр"
                fullWidth
                error={!!errors.registrationNumber}
                helperText={errors.registrationNumber?.message}
              />
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
