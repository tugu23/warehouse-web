import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Divider,
  Button,
  Stack,
} from '@mui/material';
import { Print as PrintIcon, PictureAsPdf as PdfIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Order } from '../../types';
import { generateOrderReceiptPDF } from '../../utils/pdfGenerator';

interface OrderReceiptProps {
  order: Order;
}

export default function OrderReceipt({ order }: OrderReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      await generateOrderReceiptPDF(order, {
        download: true,
        filename: `receipt-${order.eReceiptNumber || order.id}.pdf`,
      });
      toast.success('PDF татагдлаа');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('PDF үүсгэхэд алдаа гарлаа');
    }
  };

  const totalAmount = Number(order.totalAmount);
  // Calculate VAT (10%) if not provided
  const vatAmount = order.vatAmount || totalAmount / 11;
  const cityTax = 0; // Assuming 0 for now as per example, or could be part of calculation

  return (
    <Box>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          justifyContent: 'flex-end',
          mb: 2,
          '@media print': { display: 'none' },
        }}
      >
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
          Хэвлэх
        </Button>
        <Button
          variant="contained"
          startIcon={<PdfIcon />}
          onClick={handleDownloadPDF}
          color="primary"
        >
          PDF татах
        </Button>
      </Stack>

      <Paper
        id="printable-receipt"
        sx={{
          p: 3,
          width: '100%',
          maxWidth: '148mm', // A5 width (210mm x 148mm)
          margin: '0 auto',
          fontFamily: 'Arial, sans-serif',
          '@media print': {
            boxShadow: 'none',
            p: 0,
            width: '148mm',
            maxWidth: '148mm',
            margin: 0,
          },
        }}
      >
        {/* Header with Top Border */}
        <Box
          sx={{
            borderTop: '2px solid #333',
            pt: 2,
            mb: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
            Агуулахын бараа бүртгэлийн систем
          </Typography>
        </Box>

        {/* Receipt Number Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            Зарлагын падаан № {order.eReceiptNumber || order.id}
          </Typography>
        </Box>

        {/* 1. General Receipt Info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            1. Баримтын ерөнхий мэдээлэл
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5, mb: 0.5 }}>
              <Typography variant="body2">• Баримтын дугаар:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                № {order.eReceiptNumber || order.id}
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5, mb: 0.5 }}>
              <Typography variant="body2">• ДДТД:</Typography>
              <Typography variant="body2" sx={{ fontSize: '11px' }}>
                {order.eReceiptId || '-'}
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5, mb: 0.5 }}>
              <Typography variant="body2">• ТТД:</Typography>
              <Typography variant="body2">5317878</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5, mb: 0.5 }}>
              <Typography variant="body2">• Баримт бүртгэгдсэн огноо:</Typography>
              <Typography variant="body2">
                {format(new Date(order.createdAt), 'yyyy-MM-dd')}
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5, mb: 0.5 }}>
              <Typography variant="body2">• Бараа олгосон огноо:</Typography>
              <Typography variant="body2">
                {order.deliveryDate
                  ? format(new Date(order.deliveryDate), 'yyyy-MM-dd')
                  : format(new Date(order.createdAt), 'yyyy-MM-dd')}
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5 }}>
              <Typography variant="body2">• Төлбөрийн хэлбэр:</Typography>
              <Typography variant="body2">{order.paymentMethod}</Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 2. Seller Info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            2. Борлуулагчийн мэдээлэл
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5, mb: 0.5 }}>
              <Typography variant="body2">• Нэр:</Typography>
              <Typography variant="body2">{order.createdBy?.name || 'Мөнгөншагай'}</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5 }}>
              <Typography variant="body2">• Утас:</Typography>
              <Typography variant="body2">{order.createdBy?.phoneNumber || '89741277'}</Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 3. Buyer Info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            3. Худалдан авагчийн мэдээлэл
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5, mb: 0.5 }}>
              <Typography variant="body2">• Нэр:</Typography>
              <Typography variant="body2">{order.customer?.name || '-'}</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5 }}>
              <Typography variant="body2">• Утас:</Typography>
              <Typography variant="body2">{order.customer?.phoneNumber || '-'}</Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 4. Store/Company Info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            4. Дэлгүүр / Байгууллагын мэдээлэл
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5, mb: 0.5 }}>
              <Typography variant="body2">• Нэр:</Typography>
              <Typography variant="body2">GLF LLC OASIS Бөөний төв</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5, mb: 0.5 }}>
              <Typography variant="body2">• Хаяг:</Typography>
              <Typography variant="body2">
                Монгол, Улаанбаатар, Сүхбаатар дүүрэг, 6-р хороо, 27-49
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5 }}>
              <Typography variant="body2">• Утас:</Typography>
              <Typography variant="body2">70121128, 88048350, 89741277</Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 5. Items List */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            5. Худалдан авсан барааны жагсаалт
          </Typography>
          <Table
            size="small"
            sx={{
              '& .MuiTableCell-root': {
                px: 1,
                py: 0.75,
                fontSize: '11px',
                border: '1px solid #ddd',
              },
              '& .MuiTableCell-head': {
                fontWeight: 'bold',
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ width: '30px' }}>
                  №
                </TableCell>
                <TableCell>Барааны нэр</TableCell>
                <TableCell>Баркод</TableCell>
                <TableCell align="center">Тоо ширхэг</TableCell>
                <TableCell align="right">Нэгж үнэ</TableCell>
                <TableCell align="right">Нийт үнэ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.orderItems?.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell align="center">{index + 1}</TableCell>
                  <TableCell>
                    {item.product?.nameMongolian || item.product?.nameEnglish || 'N/A'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '10px' }}>{item.product?.barcode || '-'}</TableCell>
                  <TableCell align="center">{item.quantity}</TableCell>
                  <TableCell align="right">{Number(item.unitPrice).toLocaleString()}</TableCell>
                  <TableCell align="right">{Number(item.subtotal).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 6. VAT Info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            6. НӨАТ мэдээлэл
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5, mb: 0.5 }}>
              <Typography variant="body2">• НӨАТ-тэй дүн:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {totalAmount.toLocaleString()}₮
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5, mb: 0.5 }}>
              <Typography variant="body2">• НӨАТ:</Typography>
              <Typography variant="body2">{vatAmount.toFixed(2).toLocaleString()}₮</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5 }}>
              <Typography variant="body2">• НХАТ:</Typography>
              <Typography variant="body2">{cityTax}₮</Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 7. E-Receipt Info */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            7. И-Баримт мэдээлэл
          </Typography>
          <Box
            sx={{
              width: 120,
              height: 120,
              border: '1px solid #ddd',
              bgcolor: '#f9f9f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" color="text.secondary" textAlign="center">
              QR код бүртгэлийн үед харагдана
            </Typography>
          </Box>
          {order.eReceiptId && (
            <Typography variant="caption" sx={{ fontSize: '9px', mt: 0.5 }}>
              YF: {order.eReceiptId}
            </Typography>
          )}
          {order.eReceiptNumber && (
            <Typography variant="caption" sx={{ mt: 0.5 }}>
              Баримтын дугаар: {order.eReceiptNumber}
            </Typography>
          )}
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', fontStyle: 'italic' }}>
            Баярлалаа / Thank you
          </Typography>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            textAlign: 'center',
            mt: 3,
            pt: 2,
            borderTop: '1px solid #ddd',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Зураг 2.3.3.13. Төлбөрийн баримт хэвлэгсэн байдал (Сугалаатай)
          </Typography>
        </Box>
      </Paper>

      <style>{`
        @media print {
          @page {
            size: A5 portrait;
            margin: 10mm;
          }
          body {
            margin: 0;
            padding: 0;
          }
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
            width: 148mm;
            padding: 5mm;
          }
        }
      `}</style>
    </Box>
  );
}
