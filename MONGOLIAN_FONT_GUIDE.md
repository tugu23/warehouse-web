# Mongolian Font Support for PDF Generation

## Overview

The PDF generation has been moved to the frontend using `jspdf` and `jspdf-autotable`. This guide explains how to add proper Mongolian (Cyrillic) font support.

## Current Implementation

The current implementation uses transliterated text (Latin characters) as a temporary solution. To display proper Mongolian Cyrillic characters, you need to add custom fonts.

## Adding Mongolian Font Support

### Step 1: Choose a Font

Select a TrueType font (.ttf) that supports Mongolian Cyrillic characters. Recommended fonts:

- **Noto Sans Mongolian** - Free, open-source
- **Arial Unicode MS** - Widely available
- **Roboto** - Modern, clean
- **Any system font with Cyrillic support**

### Step 2: Convert Font to Base64

You have two options:

#### Option A: Use Online Converter

1. Go to https://products.aspose.app/font/base64
2. Upload your .ttf font file
3. Download the base64 encoded version

#### Option B: Use Node.js Script

Create `scripts/fontToBase64.js`:

```javascript
const fs = require('fs');
const path = require('path');

const fontPath = process.argv[2];
if (!fontPath) {
  console.error('Usage: node fontToBase64.js <path-to-font.ttf>');
  process.exit(1);
}

const fontBuffer = fs.readFileSync(fontPath);
const base64Font = fontBuffer.toString('base64');

const outputPath = path.join(__dirname, 'font-base64.txt');
fs.writeFileSync(outputPath, base64Font);

console.log(`Font converted to base64 and saved to ${outputPath}`);
```

Run: `node scripts/fontToBase64.js path/to/your-font.ttf`

### Step 3: Create Font Configuration File

Create `src/utils/fonts.ts`:

```typescript
// Example: Noto Sans Mongolian Base64 (truncated for example)
export const MONGOLIAN_FONT_BASE64 = 'AAEAAAALAIAAAwAwT1MvMg8SBfAAAAC8...'; // Full base64 string here

export const FONT_CONFIG = {
  mongolian: {
    name: 'NotoSansMongolian',
    data: MONGOLIAN_FONT_BASE64,
  },
};
```

### Step 4: Update PDF Generator

Update `src/utils/pdfGenerator.ts` to use the custom font:

```typescript
import { FONT_CONFIG } from './fonts';

export const generateOrderReceiptPDF = async (
  order: Order,
  options: PDFOptions = { download: true }
): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  // Add custom font
  doc.addFileToVFS('MongolianFont.ttf', FONT_CONFIG.mongolian.data);
  doc.addFont('MongolianFont.ttf', 'MongolianFont', 'normal');
  doc.setFont('MongolianFont');

  // ... rest of the code
};
```

### Step 5: Update Text to Use Cyrillic

Once the font is loaded, update all transliterated text to proper Mongolian Cyrillic:

```typescript
// Before (transliterated):
addText('Aguulahyn baraa burtgeliin sistem', ...);

// After (Cyrillic):
addText('Агуулахын бараа бүртгэлийн систем', ...);
```

## Complete Example

Here's a complete example with font loading:

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FONT_CONFIG } from './fonts';

