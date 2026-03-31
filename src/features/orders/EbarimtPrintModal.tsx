import { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { toast } from 'react-hot-toast';
import { ordersApi } from '../../api';
import { createEbarimtRequest, getTinInfo } from '../../api/ebarimt';
import { Order } from '../../types';
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
  totalAmount?: number;
  totalVAT?: number;
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
  // 8-аас олон бараа байвал босоо A4, эс бол хэвтээ A5
  const useA4Portrait = orderItems.length > 8;
  const doc = new jsPDF(
    useA4Portrait
      ? { orientation: 'portrait', unit: 'mm', format: 'a4' }
      : { orientation: 'portrait', unit: 'mm', format: 'a4' }
  );

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
  let y = 10;

  const drawLine = (yy: number, w = 0.4) => {
    doc.setDrawColor(0);
    doc.setLineWidth(w);
    doc.line(L, yy, R, yy);
  };
  const bold = () => doc.setFont('Roboto', 'bold');
  const normal = () => doc.setFont('Roboto', 'normal');

  // Огноо
  normal();
  doc.setFontSize(8);
  doc.setTextColor(60, 100, 180);
  doc.text(String(data.date || '').slice(0, 10) || new Date().toISOString().slice(0, 10), L, y);
  doc.setTextColor(0);
  y += 5;

  // Гарчиг
  bold();
  doc.setFontSize(13);
  doc.text('ТӨЛБӨРИЙН БАРИМТ', W / 2, y, { align: 'center' });
  y += 2;
  drawLine(y, 0.8);
  y += 5;

  // Хоёр багана: Борлуулагч (зүүн) | Худалдан авагч (баруун)
  const midX = W / 2 + 5;
  bold();
  doc.setFontSize(8);
  doc.text('Борлуулагч', L, y);
  doc.text('Худалдан авагч', midX, y);
  y += 4;
  const rowH = 4.5,
    labelW = 20,
    labelWR = 13;
  // Зүүн тал: Борлуулагч мэдээлэл + баримтын мэдээлэл
  const sellerRows: [string, string, boolean][] = [
    ['Байгуулга:', COMPANY.name, false],
    ['Хаяг:', COMPANY.address, false],
    ['Утас:', COMPANY.phones, false],
    ['ДДТД:', data.id || '', true],
    ['ТТД:', COMPANY.tin, false],
    ['Төлбөр:', paymentLabel, false],
  ];
  // Баруун тал: Худалдан авагч
  const rightRows: [string, string][] = [['Нэр:', customerName || '—']];
  if (isB2B && data.customerTin) rightRows.push(['ТТД:', String(data.customerTin)]);
  const startY = y;
  sellerRows.forEach(([lbl, val, small], i) => {
    bold();
    doc.setFontSize(7);
    doc.text(lbl, L + 2, startY + i * rowH);
    normal();
    if (small) {
      doc.setFontSize(6);
      doc.text(val, L + 2 + labelW, startY + i * rowH);
    } else {
      doc.setFontSize(7);
      doc.text(val, L + 2 + labelW, startY + i * rowH);
    }
  });
  rightRows.forEach(([lbl, val], i) => {
    bold();
    doc.setFontSize(7);
    doc.text(lbl, midX, startY + i * rowH);
    normal();
    doc.setFontSize(7);
    doc.text(val, midX + labelWR, startY + i * rowH);
  });

  y = startY + sellerRows.length * rowH + 2;
  drawLine(y, 0.3);
  y += 3;

  // Хүснэгт
  const tableData = orderItems.map((item, i) => [
    String(i + 1),
    item.name,
    item.barCode,
    String(item.qty),
    item.unitPrice.toLocaleString(),
    (item.unitPrice * item.qty).toLocaleString(),
  ]);

  // A4 босоо үед баганы өргөн өөр байна
  const colWidths = useA4Portrait
    ? { name: 75, barcode: 40, qty: 18, price: 28, total: 28 }
    : { name: 60, barcode: 35, qty: 18, price: 28, total: 28 };

  autoTable(doc, {
    startY: y,
    head: [['№', 'Барааны нэр', 'Баркод', 'Тоо/Ширхэг', 'Нэгж үнэ', 'Нийт үнэ']],
    body: tableData,
    theme: 'grid',
    styles: { font: 'Roboto', fontStyle: 'normal', fontSize: 7 },
    headStyles: {
      fillColor: [220, 220, 220],
      textColor: 0,
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: colWidths.name },
      2: { halign: 'center', cellWidth: colWidths.barcode },
      3: { halign: 'center', cellWidth: colWidths.qty },
      4: { halign: 'right', cellWidth: colWidths.price },
      5: { halign: 'right', cellWidth: colWidths.total },
    },
    margin: { left: L, right: L },
  });

  y = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 4;

  // QR + Дүн
  const qrSize = 28,
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

  const lotteryX = qrX + qrSize + 4;
  if (data.lottery) {
    bold();
    doc.setFontSize(8);
    doc.text('Сугалаа:', lotteryX, y + 7);
    bold();
    doc.setFontSize(13);
    doc.text(String(data.lottery), lotteryX, y + 15);
    normal();
    doc.setFontSize(7);
    doc.text('Сугалаанд оролцоно уу!', lotteryX, y + 21);
  } else if (isB2B) {
    normal();
    doc.setFontSize(7.5);
    doc.text('Байгууллагын баримт', lotteryX, y + 11);
    doc.setFontSize(6.5);
    doc.text('(ААН-д сугалаа олгогдохгүй)', lotteryX, y + 17);
  } else {
    normal();
    doc.setFontSize(7.5);
    doc.text('E-Barimt бүртгэлгүй', lotteryX, y + 13);
  }
  normal();
  doc.setFontSize(6.5);
  doc.text('QR код уншуулж баримт шалгана уу', qrX + qrSize / 2, y + qrSize + 3, {
    align: 'center',
  });

  const total = Number(data.totalAmount) || 0;
  const vat = Number(data.totalVAT) || 0;
  const totalRows: [string, string][] = [
    ['Барааны нийт дүн:', total.toLocaleString()],
    ['НӨАТ (10%):', vat.toLocaleString()],
    ['Нийт үнэ:', total.toLocaleString()],
  ];
  totalRows.forEach(([lbl, val], i) => {
    const ty = y + 4 + i * 6;
    if (i === 2) bold();
    else normal();
    doc.setFontSize(8);
    doc.text(lbl, totalsX, ty);
    doc.text(val, R, ty, { align: 'right' });
  });

  // Гарын үсэг: дүнгийн яг доор
  const sigY = y + 4 + totalRows.length * 6 + 3;
  normal();
  doc.setFontSize(8);
  doc.text('Хүлээлгэн өгсөн:  ........................./.........................', W / 2, sigY, {
    align: 'center',
  });
  doc.text('Хүлээн авсан:  ........................./.........................', W / 2, sigY + 7, {
    align: 'center',
  });

  y += qrSize + 8;

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
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'BankTransfer' | 'Card'>('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentMap = { Cash: 'CASH', BankTransfer: 'BANK_TRANSFER', Card: 'PAYMENT_CARD' } as const;
  const paymentLabels = { Cash: 'Бэлэн', BankTransfer: 'Шилжүүлэг', Card: 'Карт' };

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

      const payload = await createEbarimtRequest({
        items: ebarimtItems,
        paymentType: paymentMap[paymentMethod],
        type: isB2B ? 'B2B_RECEIPT' : 'B2C_RECEIPT',
        consumerNo: !isB2B && individualReg ? individualReg : null,
        customerTin: resolvedTin,
        regNo: isB2B && activeRegNo ? Number(activeRegNo) : undefined,
      });

      const res = await fetch('http://localhost:7080/rest/receipt', {
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
        ebarimtId: data.date ?? '',
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
