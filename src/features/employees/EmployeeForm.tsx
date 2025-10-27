import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
  FormHelperText,
} from '@mui/material';
import { employeeSchema } from '../../utils/validation';
import { Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from '../../types';
import { z } from 'zod';

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  employee: Employee | null;
  onSubmit: (data: CreateEmployeeRequest | UpdateEmployeeRequest) => Promise<void>;
  onCancel: () => void;
}

export default function EmployeeForm({ employee, onSubmit, onCancel }: EmployeeFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employee ? employeeSchema.omit({ password: true }) : employeeSchema),
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      password: '',
      roleName: 'SalesAgent',
    },
  });

  useEffect(() => {
    if (employee) {
      reset({
        name: employee.name,
        email: employee.email,
        phoneNumber: employee.phoneNumber,
        roleName: employee.role.name,
        password: undefined,
      });
    }
  }, [employee, reset]);

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
                label="Full Name"
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Email"
                type="email"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
                disabled={!!employee}
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

        {!employee && (
          <Grid item xs={12}>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Password"
                  type="password"
                  fullWidth
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />
              )}
            />
          </Grid>
        )}

        <Grid item xs={12}>
          <Controller
            name="roleName"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.roleName}>
                <InputLabel>Role *</InputLabel>
                <Select {...field} label="Role *">
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Manager">Manager</MenuItem>
                  <MenuItem value="SalesAgent">Sales Agent</MenuItem>
                </Select>
                {errors.roleName && <FormHelperText>{errors.roleName.message}</FormHelperText>}
              </FormControl>
            )}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : employee ? 'Update' : 'Create'}
        </Button>
      </Box>
    </Box>
  );
}
