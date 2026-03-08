import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { Order } from '../types';

// Font configuration for Mongolian (Cyrillic) support
let fontsLoaded = false;

const loadCyrillicFont = async (doc: jsPDF): Promise<void> => {
  if (fontsLoaded) return;

  try {
    // Load Roboto Regular font
    const regularResponse = await fetch('/fonts/Roboto-Regular.ttf');

    if (!regularResponse.ok) {
      console.warn('⚠️ Could not load Roboto Regular font, using default');
      return;
    }

    const regularBuffer = await regularResponse.arrayBuffer();
    const regularBytes = new Uint8Array(regularBuffer);

    // Convert to base64
    let regularBinary = '';
    for (let i = 0; i < regularBytes.length; i++) {
      regularBinary += String.fromCharCode(regularBytes[i] || 0);
    }
    const regularBase64 = btoa(regularBinary);

    // Load Roboto Bold font
    const boldResponse = await fetch('/fonts/Roboto-Bold.ttf');
    let boldBase64 = regularBase64; // Fallback to regular if bold fails

    if (boldResponse.ok) {
      const boldBuffer = await boldResponse.arrayBuffer();
      const boldBytes = new Uint8Array(boldBuffer);
      let boldBinary = '';
      for (let i = 0; i < boldBytes.length; i++) {
        boldBinary += String.fromCharCode(boldBytes[i] || 0);
      }
      boldBase64 = btoa(boldBinary);
    }

    // Add fonts to jsPDF
    doc.addFileToVFS('Roboto-Regular.ttf', regularBase64);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.addFileToVFS('Roboto-Bold.ttf', boldBase64);
    doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

    fontsLoaded = true;
    console.log('✅ Roboto fonts loaded successfully for Cyrillic support');
  } catch (error) {
    console.error('❌ Error loading fonts:', error);
    console.warn('⚠️ Falling back to default font - Cyrillic may not display correctly');
    // Don't throw - allow PDF generation to continue with default font
  }
};

interface PDFOptions {
  download?: boolean;
  filename?: string;
}

