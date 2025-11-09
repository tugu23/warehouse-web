import { useState } from 'react';
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
  Alert,
  CircularProgress,
} from '@mui/material';
import { Receipt as ReceiptIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { Order } from '../../types';
import ConfirmDialog from '../../components/ConfirmDialog';
import { posApi, EReceiptRequest } from '../../api/posApi';

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
  const [printingEReceipt, setPrintingEReceipt] = useState(false);

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

  const handlePrintEReceipt = async () => {
    if (!order.orderItems || order.orderItems.length === 0) {
      toast.error('Захиалгын барааны мэдээлэл олдсонгүй');
      return;
    }

    setPrintingEReceipt(true);

    try {
      const eReceiptRequest: EReceiptRequest = {
        orderId: order.id,
        amount: Number(order.totalAmount),
        customerTin: order.customer?.registrationNumber,
        customerName: order.customer?.name || 'Customer',
        items: order.orderItems.map((item) => ({
          name: item.product?.nameEnglish || item.product?.nameMongolian || 'Product',
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.subtotal),
          barCode: item.product?.barcode,
        })),
        paymentMethod: order.paymentMethod || 'Бэлэн',
        cashierId: order.createdById,
        cashierName: order.createdBy?.name || 'Cashier',
      };

      const response = await posApi.printEReceipt(eReceiptRequest);

      if (response.success) {
        toast.success(
          <Box>
            <Typography variant="body2" fontWeight="bold">
              И-баримт амжилттай хэвлэгдлээ!
            </Typography>
            <Typography variant="caption">Дугаар: {response.receiptNumber}</Typography>
            <Typography variant="caption" display="block">
              Сугалааны дугаар: {response.lottery}
            </Typography>
          </Box>,
          { duration: 5000 }
        );

        // TODO: Backend API-руу И-баримтын мэдээлэл хадгалах
        // await ordersApi.updateEReceipt(order.id, {
        //   eReceiptId: response.receiptId,
        //   eReceiptNumber: response.receiptNumber,
        //   eReceiptStatus: 'printed',
        //   eReceiptUrl: response.receiptUrl,
        //   eReceiptPrintedAt: response.timestamp,
        // });
      }
    } catch (error) {
      console.error('И-баримт хэвлэх алдаа:', error);
      toast.error('И-баримт хэвлэхэд алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setPrintingEReceipt(false);
    }
  };

  const getEReceiptStatusChip = () => {
    if (!order.eReceiptStatus) return null;

    const statusConfig = {
      pending: { label: 'Хүлээгдэж байна', color: 'warning' as const },
      printed: { label: 'Хэвлэгдсэн', color: 'success' as const },
      failed: { label: 'Алдаатай', color: 'error' as const },
    };

    const config = statusConfig[order.eReceiptStatus];
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            Харилцагч
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {order.customer?.name}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            Төлөв
          </Typography>
          <Chip label={order.status} color={getStatusColor(order.status)} />
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            Үүсгэсэн
          </Typography>
          <Typography variant="body1">{order.createdBy?.name}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="body2" color="text.secondary">
            Огноо
          </Typography>
          <Typography variant="body1">{new Date(order.createdAt).toLocaleString()}</Typography>
        </Grid>

        {order.eReceiptNumber && (
          <>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                И-баримтын дугаар
              </Typography>
              <Typography variant="body1" fontWeight="bold" color="primary">
                {order.eReceiptNumber}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                И-баримтын төлөв
              </Typography>
              {getEReceiptStatusChip()}
            </Grid>
          </>
        )}
      </Grid>

      {order.eReceiptNumber && order.eReceiptUrl && (
        <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircleIcon />}>
          <Typography variant="body2">
            И-баримт хэвлэгдсэн.
            <Button size="small" href={order.eReceiptUrl} target="_blank" sx={{ ml: 1 }}>
              Татаж авах
            </Button>
          </Typography>
        </Alert>
      )}

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        Захиалгын барааны жагсаалт
      </Typography>

      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Бараа</TableCell>
              <TableCell align="center">Тоо ширхэг</TableCell>
              <TableCell align="right">Нэгж үнэ</TableCell>
              <TableCell align="right">Дүн</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {order.orderItems?.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.product?.nameEnglish || 'Тодорхойгүй'}</TableCell>
                <TableCell align="center">{item.quantity}</TableCell>
                <TableCell align="right">₮{Number(item.unitPrice).toLocaleString()}</TableCell>
                <TableCell align="right">₮{Number(item.subtotal).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} align="right">
                <Typography variant="h6">Нийт дүн:</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="h6">₮{Number(order.totalAmount).toLocaleString()}</Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {/* И-баримт хэвлэх товч */}
        <Button
          variant="contained"
          color="primary"
          startIcon={printingEReceipt ? <CircularProgress size={20} /> : <ReceiptIcon />}
          onClick={handlePrintEReceipt}
          disabled={printingEReceipt || order.status === 'Cancelled'}
        >
          {printingEReceipt ? 'Хэвлэж байна...' : 'И-баримт хэвлэх'}
        </Button>

        {/* Төлөв өөрчлөх товчнууд */}
        {canManage && order.status === 'Pending' && (
          <>
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleStatusChange('Cancelled')}
            >
              Цуцлах
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => handleStatusChange('Fulfilled')}
            >
              Гүйцэтгэсэн
            </Button>
          </>
        )}
      </Box>

      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={confirmStatusChange}
        title="Төлөв өөрчлөх баталгаажуулалт"
        message={`Та захиалгын төлвийг "${newStatus}" болгохыг зөвшөөрч байна уу?`}
        danger={newStatus === 'Cancelled'}
      />
    </Box>
  );
}
