# E-Barimt Frontend - Quick Start Guide ⚡

## 🚀 5-Minute Implementation

### Option 1: Minimal (15 minutes)

Just add buttons directly in your component:

```typescript
// In your OrderDetailsModal or any component
const handleViewReceipt = () => {
  window.open(`/api/orders/${orderId}/receipt/pdf`, '_blank');
};

const handleDownloadReceipt = () => {
  const link = document.createElement('a');
  link.href = `/api/orders/${orderId}/receipt/pdf?download=true`;
  link.download = `receipt-${orderId}.pdf`;
  link.click();
};

// JSX
<Button onClick={handleViewReceipt}>Үзэх</Button>
<Button onClick={handleDownloadReceipt}>Татах</Button>
```

✅ **Done!** You have basic functionality.

---

### Option 2: Full Implementation (2-4 hours)

Follow these steps in order:

#### Step 1: Create Receipt Service (15 min)

```bash
# Create the file
touch src/services/receiptService.ts
```

Copy code from [FRONTEND_IMPLEMENTATION_GUIDE.md](#1️⃣-receipt-service) (lines 30-180)

#### Step 2: Create Receipt Actions Component (30 min)

```bash
# Create the file
touch src/components/ReceiptActions.tsx
```

Copy code from [FRONTEND_IMPLEMENTATION_GUIDE.md](#2️⃣-receipt-actions-component) (lines 190-420)

#### Step 3: Add to Order Details (15 min)

In `src/features/orders/OrderDetailsModal.tsx`:

```typescript
import ReceiptActions from '../../components/ReceiptActions';

// Add inside your modal, after order details:
<Box sx={{ mt: 3 }}>
  <Typography variant="h6" gutterBottom>
    Баримт үйлдлүүд
  </Typography>
  <ReceiptActions orderId={order.id} order={order} />
</Box>
```

#### Step 4: Add Styling (10 min)

```bash
touch src/styles/receipt.css
```

Copy CSS from [FRONTEND_IMPLEMENTATION_GUIDE.md](#5️⃣-styling) (lines 450-600)

Import in your main CSS:

```css
/* In src/index.css or App.css */
@import './styles/receipt.css';
```

#### Step 5: Test Everything (20 min)

- [ ] Open an order
- [ ] Click "Үзэх" - PDF opens in new tab
- [ ] Click "Татах" - PDF downloads
- [ ] Click "Хэвлэх" - Print dialog opens
- [ ] Check mobile view (share button)

---

## 📦 Quick Code Snippets

### View Receipt Button

```typescript
<Button
  variant="outlined"
  startIcon={<PdfIcon />}
  onClick={() => window.open(`/api/orders/${orderId}/receipt/pdf`, '_blank')}
>
  Үзэх
</Button>
```

### Download Receipt Button

```typescript
<Button
  variant="contained"
  startIcon={<DownloadIcon />}
  onClick={() => {
    const link = document.createElement('a');
    link.href = `/api/orders/${orderId}/receipt/pdf?download=true`;
    link.download = `receipt-${orderId}.pdf`;
    link.click();
  }}
>
  Татах
</Button>
```

### Print Receipt Function

```typescript
const printReceipt = async (orderId: number) => {
  const response = await fetch(`/api/orders/${orderId}/receipt/pdf`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  printWindow?.print();
};
```

---

## 🎨 UI Variations

### Inline Buttons (Full Width)

```typescript
<Box sx={{ display: 'flex', gap: 2 }}>
  <Button variant="outlined" fullWidth onClick={handleView}>Үзэх</Button>
  <Button variant="outlined" fullWidth onClick={handleDownload}>Татах</Button>
  <Button variant="outlined" fullWidth onClick={handlePrint}>Хэвлэх</Button>
</Box>
```

### Icon Buttons (Compact)

```typescript
<Box sx={{ display: 'flex', gap: 1 }}>
  <IconButton onClick={handleView}><PdfIcon /></IconButton>
  <IconButton onClick={handleDownload}><DownloadIcon /></IconButton>
  <IconButton onClick={handlePrint}><PrintIcon /></IconButton>
</Box>
```

### Menu Button (Space Saving)

```typescript
<IconButton onClick={handleMenuOpen}>
  <MoreVertIcon />
</IconButton>
<Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
  <MenuItem onClick={handleView}>Үзэх</MenuItem>
  <MenuItem onClick={handleDownload}>Татах</MenuItem>
  <MenuItem onClick={handlePrint}>Хэвлэх</MenuItem>
</Menu>
```

---

## 🐛 Common Issues & Solutions

### Issue: PDF shows garbled Mongolian text

**Solution:** Ensure UTF-8 encoding:

```typescript
// In receiptService.ts
headers: {
  'Accept': 'application/pdf',
  'Accept-Charset': 'utf-8'
}
```

### Issue: Download doesn't work on mobile

**Solution:** Use blob download:

```typescript
const blob = await response.blob();
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'receipt.pdf';
link.click();
URL.revokeObjectURL(url);
```

### Issue: Print dialog doesn't open

**Solution:** Check pop-up blocker:

```typescript
const printWindow = window.open(url, '_blank');
if (!printWindow) {
  alert('Pop-up цонхыг идэвхжүүлнэ үү');
}
```

### Issue: QR code doesn't display

**Solution:** Check image source in OrderReceipt.tsx:

```typescript
{order.eReceiptQrCode ? (
  <img src={order.eReceiptQrCode} alt="QR" />
) : (
  <Box>NO QR</Box>
)}
```

---

## ⏱️ Time Estimates

| Task          | Minimal    | Full       |
| ------------- | ---------- | ---------- |
| Service Layer | -          | 15 min     |
| Component     | -          | 30 min     |
| Integration   | 15 min     | 15 min     |
| Styling       | 5 min      | 10 min     |
| Testing       | 10 min     | 20 min     |
| **TOTAL**     | **30 min** | **90 min** |

---

## 🧪 Quick Test Script

```typescript
// Test all receipt functions
const testReceipt = async (orderId: number) => {
  console.log('Testing receipt functions...');

  // Test 1: View
  try {
    await receiptService.viewReceipt(orderId);
    console.log('✅ View: OK');
  } catch (e) {
    console.error('❌ View: FAIL', e);
  }

  // Test 2: Download
  try {
    await receiptService.downloadReceipt(orderId);
    console.log('✅ Download: OK');
  } catch (e) {
    console.error('❌ Download: FAIL', e);
  }

  // Test 3: Print
  try {
    await receiptService.printReceipt(orderId);
    console.log('✅ Print: OK');
  } catch (e) {
    console.error('❌ Print: FAIL', e);
  }
};

// Run in console
testReceipt(1);
```

---

## 📱 Mobile Considerations

### Share API (Native Share)

```typescript
if (navigator.share) {
  navigator.share({
    title: 'Баримт',
    text: `Зарлагын падаан №${orderId}`,
    url: `/api/orders/${orderId}/receipt/pdf`,
  });
}
```

### Responsive Buttons

```css
@media (max-width: 600px) {
  .receipt-actions {
    flex-direction: column;
  }

  .receipt-actions button {
    width: 100%;
  }
}
```

---

## 🔗 Useful Links

- [Full Implementation Guide](./FRONTEND_IMPLEMENTATION_GUIDE.md)
- [OrderReceipt Component](./src/features/orders/OrderReceipt.tsx)
- [Material-UI Buttons](https://mui.com/material-ui/react-button/)
- [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)

---

## 💡 Pro Tips

1. **Cache PDF URLs** for better performance
2. **Use React Query** for automatic refetching
3. **Add loading states** for better UX
4. **Handle errors gracefully** with toasts
5. **Test on real devices** (iOS/Android)
6. **Use service workers** for offline support

---

## ✅ Checklist

Before going to production:

- [ ] All buttons work correctly
- [ ] Mongolian text displays properly
- [ ] PDF downloads with correct filename
- [ ] Print format is A5
- [ ] Mobile share works (if supported)
- [ ] Loading states show during actions
- [ ] Errors are handled gracefully
- [ ] Tested on Chrome, Firefox, Safari
- [ ] Tested on mobile devices
- [ ] Performance is acceptable (<2s load time)

---

## 🎉 You're Done!

Your E-Barimt receipt system is now fully functional!

**Questions?** Check the [Full Implementation Guide](./FRONTEND_IMPLEMENTATION_GUIDE.md)
