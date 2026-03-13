import { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import { RobotoRegular } from "../../fonts/Roboto-Regular";
import { RobotoBold } from "../../fonts/Roboto-Bold";


// ── Types ──
interface Product {
  id: number;
  name: string;
  nameEn: string;
  price: number;
  stock: number;
  unitsPerBox?: number;
  barCode: string;
  classificationCode: string;
}

interface OrderItem {
  productId: string;
  qty: number;
}

interface RegResult {
  name: string;
  tin: string;
  vatPayer?: boolean;
}

interface EbarimtResult {
  success: boolean;
  billId?: string;
  lottery?: string;
  qrData?: string;
  date?: string;
  error?: string;
}

interface EbarimtItem {
  name: string;
  barCode: string;
  classificationCode: string;
  unitPrice: number;
  qty: number;
}

interface EbarimtRequestOptions {
  items: EbarimtItem[];
  paymentType?: "CASH" | "BANK_TRANSFER" | "PAYMENT_CARD";
  type?: "B2C_RECEIPT" | "B2B_RECEIPT";
  consumerNo?: string | null;
  customerTin?: string | null;
  regNo?: string;
}

// ── Embedded createEbarimtRequest logic ──
async function getTinInfo(regNo: string) {
  const response = await fetch(`https://api.ebarimt.mn/api/info/check/getTinInfo?regNo=${regNo}`);
  if (!response.ok) throw new Error("MerchantTin авахад алдаа гарлаа");
  const tinData = await response.json();
  const tinNumber = tinData?.data ?? null;
  if (!tinNumber) throw new Error("Ийм регистрийн дугаартай байгууллага олдсонгүй");
  const resName = await fetch(`https://api.ebarimt.mn/api/info/check/getInfo?tin=${tinNumber}`);
  if (!resName.ok) throw new Error("Байгууллагын нэр авахад алдаа гарлаа");
  const nameData = await resName.json();
  const tinName = nameData?.data?.name ?? "";
  if (!tinName) throw new Error("Ийм нэртэй байгууллага олдсонгүй");
  return { tinNumber, tinName };
}

async function createEbarimtRequest({
    items,
    paymentType = "CASH",
    type = "B2C_RECEIPT",
    consumerNo = null,
    customerTin = null,
    regNo,
  }: EbarimtRequestOptions) {
    const merchantTin = "37900846788";
  
    let finalCustomerTin = customerTin;
    if (regNo) {
      const tinInfo = await getTinInfo(regNo);
     
      finalCustomerTin = tinInfo.tinNumber;
    
    }
    

  if (type === "B2B_RECEIPT" && !finalCustomerTin) throw new Error("B2B_RECEIPT үед customerTin заавал хэрэгтэй");

  const calculatedItems = items.map((item) => {
    const qty = item.qty || 1;
    const basePrice = +(item.unitPrice / 1.12).toFixed(2);
    const itemTotalVAT = +(basePrice * 0.1 * qty).toFixed(2);
    const itemTotalCityTax = +(basePrice * 0.02 * qty).toFixed(2);
    const itemTotalAmount = +(item.unitPrice * qty).toFixed(2);
    return {
      name: item.name,
      barCode: item.barCode,
      barCodeType: "GS1",
      classificationCode: item.classificationCode ?? "2399421",
      taxProductCode: null,
      measureUnit: "ш",
      qty,
      unitPrice: basePrice,
      totalVAT: itemTotalVAT,
      totalCityTax: itemTotalCityTax,
      totalAmount: itemTotalAmount,
    };
  });

  const totalAmount = calculatedItems.reduce((s, i) => s + i.totalAmount, 0);
  const totalVAT = calculatedItems.reduce((s, i) => s + i.totalVAT, 0);
  const totalCityTax = calculatedItems.reduce((s, i) => s + i.totalCityTax, 0);

  return {
    branchNo: "001",
    totalAmount,
    totalVAT,
    totalCityTax,
    districtCode: "2506",
    merchantTin,
    posNo: "001",
    customerTin: type === "B2B_RECEIPT" ? finalCustomerTin : null,
    consumerNo: type === "B2C_RECEIPT" ? consumerNo : null,
    type,
    inactiveId: null,
    reportMonth: null,
    billIdSuffix: "01",
    receipts: [
      {
        totalAmount,
        taxType: "VAT_ABLE",
        merchantTin,
        customerTin: type === "B2B_RECEIPT" ? finalCustomerTin : null,
        totalVAT,
        totalCityTax,
        invoiceId: null,
        bankAccountNo: "",
        iBan: "",
        items: calculatedItems,
      },
    ],
    payments: [
      {
        code: paymentType,
        status: "PAID",
        paidAmount: totalAmount,
      },
    ],
  };
}

// ── Fake products ──
const FAKE_PRODUCTS: Product[] = [
  { id: 1, name: "Baby Topokki mild spicy 230g", nameEn: "Baby Topokki mild spicy 230g", price: 7990, stock: 224, unitsPerBox: 15, barCode: "8801301345652", classificationCode: "2399591" },
  { id: 2, name: "Shin Ramyun 120g", nameEn: "Shin Ramyun 120g", price: 3500, stock: 480, unitsPerBox: 40, barCode: "8801043012345", classificationCode: "2399422" },
  { id: 3, name: "Orion Choco Pie 360g", nameEn: "Orion Choco Pie 360g", price: 12500, stock: 96, unitsPerBox: 12, barCode: "8801111987654", classificationCode: "2399423" },
  { id: 4, name: "Lotte Pepero Original 32g", nameEn: "Lotte Pepero Original 32g", price: 2200, stock: 600, unitsPerBox: 24, barCode: "8801062123456", classificationCode: "2399424" },
  { id: 5, name: "Samyang 2x Spicy 140g", nameEn: "Samyang 2x Spicy 140g", price: 4800, stock: 312, unitsPerBox: 20, barCode: "8801073234567", classificationCode: "2399425" },
 
];

// ── Styles ──
const styles: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, fontFamily: "'Segoe UI', sans-serif" },
  modal: { background: "#1e2130", borderRadius: 12, width: "100%", maxWidth: 740, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.5)", color: "#e2e8f0" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 16px", borderBottom: "1px solid #2d3348" },
  title: { fontSize: 18, fontWeight: 600, color: "#f1f5f9", margin: 0 },
  closeBtn: { background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20, padding: 4, borderRadius: 6, display: "flex", alignItems: "center" },
  body: { padding: "20px 24px" },
  label: { display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 6, fontWeight: 500 },
  input: { width: "100%", background: "#252838", border: "1px solid #3d4460", borderRadius: 8, padding: "10px 12px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" },
  select: { width: "100%", background: "#252838", border: "1px solid #3d4460", borderRadius: 8, padding: "10px 12px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", cursor: "pointer" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: "#f1f5f9", marginBottom: 12, marginTop: 4 },
  divider: { borderColor: "#2d3348", margin: "16px 0" },
  itemCard: { background: "#252838", border: "1px solid #3d4460", borderRadius: 8, padding: "12px 14px", marginBottom: 10 },
  addBtn: { background: "none", border: "1px dashed #4b5580", color: "#94a3b8", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6 },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid #2d3348", marginTop: 8 },
  totals: { textAlign: "right" },
  totalLabel: { fontSize: 13, color: "#94a3b8" },
  totalAmount: { fontSize: 20, fontWeight: 700, color: "#f1f5f9" },
  cancelBtn: { background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14, padding: "10px 16px", borderRadius: 8 },
  submitBtn: { background: "#3b6bcc", border: "none", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, padding: "10px 24px", borderRadius: 8 },
  submitBtnDisabled: { background: "#2d3a5c", color: "#6b7db3", cursor: "not-allowed" },
  radioGroup: { display: "flex", gap: 20, marginBottom: 16 },
  radioLabel: { display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14, color: "#cbd5e1" },
  helperText: { fontSize: 11, color: "#64748b", marginTop: 4 },
  errorText: { fontSize: 11, color: "#f87171", marginTop: 4 },
  successCard: { background: "#1a2e1a", border: "1px solid #22c55e", borderRadius: 8, padding: "10px 14px", marginTop: 8 },
  resultOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  resultCard: { background: "#1e2130", borderRadius: 12, padding: 32, maxWidth: 420, width: "90%", textAlign: "center" },
  checkCircle: { width: 64, height: 64, background: "#166534", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 },
  errorCircle: { width: 64, height: 64, background: "#7f1d1d", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 },
};

