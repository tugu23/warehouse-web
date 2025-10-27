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
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      address: '',
      phoneNumber: '',
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
        address: customer.address,
        phoneNumber: customer.phoneNumber,
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
        <Grid item xs={12}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Customer Name"
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message}
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
                label="Phone Number"
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
                <InputLabel>Customer Type</InputLabel>
                <Select
                  {...field}
                  label="Customer Type"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                >
                  <MenuItem value={1}>Retail</MenuItem>
                  <MenuItem value={2}>Wholesale</MenuItem>
                </Select>
                {errors.customerTypeId && (
                  <FormHelperText>{errors.customerTypeId.message}</FormHelperText>
                )}
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
                label="Address"
                fullWidth
                multiline
                rows={2}
                error={!!errors.address}
                helperText={errors.address?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="locationLatitude"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Latitude"
                type="number"
                fullWidth
                error={!!errors.locationLatitude}
                helperText={errors.locationLatitude?.message}
                inputProps={{ step: '0.000001' }}
                onChange={(e) => field.onChange(parseFloat(e.target.value))}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="locationLongitude"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Longitude"
                type="number"
                fullWidth
                error={!!errors.locationLongitude}
                helperText={errors.locationLongitude?.message}
                inputProps={{ step: '0.000001' }}
                onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                label="Assigned Agent ID (Optional)"
                type="number"
                fullWidth
                error={!!errors.assignedAgentId}
                helperText={errors.assignedAgentId?.message || 'Leave empty to not assign'}
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
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : customer ? 'Update' : 'Create'}
        </Button>
      </Box>
    </Box>
  );
}
