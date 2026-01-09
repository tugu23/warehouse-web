import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Grid,
  Paper,
  FormHelperText,
} from '@mui/material';
import { toast } from 'react-hot-toast';
import { Order, PaymentMethod, RecordPaymentRequest } from '../../types';
import { ordersApi } from '../../api';

interface PaymentRecordModalProps {
  order: Order;
  onSuccess: () => void;
  onCancel: () => void;
}

interface PaymentFormData {
  amount: number;
  paymentMethod: PaymentMethod;
  notes: string;
}

export default function PaymentRecordModal({
  order,
  onSuccess,
  onCancel,
}: PaymentRecordModalProps) {
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormData>({
    defaultValues: {
      amount: order.remainingAmount || 0,
      paymentMethod: order.paymentMethod || 'Бэлэн',
      notes: '',
    },
  });

  const handleRecordPayment = async (data: PaymentFormData) => {
    setLoading(true);
    try {
      const paymentData: RecordPaymentRequest = {
        orderId: order.id,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        notes: data.notes || undefined,
      };

      await ordersApi.recordPayment(paymentData);
      toast.success('Төлбөр амжилттай бүртгэгдлээ');
      onSuccess();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Төлбөр бүртгэхэд алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = Number(order.totalAmount);
  const paidAmount = order.paidAmount || 0;
  const remainingAmount = order.remainingAmount || 0;

  return (
    <Box component="form" onSubmit={handleSubmit(handleRecordPayment)}>
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.100' }}>
        <Typography variant="h6" gutterBottom>
          Захиалгын мэдээлэл
        </Typography>
        <Grid container spacing={2}>
          <Grid size={6}>
            <Typography variant="body2">Захиалгын №:</Typography>
            <Typography variant="body1" fontWeight="bold">
              #{order.id}
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="body2">Харилцагч:</Typography>
            <Typography variant="body1" fontWeight="bold">
              {order.customer?.name}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant="body2">Нийт дүн:</Typography>
            <Typography variant="body1" fontWeight="bold">
              ₮{totalAmount.toLocaleString()}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant="body2">Төлсөн:</Typography>
            <Typography variant="body1" fontWeight="bold" color="success.main">
              ₮{paidAmount.toLocaleString()}
            </Typography>
          </Grid>
          <Grid size={4}>
            <Typography variant="body2">Үлдэгдэл:</Typography>
            <Typography variant="body1" fontWeight="bold" color="error.main">
              ₮{remainingAmount.toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2}>
        <Grid size={12}>
          <Controller
            name="amount"
            control={control}
            rules={{
              required: 'Төлбөрийн дүн оруулна уу',
              min: { value: 1, message: 'Төлбөрийн дүн 0-өөс их байх ёстой' },
              max: {
                value: remainingAmount,
                message: `Төлбөрийн дүн үлдэгдлээс ихгүй байх ёстой (₮${remainingAmount.toLocaleString()})`,
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Төлбөрийн дүн (₮) *"
                type="number"
                fullWidth
                error={!!errors.amount}
                helperText={errors.amount?.message}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            )}
          />
        </Grid>

        <Grid size={12}>
          <Controller
            name="paymentMethod"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.paymentMethod}>
                <InputLabel>Төлбөрийн хэлбэр *</InputLabel>
                <Select {...field} label="Төлбөрийн хэлбэр *">
                  <MenuItem value="Бэлэн">Бэлэн</MenuItem>
                  <MenuItem value="Данс">Данс</MenuItem>
                  <MenuItem value="Борлуулалт">Борлуулалт</MenuItem>
                  <MenuItem value="Падаан">Падаан</MenuItem>
                </Select>
                {errors.paymentMethod && (
                  <FormHelperText>{errors.paymentMethod.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        </Grid>

        <Grid size={12}>
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
        <Button onClick={onCancel} disabled={loading}>
          Болих
        </Button>
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? 'Бүртгэж байна...' : 'Төлбөр бүртгэх'}
        </Button>
      </Box>
    </Box>
  );
}
