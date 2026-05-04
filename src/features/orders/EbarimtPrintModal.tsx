import { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { toast } from 'react-hot-toast';
import { ordersApi } from '../../api';
import {
  createEbarimtRequest,
  getEbarimtInfoByTin,
  getTinInfo,
  lookupEbarimtOrganizationBySevenDigitReg,
} from '../../api/ebarimt';
import { Order, OrderItem } from '../../types';
import { RobotoRegular } from '../../fonts/Roboto-Regular';
import { RobotoBold } from '../../fonts/Roboto-Bold';

const COMPANY = {
  name: 'GLF LLC OASIS Бөөний төв',
  address: 'Монгол, Улаанбаатар, Сүхбаатар дүүрэг, 6-р хороо, 27-49',
  phones: '70121128, 88048350, 89741277',
  tin: '5317878',
};

/** POS receipt API payload used when drawing the PDF */
interface EbarimtReceiptPdfData {
  id?: string;
  date?: string;
  customerTin?: string | null;
  qrData?: string;
  lottery?: string | number;
  /** НӨАТ орсон нийт дүн */
  totalAmount?: number;
  totalVAT?: number;
  /** НӨАТ-гүй барааны нийт (байхгүй бол totalAmount - totalVAT-аар тооцно) */
  subtotalExVat?: number;
}

type JsPDFWithAutoTable = import('jspdf').jsPDF & { lastAutoTable: { finalY: number } };

/** Худалдан авагчийн хаяг, холбоо, регистр, ТТД — PDF-д хэвлэнэ */
interface BuyerPdfInfo {
  address?: string;
  phone?: string;
  registrationNumber?: string;
  tin?: string;
}

const PAGE_W_MM = 210;
/** Бүтэн босоо A4 өндөр. A5 хэмжээ ашиглахгүй — зөвхөн 210 мм өргөнтэй A4. */
const FULL_A4_H_MM = 297;
/** Нэг A4 дээр хүснэгтэд багтах мөр тооцоход: дээд/доод хэсгийг орхих мм (босоо A4) */
const A4_TABLE_RESERVE_TOP_MM = 92;
const A4_TABLE_RESERVE_BOTTOM_MM = 54;

/** Баримт: ерөнхий зай (их бараатай горим) */
const PDF = {
  marginX: 10,
  dateAfter: 3.2,
  titleAfter: 2.5,
  lineAfterTitle: 3,
  colHeaderAfter: 3,
  sellerRow: 3.35,
  buyerLineMin: 3.2,
  buyerLinePerWrap: 2.85,
  blockAfter: 2.2,
  tableHeadMm: 6.5,
  tableRowMm: 4.35,
  afterTable: 3,
  qrSize: 22,
  totalsLine: 4.6,
  sigGap: 5.5,
  bottomPad: 10,
};

type ReceiptLayout = {
  dateFont: number;
  titleFont: number;
  sectionHeader: number;
  sellerFont: number;
  sellerFontSmall: number;
  labelW: number;
  rowH: number;
  buyerLineMin: number;
  buyerLinePerWrap: number;
  blockAfter: number;
  dateAfter: number;
  titleAfter: number;
  lineAfterTitle: number;
  colHeaderAfter: number;
  tableHeadMm: number;
  tableRowMm: number;
  tableFont: number;
  tableHeadFont: number;
  cellPadding: number;
  minCellHeight: number;
  afterTable: number;
  qrSize: number;
  totalsLine: number;
  totalsFont: number;
  sigFont: number;
  sigGap: number;
  bottomPad: number;
  qrImagePx: number;
};

function getReceiptLayout(itemCount: number): ReceiptLayout {
  const compact = itemCount < 9;
  if (compact) {
    return {
      dateFont: 7,
      titleFont: 11,
      sectionHeader: 7,
      sellerFont: 6,
      sellerFontSmall: 5.5,
      labelW: 17,
      rowH: 2.85,
      buyerLineMin: 2.45,
      buyerLinePerWrap: 2.35,
      blockAfter: 1.8,
      dateAfter: 2.6,
      titleAfter: 2,
      lineAfterTitle: 2.4,
      colHeaderAfter: 2.5,
      tableHeadMm: 5.2,
      tableRowMm: 3.45,
      tableFont: 5.5,
      tableHeadFont: 5.5,
      cellPadding: 0.85,
      minCellHeight: 3.1,
      afterTable: 2.4,
      qrSize: 16,
      totalsLine: 3.6,
      totalsFont: 6.5,
      sigFont: 7,
      sigGap: 4,
      bottomPad: 6,
      qrImagePx: 128,
    };
  }
  return {
    dateFont: 8,
    titleFont: 13,
    sectionHeader: 8,
    sellerFont: 7,
    sellerFontSmall: 6,
    labelW: 19,
    rowH: PDF.sellerRow,
    buyerLineMin: PDF.buyerLineMin,
    buyerLinePerWrap: PDF.buyerLinePerWrap,
    blockAfter: PDF.blockAfter,
    dateAfter: PDF.dateAfter,
    titleAfter: PDF.titleAfter,
    lineAfterTitle: PDF.lineAfterTitle,
    colHeaderAfter: PDF.colHeaderAfter,
    tableHeadMm: PDF.tableHeadMm,
    tableRowMm: PDF.tableRowMm,
    tableFont: 6.5,
    tableHeadFont: 6.5,
    cellPadding: 1.2,
    minCellHeight: 4,
    afterTable: PDF.afterTable,
    qrSize: PDF.qrSize,
    totalsLine: PDF.totalsLine,
    totalsFont: 7.5,
    sigFont: 7.5,
    sigGap: PDF.sigGap,
    bottomPad: PDF.bottomPad,
    qrImagePx: 180,
  };
}

/** Текстийн ойролцоо мөрний тоо (PDF үүсэхээс өмнө өндөр тооцоход) */
function estimateTextLines(text: string, maxWidthMm: number, fontSizePt = 7): number {
  const t = text?.trim() || '';
  if (!t) return 0;
  const approxCharMm = (fontSizePt * 0.38) / 2.54;
  const charsPerLine = Math.max(6, Math.floor(maxWidthMm / approxCharMm));
  return Math.max(1, Math.ceil(t.length / charsPerLine));
}

function estimateBuyerBlockHeightMm(
  buyer: BuyerPdfInfo | undefined,
  data: EbarimtReceiptPdfData,
  isB2B: boolean,
  customerName: string,
  valMaxW: number,
  layout: Pick<ReceiptLayout, 'buyerLineMin' | 'buyerLinePerWrap'>
): number {
  let h = 0;
  const step = (label: string, value: string) => {
    const v = value?.trim();
    if (!v && label !== 'Нэр:') return;
    const lines =
      label === 'Нэр:'
        ? estimateTextLines(customerName || '—', valMaxW)
        : estimateTextLines(v, valMaxW);
    const ln = Math.max(1, lines);
    h += Math.max(layout.buyerLineMin, ln * layout.buyerLinePerWrap);
  };
  step('Нэр:', customerName || '—');
  if (buyer) {
    step('Хаяг:', buyer.address || '');
    step('Утас:', buyer.phone || '');
    step('Регистр:', buyer.registrationNumber || '');
    const tinShow =
      (buyer.tin || '').trim() ||
      (data.customerTin != null && String(data.customerTin).trim() !== ''
        ? String(data.customerTin)
        : '');
    step('ТТД:', tinShow);
  } else if (isB2B && data.customerTin) {
    step('ТТД:', String(data.customerTin));
  }
  return h;
}

/** ≤12 бараа: 12 мөр; 12+ : бүтэн A4-д багтах хүртэл мөрөөр дүүргэнэ; түүнээс олон бол бүх мөр */
function getTableBodyRowCount(itemCount: number, layout: ReceiptLayout): number {
  if (itemCount <= 12) return 12;
  const avail =
    FULL_A4_H_MM - A4_TABLE_RESERVE_TOP_MM - A4_TABLE_RESERVE_BOTTOM_MM - layout.tableHeadMm;
  const maxPadded = Math.max(13, Math.floor(Math.max(0, avail) / layout.tableRowMm));
  if (itemCount <= maxPadded) return maxPadded;
  return itemCount;
}

// ── PDF generator ────────────────────────────────────────────────────
async function generateEbarimtPDF(
  data: EbarimtReceiptPdfData,
  orderItems: { name: string; barCode: string; qty: number; unitPrice: number }[],
  customerName: string,
  paymentLabel: string,
  orderNumber: string,
  isB2B: boolean,
  buyer?: BuyerPdfInfo
) {
  const layout = getReceiptLayout(orderItems.length);
  const compactReceipt = orderItems.length < 9;
  const tableBodyRowCount = getTableBodyRowCount(orderItems.length, layout);

  const L = PDF.marginX;
  const R = PAGE_W_MM - PDF.marginX;
  const W = PAGE_W_MM;
  const midX = W / 2 + 4;
  const labelWR = 12;
  const valMaxW = R - midX - labelWR - 2;

  const sellerRowsCount = 7;
  const sellerBlockH = sellerRowsCount * layout.rowH;
  const buyerBlockH = estimateBuyerBlockHeightMm(buyer, data, isB2B, customerName, valMaxW, layout);
  const headerTopH =
    8 +
    layout.dateAfter +
    layout.titleAfter +
    1 +
    layout.lineAfterTitle +
    layout.colHeaderAfter +
    Math.max(sellerBlockH, buyerBlockH) +
    layout.blockAfter +
    0.5;
  const tableBodyH = layout.tableHeadMm + tableBodyRowCount * layout.tableRowMm;
  const footerH =
    layout.afterTable +
    layout.qrSize +
    3 * layout.totalsLine +
    4 +
    2 * layout.sigGap +
    layout.bottomPad;
  const estimatedHmm = Math.ceil(headerTopH + tableBodyH + footerH + (compactReceipt ? 12 : 28));

  // Зөвхөн босоо A4: бага бараа = нэг бүтэн A4 хуудас (доод хэсэг цагаан), их бараа = A4-аас урт эсвэл бүтэн A4
  let pageHmm: number;
  if (compactReceipt) {
    pageHmm = FULL_A4_H_MM;
  } else {
    pageHmm = Math.max(FULL_A4_H_MM, Math.min(2000, estimatedHmm));
  }

  const doc =
    pageHmm === FULL_A4_H_MM
      ? new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      : new jsPDF({ orientation: 'portrait', unit: 'mm', format: [PAGE_W_MM, pageHmm] });

  try {
    doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegular);
    doc.addFileToVFS('Roboto-Bold.ttf', RobotoBold);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
    doc.setFont('Roboto', 'normal');
  } catch {
    doc.setFont('helvetica', 'normal');
  }

  let y = PDF.marginX;

  const drawLine = (yy: number, w = 0.4) => {
    doc.setDrawColor(0);
    doc.setLineWidth(w);
    doc.line(L, yy, R, yy);
  };
  const bold = () => doc.setFont('Roboto', 'bold');
  const normal = () => doc.setFont('Roboto', 'normal');

  // Огноо
  normal();
  doc.setFontSize(layout.dateFont);
  doc.setTextColor(60, 100, 180);
  doc.text(String(data.date || '').slice(0, 10) || new Date().toISOString().slice(0, 10), L, y);
  doc.setTextColor(0);
  y += layout.dateAfter;

  // Гарчиг
  bold();
  doc.setFontSize(layout.titleFont);
  doc.text('ТӨЛБӨРИЙН БАРИМТ', W / 2, y, { align: 'center' });
  y += layout.titleAfter;
  drawLine(y, 0.8);
  y += layout.lineAfterTitle;

  // Хоёр багана: Борлуулагч (зүүн) | Худалдан авагч (баруун)
  bold();
  doc.setFontSize(layout.sectionHeader);
  doc.text('Борлуулагч', L, y);
  doc.text('Худалдан авагч', midX, y);
  y += layout.colHeaderAfter;
  const rowH = layout.rowH;
  const labelW = layout.labelW;
  // Зүүн тал: Борлуулагч мэдээлэл + баримтын мэдээлэл
  const sellerRows: [string, string, boolean][] = [
    ['Байгуулга:', COMPANY.name, false],
    ['Хаяг:', COMPANY.address, false],
    ['Утас:', COMPANY.phones, false],
    ['ДДТД:', data.id || '', true],
    ['ТТД:', COMPANY.tin, false],
    ['Төлбөр:', paymentLabel, false],
    ['Захиалга:', orderNumber, false],
  ];
  const startY = y;
  sellerRows.forEach(([lbl, val, small], i) => {
    bold();
    doc.setFontSize(layout.sellerFont);
    doc.text(lbl, L + 2, startY + i * rowH);
    normal();
    if (small) {
      doc.setFontSize(layout.sellerFontSmall);
      doc.text(val, L + 2 + labelW, startY + i * rowH);
    } else {
      doc.setFontSize(layout.sellerFont);
      doc.text(val, L + 2 + labelW, startY + i * rowH);
    }
  });

  // Баруун багана: Худалдан авагч (хаяг олон мөр болж болно)
  let buyerY = startY;
  const buyerLine = (label: string, value: string) => {
    const v = value?.trim();
    if (!v) return;
    bold();
    doc.setFontSize(layout.sellerFont);
    doc.text(label, midX, buyerY);
    normal();
    doc.setFontSize(layout.sellerFont);
    const lines = doc.splitTextToSize(v, valMaxW);
    doc.text(lines, midX + labelWR, buyerY);
    buyerY += Math.max(layout.buyerLineMin, lines.length * layout.buyerLinePerWrap);
  };
  buyerLine('Нэр:', customerName || '—');
  if (buyer) {
    buyerLine('Хаяг:', buyer.address || '');
    buyerLine('Утас:', buyer.phone || '');
    buyerLine('Регистр:', buyer.registrationNumber || '');
    const tinShow =
      (buyer.tin || '').trim() ||
      (data.customerTin != null && String(data.customerTin).trim() !== ''
        ? String(data.customerTin)
        : '');
    buyerLine('ТТД:', tinShow);
  } else if (isB2B && data.customerTin) {
    buyerLine('ТТД:', String(data.customerTin));
  }

  y = Math.max(startY + sellerRows.length * rowH, buyerY) + (compactReceipt ? 0.6 : 1);

  // Хүснэгт — тогтмол мөр (12 эсвэл A4-д багтах хүртэл); багана мм-ээр тэнцвэртэй
  const tableData: string[][] = [];
  for (let i = 0; i < tableBodyRowCount; i++) {
    if (i < orderItems.length) {
      const item = orderItems[i]!;
      tableData.push([
        String(i + 1),
        item.name,
        item.barCode,
        String(item.qty),
        item.unitPrice.toLocaleString(),
        (item.unitPrice * item.qty).toLocaleString(),
      ]);
    } else {
      tableData.push([String(i + 1), '', '', '', '', '']);
    }
  }

  const tableInnerW = W - 2 * L;
  const cwNo = 7;
  const cwName = Math.min(48, Math.floor(tableInnerW * 0.26));
  const rest = tableInnerW - cwNo - cwName;
  const cwQty = Math.floor(rest * 0.12);
  const cwPrice = Math.floor(rest * 0.28);
  const cwTot = Math.floor(rest * 0.28);
  const cwBc = rest - cwQty - cwPrice - cwTot;

  autoTable(doc, {
    startY: y,
    head: [['№', 'Барааны нэр', 'Баркод', 'Тоо/Ширхэг', 'Нэгж үнэ', 'Нийт үнэ']],
    body: tableData,
    theme: 'grid',
    tableWidth: tableInnerW,
    styles: {
      font: 'Roboto',
      fontStyle: 'normal',
      fontSize: layout.tableFont,
      cellPadding: layout.cellPadding,
      lineColor: [180, 180, 180],
      lineWidth: 0.15,
      minCellHeight: layout.minCellHeight,
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [220, 220, 220],
      textColor: 0,
      fontSize: layout.tableHeadFont,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: layout.cellPadding + 0.2,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: cwNo },
      1: {
        cellWidth: cwName,
        fontSize: layout.tableFont,
        halign: 'left',
        overflow: 'linebreak',
      },
      2: { halign: 'center', cellWidth: cwBc, fontSize: layout.tableFont - 0.5 },
      3: { halign: 'center', cellWidth: cwQty },
      4: { halign: 'right', cellWidth: cwPrice },
      5: { halign: 'right', cellWidth: cwTot },
    },
    margin: { left: L, right: L },
    pageBreak: 'auto',
  });

  y = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + layout.afterTable;

  // QR + Дүн
  const qrSize = layout.qrSize;
  const qrX = L + 2;
  const totalsX = W / 2 + 4;

  let qrDataUrl: string | null = null;
  try {
    const qrContent = data.qrData || JSON.stringify({ id: data.id, date: data.date });
    qrDataUrl = await QRCode.toDataURL(qrContent, { width: layout.qrImagePx, margin: 1 });
  } catch {
    /* ignore */
  }

  if (qrDataUrl) doc.addImage(qrDataUrl, 'PNG', qrX, y, qrSize, qrSize);

  const lotteryX = qrX + qrSize + 3;
  const lotY1 = compactReceipt ? 5 : 7;
  const lotY2 = compactReceipt ? 10 : 15;
  const lotY3 = compactReceipt ? 15 : 21;
  if (data.lottery) {
    bold();
    doc.setFontSize(compactReceipt ? 7 : 8);
    doc.text('Сугалаа:', lotteryX, y + lotY1);
    bold();
    doc.setFontSize(compactReceipt ? 11 : 13);
    doc.text(String(data.lottery), lotteryX, y + lotY2);
    normal();
    doc.setFontSize(compactReceipt ? 6 : 7);
    doc.text('Сугалаанд оролцоно уу!', lotteryX, y + lotY3);
  } else if (isB2B) {
    normal();
    doc.setFontSize(compactReceipt ? 6.5 : 7.5);
    doc.text('Байгууллагын баримт', lotteryX, y + (compactReceipt ? 8 : 11));
    doc.setFontSize(compactReceipt ? 6 : 6.5);
    doc.text('(ААН-д сугалаа олгогдохгүй)', lotteryX, y + (compactReceipt ? 13 : 17));
  } else {
    normal();
    doc.setFontSize(compactReceipt ? 6.5 : 7.5);
    doc.text('E-Barimt бүртгэлгүй', lotteryX, y + (compactReceipt ? 9 : 13));
  }
  normal();
  doc.setFontSize(compactReceipt ? 5.8 : 6.5);
  doc.text(
    'QR код уншуулж баримт шалгана уу',
    qrX + qrSize / 2,
    y + qrSize + (compactReceipt ? 2 : 3),
    {
      align: 'center',
    }
  );

  const grossWithVat = Number(data.totalAmount) || 0;
  const vat = Number(data.totalVAT) || 0;
  const subtotalNoVat = Math.round((grossWithVat - vat) * 100) / 100;
  const totalRows: [string, string][] = [
    ['Барааны нийт дүн:', subtotalNoVat.toLocaleString()],
    ['НӨАТ (10%):', vat.toLocaleString()],
    ['Нийт үнэ:', grossWithVat.toLocaleString()],
  ];
  totalRows.forEach(([lbl, val], i) => {
    const ty = y + (compactReceipt ? 2 : 3) + i * layout.totalsLine;
    if (i === 2) bold();
    else normal();
    doc.setFontSize(layout.totalsFont);
    doc.text(lbl, totalsX, ty);
    doc.text(val, R, ty, { align: 'right' });
  });

  // Гарын үсэг: дүнгийн яг доор
  const sigY = y + (compactReceipt ? 2 : 3) + totalRows.length * layout.totalsLine + layout.sigGap;
  normal();
  doc.setFontSize(layout.sigFont);
  doc.text('Хүлээлгэн өгсөн:  ........................./.........................', W / 2, sigY, {
    align: 'center',
  });
  doc.text(
    'Хүлээн авсан:  ........................./.........................',
    W / 2,
    sigY + layout.sigGap,
    {
      align: 'center',
    }
  );

  const blobUrl = doc.output('bloburl');
  const pdfWindow = window.open(blobUrl);
  if (pdfWindow) {
    pdfWindow.onload = () => pdfWindow.print();
  } else {
    doc.save(`ebarimt_${data.id || 'receipt'}.pdf`);
  }
}

