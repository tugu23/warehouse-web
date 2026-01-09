import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import {
  CreateSalesTargetRequest,
  UpdateSalesTargetRequest,
  Employee,
  SalesTarget,
} from '../../types';
import { employeesApi } from '../../api';

interface SalesTargetFormProps {
  target: SalesTarget | null;
  onSubmit: (data: CreateSalesTargetRequest | UpdateSalesTargetRequest) => Promise<void>;
  onCancel: () => void;
}

export default function SalesTargetForm({ target, onSubmit, onCancel }: SalesTargetFormProps) {
  const [agents, setAgents] = useState<Employee[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      agentId: target?.agentId || 0,
      targetPeriod: target?.targetPeriod || '',
      targetAmount: target?.targetAmount || 0,
      targetOrders: target?.targetOrders || 0,
    },
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await employeesApi.getAll();
      const employees = response.data.data?.employees || [];
      setAgents(employees.filter((e) => e.role.name === 'SalesAgent'));
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="agentId"
            control={control}
            rules={{ required: 'Агент сонгоно уу', min: { value: 1, message: 'Агент сонгоно уу' } }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.agentId}>
                <InputLabel>Агент *</InputLabel>
                <Select
                  {...field}
                  label="Агент *"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  disabled={!!target}
                >
                  <MenuItem value={0}>Агент сонгох</MenuItem>
                  {agents.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.agentId && <FormHelperText>{errors.agentId?.message}</FormHelperText>}
              </FormControl>
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="targetPeriod"
            control={control}
            rules={{ required: 'Хугацаа оруулна уу' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Хугацаа (YYYY-MM эсвэл YYYY-Q1) *"
                fullWidth
                placeholder="2025-01 эсвэл 2025-Q1"
                error={!!errors.targetPeriod}
                helperText={errors.targetPeriod?.message}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="targetAmount"
            control={control}
            rules={{
              required: 'Зорилтот дүн оруулна уу',
              min: { value: 1, message: 'Зорилтот дүн 0-ээс их байх ёстой' },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Зорилтот дүн (₮) *"
                type="number"
                fullWidth
                error={!!errors.targetAmount}
                helperText={errors.targetAmount?.message}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="targetOrders"
            control={control}
            rules={{
              required: 'Захиалгын зорилт оруулна уу',
              min: { value: 1, message: 'Захиалгын зорилт 0-ээс их байх ёстой' },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Захиалгын зорилт *"
                type="number"
                fullWidth
                error={!!errors.targetOrders}
                helperText={errors.targetOrders?.message}
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
              />
            )}
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
        <Button onClick={onCancel} disabled={isSubmitting}>
          Болих
        </Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Хадгалж байна...' : target ? 'Засах' : 'Үүсгэх'}
        </Button>
      </Box>
    </Box>
  );
}
