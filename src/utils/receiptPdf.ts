import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Product } from '../types';

export interface ReceiptEbarimtData {
  id: string;
  lottery?: string;
  qrData?: string;
  date?: string;
  totalAmount: number;
  totalVAT: number;
  totalCityTax?: number;
}

export interface ReceiptOrderItem {
  productId: number;
  quantity: number;
}

export interface ReceiptCustomerInfo {
  name: string;
  regNo?: string;
}

export async function generateReceiptPDF(
  ebarimtData: ReceiptEbarimtData,
  orderItems: ReceiptOrderItem[],
  products: Product[],
  customerInfo?: ReceiptCustomerInfo,
  paymentMethod?: string
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const boldFont = 'helvetica';
  const regularFont = 'helvetica';
  const width = doc.internal.pageSize.getWidth();
  let y = 15;

  const drawLine = (yPos: number, thickness = 0.5) => {
    doc.setDrawColor(0);
    doc.setLineWidth(thickness);
    doc.line(10, yPos, width - 10, yPos);
  };

  const getProductPrice = (product: Product): number => {
    const firstPrice = product.prices && product.prices.length > 0 ? product.prices[0] : undefined;
    if (firstPrice) return Number(firstPrice.price);
    return Number(product.priceRetail) || Number(product.priceWholesale) || 0;
  };

  // 1. Date
  doc.setFont(regularFont, 'normal');
  doc.setFontSize(10);
  doc.text(`Date: ${ebarimtData.date || new Date().toISOString().split('T')[0]}`, 10, y);
  y += 7;

  // 2. Title
  doc.setFontSize(16);
  doc.setFont(boldFont, 'bold');
  doc.text('SALES RECEIPT', width / 2, y, { align: 'center' });
  y += 5;
  drawLine(y, 0.6);
  y += 10;

  // 3. Document Info & Customer
  doc.setFontSize(10);
  doc.setFont(boldFont, 'bold');
  doc.text('Receipt Information', 10, y);
  doc.text('Customer Details', width / 2 + 10, y);
  y += 5;

  doc.setFont(regularFont, 'normal');
  doc.setFontSize(9);
  doc.text(`Receipt No:   ${ebarimtData.id}`, 10, y);
  doc.text(`Payment:      ${paymentMethod || 'Cash'}`, 10, y + 10);

  const rightX = width / 2 + 10;
  doc.text(`Name:  ${customerInfo?.name || 'Customer'}`, rightX, y);
  if (customerInfo?.regNo) {
    doc.text(`Reg No: ${customerInfo.regNo}`, rightX, y + 5);
  }
  y += 20;

  // 4. Seller Section
  doc.setFont(boldFont, 'bold');
  doc.setFontSize(10);
  doc.text('Seller Information', 10, y);
  y += 5;
  doc.setFont(regularFont, 'normal');
  doc.setFontSize(9);
  doc.text('Company: GLF LLC OASIS Wholesale Center', 10, y);
  doc.text('Address: 27-49, 6th Khoroo, Sukhbaatar District, Ulaanbaatar, MN', 10, y + 5);
  doc.text('Phone:   70121128, 88048350, 89741277', 10, y + 10);
  y += 20;
  drawLine(y, 0.4);
  y += 7;

  // 5. Table Header
  doc.setFont(boldFont, 'bold');
  doc.text('No', 10, y);
  doc.text('Item Description', 20, y);
  doc.text('Barcode', 75, y);
  doc.text('Qty', 115, y, { align: 'center' });
  doc.text('Unit Price', 145, y, { align: 'right' });
  doc.text('Total Amount', 185, y, { align: 'right' });
  y += 3;
  doc.setLineWidth(0.2);
  doc.line(10, y, width - 10, y);
  y += 7;

  // 6. Items List
  doc.setFont(regularFont, 'normal');
  orderItems.forEach((item, index) => {
    const product = products.find((p) => p.id === item.productId);
    if (product) {
      const price = getProductPrice(product);
      const name = product.nameEnglish || product.nameMongolian || `Product ${item.productId}`;
      doc.text(`${index + 1}`, 10, y);
      doc.text(name.substring(0, 30), 20, y);
      doc.text(product.barcode || '', 75, y);
      doc.text(`${item.quantity}`, 115, y, { align: 'center' });
      doc.text(`${price.toLocaleString()}`, 145, y, { align: 'right' });
      doc.text(`${(price * item.quantity).toLocaleString()}`, 185, y, { align: 'right' });
      y += 8;
    }
  });

  y += 2;
  drawLine(y, 0.2);
  y += 10;

  // 7. QR Code & Totals
  if (ebarimtData.qrData) {
    const qrDataUrl = await QRCode.toDataURL(ebarimtData.qrData);
    doc.addImage(qrDataUrl, 'PNG', 10, y, 35, 35);
    doc.setFontSize(8);
    doc.text('Scan QR to', 12, y + 40);
    doc.text('verify receipt', 12, y + 44);

    const infoX = 50;
    if (ebarimtData.lottery) {
      doc.setFontSize(10);
      doc.setFont(boldFont, 'bold');
      doc.text('Lottery No:', infoX, y + 12);
      doc.setFontSize(14);
      doc.text(`${ebarimtData.lottery}`, infoX, y + 20);
      doc.setFontSize(8);
      doc.setFont(regularFont, 'normal');
      doc.text('Keep this receipt for lottery', infoX, y + 26);
    } else {
      doc.setFontSize(10);
      doc.setFont(boldFont, 'bold');
      doc.text('E-Barimt: No lottery', infoX, y + 15);
    }
  }

  // Totals Section
  const totalX = 140;
  doc.setFontSize(10);
  doc.setFont(regularFont, 'normal');
  doc.text('Subtotal:', totalX, y);
  doc.text(`${ebarimtData.totalAmount.toLocaleString()}`, 185, y, { align: 'right' });

  y += 7;
  doc.text('VAT (10%):', totalX, y);
  doc.text(`${ebarimtData.totalVAT.toLocaleString()}`, 185, y, { align: 'right' });

  if (ebarimtData.totalCityTax) {
    y += 7;
    doc.text('City Tax (2%):', totalX, y);
    doc.text(`${ebarimtData.totalCityTax.toLocaleString()}`, 185, y, { align: 'right' });
  }

  y += 7;
  doc.setFont(boldFont, 'bold');
  doc.text('GRAND TOTAL:', totalX, y);
  const grandTotal =
    ebarimtData.totalAmount + ebarimtData.totalVAT + (ebarimtData.totalCityTax || 0);
  doc.text(`${grandTotal.toLocaleString()}`, 185, y, { align: 'right' });

  y += 35;

  // 8. Signatures
  doc.setFont(regularFont, 'normal');
  doc.setFontSize(9);
  doc.text('Issued by: .........................../...........................', width / 2, y, {
    align: 'center',
  });
  y += 10;
  doc.text('Received by: .........................../...........................', width / 2, y, {
    align: 'center',
  });

  y += 20;
  doc.setFont(boldFont, 'bold');
  doc.text('Thank you for your business!', width / 2, y, { align: 'center' });

  // Open in new tab for printing
  const blobUrl = doc.output('bloburl');
  const pdfWindow = window.open(blobUrl);

  if (pdfWindow) {
    pdfWindow.onload = () => {
      pdfWindow.print();
    };
  } else {
    doc.save(`receipt_${ebarimtData.id || 'order'}.pdf`);
  }
}
