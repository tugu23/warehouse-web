import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '../types';
import { format } from 'date-fns';

// jsPDF-д autotable-г бүртгэх
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

/**
 * И-баримтын PDF үүсгэх
 * Generate E-Receipt PDF
 */
export const generateEReceiptPDF = (
  order: Order,
  eReceiptNumber?: string,
  lottery?: string
): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Fonts - default Latin fonts
  doc.setFont('helvetica');

  // Header - Company Logo/Name
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('OASIS', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Aguulakhyn Udirdlagyn Sistem', 105, 28, { align: 'center' });
  doc.text('Warehouse Management System', 105, 34, { align: 'center' });

  // Divider line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(20, 40, 190, 40);

  // И-баримт Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('I-BARIMT / E-RECEIPT', 105, 50, { align: 'center' });

  // Receipt Number and Date
  let yPos = 60;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  if (eReceiptNumber) {
    doc.text(`Receipt Number: ${eReceiptNumber}`, 20, yPos);
    yPos += 6;
  }
  
  doc.text(`Order ID: #${order.id}`, 20, yPos);
  yPos += 6;
  doc.text(`Date: ${format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm:ss')}`, 20, yPos);
  yPos += 6;

  if (lottery) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Lottery Number: ${lottery}`, 20, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 6;
  }

  // Customer Information
  yPos += 4;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Information:', 20, yPos);
  yPos += 6;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${order.customer?.name || 'N/A'}`, 20, yPos);
  yPos += 6;
  
  if (order.customer?.registrationNumber) {
    doc.text(`Registration: ${order.customer.registrationNumber}`, 20, yPos);
    yPos += 6;
  }

  doc.text(`Cashier: ${order.createdBy?.name || 'N/A'}`, 20, yPos);
  yPos += 6;
  doc.text(`Payment Method: ${order.paymentMethod || 'N/A'}`, 20, yPos);
  yPos += 10;

  // Items Table
  const tableData = order.orderItems?.map((item, index) => [
    (index + 1).toString(),
    item.product?.nameEnglish || item.product?.nameMongolian || 'Unknown',
    item.quantity.toString(),
    `₮${Number(item.unitPrice).toLocaleString()}`,
    `₮${Number(item.subtotal).toLocaleString()}`,
  ]) || [];

  autoTable(doc, {
    startY: yPos,
    head: [['№', 'Product Name', 'Quantity', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'left', cellWidth: 80 },
      2: { halign: 'center', cellWidth: 25 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'right', cellWidth: 30 },
    },
  });

  // Get final Y position after table
  const finalY = (doc as any).lastAutoTable.finalY || yPos + 50;

  // Total Amount Section
  yPos = finalY + 10;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(130, yPos, 190, yPos);

  yPos += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL AMOUNT:', 130, yPos);
  doc.text(`₮${Number(order.totalAmount).toLocaleString()}`, 190, yPos, { align: 'right' });

  // Payment Status
  if (order.paymentStatus && order.paymentStatus !== 'Paid') {
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Paid Amount: ₮${order.paidAmount?.toLocaleString() || '0'}`, 130, yPos);
    
    yPos += 6;
    doc.setTextColor(255, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(`Remaining: ₮${order.remainingAmount?.toLocaleString() || '0'}`, 130, yPos);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
  }

  // Footer
  yPos = 270;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your business!', 105, yPos, { align: 'center' });
  yPos += 5;
  doc.text('Bayarlalaa! / Thank you!', 105, yPos, { align: 'center' });
  
  yPos += 8;
  doc.setFontSize(8);
  doc.text('Contact: +976 1234-5678 | Email: info@oasis.mn', 105, yPos, { align: 'center' });
  doc.text('Web: www.oasis.mn', 105, yPos + 4, { align: 'center' });

  // QR Code placeholder (if QR code data is available)
  // doc.addImage(qrCodeBase64, 'PNG', 175, yPos + 10, 20, 20);

  return doc;
};

/**
 * И-баримт PDF татах
 * Download E-Receipt PDF
 */
export const downloadEReceiptPDF = (
  order: Order,
  eReceiptNumber?: string,
  lottery?: string
): void => {
  const doc = generateEReceiptPDF(order, eReceiptNumber, lottery);
  const fileName = `E-Receipt_${eReceiptNumber || order.id}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
};

/**
 * И-баримт PDF хэвлэх
 * Print E-Receipt PDF
 */
export const printEReceiptPDF = (
  order: Order,
  eReceiptNumber?: string,
  lottery?: string
): void => {
  const doc = generateEReceiptPDF(order, eReceiptNumber, lottery);
  
  // Open PDF in new window for printing
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  
  const printWindow = window.open(pdfUrl, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
      // Clean up URL after print dialog closes
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
    };
  }
};

/**
 * И-баримт PDF-г Base64 хэлбэрээр авах
 * Get E-Receipt PDF as Base64
 */
export const getEReceiptPDFBase64 = (
  order: Order,
  eReceiptNumber?: string,
  lottery?: string
): string => {
  const doc = generateEReceiptPDF(order, eReceiptNumber, lottery);
  return doc.output('dataurlstring');
};

/**
 * И-баримт PDF шинэ цонхонд нээх
 * Open E-Receipt PDF in new window
 */
export const openEReceiptPDF = (
  order: Order,
  eReceiptNumber?: string,
  lottery?: string
): void => {
  const doc = generateEReceiptPDF(order, eReceiptNumber, lottery);
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
};

