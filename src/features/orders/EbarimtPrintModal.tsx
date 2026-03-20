import { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { toast } from 'react-hot-toast';
import { ordersApi } from '../../api';
import { Order } from '../../types';
import { RobotoRegular } from '../../fonts/Roboto-Regular';
import { RobotoBold } from '../../fonts/Roboto-Bold';

// ── eBarimt request builder ──────────────────────────────────────────
const MERCHANT_TIN = '37900846788';
const DEFAULT_CONSUMER_NO = '10012516';
const COMPANY = {
  name: 'GLF LLC OASIS Боонь тов',
  address: 'Монгол, Улаанбаатар, Сүхбаатар дүүрэг, 6-р хороо, 27-49',
  phones: '70121128, 88048350, 89741277',
  tin: '5317878',
};

function buildEbarimtPayload(opts: {
  items: {
    name: string;
    barCode: string;
    classificationCode: string;
    unitPrice: number;
    qty: number;
  }[];
  paymentType: 'CASH' | 'BANK_TRANSFER' | 'PAYMENT_CARD';
  type: 'B2C_RECEIPT' | 'B2B_RECEIPT';
  consumerNo?: string | null;
  customerTin?: string | null;
}) {
  const { items, paymentType, type, consumerNo, customerTin } = opts;

  const calculatedItems = items.map((item) => {
    const qty = item.qty || 1;
    const itemTotalAmount = +(item.unitPrice * qty).toFixed(2);
    const unitPriceExTax = +(item.unitPrice / 1.12).toFixed(2);
    const itemTotalVAT = +((itemTotalAmount * 10) / 112).toFixed(2);
    const itemTotalCityTax = +((itemTotalAmount * 2) / 112).toFixed(2);
    return {
      name: item.name,
      barCode: item.barCode,
      barCodeType: 'GS1',
      classificationCode: item.classificationCode || '2399421',
      taxProductCode: null,
      measureUnit: 'ш',
      qty,
      unitPrice: unitPriceExTax,
      totalVAT: itemTotalVAT,
      totalCityTax: itemTotalCityTax,
      totalAmount: itemTotalAmount,
    };
  });

  const totalAmount = +calculatedItems.reduce((s, i) => s + i.totalAmount, 0).toFixed(2);
  const totalVAT = +((totalAmount * 10) / 112).toFixed(2);
  const totalCityTax = +((totalAmount * 2) / 112).toFixed(2);

  return {
    branchNo: '001',
    totalAmount,
    totalVAT,
    totalCityTax,
    districtCode: '2506',
    merchantTin: MERCHANT_TIN,
    posNo: '001',
    customerTin: type === 'B2B_RECEIPT' ? (customerTin ? String(customerTin) : null) : null,
    consumerNo: type === 'B2C_RECEIPT' ? consumerNo || DEFAULT_CONSUMER_NO : undefined,
    type,
    inactiveId: null,
    invoiceId: null,
    reportMonth: null,
    billIdSuffix: '01',
    receipts: [
      {
        totalAmount,
        taxType: 'VAT_ABLE',
        merchantTin: MERCHANT_TIN,
        customerTin: type === 'B2B_RECEIPT' ? (customerTin ? String(customerTin) : null) : null,
        totalVAT,
        totalCityTax,
        bankAccountNo: '',
        iBan: '',
        items: calculatedItems,
      },
    ],
    payments: [{ code: paymentType, status: 'PAID', paidAmount: totalAmount }],
  };
}

/** POS receipt API payload used when drawing the PDF */
interface EbarimtReceiptPdfData {
  id?: string;
  date?: string;
  customerTin?: string | null;
  qrData?: string;
  lottery?: string | number;
}

type JsPDFWithAutoTable = import('jspdf').jsPDF & { lastAutoTable: { finalY: number } };

// ── PDF generator ────────────────────────────────────────────────────
async function generateEbarimtPDF(
  data: EbarimtReceiptPdfData,
  orderItems: { name: string; barCode: string; qty: number; unitPrice: number }[],
  customerName: string,
  paymentLabel: string,
  orderNumber: string,
  isB2B: boolean
) {
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

  const W = doc.internal.pageSize.getWidth();
  const L = 10,
    R = W - 10;
  let y = 12;

  const drawLine = (yy: number, w = 0.4) => {
    doc.setDrawColor(0);
    doc.setLineWidth(w);
    doc.line(L, yy, R, yy);
  };
  const bold = () => doc.setFont('Roboto', 'bold');
  const normal = () => doc.setFont('Roboto', 'normal');

  // Огноо
  normal();
  doc.setFontSize(9);
  doc.setTextColor(60, 100, 180);
  doc.text(String(data.date || '').slice(0, 10) || new Date().toISOString().slice(0, 10), L, y);
  doc.setTextColor(0);
  y += 7;

  // Гарчиг
  bold();
  doc.setFontSize(15);
  doc.text('ТӨЛБӨРИЙН БАРИМТ', W / 2, y, { align: 'center' });
  y += 2;
  drawLine(y, 0.8);
  y += 7;

  // Хоёр багана
  const midX = W / 2 + 5;
  bold();
  doc.setFontSize(9);
  doc.text('Баримтын мэдээлэл', L, y);
  doc.text('Худалдан авагч', midX, y);
  y += 5;

  const rowH = 5,
    labelW = 22,
    labelWR = 14;
  const leftRows: [string, string][] = [
    ['Падаан №:', orderNumber],
    ['ДДТД:', data.id || ''],
    ['ТТД:', COMPANY.tin],
    ['Төлбөр:', paymentLabel],
  ];
  const rightRows: [string, string][] = [['Нэр:', customerName || '—']];
  if (isB2B && data.customerTin) rightRows.push(['ТТД:', String(data.customerTin)]);

  const startY = y;
  leftRows.forEach(([lbl, val], i) => {
    bold();
    doc.setFontSize(8);
    doc.text(lbl, L + 2, startY + i * rowH);
    normal();
    if (lbl === 'ДДТД:') {
      doc.setFontSize(6.5);
      doc.text(val, L + 2 + labelW, startY + i * rowH);
      doc.setFontSize(8);
    } else {
      doc.setFontSize(8);
      doc.text(val, L + 2 + labelW, startY + i * rowH);
    }
  });
  rightRows.forEach(([lbl, val], i) => {
    bold();
    doc.setFontSize(8);
    doc.text(lbl, midX, startY + i * rowH);
    normal();
    doc.setFontSize(8);
    doc.text(val, midX + labelWR, startY + i * rowH);
  });

  y = startY + Math.max(leftRows.length, rightRows.length) * rowH + 3;
  drawLine(y, 0.3);
  y += 5;

  // Борлуулагч
  bold();
  doc.setFontSize(9);
  doc.text('Борлуулагч', L, y);
  y += 5;
  [
    ['Байгуулга:', COMPANY.name],
    ['Хаяг:', COMPANY.address],
    ['Утас:', COMPANY.phones],
  ].forEach(([lbl, val]) => {
    bold();
    doc.setFontSize(8);
    doc.text(lbl, L + 2, y);
    normal();
    doc.setFontSize(8);
    const lines = doc.splitTextToSize(val, 130);
    doc.text(lines, L + 2 + 22, y);
    y += lines.length > 1 ? lines.length * 4 + 1 : rowH;
  });
  drawLine(y, 0.3);
  y += 4;

  // Хүснэгт
  const tableData = orderItems.map((item, i) => [
    String(i + 1),
    item.name,
    item.barCode,
    String(item.qty),
    item.unitPrice.toLocaleString(),
    (item.unitPrice * item.qty).toLocaleString(),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['№', 'Барааны нэр', 'Баркод', 'Тоо/Ширхэг', 'Нэгж үнэ', 'Нийт үнэ']],
    body: tableData,
    theme: 'grid',
    styles: { font: 'Roboto', fontStyle: 'normal', fontSize: 8 },
    headStyles: {
      fillColor: [220, 220, 220],
      textColor: 0,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 60 },
      2: { halign: 'center', cellWidth: 35 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'right', cellWidth: 28 },
      5: { halign: 'right', cellWidth: 28 },
    },
    margin: { left: L, right: L },
  });

  y = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 5;

  // QR + Дүн
  const qrSize = 32,
    qrX = L + 3,
    totalsX = W / 2 + 5;

  let qrDataUrl: string | null = null;
  try {
    const qrContent = data.qrData || JSON.stringify({ id: data.id, date: data.date });
    qrDataUrl = await QRCode.toDataURL(qrContent, { width: 200, margin: 1 });
  } catch {
    /* ignore */
  }

  if (qrDataUrl) doc.addImage(qrDataUrl, 'PNG', qrX, y, qrSize, qrSize);

  const lotteryX = qrX + qrSize + 5;
  if (data.lottery) {
    bold();
    doc.setFontSize(9);
    doc.text('Сугалаа:', lotteryX, y + 8);
    bold();
    doc.setFontSize(14);
    doc.text(String(data.lottery), lotteryX, y + 17);
    normal();
    doc.setFontSize(7);
    doc.text('Сугалаанд оролцоно уу!', lotteryX, y + 23);
  } else if (isB2B) {
    normal();
    doc.setFontSize(8);
    doc.text('Байгууллагын баримт', lotteryX, y + 12);
    doc.setFontSize(7);
    doc.text('(ААН-д сугалаа олгогдохгүй)', lotteryX, y + 18);
  } else {
    normal();
    doc.setFontSize(8);
    doc.text('E-Barimt бүртгэлгүй', lotteryX, y + 15);
  }
  normal();
  doc.setFontSize(7);
  doc.text('QR код уншуулж баримт шалгана уу', qrX + qrSize / 2, y + qrSize + 4, {
    align: 'center',
  });

  const total = Number(data.totalAmount) || 0;
  const vat = Number(data.totalVAT) || 0;
  [
    ['Барааны нийт дүн:', total.toLocaleString()],
    ['НӨАТ (10%):', vat.toLocaleString()],
    ['Нийт үнэ:', total.toLocaleString()],
  ].forEach(([lbl, val], i) => {
    const ty = y + 5 + i * 7;
    if (i === 2) bold();
    else normal();
    doc.setFontSize(9);
    doc.text(lbl, totalsX, ty);
    doc.text(val, R, ty, { align: 'right' });
  });

  y += qrSize + 12;
  drawLine(y, 0.3);
  y += 7;

  normal();
  doc.setFontSize(9);
  doc.text('Хүлээлгэн өгсөн:  ........................./.........................', W / 2, y, {
    align: 'center',
  });
  y += 8;
  doc.text('Хүлээн авсан:  ........................./.........................', W / 2, y, {
    align: 'center',
  });
  y += 10;
  bold();
  doc.setFontSize(9);
  doc.text('Худалдан авалт хийсэнд баярлалаа!', W / 2, y, { align: 'center' });

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
  const [customerKind, setCustomerKind] = useState<'organization' | 'individual'>('organization');
  const [regNumber, setRegNumber] = useState('');
  const [regResult, setRegResult] = useState<{ name: string; tin: string } | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [regError, setRegError] = useState('');
  const [individualReg, setIndividualReg] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'BankTransfer' | 'Card'>('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentMap = { Cash: 'CASH', BankTransfer: 'BANK_TRANSFER', Card: 'PAYMENT_CARD' } as const;
  const paymentLabels = { Cash: 'Бэлэн', BankTransfer: 'Шилжүүлэг', Card: 'Карт' };

  const handleRegLookup = async () => {
    const trimmed = regNumber.trim();
    if (!trimmed) {
      setRegError('Регистрийн дугаар оруулна уу');
      return;
    }
    setIsLookingUp(true);
    setRegError('');
    setRegResult(null);
    try {
      const tinRes = await fetch(
        `https://api.ebarimt.mn/api/info/check/getTinInfo?regNo=${trimmed}`
      );
      const tinData = await tinRes.json();
      if (!tinData || tinData.status !== 200) {
        setRegError('TIN олдсонгүй');
        return;
      }
      const tin = tinData.data;
      const infoRes = await fetch(`https://api.ebarimt.mn/api/info/check/getInfo?tin=${tin}`);
      const infoData = await infoRes.json();
      if (!infoData || infoData.status !== 200) {
        setRegError('Байгууллагын мэдээлэл олдсонгүй');
        return;
      }
      setRegResult({ name: infoData.data.name, tin: String(tin) });
    } catch {
      setRegError('Хайлт амжилтгүй');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handlePrint = async () => {
    const isB2B = customerKind === 'organization';
    if (isB2B && !regResult?.tin) {
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

      const payload = buildEbarimtPayload({
        items: ebarimtItems,
        paymentType: paymentMap[paymentMethod],
        type: isB2B ? 'B2B_RECEIPT' : 'B2C_RECEIPT',
        consumerNo: !isB2B && individualReg ? individualReg : null,
        customerTin: isB2B && regResult?.tin ? regResult.tin : null,
      });

      const res = await fetch('http://localhost:7080/rest/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data?.id) {
        toast.error(data?.message || 'eBarimt үүсгэхэд алдаа гарлаа');
        return;
      }

      // Backend-д ebarimt мэдээлэл хадгалах
      await ordersApi.markEbarimt(order.id, {
        ebarimtBillId: data.id,
        ebarimtDate: data.date,
        ebarimtId: data.date,
        ebarimtType: isB2B ? 'B2B' : 'B2C',
      });

      // PDF хэвлэх
      const orderNum = `ORD-${order.id.toString().padStart(6, '0')}`;
      const custName = isB2B ? regResult?.name || '' : order.customer?.name || '';
      await generateEbarimtPDF(
        data,
        ebarimtItems,
        custName,
        paymentLabels[paymentMethod],
        orderNum,
        isB2B
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

  const totalAmount = (order.orderItems || []).reduce(
    (s, oi) => s + Number(oi.unitPrice) * oi.quantity,
    0
  );

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
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Барааны жагсаалт</div>
            <div style={st.itemsList}>
              {(order.orderItems || []).map((oi, i) => (
                <div
                  key={i}
                  style={{
                    ...st.itemRow,
                    ...(i === (order.orderItems?.length || 0) - 1 ? { border: 'none' } : {}),
                  }}
                >
                  <span>{oi.product?.nameMongolian || 'Бараа'}</span>
                  <span>
                    {oi.quantity} ш × {Number(oi.unitPrice).toLocaleString()}₮
                  </span>
                </div>
              ))}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  paddingTop: 6,
                  fontWeight: 600,
                  fontSize: 14,
                  color: '#f1f5f9',
                }}
              >
                Нийт: {totalAmount.toLocaleString()}₮
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
              <label style={st.label}>Байгууллагын регистр</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={st.input}
                  value={regNumber}
                  placeholder="Регистрийн дугаар"
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
              <label style={st.label}>Иргэний регистр (заавал биш)</label>
              <input
                style={st.input}
                value={individualReg}
                placeholder="АА12345678"
                onChange={(e) => setIndividualReg(e.target.value)}
              />
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
