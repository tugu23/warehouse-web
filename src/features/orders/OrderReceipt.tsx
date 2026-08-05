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
import { Fragment } from 'react';
import { Order } from '../../types';
import { generateOrderReceiptPDF } from '../../utils/pdfGenerator';
import { getPromotionDisplayInfo } from '../../utils/promotionUtils';

interface OrderReceiptProps {
  order: Order;
}

export default function OrderReceipt({ order }: OrderReceiptProps) {
  let calculatedSubtotal = 0;
  let calculatedVat = 0;
  const sellerName = order.agent?.name || order.createdBy?.name || '-';
  const sellerPhone = order.agent?.phoneNumber || order.createdBy?.phoneNumber || '-';
  const buyerSystemName = order.customer?.organizationName || order.customer?.name || '-';
  const buyerAddress = order.customer?.address || '-';

  order.orderItems?.forEach((item) => {
    calculatedSubtotal += Number(item.subtotal);
  });

  calculatedVat = calculatedSubtotal * 0.1;

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

  const cityTax = 0;

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
          maxWidth: '210mm',
          margin: '0 auto',
          fontFamily: 'Arial, sans-serif',
          '@media print': {
            boxShadow: 'none',
            p: 0,
            width: '210mm',
            maxWidth: '210mm',
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

        {/* Top Summary */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
            Борлуулалтын баримт
          </Typography>
          <Typography variant="body2">Борлуулагч: {sellerName}</Typography>
          <Typography variant="body2">Утас: {sellerPhone}</Typography>
        </Box>

        {/* 1. General Receipt Info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            1. Баримтын ерөнхий мэдээлэл
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5, mb: 0.5 }}>
              <Typography variant="body2">• Борлуулагч:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {sellerName}
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5, mb: 0.5 }}>
              <Typography variant="body2">• Утас:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {sellerPhone}
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

        {/* 2. Buyer Info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            2. Худалдан авагчийн мэдээлэл
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
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5, mt: 0.5 }}>
              <Typography variant="body2">• Хаяг:</Typography>
              <Typography variant="body2">{buyerAddress}</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5, mt: 0.5 }}>
              <Typography variant="body2">• Системийн нэр:</Typography>
              <Typography variant="body2">{buyerSystemName}</Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 3. Store/Company Info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            3. Дэлгүүр / Байгууллагын мэдээлэл
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5, mb: 0.5 }}>
              <Typography variant="body2">• Нэр:</Typography>
              <Typography variant="body2">Жи Эл Эф ххк</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5, mb: 0.5 }}>
              <Typography variant="body2">• Данс:</Typography>
              <Typography variant="body2">13000500 5070262037</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5 }}>
              <Typography variant="body2">• Утас:</Typography>
              <Typography variant="body2">70121128, 88048350, 89741277</Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 4. Items List */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            4. Худалдан авсан барааны жагсаалт
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
              {order.orderItems?.map((item, index) => {
                const [, freeItemCount] = getPromotionDisplayInfo(
                  item.quantity,
                  item.product?.promotions,
                  { promotionId: item.promotionId }
                );
                const mainItemNumber = index + 1;
                return (
                  <Fragment key={item.id}>
                    <TableRow>
                      <TableCell align="center">{mainItemNumber}</TableCell>
                      <TableCell>{item.product?.nameMongolian || 'N/A'}</TableCell>
                      <TableCell sx={{ fontSize: '10px' }}>{item.product?.barcode || '-'}</TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="right">{Number(item.unitPrice).toLocaleString()}</TableCell>
                      <TableCell align="right">{Number(item.subtotal).toLocaleString()}</TableCell>
                    </TableRow>
                    {/* Урамшуулалтай бол нэмэлт мөр нэмэх (2+1, 3+1 гэх мэт) */}
                    {freeItemCount > 0 && Array.from({ length: freeItemCount }).map((_, i) => (
                      <TableRow
                        key={`promo-${item.id}-${i}`}
                        sx={{ backgroundColor: '#f5f5f5', opacity: 0.7 }}
                      >
                        <TableCell align="center"></TableCell>
                        <TableCell sx={{ fontStyle: 'italic', color: '#666' }}>
                          {item.product?.nameMongolian} (Урамшуулал)
                        </TableCell>
                        <TableCell sx={{ fontSize: '10px' }}></TableCell>
                        <TableCell align="center">1</TableCell>
                        <TableCell align="right">0</TableCell>
                        <TableCell align="right">0</TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 5. VAT Info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            5. НӨАТ мэдээлэл
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5, mb: 0.5 }}>
              <Typography variant="body2">• НӨАТ-тэй дүн:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {calculatedSubtotal.toLocaleString()}₮
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5, mb: 0.5 }}>
              <Typography variant="body2">• НӨАТ:</Typography>
              <Typography variant="body2">{calculatedVat.toFixed(2).toLocaleString()}₮</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 0.5 }}>
              <Typography variant="body2">• НХАТ:</Typography>
              <Typography variant="body2">{cityTax}₮</Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 6. E-Receipt Info */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            6. И-Баримт мэдээлэл
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
            size: A4 portrait;
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
            width: 210mm;
            padding: 5mm;
          }
        }
      `}</style>
    </Box>
  );
}
