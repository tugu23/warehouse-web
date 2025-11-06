import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Box, Button, TextField, Grid, FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import { CreateWorkTaskRequest, UpdateWorkTaskRequest, User } from '../../types';
import { employeesApi } from '../../api';

interface WorkTaskFormProps {
  task: any | null;
  onSubmit: (data: CreateWorkTaskRequest | UpdateWorkTaskRequest) => Promise<void>;
  onCancel: () => void;
}

export default function WorkTaskForm({ task, onSubmit, onCancel }: WorkTaskFormProps) {
  const [employees, setEmployees] = useState<User[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      assignedToId: task?.assignedToId || 0,
      priority: task?.priority || 'Medium',
      status: task?.status || 'Todo',
      dueDate: task?.dueDate || '',
    },
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await employeesApi.getAll();
      setEmployees(response.data.data?.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Controller
            name="title"
            control={control}
            rules={{ required: 'Гарчиг оруулна уу', minLength: { value: 3, message: 'Гарчиг 3-аас дээш тэмдэгт байх ёстой' } }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Гарчиг *"
                fullWidth
                error={!!errors.title}
                helperText={errors.title?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12}>
          <Controller
            name="description"
            control={control}
            rules={{ required: 'Тайлбар оруулна уу' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Тайлбар *"
                multiline
                rows={4}
                fullWidth
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="assignedToId"
            control={control}
            rules={{ required: 'Хариуцагч сонгоно уу', min: { value: 1, message: 'Хариуцагч сонгоно уу' } }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.assignedToId}>
                <InputLabel>Хариуцагч *</InputLabel>
                <Select
                  {...field}
                  label="Хариуцагч *"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                >
                  <MenuItem value={0}>Хариуцагч сонгох</MenuItem>
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.assignedToId && <FormHelperText>{errors.assignedToId.message}</FormHelperText>}
              </FormControl>
            )}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Чухал байдал</InputLabel>
                <Select {...field} label="Чухал байдал">
                  <MenuItem value="Low">Бага</MenuItem>
                  <MenuItem value="Medium">Дунд</MenuItem>
                  <MenuItem value="High">Өндөр</MenuItem>
                  <MenuItem value="Urgent">Яаралтай</MenuItem>
                </Select>
              </FormControl>
            )}
          />
        </Grid>

        {task && (
          <Grid item xs={12} sm={6}>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Төлөв</InputLabel>
                  <Select {...field} label="Төлөв">
                    <MenuItem value="Todo">Хийх</MenuItem>
                    <MenuItem value="InProgress">Хийж байгаа</MenuItem>
                    <MenuItem value="Completed">Дууссан</MenuItem>
                    <MenuItem value="Cancelled">Цуцлагдсан</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
        )}

        <Grid item xs={12} sm={task ? 6 : 12}>
          <Controller
            name="dueDate"
            control={control}
            rules={{ required: 'Хугацаа оруулна уу' }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Дуусах хугацаа *"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!errors.dueDate}
                helperText={errors.dueDate?.message}
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
          {isSubmitting ? 'Хадгалж байна...' : task ? 'Засах' : 'Үүсгэх'}
        </Button>
      </Box>
    </Box>
  );
}

