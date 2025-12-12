# E-Barimt Frontend Implementation Guide

## 📋 Complete TypeScript/React Implementation

This guide provides complete, production-ready code for implementing E-Barimt receipt viewing, downloading, and printing functionality.

---

## 🎯 Overview

### Features Included

✅ View Receipt PDF in new tab  
✅ Download Receipt PDF to device  
✅ Print Receipt directly  
✅ Share Receipt (mobile)  
✅ E-Barimt QR code display  
✅ Loading states & error handling  
✅ Responsive design  
✅ Mongolian Cyrillic text support

---

## 📁 File Structure

```
src/
├── services/
│   └── receiptService.ts          # API calls for receipts
├── components/
│   ├── ReceiptActions.tsx         # Main receipt actions component
│   └── ReceiptModal.tsx           # Optional: Modal view component
├── features/
│   └── orders/
│       ├── OrderReceipt.tsx       # Already implemented ✅
│       ├── OrderDetailsModal.tsx  # Add receipt buttons here
│       └── OrdersList.tsx         # Optional: Quick actions
└── styles/
    └── receipt.css                # Receipt-specific styles
```

---

## 1️⃣ Receipt Service (services/receiptService.ts)

```typescript
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export interface ReceiptResponse {
  success: boolean;
  receiptUrl?: string;
  receiptId?: string;
  lottery?: string;
  qrCode?: string;
  error?: string;
}

class ReceiptService {
  /**
   * Get receipt PDF URL for viewing
   */
  getReceiptPdfUrl(orderId: number): string {
    return `${API_BASE_URL}/orders/${orderId}/receipt/pdf`;
  }

  /**
   * Get receipt PDF download URL
   */
  getReceiptDownloadUrl(orderId: number): string {
    return `${API_BASE_URL}/orders/${orderId}/receipt/pdf?download=true`;
  }

  /**
   * View receipt in new tab
   */
  async viewReceipt(orderId: number): Promise<void> {
    try {
      const url = this.getReceiptPdfUrl(orderId);
      window.open(url, '_blank');
      toast.success('Баримт нээгдэж байна...');
    } catch (error) {
      console.error('Error viewing receipt:', error);
      toast.error('Баримт нээхэд алдаа гарлаа');
      throw error;
    }
  }

  /**
   * Download receipt PDF
   */
  async downloadReceipt(orderId: number, filename?: string): Promise<void> {
    try {
      const url = this.getReceiptDownloadUrl(orderId);

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `receipt-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Баримт татаж авах үйлдэл эхэллээ');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Баримт татахад алдаа гарлаа');
      throw error;
    }
  }

  /**
   * Fetch receipt as blob for advanced operations
   */
  async fetchReceiptBlob(orderId: number): Promise<Blob> {
    try {
      const url = this.getReceiptPdfUrl(orderId);
      const response = await axios.get(url, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching receipt blob:', error);
      toast.error('Баримт татахад алдаа гарлаа');
      throw error;
    }
  }

  /**
   * Print receipt directly
   */
  async printReceipt(orderId: number): Promise<void> {
    try {
      const blob = await this.fetchReceiptBlob(orderId);
      const url = URL.createObjectURL(blob);

      // Open in new window for printing
      const printWindow = window.open(url, '_blank');

      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          // Clean up blob URL after printing
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        };
        toast.success('Хэвлэх цонх нээгдэж байна...');
      } else {
        toast.error('Pop-up цонх блоклогдсон байна');
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      toast.error('Хэвлэхэд алдаа гарлаа');
      throw error;
    }
  }

  /**
   * Share receipt (mobile)
   */
  async shareReceipt(orderId: number): Promise<void> {
    try {
      if (navigator.share) {
        const blob = await this.fetchReceiptBlob(orderId);
        const file = new File([blob], `receipt-${orderId}.pdf`, {
          type: 'application/pdf',
        });

        await navigator.share({
          title: `Баримт №${orderId}`,
          text: 'Зарлагын падаан',
          files: [file],
        });

        toast.success('Баримт хуваалцлаа');
      } else {
        // Fallback: Copy link to clipboard
        const url = this.getReceiptPdfUrl(orderId);
        await navigator.clipboard.writeText(url);
        toast.success('Линк хуулагдлаа');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing receipt:', error);
        toast.error('Хуваалцахад алдаа гарлаа');
      }
      throw error;
    }
  }

  /**
   * Get E-Barimt info from order
   */
  getEBarimtInfo(order: any): {
    hasEBarimt: boolean;
    receiptNumber?: string;
    lottery?: string;
    qrCode?: string;
  } {
    return {
      hasEBarimt: !!order.eReceiptNumber,
      receiptNumber: order.eReceiptNumber,
      lottery: order.eReceiptLottery,
      qrCode: order.eReceiptQrCode,
    };
  }
}