// ── Styles ───────────────────────────────────────────────────────────
const st: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  modal: {
    background: '#1e2130',
    borderRadius: 12,
    width: '100%',
    maxWidth: 540,
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
    color: '#e2e8f0',
    fontFamily: "'Segoe UI', sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 22px 14px',
    borderBottom: '1px solid #2d3348',
  },
  title: { fontSize: 16, fontWeight: 600, color: '#f1f5f9', margin: 0 },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 20,
  },
  body: { padding: '18px 22px' },
  label: { display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 5, fontWeight: 500 },
  input: {
    width: '100%',
    background: '#252838',
    border: '1px solid #3d4460',
    borderRadius: 8,
    padding: '9px 12px',
    color: '#e2e8f0',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    background: '#252838',
    border: '1px solid #3d4460',
    borderRadius: 8,
    padding: '9px 12px',
    color: '#e2e8f0',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
    cursor: 'pointer',
  },
  radioGroup: { display: 'flex', gap: 20, marginBottom: 14 },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    fontSize: 13,
    color: '#cbd5e1',
  },
  successCard: {
    background: '#1a2e1a',
    border: '1px solid #22c55e',
    borderRadius: 6,
    padding: '8px 12px',
    marginTop: 8,
    fontSize: 12,
    color: '#86efac',
  },
  errorText: { fontSize: 11, color: '#f87171', marginTop: 4 },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 16,
    borderTop: '1px solid #2d3348',
    marginTop: 12,
  },
  cancelBtn: {
    background: 'none',
    border: '1px solid #3d4460',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 13,
    padding: '8px 18px',
    borderRadius: 8,
  },
  submitBtn: {
    background: '#16a34a',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    padding: '8px 20px',
    borderRadius: 8,
  },
  disabledBtn: { background: '#1a3a28', color: '#4d7a5f', cursor: 'not-allowed' },
  itemsList: {
    background: '#252838',
    border: '1px solid #3d4460',
    borderRadius: 8,
    padding: '10px 14px',
    marginBottom: 14,
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 13,
    color: '#cbd5e1',
    padding: '3px 0',
    borderBottom: '1px solid #2d3348',
  },
};

