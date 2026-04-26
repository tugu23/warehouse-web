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
} from '@mui/material';
import {
  Store as StoreIcon,
  Warehouse as WarehouseIcon,
  Description as DescriptionIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { Order } from '../../types';
import ConfirmDialog from '../../components/ConfirmDialog';
import { ordersApi } from '../../api';
import { formatDateMN } from '../../utils/dateFormatter';
import EbarimtPrintModal from './EbarimtPrintModal';
import OrderForm2 from './OrderForm2';

interface OrderDetailsModalProps {
  order: Order | null;
  onUpdateStatus: (orderId: number, status: string) => void;
  canManage: boolean;
  currentUserId?: number;
  onRefresh?: () => void;
}

export default function OrderDetailsModal({
  order,
  onUpdateStatus,
  canManage,
  currentUserId,
  onRefresh,
}: OrderDetailsModalProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [ebarimtPrintOpen, setEbarimtPrintOpen] = useState(false);
  const [editOrderOpen, setEditOrderOpen] = useState(false);

  if (!order) return null;

  const handleStatusChange = (status: string) => {
    setNewStatus(status);
    setConfirmDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    onUpdateStatus(order.id, newStatus);
    setConfirmDialogOpen(false);
    if (newStatus === 'Fulfilled' && !order.ebarimtRegistered) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const response = await ordersApi.getById(order.id);
      if (response.data.data?.order) {
        setEbarimtPrintOpen(true);
      }
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
      Pending: 'warning',
      Fulfilled: 'success',
      Cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const handleViewNonVatReceipt = async () => {
    try {
      await ordersApi.viewNonVatReceiptPDF(order.id);
    } catch (error) {
      console.error('Error viewing non-VAT receipt:', error);
      toast.error('Падаан нээхэд алдаа гарлаа');
    }
  };

  const canPrintEbarimt = order.status === 'Fulfilled' && !order.ebarimtRegistered;
  const canEditBeforeEbarimt = order.status === 'Pending' && !order.ebarimtRegistered;

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={6}>
          <Typography variant="body2" color="text.secondary">
            Харилцагч
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {order.customer?.name}
          </Typography>
        </Grid>
        <Grid size={6}>
          <Typography variant="body2" color="text.secondary">
            Төлөв
          </Typography>
          <Chip label={order.status} color={getStatusColor(order.status)} />
        </Grid>
        <Grid size={6}>
          <Typography variant="body2" color="text.secondary">
            Захиалгын төрөл
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {order.orderType === 'Store' ? (
              <>
                <StoreIcon color="success" fontSize="small" />
                <Chip label="Дэлгүүр" color="success" size="small" />
              </>
            ) : (
              <>
                <WarehouseIcon color="primary" fontSize="small" />
                <Chip label="Захын лангуу" color="primary" size="small" />
              </>
            )}
          </Box>
        </Grid>
        <Grid size={6}>
          <Typography variant="body2" color="text.secondary">
            Үүсгэсэн
          </Typography>
          <Typography variant="body1">{order.createdBy?.name}</Typography>
        </Grid>
        <Grid size={6}>
          <Typography variant="body2" color="text.secondary">
            Огноо
          </Typography>
          <Typography variant="body1">{formatDateMN(order.createdAt)}</Typography>
        </Grid>

        {/* eBarimt төлөв */}
        <Grid size={6}>
          <Typography variant="body2" color="text.secondary">
            eBarimt
          </Typography>
          {order.ebarimtReturnId ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
              <Chip label="Буцаагдсан" size="small" color="default" />
              {order.ebarimtBillId && (
                <Typography variant="caption" color="text.secondary">
                  ДДТД: …{order.ebarimtBillId.slice(-8)}
                </Typography>
              )}
            </Box>
          ) : order.ebarimtRegistered ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CheckCircleIcon color="success" fontSize="small" />
              <Typography variant="body2" color="success.main" fontWeight="bold">
                Бүртгэгдсэн
              </Typography>
              {order.ebarimtBillId && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                  ({order.ebarimtBillId.slice(-8)})
                </Typography>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              —
            </Typography>
          )}
        </Grid>
      </Grid>

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
                <TableCell>{item.product?.nameMongolian || 'Тодорхойгүй'}</TableCell>
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

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {/* Падаан харах */}
        <Button
          variant="outlined"
          color="warning"
          startIcon={<DescriptionIcon />}
          onClick={handleViewNonVatReceipt}
        >
          Падаан харах
        </Button>

        {canEditBeforeEbarimt && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => setEditOrderOpen(true)}
          >
            Захиалга засах
          </Button>
        )}

        {/* eBarimt хэвлэх — зөвхөн Fulfilled, хэвлэгдээгүй тохиолдолд */}
        {canPrintEbarimt && (
          <Button
            variant="contained"
            color="success"
            startIcon={<ReceiptIcon />}
            onClick={() => setEbarimtPrintOpen(true)}
          >
            eBarimt хэвлэх
          </Button>
        )}

        {/* Төлөв өөрчлөх */}
        {(canManage || (currentUserId && order.createdById === currentUserId)) &&
          order.status === 'Pending' && (
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

      {ebarimtPrintOpen && (
        <EbarimtPrintModal
          order={order}
          onClose={() => setEbarimtPrintOpen(false)}
          onSuccess={() => {
            setEbarimtPrintOpen(false);
            onRefresh?.();
          }}
        />
      )}

      {editOrderOpen && (
        <OrderForm2
          initialOrder={order}
          onClose={() => setEditOrderOpen(false)}
          onSuccess={() => {
            setEditOrderOpen(false);
            onRefresh?.();
            toast.success('Захиалга шинэчлэгдлээ');
          }}
        />
      )}
    </Box>
  );
}