export const receiptService = new ReceiptService();
export default receiptService;
```

---

## 2️⃣ Receipt Actions Component (components/ReceiptActions.tsx)

```typescript
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
import { toast } from 'react-hot-toast';
import receiptService from '../services/receiptService';

interface ReceiptActionsProps {
  orderId: number;
  order?: any;
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
    } catch (error: any) {
      if (error.name !== 'AbortError') {
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
          <IconButton
            size="small"
            onClick={handleView}
            disabled={loading}
            color="primary"
          >
            {loading && action === 'view' ? (
              <CircularProgress size={20} />
            ) : (
              <PdfIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip title="Татах">
          <IconButton
            size="small"
            onClick={handleDownload}
            disabled={loading}
            color="success"
          >
            {loading && action === 'download' ? (
              <CircularProgress size={20} />
            ) : (
              <DownloadIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip title="Хэвлэх">
          <IconButton
            size="small"
            onClick={handlePrint}
            disabled={loading}
          >
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
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
        >
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
          startIcon={
            loading && action === 'view' ? (
              <CircularProgress size={20} />
            ) : (
              <PdfIcon />
            )
          }
          onClick={handleView}
          disabled={loading}
        >
          Үзэх
        </Button>

        <Button
          variant="outlined"
          color="success"
          startIcon={
            loading && action === 'download' ? (
              <CircularProgress size={20} />
            ) : (
              <DownloadIcon />
            )
          }
          onClick={handleDownload}
          disabled={loading}
        >
          Татах
        </Button>

        <Button
          variant="outlined"
          startIcon={
            loading && action === 'print' ? (
              <CircularProgress size={20} />
            ) : (
              <PrintIcon />
            )
          }
          onClick={handlePrint}
          disabled={loading}
        >
          Хэвлэх
        </Button>

        {/* Share button - only on mobile */}
        {navigator.share && (
          <Button
            variant="outlined"
            color="secondary"
            startIcon={
              loading && action === 'share' ? (
                <CircularProgress size={20} />
              ) : (
                <ShareIcon />
              )
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
```

---

## 3️⃣ Integration with OrderDetailsModal

Update your `OrderDetailsModal.tsx`:

```typescript
import ReceiptActions from '../../components/ReceiptActions';

// Inside the modal, add this section:
<Box sx={{ mt: 3, mb: 2 }}>
  <Typography variant="h6" gutterBottom>
    Баримт
  </Typography>
  <ReceiptActions
    orderId={order.id}
    order={order}
    showEBarimtInfo={true}
  />
</Box>
```

---

## 4️⃣ Integration with OrdersList (Quick Actions)

Add quick actions to your orders list:

```typescript
import ReceiptActions from '../../components/ReceiptActions';

// In your table cell:
<TableCell>
  <ReceiptActions
    orderId={row.id}
    order={row}
    variant="compact"
    showEBarimtInfo={false}
  />
</TableCell>
```

---

## 5️⃣ Styling (styles/receipt.css)

```css
/* Receipt Actions Styling */
.receipt-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.receipt-actions--compact {
  gap: 4px;
}

.receipt-action-button {
  min-width: 120px;
}

.receipt-action-button--loading {
  opacity: 0.6;
  pointer-events: none;
}

/* E-Barimt Badge */
.ebarimt-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
}

.ebarimt-badge__icon {
  width: 16px;
  height: 16px;
}

/* Receipt Modal */
.receipt-modal {
  max-width: 800px;
  margin: 20px auto;
}

.receipt-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.receipt-modal__body {
  padding: 24px;
  max-height: 600px;
  overflow-y: auto;
}

.receipt-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
}

/* Loading State */
.receipt-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 16px;
}

.receipt-loading__spinner {
  width: 48px;
  height: 48px;
}

.receipt-loading__text {
  color: #666;
  font-size: 14px;
}

/* Mobile Responsive */
@media (max-width: 600px) {
  .receipt-actions {
    flex-direction: column;
    width: 100%;
  }

  .receipt-action-button {
    width: 100%;
  }

  .receipt-modal {
    margin: 0;
    max-width: 100%;
  }

  .receipt-modal__body {
    padding: 16px;
  }
}

/* Print Styles */
@media print {
  .receipt-actions,
  .receipt-modal__header,
  .receipt-modal__footer {
    display: none !important;
  }

  .receipt-modal__body {
    max-height: none;
    overflow: visible;
  }
}
```

---

## 6️⃣ Error Handling Examples

```typescript
// Custom error handler
const handleReceiptError = (error: any, action: string) => {
  let message = `Баримт ${action}-д алдаа гарлаа`;

  if (error.response) {
    // Server responded with error
    switch (error.response.status) {
      case 404:
        message = 'Баримт олдсонгүй';
        break;
      case 500:
        message = 'Серверийн алдаа гарлаа';
        break;
      case 403:
        message = 'Хандах эрх байхгүй байна';
        break;
    }
  } else if (error.request) {
    // Request made but no response
    message = 'Сервертэй холбогдох боломжгүй байна';
  }

  toast.error(message);
  console.error(`Receipt ${action} error:`, error);
};

// Usage in component
try {
  await receiptService.viewReceipt(orderId);
} catch (error) {
  handleReceiptError(error, 'үзэх');
}
```

---

## 7️⃣ Testing Checklist

### Manual Testing

- [ ] **View Receipt**
  - [ ] Opens in new tab
  - [ ] Mongolian text displays correctly
  - [ ] QR code is visible
  - [ ] All sections present (1-7)
- [ ] **Download Receipt**
  - [ ] File downloads successfully
  - [ ] Filename is correct
  - [ ] PDF opens properly
  - [ ] Can view offline
- [ ] **Print Receipt**
  - [ ] Print dialog opens
  - [ ] A5 format is correct
  - [ ] All content fits on page
  - [ ] No cut-off text
- [ ] **Share Receipt** (Mobile)
  - [ ] Share dialog opens
  - [ ] Can share to WhatsApp
  - [ ] Can share to Email
  - [ ] Fallback to copy link works

### Browser Testing

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Chrome (iOS/Android)
- [ ] Mobile Safari (iOS)

### Responsive Testing

- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Small mobile (320x568)

---

## 8️⃣ Deployment Steps

### 1. Environment Variables

```bash
# .env.production
REACT_APP_API_URL=https://your-api.com/api
```

### 2. Build & Deploy

```bash
# Build for production
npm run build

# Test production build locally
npx serve -s build

# Deploy to your hosting
# (Vercel, Netlify, AWS, etc.)
```

### 3. Server Configuration

Ensure your backend serves PDFs with correct headers:

```javascript
// Express.js example
app.get('/api/orders/:id/receipt/pdf', (req, res) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename=receipt.pdf');
  // ... send PDF
});
```

---

## 9️⃣ Performance Optimization

### Lazy Loading

```typescript
// Lazy load receipt actions
const ReceiptActions = React.lazy(() => import('./components/ReceiptActions'));

// Usage
<Suspense fallback={<CircularProgress />}>
  <ReceiptActions orderId={orderId} />
</Suspense>
```

### Caching

```typescript
// Cache PDF URLs
const pdfCache = new Map<number, string>();

const getCachedPdfUrl = (orderId: number): string => {
  if (pdfCache.has(orderId)) {
    return pdfCache.get(orderId)!;
  }
  const url = receiptService.getReceiptPdfUrl(orderId);
  pdfCache.set(orderId, url);
  return url;
};
```

---

## 🎉 Summary

You now have a complete, production-ready implementation for E-Barimt receipts with:

✅ Full TypeScript typing  
✅ Error handling  
✅ Loading states  
✅ Mobile support  
✅ Print optimization  
✅ Share functionality  
✅ Responsive design  
✅ Professional UI

**Estimated Implementation Time:** 2-4 hours

**Need Help?** Check the quick start guide in `FRONTEND_QUICK_START.md`
