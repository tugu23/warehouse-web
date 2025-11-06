import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, Button, TextField, Grid, FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import { CreateVisitPlanRequest, UpdateVisitPlanRequest, User, Customer } from '../../types';
import { employeesApi, customersApi } from '../../api';

interface VisitPlanFormProps {
  visitPlan: any | null;
  onSubmit: (data: CreateVisitPlanRequest | UpdateVisitPlanRequest) => Promise<void>;
  onCancel: () => void;
}

export default function VisitPlanForm({ visitPlan, onSubmit, onCancel }: VisitPlanFormProps) {
  const [agents, setAgents] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      agentId: visitPlan?.agentId || 0,
      customerId: visitPlan?.customerId || 0,
      plannedDate: visitPlan?.plannedDate || '',
      plannedTime: visitPlan?.plannedTime || '',
      notes: visitPlan?.notes || '',
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [employeesRes, customersRes] = await Promise.all([
        employeesApi.getAll(),
        customersApi.getAll(),
      ]);
      const employees = employeesRes.data.data?.employees || [];
      setAgents(employees.filter((e: any) => e.role.name === 'SalesAgent'));
      setCustomers(customersRes.data.data?.customers || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
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
                >
                  <MenuItem value={0}>Агент сонгох</MenuItem>
                  {agents.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.agentId && <FormHelperText>{errors.agentId.message}</FormHelperText>}
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="customerId"
            control={control}
            rules={{ required: 'Харилцагч сонгоно уу', min: { value: 1, message: 'Харилцагч сонгоно уу' } }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.customerId}>
                <InputLabel>Харилцагч *</InputLabel>
                <Select
                  {...field}
                  label="Харилцагч *"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                >
                  <MenuItem value={0}>Харилцагч сонгох</MenuItem>
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
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="plannedDate"
            control={control}
            rules={{ required: 'Огноо оруулна уу' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Огноо *"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!errors.plannedDate}
                helperText={errors.plannedDate?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="plannedTime"
            control={control}
            rules={{ required: 'Цаг оруулна уу' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Цаг *"
                type="time"
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!errors.plannedTime}
                helperText={errors.plannedTime?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Тэмдэглэл"
                multiline
                rows={3}
                fullWidth
                placeholder="Нэмэлт тэмдэглэл..."
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
          {isSubmitting ? 'Хадгалж байна...' : visitPlan ? 'Засах' : 'Үүсгэх'}
        </Button>
      </Box>
    </Box>
  );
}

