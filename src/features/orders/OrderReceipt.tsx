import { Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Divider, Button } from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { Order } from '../../types';

interface OrderReceiptProps {
  order: Order;
}

export default function OrderReceipt({ order }: OrderReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  const totalAmount = Number(order.totalAmount);
  const paidAmount = order.paidAmount || 0;
  const remainingAmount = order.remainingAmount || 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, '@media print': { display: 'none' } }}>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
          Хэвлэх
        </Button>
      </Box>

      <Paper sx={{ p: 4, '@media print': { boxShadow: 'none', p: 2 } }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            ЗАХИАЛГЫН БАРИМТ
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Oasis Sales Management
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Order Info */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Захиалгын мэдээлэл
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <Typography>
              <strong>Захиалгын дугаар:</strong> #{order.id}
            </Typography>
            <Typography>
              <strong>Огноо:</strong> {format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm')}
            </Typography>
            <Typography>
              <strong>Харилцагч:</strong> {order.customer?.name || 'N/A'}
            </Typography>
            <Typography>
              <strong>Агент:</strong> {order.createdBy?.name || 'N/A'}
            </Typography>
            <Typography>
              <strong>Төлөв:</strong> {order.status}
            </Typography>
            <Typography>
              <strong>Төлбөрийн хэлбэр:</strong> {order.paymentMethod || 'N/A'}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Items Table */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Барааны жагсаалт
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>№</strong></TableCell>
                <TableCell><strong>Бараа</strong></TableCell>
                <TableCell align="right"><strong>Тоо ширхэг</strong></TableCell>
                <TableCell align="right"><strong>Нэгж үнэ</strong></TableCell>
                <TableCell align="right"><strong>Дүн</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.orderItems?.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.product?.nameEnglish || 'N/A'}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">₮{Number(item.unitPrice).toLocaleString()}</TableCell>
                  <TableCell align="right">₮{Number(item.subtotal).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Totals */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Box sx={{ minWidth: 300 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography><strong>Нийт дүн:</strong></Typography>
              <Typography><strong>₮{totalAmount.toLocaleString()}</strong></Typography>
            </Box>
            {order.paymentStatus && order.paymentStatus !== 'Paid' && (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Төлсөн дүн:</Typography>
                  <Typography>₮{paidAmount.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="error"><strong>Үлдэгдэл:</strong></Typography>
                  <Typography color="error"><strong>₮{remainingAmount.toLocaleString()}</strong></Typography>
                </Box>
                {order.creditDueDate && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Төлөх огноо:</Typography>
                    <Typography>{format(new Date(order.creditDueDate), 'yyyy-MM-dd')}</Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Баярлалаа! / Thank you!
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Утас: +976 1234-5678 | И-мэйл: info@oasis.mn
          </Typography>
        </Box>
      </Paper>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </Box>
  );
}

