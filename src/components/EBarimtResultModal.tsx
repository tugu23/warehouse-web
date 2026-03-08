import { useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  Print as PrintIcon,
  CheckCircle as SuccessIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

export interface EBarimtResultData {
  orderId?: number;
  billId?: string;
  lottery?: string;
  qrData?: string;
  isB2B?: boolean;
  message?: string;
}

interface EBarimtResultModalProps {
  open: boolean;
  onClose: () => void;
  result: EBarimtResultData | null;
  title?: string;
}

export default function EBarimtResultModal({
  open,
  onClose,
  result,
  title = 'И-Баримт бүртгэгдлээ',
}: EBarimtResultModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>E-Barimt</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
                .qr-container { margin: 20px auto; }
                .lottery { font-size: 24px; font-weight: bold; margin: 16px 0; }
                .info { margin: 8px 0; color: #666; }
                .bill-id { font-size: 12px; color: #999; }
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  if (!result) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SuccessIcon color="success" />
        {title}
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Анхааруулга: Сугалааны дугаар болон QR код зөвхөн одоо харагдах болно. Хадгалагдахгүй тул
          хэвлэх эсвэл тэмдэглэж авна уу!
        </Alert>

        <Box ref={printRef}>
          {result.isB2B ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <BusinessIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Chip label="ААН (B2B)" color="primary" sx={{ mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Байгууллагын баримт (B2B) бүртгэгдсэн тул сугалааны дугаар байхгүй.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              {result.lottery && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Сугалааны дугаар
                  </Typography>
                  <Typography
                    variant="h4"
                    className="lottery"
                    sx={{ fontWeight: 'bold', fontFamily: 'monospace', mb: 2 }}
                  >
                    {result.lottery}
                  </Typography>
                </>
              )}

              {result.qrData && (
                <Box className="qr-container" sx={{ my: 2 }}>
                  <img
                    src={
                      result.qrData.startsWith('data:')
                        ? result.qrData
                        : `data:image/png;base64,${result.qrData}`
                    }
                    alt="E-Barimt QR Code"
                    style={{ width: 180, height: 180 }}
                  />
                </Box>
              )}
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ textAlign: 'center' }}>
            {result.billId && (
              <Typography variant="caption" className="bill-id" color="text.secondary">
                ДДТД: {result.billId}
              </Typography>
            )}
            {result.orderId && (
              <Typography variant="caption" display="block" color="text.secondary">
                Захиалга: #{result.orderId}
              </Typography>
            )}
          </Box>
        </Box>

        {result.message && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {result.message}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Хаах</Button>
        {!result.isB2B && (result.lottery || result.qrData) && (
          <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
            Хэвлэх
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