// ── Component ──
export default function EbarimtDemoForm() {
  const [customerKind, setCustomerKind] = useState<"organization" | "individual">("organization");
  const [regNumber, setRegNumber] = useState<string>("");
  const [regResult, setRegResult] = useState<RegResult | null>(null);
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [regError, setRegError] = useState<string>("");
  const [individualReg, setIndividualReg] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "BankTransfer" | "Card">("Cash");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([{ productId: "", qty: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<EbarimtResult | null>(null);

  const paymentMap: Record<"Cash" | "BankTransfer" | "Card", "CASH" | "BANK_TRANSFER" | "PAYMENT_CARD"> = {
    Cash: "CASH",
    BankTransfer: "BANK_TRANSFER",
    Card: "PAYMENT_CARD",
  };

  const addItem = () => setOrderItems([...orderItems, { productId: "", qty: 1 }]);
  const removeItem = (i: number) => setOrderItems(orderItems.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: "productId" | "qty", val: string | number) => {
    const next = [...orderItems];
    const item = next[i];
    if (!item) return; // Хэрвээ item байхгүй бол зүгээр л буцах
  
    if (field === "productId") item.productId = val as string;
    if (field === "qty") item.qty = val as number;
  
    setOrderItems(next);
  };

  const getProduct = (id: string): Product | undefined => FAKE_PRODUCTS.find((p) => p.id === Number(id));
  const totalAmount = orderItems.reduce((sum, oi) => {
    const p = getProduct(oi.productId);
    return sum + (p ? p.price * (oi.qty || 1) : 0);
  }, 0);

  // ── Handlers ──
  const handleRegLookup = async () => {
    const trimmed = regNumber.trim();
    if (!trimmed) { setRegError("Регистрийн дугаар оруулна уу"); return; }
    setIsLookingUp(true); setRegError(""); setRegResult(null);
    try {
      const tinRes = await fetch(`https://api.ebarimt.mn/api/info/check/getTinInfo?regNo=${trimmed}`);
      const tinData = await tinRes.json();
      if (!tinData || tinData.status !== 200) { setRegError("TIN олдсонгүй"); return; }
      const tin = tinData.data;
      const infoRes = await fetch(`https://api.ebarimt.mn/api/info/check/getInfo?tin=${tin}`);
      const infoData = await infoRes.json();
      if (!infoData || infoData.status !== 200) { setRegError("Байгууллагын мэдээлэл олдсонгүй"); return; }
      setRegResult({ name: infoData.data.name, tin, vatPayer: infoData.data.vatpayer ?? false });
    } catch (e) { setRegError("Хайлт амжилтгүй. Дахин оролдоно уу."); }
    finally { setIsLookingUp(false); }
  };

  const handleSubmit = async () => {
    const validItems = orderItems.filter((oi) => oi.productId && oi.qty > 0);
    if (validItems.length === 0) { alert("Бараа сонгоно уу"); return; }

    setIsSubmitting(true);
    try {
      const ebarimtItems: EbarimtItem[] = validItems.map((oi) => {
        const p = getProduct(oi.productId)!;
        return { name: p.name, barCode: p.barCode, classificationCode: p.classificationCode, unitPrice: p.price, qty: oi.qty };
      });

      const isB2B = customerKind === "organization";
      const payload = await createEbarimtRequest({
        items: ebarimtItems,
        paymentType: paymentMap[paymentMethod],
        type: isB2B ? "B2B_RECEIPT" : "B2C_RECEIPT",
        consumerNo: !isB2B && individualReg ? individualReg : null,
        customerTin: null,
        regNo: isB2B && regNumber ? regNumber.trim() : undefined, 
      });

      if (isB2B && regResult?.tin && payload.receipts?.length) {
        // RegResult.tin-г string болгож дамжуулна
        const tinString = String(regResult.tin); 
        payload.customerTin = tinString;
        if (payload.receipts[0]) {
          payload.receipts[0].customerTin = tinString;
        }
      }

      const res = await fetch("http://localhost:7080/rest/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
console.log("data:",data)
      // handleSubmit доторх өөрчлөлт
if (data?.id) {
    const resultData = { 
        success: true, 
        billId: data.id, 
        lottery: data.lottery, 
        qrData: data.qrData, 
        date: data.date,
        totalAmount: data.totalAmount,
        totalVAT: data.totalVAT,
        totalCityTax: data.totalCityTax,
        districtCode: data.districtCode
    };
    setResult(resultData);
    
    // PDF үүсгэх функцийг энд дуудна
    await generatePDF(data, orderItems); 

} else {
    setResult({ success: false, error: data?.message || "Тодорхойгүй алдаа" });
}
      if (data?.id) {
        setResult({ success: true, billId: data.id, lottery: data.lottery, qrData: data.qrData, date: data.date });
      } else {
        setResult({ success: false, error: data?.message || "Тодорхойгүй алдаа" });
      }
    } catch (e: any) {
      setResult({ success: false, error: e.message });
    } finally { setIsSubmitting(false); }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Захиалга</h2>
          <button style={styles.closeBtn} onClick={() => console.log("close")}>×</button>
        </div>
        <div style={styles.body}>
          <div style={styles.sectionTitle}>Хэрэглэгчийн төрөл</div>
          <div style={styles.radioGroup}>
            <label style={styles.radioLabel}>
              <input type="radio" checked={customerKind === "organization"} onChange={() => setCustomerKind("organization")} />
              Байгууллага
            </label>
            <label style={styles.radioLabel}>
              <input type="radio" checked={customerKind === "individual"} onChange={() => setCustomerKind("individual")} />
              Иргэн
            </label>
          </div>

          {customerKind === "organization" ? (
            <div>
              <label style={styles.label}>Регистрийн дугаар</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input style={styles.input} value={regNumber} onChange={(e) => setRegNumber(e.target.value)} />
                <button style={styles.submitBtn} onClick={handleRegLookup} disabled={isLookingUp}>{isLookingUp ? "Хайж байна..." : "Хайх"}</button>
              </div>
              {regError && <div style={styles.errorText}>{regError}</div>}
              {regResult && <div style={styles.successCard}>Нэр: {regResult.name}, TIN: {regResult.tin}</div>}
            </div>
          ) : (
            <div>
              <label style={styles.label}>Иргэний регистр</label>
              <input style={styles.input} value={individualReg} onChange={(e) => setIndividualReg(e.target.value)} />
            </div>
          )}

          <div style={styles.sectionTitle}>Бараанууд</div>
          {orderItems.map((oi, idx) => (
            <div key={idx} style={styles.itemCard}>
              <div style={styles.row2}>
                <select style={styles.select} value={oi.productId} onChange={(e) => updateItem(idx, "productId", e.target.value)}>
                  <option value="">Бараа сонгох</option>
                  {FAKE_PRODUCTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input style={styles.input} type="number" min={1} value={oi.qty} onChange={(e) => updateItem(idx, "qty", Number(e.target.value))} />
              </div>
              {orderItems.length > 1 && <button style={styles.cancelBtn} onClick={() => removeItem(idx)}>Устгах</button>}
            </div>
          ))}
          <button style={styles.addBtn} onClick={addItem}>+ Бараа нэмэх</button>

          <div style={styles.sectionTitle}>Төлбөрийн төрөл</div>
          <select style={styles.select} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}>
            <option value="Cash">Бэлнээр</option>
            <option value="BankTransfer">Дансанд шилжүүлэх</option>
            <option value="Card">Карт</option>
          </select>

          <div style={styles.footer}>
            <div style={styles.totals}>
              <div style={styles.totalLabel}>Нийт дүн</div>
              <div style={styles.totalAmount}>{totalAmount.toLocaleString()}₮</div>
            </div>
            <button style={{ ...styles.submitBtn, ...(isSubmitting ? styles.submitBtnDisabled : {}) }} onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Илгээж байна..." : "Илгээх"}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div style={styles.resultOverlay} onClick={() => setResult(null)}>
          <div style={styles.resultCard}>
            {result.success ? (
              <div>
                <div style={styles.checkCircle}>✓</div>
                <div>Билл амжилттай үүслээ</div>
                <div>Bill ID: {result.billId}</div>
                <div>Lottery: {result.lottery}</div>
              </div>
            ) : (
              <div>
                <div style={styles.errorCircle}>✕</div>
                <div>Алдаа гарлаа</div>
                <div>{result.error}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
const generatePDF = async (data: any, orderItems: any[]) => {
  // Create A4 PDF
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Standard fonts for English
  const boldFont = "helvetica";
  const regularFont = "helvetica";

  const width = doc.internal.pageSize.getWidth();
  let y = 15;

  // Helper function: Draw horizontal line
  const drawLine = (yPos: number, thickness = 0.5) => {
    doc.setDrawColor(0);
    doc.setLineWidth(thickness);
    doc.line(10, yPos, width - 10, yPos);
  };

  // 1. Date (Top Left)
  doc.setFont(regularFont, "normal");
  doc.setFontSize(10);
  doc.text(`Date: ${data.date || new Date().toISOString().split('T')[0]}`, 10, y);
  y += 7;

  // 2. Title
  doc.setFontSize(16);
  doc.setFont(boldFont, "bold");
  doc.text("SALES RECEIPT", width / 2, y, { align: "center" });
  y += 5;
  drawLine(y, 0.6);
  y += 10;

  // 3. Document Info & Customer (Two Columns)
  doc.setFontSize(10);
  doc.setFont(boldFont, "bold");
  doc.text("Receipt Information", 10, y);
  doc.text("Customer Details", width / 2 + 10, y);
  y += 5;

  doc.setFont(regularFont, "normal");
  doc.setFontSize(9);
  // Left Column
  const leftX = 10;
  doc.text(`Receipt No:   ${data.id || 'ORD171773235047455'}`, leftX, y);
  doc.text(`Payment:      Cash`, leftX, y + 10);

  // Right Column
  const rightX = width / 2 + 10;
  doc.text(`Name:  Person`, rightX, y);
  y += 20;

  // 4. Seller Section
  doc.setFont(boldFont, "bold");
  doc.setFontSize(10);
  doc.text("Seller Information", 10, y);
  y += 5;
  doc.setFont(regularFont, "normal");
  doc.setFontSize(9);
  doc.text("Company: GLF LLC OASIS Wholesale Center", 10, y);
  doc.text("Address: 27-49, 6th Khoroo, Sukhbaatar District, Ulaanbaatar, MN", 10, y + 5);
  doc.text("Phone:   70121128, 88048350, 89741277", 10, y + 10);
  doc.text("Staff:   System Administrator", 10, y + 15);

  y += 25;
  drawLine(y, 0.4);
  y += 7;

  // 5. Table Header
  doc.setFont(boldFont, "bold");
  doc.text("No", 10, y);
  doc.text("Item Description", 20, y);
  doc.text("Barcode", 75, y);
  doc.text("Qty", 115, y, { align: "center" });
  doc.text("Unit Price", 145, y, { align: "right" });
  doc.text("Total Amount", 185, y, { align: "right" });

  y += 3;
  doc.setLineWidth(0.2);
  doc.line(10, y, width - 10, y);
  y += 7;

  // 6. Items List
  doc.setFont(regularFont, "normal");
  orderItems.forEach((item, index) => {
    const product = FAKE_PRODUCTS.find(p => p.id === Number(item.productId));
    if (product) {
      doc.text(`${index + 1}`, 10, y);
      doc.text(`${product.name}`, 20, y);
      doc.text(`${product.barCode}`, 75, y);
      doc.text(`${item.qty}`, 115, y, { align: "center" });
      doc.text(`${product.price.toLocaleString()}`, 145, y, { align: "right" });
      doc.text(`${(product.price * item.qty).toLocaleString()}`, 185, y, { align: "right" });
      y += 8;
    }
  });

  y += 2;
  drawLine(y, 0.2);
  y += 10;

  // 7. QR Code & Totals
  if (data.qrData) {
    const qrDataUrl = await QRCode.toDataURL(data.qrData);
    doc.addImage(qrDataUrl, 'PNG', 10, y, 35, 35);
    doc.setFontSize(8);
    doc.text("Scan QR to", 12, y + 40);
    doc.text("verify receipt", 12, y + 44);

    const infoX = 50;
    if (data.lotteryNumber || data.lottery) {
      doc.setFontSize(10);
      doc.setFont(boldFont, "bold");
      doc.text("Lottery No:", infoX, y + 12);
      doc.setFontSize(14);
      doc.text(`${data.lotteryNumber || data.lottery}`, infoX, y + 20);
      doc.setFontSize(8);
      doc.setFont(regularFont, "normal");
      doc.text("Keep this receipt for lottery", infoX, y + 26);
    } else {
      doc.setFontSize(10);
      doc.setFont(boldFont, "bold");
      doc.text("E-Barimt: No lottery", infoX, y + 15);
    }
  }

  // Totals Section
  const totalX = 140;
  doc.setFontSize(10);
  doc.setFont(regularFont, "normal");
  doc.text("Subtotal:", totalX, y);
  doc.text(`${data.totalAmount.toLocaleString()}`, 185, y, { align: "right" });

  y += 7;
  doc.text("VAT (10%):", totalX, y);
  doc.text(`${data.totalVAT.toLocaleString()}`, 185, y, { align: "right" });

  y += 7;
  doc.setFont(boldFont, "bold");
  doc.text("GRAND TOTAL:", totalX, y);
  doc.text(`${(data.totalAmount + data.totalVAT).toLocaleString()}`, 185, y, { align: "right" });

  y += 35;

  // 8. Signatures
  doc.setFont(regularFont, "normal");
  doc.setFontSize(9);
  doc.text("Issued by: .........................../...........................", width / 2, y, { align: "center" });
  y += 10;
  doc.text("Received by: .........................../...........................", width / 2, y, { align: "center" });

  y += 20;
  doc.setFont(boldFont, "bold");
  doc.text("Thank you for your business!", width / 2, y, { align: "center" });

  // --- PRINT IN NEW TAB LOGIC START ---
  // PDF-ийг Blob URL болгож хөрвүүлнэ
  const string = doc.output('bloburl');
  
  // Шинэ таб нээнэ
  const pdfWindow = window.open(string);
  
  // Хэрэв таб амжилттай нээгдсэн бол хэвлэх командыг өгнө
  if (pdfWindow) {
    pdfWindow.onload = () => {
      pdfWindow.print();
    };
  } else {
    // Хэрэв Popup blocker нээхийг зөвшөөрөхгүй бол шууд татах сонголтыг үлдээнэ
    doc.save(`receipt_${data.id || 'order'}.pdf`);
    alert("Please allow popups to print automatically.");
  }
  // --- PRINT IN NEW TAB LOGIC END ---
};