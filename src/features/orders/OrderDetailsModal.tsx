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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  Print as PrintIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { Order } from '../../types';
import ConfirmDialog from '../../components/ConfirmDialog';
import { posApi, EReceiptRequest } from '../../api/posApi';
import {
  downloadEReceiptPDF,
  printEReceiptPDF,
  openEReceiptPDF,
} from '../../utils/eReceiptPDF';

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
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  
  // Store e-receipt data after printing
  const [eReceiptData, setEReceiptData] = useState<{
    receiptNumber?: string;
    lottery?: string;
  }>({});

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
        // Store e-receipt data for PDF generation
        setEReceiptData({
          receiptNumber: response.receiptNumber,
          lottery: response.lottery,
        });

        toast.success(
          <Box>
            <Typography variant="body2" fontWeight="bold">
              И-баримт амжилттай хэвлэгдлээ!
            </Typography>
            <Typography variant="caption">
              Дугаар: {response.receiptNumber}
            </Typography>
            <Typography variant="caption" display="block">
              Сугалааны дугаар: {response.lottery}
            </Typography>
          </Box>,
          { duration: 5000 }
        );

        // TODO: Backend API-руу И-баримтын мэдээлэл хадгалах
      }
    } catch (error) {
      console.error('И-баримт хэвлэх алдаа:', error);
      toast.error('И-баримт хэвлэхэд алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setPrintingEReceipt(false);
    }
  };

  const handleDownloadPDF = () => {
    try {
      downloadEReceiptPDF(
        order,
        eReceiptData.receiptNumber || order.eReceiptNumber,
        eReceiptData.lottery
      );
      toast.success('PDF амжилттай татагдлаа');
    } catch (error) {
      console.error('PDF татах алдаа:', error);
      toast.error('PDF татахад алдаа гарлаа');
    }
  };

  const handlePrintPDF = () => {
    try {
      printEReceiptPDF(
        order,
        eReceiptData.receiptNumber || order.eReceiptNumber,
        eReceiptData.lottery
      );
      toast.success('PDF хэвлэх цонх нээгдлээ');
    } catch (error) {
      console.error('PDF хэвлэх алдаа:', error);
      toast.error('PDF хэвлэхэд алдаа гарлаа');
    }
  };

  const handlePreviewPDF = () => {
    try {
      openEReceiptPDF(
        order,
        eReceiptData.receiptNumber || order.eReceiptNumber,
        eReceiptData.lottery
      );
      toast.success('PDF шинэ цонхонд нээгдлээ');
    } catch (error) {
      console.error('PDF үзэх алдаа:', error);
      toast.error('PDF үзэхэд алдаа гарлаа');
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

  const hasEReceipt = order.eReceiptNumber || eReceiptData.receiptNumber;

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

        {(order.eReceiptNumber || eReceiptData.receiptNumber) && (
          <>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                И-баримтын дугаар
              </Typography>
              <Typography variant="body1" fontWeight="bold" color="primary">
                {eReceiptData.receiptNumber || order.eReceiptNumber}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Сугалааны дугаар
              </Typography>
              <Typography variant="body1" fontWeight="bold" color="success.main">
                {eReceiptData.lottery || 'N/A'}
              </Typography>
            </Grid>
          </>
        )}
      </Grid>

      {hasEReceipt && (
        <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircleIcon />}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2">
              И-баримт хэвлэгдсэн. PDF хэлбэрээр үзэх, татах, хэвлэх боломжтой.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton size="small" color="primary" onClick={handlePreviewPDF} title="PDF үзэх">
                <VisibilityIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" color="primary" onClick={handleDownloadPDF} title="PDF татах">
                <DownloadIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" color="primary" onClick={handlePrintPDF} title="PDF хэвлэх">
                <PrintIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
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
        {!hasEReceipt && (
          <Button
            variant="contained"
            color="primary"
            startIcon={printingEReceipt ? <CircularProgress size={20} /> : <ReceiptIcon />}
            onClick={handlePrintEReceipt}
            disabled={printingEReceipt || order.status === 'Cancelled'}
          >
            {printingEReceipt ? 'Хэвлэж байна...' : 'И-баримт хэвлэх'}
          </Button>
        )}

        {/* PDF үйлдлүүд */}
        {hasEReceipt && (
          <>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<VisibilityIcon />}
              onClick={handlePreviewPDF}
            >
              PDF үзэх
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadPDF}
            >
              PDF татах
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PrintIcon />}
              onClick={handlePrintPDF}
            >
              PDF хэвлэх
            </Button>
          </>
        )}

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
