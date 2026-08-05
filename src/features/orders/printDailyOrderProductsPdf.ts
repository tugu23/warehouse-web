import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RobotoRegular } from '../../fonts/Roboto-Regular';
import { RobotoBold } from '../../fonts/Roboto-Bold';
import type { DailyAggregatedProduct } from './dailyOrderProductsAggregate';

const MARGIN = 14;

/**
 * Өдрийн нэгтгэсэн барааны жагсаалтыг A4 босоо PDF болгон хадгална (Монгол текст Roboto).
 *
 * багана: № | Барааны нэр | Хайрцаг | Ширхэг | Шалгах
 */
export function printDailyOrderProductsPdf(
  rows: DailyAggregatedProduct[],
  dateYmd: string,
  employeeName?: string
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  try {
    doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegular);
    doc.addFileToVFS('Roboto-Bold.ttf', RobotoBold);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
    doc.setFont('Roboto', 'normal');
  } catch {
    doc.setFont('helvetica', 'normal');
  }

  const pageW = doc.internal.pageSize.getWidth();
  const title = 'Өдрийн ачааны жагсаалт';
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(16);
  doc.text(title, pageW / 2, MARGIN, { align: 'center' });
  if (employeeName) {
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Ажилтан: ${employeeName}`, pageW / 2, MARGIN + 6, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Огноо: ${dateYmd}`, pageW / 2, employeeName ? MARGIN + 13 : MARGIN + 8, {
    align: 'center',
  });
  doc.setTextColor(0, 0, 0);

  const body = rows.map((r, i) => [
    String(i + 1),
    r.name,
    r.boxesDisplay,     // хайрцаг
    r.piecesDisplay,    // ширхэг
    '',                 // шалгах (хоосон чеклэх зай)
  ]);

  const pageInnerW = doc.internal.pageSize.getWidth() - 2 * MARGIN;
  // № | Нэр | Хайрцаг | Ширхэг | Шалгах
  const c0 = 9;    // №
  const c3 = 22;   // хайрцаг
  const c4 = 22;   // ширхэг
  const c5 = 20;   // шалгах
  const c1 = Math.max(40, pageInnerW - c0 - c3 - c4 - c5);

  autoTable(doc, {
    startY: employeeName ? MARGIN + 21 : MARGIN + 16,
    head: [['№', 'Барааны нэр', 'Хайрцаг', 'Ширхэг', 'Шалгах']],
    body,
    theme: 'grid',
    tableWidth: pageInnerW,
    styles: {
      font: 'Roboto',
      fontSize: 9,
      cellPadding: 2,
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      font: 'Roboto',
      fontStyle: 'bold',
      fillColor: [41, 98, 146],
      textColor: 255,
    },
    columnStyles: {
      0: { cellWidth: c0, halign: 'center' },
      1: { cellWidth: c1, halign: 'left' },
      2: { cellWidth: c3, halign: 'center' },
      3: { cellWidth: c4, halign: 'center' },
      4: { cellWidth: c5, halign: 'center', minCellHeight: 8 },
    },
    margin: { left: MARGIN, right: MARGIN },
  });

  const safe = dateYmd.replace(/[^0-9-]/g, '');
  doc.save(`achaan_baraa_${safe || 'odor'}.pdf`);
}