// ── Component ─────────────────────────────────────────────────────────
interface Props {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EbarimtPrintModal({ order, onClose, onSuccess }: Props) {
  const customerRegNo = String(order.customer?.registrationNumber || '').trim();
  const [customerKind, setCustomerKind] = useState<'organization' | 'individual'>('organization');
  const [useCustomerRegNo, setUseCustomerRegNo] = useState(Boolean(customerRegNo));
  const [regNumber, setRegNumber] = useState(customerRegNo);
  const [regResult, setRegResult] = useState<{ name: string; tin: string } | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [regError, setRegError] = useState('');
  const [individualReg, setIndividualReg] = useState('');
  const [individualLookupResult, setIndividualLookupResult] = useState<{
    name: string;
    tin: string;
  } | null>(null);
  const [individualLookupError, setIndividualLookupError] = useState('');
  const [individualLookupInfo, setIndividualLookupInfo] = useState('');
  const [individualLookingUp, setIndividualLookingUp] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'BankTransfer' | 'Card'>('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feature flag: Backend API ашиглах эсэх (туршилтын үе)
  const [useBackendApi] = useState(true);

  const paymentMap = { Cash: 'CASH', BankTransfer: 'BANK_TRANSFER', Card: 'PAYMENT_CARD' } as const;
  const paymentLabels = { Cash: 'Бэлэн', BankTransfer: 'Шилжүүлэг', Card: 'Карт' };

  const lineGrossTotal = (oi: OrderItem) => {
    if (oi.subtotal != null && oi.subtotal !== '') return Number(oi.subtotal);
    return Number(oi.unitPrice) * oi.quantity;
  };
  const linesGrossTotal = (order.orderItems || []).reduce((s, oi) => s + lineGrossTotal(oi), 0);
  const subtotalExVat =
    order.subtotalAmount != null && order.subtotalAmount !== ''
      ? Number(order.subtotalAmount)
      : linesGrossTotal - (order.vatAmount != null ? Number(order.vatAmount) : 0);
  const vatNum = order.vatAmount != null ? Number(order.vatAmount) : 0;
  const grandTotal = Number(order.totalAmount) || 0;

  const handleRegLookup = async () => {
    const activeRegNo = useCustomerRegNo ? customerRegNo : regNumber;
    const trimmed = activeRegNo.trim();
    if (!trimmed) {
      setRegError('Регистрийн дугаар оруулна уу');
      return;
    }
    setIsLookingUp(true);
    setRegError('');
    setRegResult(null);
    try {
      const { name, tin } = await lookupEbarimtOrganizationBySevenDigitReg(trimmed);
      setRegResult({ name, tin });
    } catch (e) {
      setRegError(e instanceof Error ? e.message : 'Хайлт амжилтгүй');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleIndividualLookup = async () => {
    const trimmed = individualReg.trim();
    if (!trimmed) {
      setIndividualLookupError('Дугаар оруулна уу');
      setIndividualLookupInfo('');
      return;
    }
    setIndividualLookingUp(true);
    setIndividualLookupError('');
    setIndividualLookupInfo('');
    setIndividualLookupResult(null);
    try {
      if (/^\d{10,12}$/.test(trimmed)) {
        const { name, tin } = await getEbarimtInfoByTin(trimmed);
        setIndividualLookupResult({ name, tin });
        setIndividualLookupInfo('');
        toast.success('ТТД (getInfo)-ээр нэр, ТТД татагдлаа');
      } else if (/^\d{7}$/.test(trimmed)) {
        const { name, tin } = await lookupEbarimtOrganizationBySevenDigitReg(trimmed);
        setIndividualLookupResult({ name, tin });
        setIndividualLookupInfo('');
        toast.success('eBarimt-аас байгууллагын мэдээлэл татагдлаа');
      } else if (/^\d{8}$/.test(trimmed)) {
        setIndividualLookupInfo(
          '8 оронтой нь И-баримт апп-ын хэрэглэгчийн дугаар. Гадаад API-аар нэр татдаггүй; баримтад шууд дамжуулна.'
        );
      } else {
        setIndividualLookupError(
          '7 орон — байгууллага, 8 орон — И-баримт хэрэглэгчийн дугаар, 10–12 орон — ТТД (getInfo)'
        );
      }
    } catch (e) {
      setIndividualLookupError(e instanceof Error ? e.message : 'Хайлт амжилтгүй');
    } finally {
      setIndividualLookingUp(false);
    }
  };

  // ========== ХУУЧИН АРГ: Шууд POS API руу хүсэлт илгээх ==========
  const handlePrintDirect = async () => {
    const isB2B = customerKind === 'organization';
    const activeRegNo = useCustomerRegNo ? customerRegNo : regNumber.trim();

    if (isB2B && !regResult?.tin && !activeRegNo) {
      toast.error("Байгууллагын TIN-г 'Лавлах' товч дарж авна уу");
      return;
    }

    if (!order.orderItems || order.orderItems.length === 0) {
      toast.error('Захиалгын бараа олдсонгүй');
      return;
    }

    setIsSubmitting(true);
    try {
      const ebarimtItems = order.orderItems.map((oi) => ({
        name: oi.product?.nameMongolian || 'Бараа',
        barCode: oi.product?.barcode || '',
        classificationCode: oi.product?.classificationCode || '2399421',
        unitPrice: Number(oi.unitPrice),
        qty: oi.quantity,
      }));

      let resolvedTin = isB2B && regResult?.tin ? regResult.tin : null;

      if (isB2B && !resolvedTin && activeRegNo) {
        try {
          const tinInfo = await getTinInfo(Number(activeRegNo));
          resolvedTin = tinInfo.tinNumber;
          if (!regResult) {
            setRegResult({ name: tinInfo.tinName, tin: tinInfo.tinNumber });
          }
        } catch {
          toast.error('Регистрээс TIN авахад алдаа гарлаа. Лавлах товч дарж шалгана уу');
          return;
        }
      }

      if (isB2B && !resolvedTin) {
        toast.error('Байгууллагын TIN олдсонгүй. Лавлах товч дарж баталгаажуулна уу');
        return;
      }

      const ind = individualReg.trim();
      /** B2C: зөвхөн 8 орон consumerNo; ТТД (10–12) нь getInfo-оор нэр авсан — POS-д consumer хоосон */
      const consumerNoB2C =
        !isB2B && ind ? (/^\d{8}$/.test(ind) ? ind : /^\d{10,12}$/.test(ind) ? '' : null) : null;

      const payload = await createEbarimtRequest({
        items: ebarimtItems,
        paymentType: paymentMap[paymentMethod],
        type: isB2B ? 'B2B_RECEIPT' : 'B2C_RECEIPT',
        consumerNo: consumerNoB2C,
        customerTin: resolvedTin,
        regNo: isB2B && activeRegNo ? Number(activeRegNo) : undefined,
      });

      const res = await fetch('/posapi/rest/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const raw = await res.text();
      let data: { id?: string; date?: string; message?: string } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        /* non-JSON */
      }

      if (!res.ok) {
        const parsedMessage = (() => {
          try {
            const j = raw ? JSON.parse(raw) : null;
            return j?.message || j?.error || j?.data?.message;
          } catch {
            return undefined;
          }
        })();

        console.error('eBarimt POS 400 payload', payload);
        toast.error(parsedMessage || data?.message || raw || `HTTP ${res.status}`);
        return;
      }

      if (!data?.id) {
        toast.error(data?.message || 'eBarimt үүсгэхэд алдаа гарлаа');
        return;
      }

      // Backend-д ebarimt мэдээлэл хадгалах
      await ordersApi.markEbarimt(order.id, {
        ebarimtBillId: data.id,
        ebarimtDate: data.date ?? '',
        ebarimtId: data.id,
        ebarimtType: isB2B ? 'B2B' : 'B2C',
      });

      // PDF хэвлэх
      const orderNum = `ORD-${order.id.toString().padStart(6, '0')}`;
      const custName = isB2B
        ? regResult?.name || ''
        : individualLookupResult?.name || order.customer?.name || '';
      const cust = order.customer;
      const addressStr =
        [cust?.district, cust?.address].filter(Boolean).join(', ') || cust?.address || '';
      const pdfData: EbarimtReceiptPdfData = {
        ...data,
        customerTin: resolvedTin ?? undefined,
        totalAmount: grandTotal,
        totalVAT: vatNum,
        subtotalExVat,
      };
      await generateEbarimtPDF(
        pdfData,
        ebarimtItems,
        custName,
        paymentLabels[paymentMethod],
        orderNum,
        isB2B,
        {
          address: addressStr,
          phone: cust?.phoneNumber ?? '',
          registrationNumber: isB2B
            ? (cust?.registrationNumber ?? '')
            : individualReg.trim() || cust?.registrationNumber || '',
          tin: isB2B ? (resolvedTin ?? '') : (individualLookupResult?.tin ?? ''),
        }
      );

      toast.success('eBarimt амжилттай хэвлэгдлээ!');
      onSuccess();
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err.response?.data?.message || err.message || 'Алдаа гарлаа');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========== ШИНЭ АРГ: Backend API ашиглах (зөвлөмжтэй) ==========
  const handlePrintViaBackend = async () => {
    const isB2B = customerKind === 'organization';
    const activeRegNo = useCustomerRegNo ? customerRegNo : regNumber.trim();

    if (isB2B && !regResult?.tin && !activeRegNo) {
      toast.error("Байгууллагын TIN-г 'Лавлах' товч дарж авна уу");
      return;
    }

    if (!order.orderItems || order.orderItems.length === 0) {
      toast.error('Захиалгын бараа олдсонгүй');
      return;
    }

    setIsSubmitting(true);
    try {
      let resolvedTin = isB2B && regResult?.tin ? regResult.tin : null;

      if (isB2B && !resolvedTin && activeRegNo) {
        try {
          const tinInfo = await getTinInfo(Number(activeRegNo));
          resolvedTin = String(tinInfo.tinNumber);
          if (!regResult) {
            setRegResult({ name: tinInfo.tinName, tin: tinInfo.tinNumber });
          }
        } catch {
          toast.error('Регистрээс TIN авахад алдаа гарлаа. Лавлах товч дарж шалгана уу');
          return;
        }
      }

      if (isB2B && !resolvedTin) {
        toast.error('Байгууллагын TIN олдсонгүй. Лавлах товч дарж баталгаажуулна уу');
        return;
      }

      // Backend API руу хүсэлт илгээх - бүх логик backend дээр
      const requestData: { customerTin?: string } = {};

      // Байгууллага бол лавласан TIN дамжуулах
      if (isB2B && resolvedTin) {
        requestData.customerTin = resolvedTin;
      }

      const res = await ordersApi.registerEbarimt(order.id, requestData);
      const result = res.data.data;

      if (!result?.billId) {
        toast.error('eBarimt үүсгэхэд алдаа гарлаа');
        return;
      }

      // PDF хэвлэх
      const ebarimtItems = order.orderItems.map((oi) => ({
        name: oi.product?.nameMongolian || 'Бараа',
        barCode: oi.product?.barcode || '',
        qty: oi.quantity,
        unitPrice: Number(oi.unitPrice),
      }));

      const orderNum = `ORD-${order.id.toString().padStart(6, '0')}`;
      const custName = isB2B
        ? regResult?.name || ''
        : individualLookupResult?.name || order.customer?.name || '';
      const cust = order.customer;
      const addressStr =
        [cust?.district, cust?.address].filter(Boolean).join(', ') || cust?.address || '';

      let resolvedTinForPdf = resolvedTin;
      if (!isB2B && individualLookupResult?.tin) {
        resolvedTinForPdf = individualLookupResult.tin;
      }

      const pdfData: EbarimtReceiptPdfData = {
        id: result.billId,
        date: result.date,
        customerTin: resolvedTinForPdf ?? undefined,
        lottery: result.lottery,
        qrData: result.qrData,
        totalAmount: result.totalAmount || grandTotal,
        totalVAT: result.totalVAT || vatNum,
        subtotalExVat: undefined,
      };

      await generateEbarimtPDF(
        pdfData,
        ebarimtItems,
        custName,
        paymentLabels[paymentMethod],
        orderNum,
        isB2B,
        {
          address: addressStr,
          phone: cust?.phoneNumber ?? '',
          registrationNumber: isB2B
            ? (cust?.registrationNumber ?? '')
            : individualReg.trim() || cust?.registrationNumber || '',
          tin: isB2B ? (resolvedTinForPdf ?? '') : (individualLookupResult?.tin ?? ''),
        }
      );

      toast.success('eBarimt амжилттай хэвлэгдлээ! (Backend API)');
      onSuccess();
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err.response?.data?.message || err.message || 'Алдаа гарлаа');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========== ҮНДСЭН ФУНКЦ: Feature flag-аар сонгох ==========
  const handlePrint = async () => {
    if (useBackendApi) {
      await handlePrintViaBackend();
    } else {
      await handlePrintDirect();
    }
  };

  const showVatBreakdown = Number.isFinite(vatNum) && vatNum > 0.005;

  return (
    <div style={st.overlay}>
      <div style={st.modal}>
        <div style={st.header}>
          <h2 style={st.title}>eBarimt хэвлэх — Захиалга #{order.id}</h2>
          <button style={st.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>
        <div style={st.body}>
          {/* Захиалгын барааны жагсаалт */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Барааны жагсаалт</div>
            <div style={st.itemsList}>
              {(order.orderItems || []).map((oi, i) => {
                const unit = Number(oi.unitPrice);
                const lineGross = lineGrossTotal(oi);
                return (
                  <div
                    key={oi.id ?? i}
                    style={{
                      ...st.itemRow,
                      ...(i === (order.orderItems?.length || 0) - 1 ? { border: 'none' } : {}),
                    }}
                  >
                    <span style={{ flex: 1, paddingRight: 8 }}>
                      {oi.product?.nameMongolian || 'Бараа'}
                    </span>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ color: '#cbd5e1' }}>
                        {oi.quantity} × {unit.toLocaleString()}₮
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                        = {lineGross.toLocaleString()}₮
                      </div>
                    </div>
                  </div>
                );
              })}
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: '1px solid #3d4460',
                  fontSize: 13,
                  color: '#e2e8f0',
                  textAlign: 'right',
                }}
              >
                {showVatBreakdown ? (
                  <>
                    <div style={{ marginBottom: 4 }}>
                      Барааны дүн (НӨАТ-гүй):{' '}
                      <span style={{ color: '#f1f5f9' }}>{subtotalExVat.toLocaleString()}₮</span>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      НӨАТ (10%):{' '}
                      <span style={{ color: '#f1f5f9' }}>{vatNum.toLocaleString()}₮</span>
                    </div>
                  </>
                ) : null}
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    color: '#f8fafc',
                  }}
                >
                  Нийт төлөх: {grandTotal.toLocaleString()}₮
                </div>
              </div>
            </div>
          </div>

          {/* Хэрэглэгчийн төрөл */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
              Хэрэглэгчийн төрөл
            </div>
            <div style={st.radioGroup}>
              <label style={st.radioLabel}>
                <input
                  type="radio"
                  checked={customerKind === 'organization'}
                  onChange={() => setCustomerKind('organization')}
                />
                Байгууллага (B2B)
              </label>
              <label style={st.radioLabel}>
                <input
                  type="radio"
                  checked={customerKind === 'individual'}
                  onChange={() => setCustomerKind('individual')}
                />
                Иргэн (B2C)
              </label>
            </div>
          </div>

          {customerKind === 'organization' ? (
            <div style={{ marginBottom: 14 }}>
              {customerRegNo && (
                <label style={{ ...st.radioLabel, marginBottom: 8 }}>
                  <input
                    type="checkbox"
                    checked={useCustomerRegNo}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setUseCustomerRegNo(checked);
                      setRegError('');
                      setRegResult(null);
                      if (checked) {
                        setRegNumber(customerRegNo);
                      }
                    }}
                  />
                  Харилцагчийн бүртгэлтэй регистр ({customerRegNo}) ашиглах
                </label>
              )}

              <label style={st.label}>Байгууллагын регистр</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...st.input, ...(useCustomerRegNo ? { opacity: 0.7 } : {}) }}
                  value={useCustomerRegNo ? customerRegNo : regNumber}
                  placeholder="Регистрийн дугаар"
                  disabled={useCustomerRegNo}
                  onChange={(e) => setRegNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRegLookup()}
                />
                <button
                  style={{ ...st.submitBtn, whiteSpace: 'nowrap' }}
                  onClick={handleRegLookup}
                  disabled={isLookingUp}
                >
                  {isLookingUp ? '...' : 'Лавлах'}
                </button>
              </div>
              {regError && <div style={st.errorText}>{regError}</div>}
              {regResult && (
                <div style={st.successCard}>
                  ✓ {regResult.name} — TIN: {regResult.tin}
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <label style={st.label}>
                ТТД (10–12 орон), эсвэл 7 орон байгууллага, эсвэл 8 орон И-баримт хэрэглэгчийн
                дугаар
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={st.input}
                  value={individualReg}
                  placeholder="Жишээ: 111655202982 (ТТД) эсвэл 1234567 / 12345678"
                  onChange={(e) => {
                    setIndividualReg(e.target.value);
                    setIndividualLookupResult(null);
                    setIndividualLookupError('');
                    setIndividualLookupInfo('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleIndividualLookup()}
                />
                <button
                  type="button"
                  style={{ ...st.submitBtn, whiteSpace: 'nowrap' }}
                  onClick={handleIndividualLookup}
                  disabled={individualLookingUp}
                >
                  {individualLookingUp ? '...' : 'Лавлах'}
                </button>
              </div>
              {individualLookupError && <div style={st.errorText}>{individualLookupError}</div>}
              {individualLookupInfo && (
                <div style={{ ...st.successCard, marginTop: 8, background: '#1e293b' }}>
                  {individualLookupInfo}
                </div>
              )}
              {individualLookupResult && (
                <div style={{ ...st.successCard, marginTop: 8 }}>
                  ✓ {individualLookupResult.name} — ТТД: {individualLookupResult.tin}
                </div>
              )}
            </div>
          )}

          {/* Төлбөрийн төрөл */}
          <div style={{ marginBottom: 4 }}>
            <label style={st.label}>Төлбөрийн төрөл</label>
            <select
              style={st.select}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as 'Cash' | 'BankTransfer' | 'Card')}
            >
              <option value="Cash">Бэлнээр</option>
              <option value="BankTransfer">Дансанд шилжүүлэх</option>
              <option value="Card">Карт</option>
            </select>
          </div>

          {/* API сонголт (туршилтын үе) */}
          {/* <div
            style={{
              marginBottom: 14,
              padding: '12px',
              background: '#252838',
              borderRadius: 8,
              border: '1px solid #3d4460',
            }}
          >
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: 500 }}>
              🔧 Туршилтын горим
            </div>
            <label style={{ ...st.radioLabel, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useBackendApi}
                onChange={(e) => setUseBackendApi(e.target.checked)}
              />
              <span style={{ fontSize: 12 }}>
                Backend API ашиглах (зөвлөмжтэй) {useBackendApi ? '✅' : ''}
              </span>
            </label>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, marginLeft: 20 }}>
              {useBackendApi
                ? '✓ Аюулгүй, найдвартай арга. Backend дамжуулж POS API руу хүсэлт илгээнэ.'
                : '⚠️ Хуучин арга: Frontend шууд POS руу холбогдоно.'}
            </div>
          </div> */}

          <div style={st.footer}>
            <button style={st.cancelBtn} onClick={onClose}>
              Болих
            </button>
            <button
              style={{ ...st.submitBtn, ...(isSubmitting ? st.disabledBtn : {}) }}
              onClick={handlePrint}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Хэвлэж байна...' : 'eBarimt хэвлэх'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
