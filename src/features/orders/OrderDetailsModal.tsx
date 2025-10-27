import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Divider,
  Grid,
} from '@mui/material';
import { Order } from '../../types';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useState } from 'react';

interface OrderDetailsModalProps {
  order: Order | null;
  onUpdateStatus: (orderId: number, status: string) => void;
  canManage: boolean;
}

export default function OrderDetailsModal({
  order,
  onUpdateStatus,
  canManage,
}: OrderDetailsModalProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');

  if (!order) return null;

  const handleStatusChange = (status: string) => {
    setNewStatus(status);
    setConfirmDialogOpen(true);
  };

  const confirmStatusChange = () => {
    onUpdateStatus(order.id, newStatus);
    setConfirmDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
      Pending: 'warning',
      Fulfilled: 'success',
      Cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            Customer
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {order.customer?.name}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            Status
          </Typography>
          <Chip label={order.status} color={getStatusColor(order.status)} />
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            Created By
          </Typography>
          <Typography variant="body1">{order.createdBy?.name}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            Created At
          </Typography>
          <Typography variant="body1">{new Date(order.createdAt).toLocaleString()}</Typography>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        Order Items
      </Typography>

      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell align="center">Quantity</TableCell>
              <TableCell align="right">Unit Price</TableCell>
              <TableCell align="right">Subtotal</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {order.orderItems?.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.product?.nameEnglish || 'Unknown Product'}</TableCell>
                <TableCell align="center">{item.quantity}</TableCell>
                <TableCell align="right">₮{Number(item.unitPrice).toLocaleString()}</TableCell>
                <TableCell align="right">₮{Number(item.subtotal).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} align="right">
                <Typography variant="h6">Total:</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="h6">₮{Number(order.totalAmount).toLocaleString()}</Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {canManage && order.status === 'Pending' && (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" color="error" onClick={() => handleStatusChange('Cancelled')}>
            Cancel Order
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleStatusChange('Fulfilled')}
          >
            Mark as Fulfilled
          </Button>
        </Box>
      )}

      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={confirmStatusChange}
        title="Confirm Status Change"
        message={`Are you sure you want to change the order status to "${newStatus}"?`}
        danger={newStatus === 'Cancelled'}
      />
    </Box>
  );
}