export const generateOrderReceiptPDF = async (
  order: Order,
  options: PDFOptions = { download: true }
): Promise<jsPDF> => {
  // Create PDF with A5 size (portrait)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // 148 x 210 mm
  });

  // Load Cyrillic font support
  await loadCyrillicFont(doc);

  // Margins
  const margin = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper function to add text with word wrap
  const addText = (
    text: string,
    x: number,
    y: number,
    options: {
      align?: 'left' | 'center' | 'right';
      fontSize?: number;
      fontStyle?: 'normal' | 'bold';
      maxWidth?: number;
    } = {}
  ) => {
    const {
      align = 'left',
      fontSize = 10,
      fontStyle = 'normal',
      maxWidth = contentWidth,
    } = options;

    doc.setFontSize(fontSize);
    doc.setFont('Roboto', fontStyle);

    let xPos = x;
    if (align === 'center') {
      xPos = pageWidth / 2;
    } else if (align === 'right') {
      xPos = pageWidth - margin;
    }

    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, xPos, y, { align });

    return y + lines.length * fontSize * 0.35; // Return new Y position
  };

  // Header with top border
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  // Title
  yPosition = addText('Агуулахын бараа бүртгэлийн систем', pageWidth / 2, yPosition, {
    align: 'center',
    fontSize: 14,
    fontStyle: 'bold',
  });
  yPosition += 3;

  // Subtitle
  yPosition = addText('Э-Баримт / Төлбөрийн баримт', pageWidth / 2, yPosition, {
    align: 'center',
    fontSize: 10,
  });
  yPosition += 8;

  // Receipt Number Header
  yPosition = addText(
    `Зарлагын падаан № ${order.eReceiptNumber || order.id}`,
    pageWidth / 2,
    yPosition,
    {
      align: 'center',
      fontSize: 12,
      fontStyle: 'bold',
    }
  );
  yPosition += 8;

  // Calculate VAT
  const totalAmount = Number(order.totalAmount);
  const vatAmount = order.vatAmount || totalAmount / 11;
  const cityTax = 0;

  // Section 1: General Receipt Info
  yPosition = addText('1. Баримтын ерөнхий мэдээлэл', margin, yPosition, {
    fontSize: 11,
    fontStyle: 'bold',
  });
  yPosition += 5;

  const generalInfo = [
    ['  • Баримтын дугаар:', `№ ${order.eReceiptNumber || order.id}`],
    ['  • ДДТД:', order.eReceiptId || '-'],
    ['  • ТТД:', '5317878'],
    ['  • Баримт бүртгэгдсэн огноо:', format(new Date(order.createdAt), 'yyyy-MM-dd')],
    [
      '  • Бараа олгосон огноо:',
      order.deliveryDate
        ? format(new Date(order.deliveryDate), 'yyyy-MM-dd')
        : format(new Date(order.createdAt), 'yyyy-MM-dd'),
    ],
    ['  • Төлбөрийн хэлбэр:', order.paymentMethod],
  ];

  generalInfo.forEach(([label, value]) => {
    doc.setFontSize(9);
    doc.setFont('Roboto', 'normal');
    doc.text(label || '', margin + 2, yPosition);
    doc.text(value || '', margin + 60, yPosition);
    yPosition += 4;
  });

  yPosition += 3;
  doc.setLineWidth(0.1);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  // Section 2: Seller Info
  yPosition = addText('2. Борлуулагчийн мэдээлэл', margin, yPosition, {
    fontSize: 11,
    fontStyle: 'bold',
  });
  yPosition += 5;

  const sellerInfo = [
    ['  • Нэр:', order.createdBy?.name || 'Мөнгөншагай'],
    ['  • Утас:', order.createdBy?.phoneNumber || '89741277'],
  ];

  sellerInfo.forEach(([label, value]) => {
    doc.setFontSize(9);
    doc.setFont('Roboto', 'normal');
    doc.text(label || '', margin + 2, yPosition);
    doc.text(value || '', margin + 60, yPosition);
    yPosition += 4;
  });

  yPosition += 3;
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  // Section 3: Buyer Info
  yPosition = addText('3. Худалдан авагчийн мэдээлэл', margin, yPosition, {
    fontSize: 11,
    fontStyle: 'bold',
  });
  yPosition += 5;

  const buyerInfo = [
    ['  • Нэр:', order.customer?.name || '-'],
    ['  • Утас:', order.customer?.phoneNumber || '-'],
  ];

  buyerInfo.forEach(([label, value]) => {
    doc.setFontSize(9);
    doc.setFont('Roboto', 'normal');
    doc.text(label || '', margin + 2, yPosition);
    doc.text(value || '', margin + 60, yPosition);
    yPosition += 4;
  });

  yPosition += 3;
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  // Section 4: Store Info
  yPosition = addText('4. Дэлгүүр / Байгууллагын мэдээлэл', margin, yPosition, {
    fontSize: 11,
    fontStyle: 'bold',
  });
  yPosition += 5;

  const storeInfo = [
    ['  • Нэр:', 'GLF LLC OASIS Бөөний төв'],
    ['  • Хаяг:', 'Монгол, Улаанбаатар, Сүхбаатар дүүрэг, 6-р хороо, 27-49'],
    ['  • Утас:', '70121128, 88048350, 89741277'],
  ];

  storeInfo.forEach(([label, value]) => {
    doc.setFontSize(9);
    doc.setFont('Roboto', 'normal');
    doc.text(label || '', margin + 2, yPosition);
    const valueLines = doc.splitTextToSize(value || '', contentWidth - 60);
    doc.text(valueLines, margin + 60, yPosition);
    yPosition += valueLines.length * 4;
  });

  yPosition += 3;
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  // Section 5: Items Table
  yPosition = addText('5. Худалдан авсан барааны жагсаалт', margin, yPosition, {
    fontSize: 11,
    fontStyle: 'bold',
  });
  yPosition += 5;

  // Prepare table data
  const tableData =
    order.orderItems?.map((item, index) => [
      (index + 1).toString(),
      item.product?.nameMongolian || item.product?.nameEnglish || 'N/A',
      item.product?.barcode || '-',
      item.quantity.toString(),
      Number(item.unitPrice).toLocaleString(),
      Number(item.subtotal).toLocaleString(),
    ]) || [];

  autoTable(doc, {
    startY: yPosition,
    head: [['№', 'Барааны нэр', 'Баркод', 'Тоо ширхэг', 'Нэгж үнэ', 'Нийт үнэ']],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'Roboto',
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 40 },
      2: { cellWidth: 25, fontSize: 7 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 20, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  // Get Y position after table
  yPosition = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  // Section 6: VAT Info
  yPosition = addText('6. НӨАТ мэдээлэл', margin, yPosition, {
    fontSize: 11,
    fontStyle: 'bold',
  });
  yPosition += 5;

  const vatInfo = [
    ['  • НӨАТ-тэй дүн:', `${totalAmount.toLocaleString()}₮`],
    ['  • НӨАТ:', `${vatAmount.toFixed(2)}₮`],
    ['  • НХАТ:', `${cityTax}₮`],
  ];

  vatInfo.forEach(([label, value]) => {
    doc.setFontSize(9);
    doc.setFont('Roboto', 'normal');
    doc.text(label || '', margin + 2, yPosition);
    doc.text(value || '', margin + 60, yPosition);
    yPosition += 4;
  });

  yPosition += 3;
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  // Section 7: E-Receipt Info
  yPosition = addText('7. И-Баримт мэдээлэл', margin, yPosition, {
    fontSize: 11,
    fontStyle: 'bold',
  });
  yPosition += 5;

  // QR code placeholder
  yPosition = addText('QR код бүртгэлийн үед харагдана', pageWidth / 2, yPosition + 10, {
    align: 'center',
    fontSize: 9,
  });
  yPosition += 15;

  // E-Receipt Number
  if (order.eReceiptNumber) {
    yPosition = addText(`Баримтын дугаар: ${order.eReceiptNumber}`, pageWidth / 2, yPosition, {
      align: 'center',
      fontSize: 8,
    });
    yPosition += 4;
  }

  // E-Receipt ID
  if (order.eReceiptId) {
    yPosition = addText(`YF: ${order.eReceiptId}`, pageWidth / 2, yPosition, {
      align: 'center',
      fontSize: 7,
    });
    yPosition += 5;
  }

  // Thank you message
  yPosition = addText('Баярлалаа / Thank you', pageWidth / 2, yPosition, {
    align: 'center',
    fontSize: 10,
    fontStyle: 'bold',
  });
  yPosition += 8;

  // Footer
  doc.setLineWidth(0.1);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 4;

  addText('Төлбөрийн баримт', pageWidth / 2, yPosition, {
    align: 'center',
    fontSize: 7,
  });

  // Download or return PDF
  if (options.download) {
    const filename = options.filename || `receipt-${order.eReceiptNumber || order.id}.pdf`;
    doc.save(filename);
  }

  return doc;
};