export const generateOrderReceiptPDF = async (
  order: Order,
  options: PDFOptions = { download: true }
): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  // Add and set custom font
  doc.addFileToVFS('MongolianFont.ttf', FONT_CONFIG.mongolian.data);
  doc.addFont('MongolianFont.ttf', 'MongolianFont', 'normal');
  doc.addFont('MongolianFont.ttf', 'MongolianFont', 'bold');
  doc.setFont('MongolianFont');

  // Now you can use Cyrillic text
  const margin = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = margin + 5;

  // Title in Cyrillic
  doc.setFontSize(14);
  doc.setFont('MongolianFont', 'bold');
  doc.text('Агуулахын бараа бүртгэлийн систем', pageWidth / 2, yPosition, {
    align: 'center',
  });
  yPosition += 10;

  // Section headers in Cyrillic
  doc.setFontSize(11);
  doc.setFont('MongolianFont', 'bold');
  doc.text('1. Баримтын ерөнхий мэдээлэл', margin, yPosition);
  yPosition += 5;

  // Regular text
  doc.setFontSize(9);
  doc.setFont('MongolianFont', 'normal');
  doc.text('• Баримтын дугаар:', margin + 2, yPosition);
  doc.text(`№ ${order.eReceiptNumber || order.id}`, margin + 60, yPosition);

  // For tables, update the autoTable call
  autoTable(doc, {
    startY: yPosition,
    head: [['№', 'Барааны нэр', 'Баркод', 'Тоо ширхэг', 'Нэгж үнэ', 'Нийт үнэ']],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'MongolianFont', // Use custom font in table
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
  });

  // Download
  if (options.download) {
    doc.save(options.filename || `receipt-${order.id}.pdf`);
  }

  return doc;
};
```

## Obtaining Free Mongolian Fonts

### Noto Sans Mongolian (Recommended)

1. Visit: https://fonts.google.com/noto/specimen/Noto+Sans+Mongolian
2. Click "Download family"
3. Extract the .ttf files
4. Use the Regular weight for normal text and Bold for headings

### Alternative: Use Web Font

You can also load fonts from Google Fonts at runtime:

```typescript
export const loadGoogleFont = async (doc: jsPDF) => {
  const fontUrl = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Mongolian&display=swap';

  // Fetch font CSS
  const response = await fetch(fontUrl);
  const cssText = await response.text();

  // Extract font URL from CSS
  const fontUrlMatch = cssText.match(/url\((https:\/\/[^)]+)\)/);
  if (!fontUrlMatch) throw new Error('Font URL not found');

  // Fetch actual font file
  const fontResponse = await fetch(fontUrlMatch[1]);
  const fontBlob = await fontResponse.blob();

  return new Promise<void>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Font = (reader.result as string).split(',')[1];
      doc.addFileToVFS('MongolianFont.ttf', base64Font);
      doc.addFont('MongolianFont.ttf', 'MongolianFont', 'normal');
      doc.setFont('MongolianFont');
      resolve();
    };
    reader.onerror = reject;
    reader.readAsDataURL(fontBlob);
  });
};

// Usage
const doc = new jsPDF({
  /* ... */
});
await loadGoogleFont(doc);
// Now generate PDF with Cyrillic text
```

## Testing

After implementing custom fonts:

1. Generate a PDF receipt
2. Open in PDF viewer (Adobe Reader, Preview, etc.)
3. Verify Cyrillic characters display correctly
4. Check that special characters (₮, №, etc.) render properly

## Troubleshooting

### Issue: Characters show as boxes/squares

- **Solution**: Font doesn't support those characters. Try a different font.

### Issue: Font file too large

- **Solution**: Use a font with only Cyrillic glyphs, or subset the font to include only needed characters.

### Issue: PDF generation is slow

- **Solution**: Cache the loaded font. Load it once when the app starts:

```typescript
// In App.tsx or main initialization
import { preloadFonts } from './utils/pdfGenerator';

useEffect(() => {
  preloadFonts();
}, []);
```

## Performance Optimization

For better performance, consider:

1. **Font subsetting**: Include only Cyrillic characters
2. **Lazy loading**: Load font only when PDF generation is triggered
3. **Caching**: Store the loaded font in memory after first use

## Resources

- [jsPDF Documentation](https://artskydj.github.io/jsPDF/docs/)
- [jsPDF AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable)
- [Google Noto Fonts](https://fonts.google.com/noto)
- [Font Squirrel](https://www.fontsquirrel.com/) - Free commercial fonts

## Current Status

✅ PDF generation moved to frontend  
✅ Basic layout implemented  
✅ Table support with jspdf-autotable  
✅ QR code support  
⏳ Custom Mongolian font (pending - follow this guide)  
⏳ Cyrillic text (pending - requires custom font)

## Next Steps

1. Choose and download a Mongolian-supporting font
2. Convert to base64
3. Create `src/utils/fonts.ts` with font data
4. Update `pdfGenerator.ts` to use custom font
5. Replace all transliterated text with Cyrillic
6. Test PDF generation
