import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Chip,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  MoreVert as MoreIcon,
  Receipt as ReceiptIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material';
import receiptService from '../services/receiptService';

interface Order {
  eReceiptNumber?: string;
  eReceiptLottery?: string;
  eReceiptQrCode?: string;
}

interface ReceiptActionsProps {
  orderId: number;
  order?: Order;
  variant?: 'default' | 'compact' | 'menu';
  showEBarimtInfo?: boolean;
}

export default function ReceiptActions({
  orderId,
  order,
  variant = 'default',
  showEBarimtInfo = true,
}: ReceiptActionsProps) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const eBarimtInfo = order ? receiptService.getEBarimtInfo(order) : null;

  const handleView = async () => {
    setLoading(true);
    setAction('view');
    try {
      await receiptService.viewReceipt(orderId);
    } catch (error) {
      console.error('View receipt error:', error);
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    setAction('download');
    try {
      const filename = order?.eReceiptNumber
        ? `ebarimt-${order.eReceiptNumber}.pdf`
        : `receipt-${orderId}.pdf`;
      await receiptService.downloadReceipt(orderId, filename);
    } catch (error) {
      console.error('Download receipt error:', error);
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handlePrint = async () => {
    setLoading(true);
    setAction('print');
    try {
      await receiptService.printReceipt(orderId);
    } catch (error) {
      console.error('Print receipt error:', error);
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handleShare = async () => {
    setLoading(true);
    setAction('share');
    try {
      await receiptService.shareReceipt(orderId);
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Share receipt error:', error);
      }
    } finally {
      setLoading(false);
      setAction(null);
      handleCloseMenu();
    }
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  // Compact variant - Icon buttons
  if (variant === 'compact') {
    return (
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="Үзэх">
          <IconButton size="small" onClick={handleView} disabled={loading} color="primary">
            {loading && action === 'view' ? (
              <CircularProgress size={20} />
            ) : (
              <PdfIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip title="Татах">
          <IconButton size="small" onClick={handleDownload} disabled={loading} color="success">
            {loading && action === 'download' ? (
              <CircularProgress size={20} />
            ) : (
              <DownloadIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip title="Хэвлэх">
          <IconButton size="small" onClick={handlePrint} disabled={loading}>
            {loading && action === 'print' ? (
              <CircularProgress size={20} />
            ) : (
              <PrintIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  // Menu variant - More options button
  if (variant === 'menu') {
    return (
      <>
        <IconButton onClick={handleOpenMenu} disabled={loading}>
          <MoreIcon />
        </IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
          <MenuItem onClick={handleView}>
            <ListItemIcon>
              <PdfIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Үзэх</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDownload}>
            <ListItemIcon>
              <DownloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Татах</ListItemText>
          </MenuItem>
          <MenuItem onClick={handlePrint}>
            <ListItemIcon>
              <PrintIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Хэвлэх</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleShare}>
            <ListItemIcon>
              <ShareIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Хуваалцах</ListItemText>
          </MenuItem>
        </Menu>
      </>
    );
  }

  // Default variant - Full buttons
  return (
    <Box>
      {/* E-Barimt Info */}
      {showEBarimtInfo && eBarimtInfo?.hasEBarimt && (
        <Alert severity="success" icon={<ReceiptIcon />} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <span>И-баримт:</span>
            <Chip
              label={eBarimtInfo.receiptNumber}
              size="small"
              color="success"
              icon={<ReceiptIcon />}
            />
            {eBarimtInfo.lottery && (
              <Chip
                label={`Сугалаа: ${eBarimtInfo.lottery}`}
                size="small"
                color="primary"
                icon={<QrCodeIcon />}
              />
            )}
          </Box>
        </Alert>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={loading && action === 'view' ? <CircularProgress size={20} /> : <PdfIcon />}
          onClick={handleView}
          disabled={loading}
        >
          Үзэх
        </Button>

        <Button
          variant="outlined"
          color="success"
          startIcon={
            loading && action === 'download' ? <CircularProgress size={20} /> : <DownloadIcon />
          }
          onClick={handleDownload}
          disabled={loading}
        >
          Татах
        </Button>

        <Button
          variant="outlined"
          startIcon={loading && action === 'print' ? <CircularProgress size={20} /> : <PrintIcon />}
          onClick={handlePrint}
          disabled={loading}
        >
          Хэвлэх
        </Button>

        {/* Share button - only on mobile */}
        {typeof navigator.share === 'function' && (
          <Button
            variant="outlined"
            color="secondary"
            startIcon={
              loading && action === 'share' ? <CircularProgress size={20} /> : <ShareIcon />
            }
            onClick={handleShare}
            disabled={loading}
          >
            Хуваалцах
          </Button>
        )}
      </Box>
    </Box>
  );
}
