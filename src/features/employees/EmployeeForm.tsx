import { useEffect, useState } from 'react';
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
  InputAdornment,
  IconButton,
  Chip,
  Divider,
  Typography,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { employeeSchema } from '../../utils/validation';
import { Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from '../../types';
import { z } from 'zod';

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  employee: Employee | null;
  onSubmit: (data: CreateEmployeeRequest | UpdateEmployeeRequest) => Promise<void>;
  onCancel: () => void;
}

const ROLE_OPTIONS = [
  { value: 'Admin', label: 'Админ', color: 'error' as const, desc: 'Бүх эрхтэй' },
  { value: 'Manager', label: 'Менежер', color: 'warning' as const, desc: 'Удирдах эрхтэй' },
  { value: 'SalesAgent', label: 'Борлуулагч', color: 'info' as const, desc: 'Борлуулалтын эрхтэй' },
];

export default function EmployeeForm({ employee, onSubmit, onCancel }: EmployeeFormProps) {
  const [showPassword, setShowPassword] = useState(false);

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

  const submitAdapter = async (data: EmployeeFormData) => {
    if (employee) {
      await onSubmit({
        name: data.name,
        phoneNumber: data.phoneNumber,
        roleName: data.roleName,
      });
      return;
    }
    if (!data.password) return;
    await onSubmit({
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
      password: data.password,
      roleName: data.roleName,
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit(submitAdapter)}>
      {employee && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Одоогийн эрх:
          </Typography>
          {ROLE_OPTIONS.map((r) =>
            r.value === employee.role.name ? (
              <Chip key={r.value} label={r.label} color={r.color} size="small" />
            ) : null
          )}
          <Chip
            label={employee.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
            color={employee.isActive ? 'success' : 'default'}
            size="small"
            sx={{ ml: 1 }}
          />
        </Box>
      )}

      <Grid container spacing={2}>
        <Grid size={12}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Бүтэн нэр *"
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message}
                placeholder="Жишээ: Батбаяр Дорж"
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="И-мэйл хаяг *"
                type="email"
                fullWidth
                error={!!errors.email}
                helperText={
                  errors.email?.message ||
                  (employee ? 'И-мэйл хаягийг өөрчлөх боломжгүй' : undefined)
                }
                disabled={!!employee}
                placeholder="example@company.mn"
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="phoneNumber"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Утасны дугаар *"
                fullWidth
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber?.message}
                placeholder="99xxxxxx"
              />
            )}
          />
        </Grid>

        {!employee && (
          <>
            <Grid size={12}>
              <Divider>
                <Typography variant="caption" color="text.secondary">
                  Нэвтрэх мэдээлэл
                </Typography>
              </Divider>
            </Grid>
            <Grid size={12}>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Нууц үг *"
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    error={!!errors.password}
                    helperText={errors.password?.message || 'Хамгийн багадаа 6 тэмдэгт'}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword((v) => !v)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? (
                              <VisibilityOffIcon fontSize="small" />
                            ) : (
                              <VisibilityIcon fontSize="small" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
          </>
        )}

        <Grid size={12}>
          <Divider>
            <Typography variant="caption" color="text.secondary">
              Эрх тохиргоо
            </Typography>
          </Divider>
        </Grid>

        <Grid size={12}>
          <Controller
            name="roleName"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.roleName}>
                <InputLabel>Эрх *</InputLabel>
                <Select {...field} label="Эрх *">
                  {ROLE_OPTIONS.map((r) => (
                    <MenuItem key={r.value} value={r.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={r.label} color={r.color} size="small" sx={{ minWidth: 80 }} />
                        <Typography variant="caption" color="text.secondary">
                          {r.desc}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.roleName && <FormHelperText>{errors.roleName.message}</FormHelperText>}
              </FormControl>
            )}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={isSubmitting}>
          Болих
        </Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Хадгалж байна...' : employee ? 'Шинэчлэх' : 'Үүсгэх'}
        </Button>
      </Box>
    </Box>
  );
}
