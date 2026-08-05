import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import type { Promotion } from '../types';
import { getPromotionDisplayInfo } from './promotionUtils';

export interface ReceiptEbarimtData {
  id: string;
  lottery?: string;
  qrData?: string;
  date?: string;
  totalAmount: number;
  totalVAT: number;
  totalCityTax?: number;
}

export interface ReceiptProduct {
  id: number;
  name: string;
  price: number;
  barCode: string;
  promotions?: Promotion[];
}

export interface ReceiptOrderItem {
  productId: number;
  quantity: number;
  promotionId?: number | null; // explicitly selected promotion
}

export interface ReceiptCustomerInfo {
  name: string;
  regNo?: string;
}

export async function generateReceiptPDF(
  ebarimtData: ReceiptEbarimtData,
  orderItems: ReceiptOrderItem[],
  products: ReceiptProduct[],
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
  let y = 10;

  const drawLine = (yPos: number, thickness = 0.5) => {
    doc.setDrawColor(0);
    doc.setLineWidth(thickness);
    doc.line(10, yPos, width - 10, yPos);
  };

  // Format date: yyyy.MM.dd HH:mm
  const formatDate = (dateStr?: string) => {
    const date = dateStr ? new Date(dateStr) : new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  // 1. Title (moved up)
  doc.setFontSize(20);
  doc.setFont(boldFont, 'bold');
  doc.text('Төлбөрийн баримт', width / 2, y, { align: 'center' });

  // 2. Date (right side, next to title)
  doc.setFont(regularFont, 'normal');
  doc.setFontSize(11);
  doc.text(formatDate(ebarimtData.date), width - 10, y, { align: 'right' });
  y += 8;
  drawLine(y, 0.6);
  y += 10;

  // 3. Document Info & Customer
  doc.setFontSize(11);
  doc.setFont(boldFont, 'bold');
  doc.text('Баримтын мэдээлэл', 10, y);
  doc.text('Харилцагч', width / 2 + 10, y);
  y += 6;

  doc.setFont(regularFont, 'normal');
  doc.setFontSize(10);
  doc.text(`Баримтын дугаар:   ${ebarimtData.id}`, 10, y);
  doc.text(`Төлбөр:            ${paymentMethod || 'Бэлэн'}`, 10, y + 6);

  const rightX = width / 2 + 10;
  doc.text(`Нэр:     ${customerInfo?.name || 'Харилцагч'}`, rightX, y);
  if (customerInfo?.regNo) {
    doc.text(`Регистр: ${customerInfo.regNo}`, rightX, y + 6);
  }
  y += 18;

  // 4. Seller Section
  doc.setFont(boldFont, 'bold');
  doc.setFontSize(11);
  doc.text('Борлуулагчийн мэдээлэл', 10, y);
  y += 6;
  doc.setFont(regularFont, 'normal');
  doc.setFontSize(10);
  doc.text('Компани: Жи Эл Эф ххк', 10, y);
  doc.text('Хаяг: 27-49, 6-р хороо, Сүхбаатар дүүрэг, Улаанбаатар', 10, y + 5);
  doc.text('Утас: 70121128, 88048350, 89741277', 10, y + 10);
  doc.text('Банк: Хаан банк', 10, y + 15);
  y += 23;
  drawLine(y, 0.4);
  y += 7;

  // 5. Table Header (reduced barcode column width)
  doc.setFontSize(10);
  doc.setFont(boldFont, 'bold');
  doc.text('№', 10, y);
  doc.text('Барааны нэр', 20, y);
  doc.text('Баркод', 90, y);
  doc.text('Тоо', 125, y, { align: 'center' });
  doc.text('Нэгж үнэ', 155, y, { align: 'right' });
  doc.text('Нийт дүн', 185, y, { align: 'right' });
  y += 3;
  doc.setLineWidth(0.2);
  doc.line(10, y, width - 10, y);
  y += 7;

  // 6. Items List with 1+1, 2+1, 3+1 promotion support
  doc.setFontSize(10);
  doc.setFont(regularFont, 'normal');
  let mainItemNumber = 0;

  orderItems.forEach((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (product) {
      mainItemNumber++;
      // Only show bonus rows if a promotion was EXPLICITLY selected for this item
      const [, freeItemCount] = getPromotionDisplayInfo(
        item.quantity,
        product.promotions,
        { promotionId: item.promotionId }
      );

      // Main item row
      doc.text(`${mainItemNumber}`, 10, y);
      doc.text(product.name.substring(0, 35), 20, y);
      doc.text((product.barCode || '').substring(0, 15), 90, y);
      doc.text(`${item.quantity}`, 125, y, { align: 'center' });
      doc.text(`${product.price.toLocaleString()}`, 155, y, { align: 'right' });
      doc.text(`${(product.price * item.quantity).toLocaleString()}`, 185, y, { align: 'right' });
      y += 8;

      // Promotion rows (free items) - showing each free item separately
      if (freeItemCount > 0) {
        doc.setFont(regularFont, 'italic');
        doc.setTextColor(0, 100, 0); // Dark green
        for (let i = 0; i < freeItemCount; i++) {
          doc.text('', 10, y);
          doc.text(`${product.name.substring(0, 35)} (Урамшуулал)`, 20, y);
          doc.text((product.barCode || '').substring(0, 15), 90, y);
          doc.text('1', 125, y, { align: 'center' });
          doc.text('0', 155, y, { align: 'right' });
          doc.text('0', 185, y, { align: 'right' });
          y += 8;
        }
        doc.setTextColor(0, 0, 0); // Reset to black
        doc.setFont(regularFont, 'normal');
      }
    }
  });

  y += 2;
  drawLine(y, 0.2);
  y += 10;

  // 7. QR Code & Totals (QR increased from 35x35 to 50x50)
  if (ebarimtData.qrData) {
    const qrDataUrl = await QRCode.toDataURL(ebarimtData.qrData, { width: 200 });
    doc.addImage(qrDataUrl, 'PNG', 10, y, 50, 50);
    doc.setFontSize(10);
    doc.text('QR код уншуулж', 12, y + 55);
    doc.text('баримт шалгах', 12, y + 60);

    const infoX = 70;
    if (ebarimtData.lottery) {
      doc.setFontSize(11);
      doc.setFont(boldFont, 'bold');
      doc.text('Сугалааны дугаар:', infoX, y + 12);
      doc.setFontSize(16);
      doc.text(`${ebarimtData.lottery}`, infoX, y + 22);
      doc.setFontSize(10);
      doc.setFont(regularFont, 'normal');
      doc.text('Сугалаанд оролцохын тулд баримтаа хадгална уу', infoX, y + 30);
    } else {
      doc.setFontSize(11);
      doc.setFont(boldFont, 'bold');
      doc.text('E-Barimt: Сугалаагүй', infoX, y + 15);
    }
  }

  // Totals Section (font size increased)
  const totalX = 140;
  doc.setFontSize(11);
  doc.setFont(regularFont, 'normal');
  doc.text('НӨАТ-гүй үнэ:', totalX, y);
  doc.text(`${ebarimtData.totalAmount.toLocaleString()}`, 185, y, { align: 'right' });

  y += 7;
  doc.text('НӨАТ (10%):', totalX, y);
  doc.text(`${ebarimtData.totalVAT.toLocaleString()}`, 185, y, { align: 'right' });

  if (ebarimtData.totalCityTax) {
    y += 7;
    doc.text('Хотын татвар (2%):', totalX, y);
    doc.text(`${ebarimtData.totalCityTax.toLocaleString()}`, 185, y, { align: 'right' });
  }

  y += 8;
  doc.setFontSize(12);
  doc.setFont(boldFont, 'bold');
  doc.text('НИЙТ ДҮН:', totalX, y);
  doc.text(`${ebarimtData.totalAmount.toLocaleString()}`, 185, y, { align: 'right' });

  y += 40;

  // 8. Signatures
  doc.setFont(regularFont, 'normal');
  doc.setFontSize(10);
  doc.text('Гаргасан: .........................../...........................', width / 2, y, {
    align: 'center',
  });
  y += 10;
  doc.text('Хүлээн авсан: .........................../...........................', width / 2, y, {
    align: 'center',
  });

  y += 20;
  doc.setFontSize(11);
  doc.setFont(boldFont, 'bold');
  doc.text('Баярлалаа!', width / 2, y, { align: 'center' });

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
