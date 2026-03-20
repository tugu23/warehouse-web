import { useState, useEffect, useMemo } from 'react';
import { productsApi, customersApi, ordersApi } from '../../api';
import { Customer, type PaymentMethod as ApiPaymentMethod } from '../../types';
import { toast } from 'react-hot-toast';

// ── Types ──────────────────────────────────────────────────────────────────
interface ProductOption {
  id: number;
  name: string;
  price: number;
  stock: number;
  barCode: string;
  classificationCode: string;
}

interface OrderItem {
  productId: string;
  qty: number;
}

// ── Styles ─────────────────────────────────────────────────────────────────
const C = {
  bg: '#1a1d2e',
  bgCard: '#21253a',
  bgInput: '#252838',
  border: '#2e3350',
  borderFocus: '#4f6bcc',
  text: '#e2e8f0',
  textMuted: '#7c8db5',
  textDim: '#4a5580',
  blue: '#3b6bcc',
  blueHover: '#4f7fd6',
  green: '#16a34a',
  red: '#dc2626',
  yellow: '#d97706',
  success: '#22c55e',
};

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  modal: {
    background: C.bg,
    borderRadius: 14,
    width: '100%',
    maxWidth: 780,
    maxHeight: '92vh',
    overflowY: 'auto',
    boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
    color: C.text,
    border: `1px solid ${C.border}`,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 28px 16px',
    borderBottom: `1px solid ${C.border}`,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  badge: {
    background: '#1e3a8a',
    color: '#93c5fd',
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 20,
    fontWeight: 600,
  },
  title: { fontSize: 17, fontWeight: 700, color: C.text, margin: 0 },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: C.textMuted,
    cursor: 'pointer',
    fontSize: 22,
    padding: '2px 6px',
    borderRadius: 6,
    lineHeight: 1,
  },
  body: { padding: '20px 28px' },
  section: { marginBottom: 22 },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: C.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  divider: { height: 1, background: C.border, margin: '20px 0' },
  label: { display: 'block', fontSize: 12, color: C.textMuted, marginBottom: 5, fontWeight: 600 },
  input: {
    width: '100%',
    background: C.bgInput,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '9px 12px',
    color: C.text,
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  inputError: { border: `1px solid ${C.red}` },
  select: {
    width: '100%',
    background: C.bgInput,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '9px 12px',
    color: C.text,
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box' as const,
    cursor: 'pointer',
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  // Customer card
  customerCard: {
    background: C.bgCard,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '10px 14px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4px 16px',
    marginTop: 8,
  },
  customerField: { fontSize: 12, color: C.textMuted },
  customerValue: { fontSize: 12, color: C.text, fontWeight: 500 },
  // Product item
  itemRow: {
    background: C.bgCard,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: '12px 14px',
    marginBottom: 8,
  },
  itemRowWarning: { border: `1px solid ${C.yellow}` },
  itemRowDuplicate: { border: `1px solid ${C.red}` },
  itemGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 90px 100px 100px 36px',
    gap: 10,
    alignItems: 'center',
  },
  itemMeta: { display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' },
  tag: { fontSize: 11, padding: '2px 8px', borderRadius: 12, fontWeight: 600 },
  stockOk: { background: '#14532d', color: C.success },
  stockWarn: { background: '#451a03', color: '#fbbf24' },
  stockOut: { background: '#450a0a', color: '#f87171' },
  warn: { fontSize: 11, color: C.yellow },
  err: { fontSize: 11, color: C.red },
  addBtn: {
    background: 'none',
    border: `1px dashed ${C.textDim}`,
    color: C.textMuted,
    borderRadius: 8,
    padding: '9px 16px',
    cursor: 'pointer',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 4,
  },
  // Payment method toggle
  pmGroup: { display: 'flex', gap: 8, flexWrap: 'wrap' as const },
  // Order type toggle
  typeGroup: { display: 'flex', gap: 8 },
  // Footer / summary
  footer: { borderTop: `1px solid ${C.border}`, padding: '16px 28px 20px', background: C.bgCard },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryLabel: { fontSize: 13, color: C.textMuted },
  summaryValue: { fontSize: 13, color: C.text },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTop: `1px solid ${C.border}`,
  },
  totalLabel: { fontSize: 15, fontWeight: 700, color: C.text },
  totalValue: { fontSize: 22, fontWeight: 700, color: C.text },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 },
  cancelBtn: {
    background: 'none',
    border: `1px solid ${C.border}`,
    color: C.textMuted,
    cursor: 'pointer',
    fontSize: 13,
    padding: '10px 20px',
    borderRadius: 8,
  },
};

const pmBtn = (active: boolean): React.CSSProperties => ({
  background: active ? C.blue : C.bgInput,
  border: `1px solid ${active ? C.blue : C.border}`,
  color: active ? '#fff' : C.textMuted,
  borderRadius: 8,
  padding: '8px 16px',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: active ? 600 : 400,
  transition: 'all 0.15s',
});

const typeBtn = (active: boolean): React.CSSProperties => ({
  background: active ? '#1e3a8a' : C.bgInput,
  border: `1px solid ${active ? '#3b82f6' : C.border}`,
  color: active ? '#93c5fd' : C.textMuted,
  borderRadius: 8,
  padding: '7px 18px',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: active ? 600 : 400,
});

const submitBtn = (disabled: boolean): React.CSSProperties => ({
  background: disabled ? '#1e3050' : C.blue,
  border: 'none',
  color: disabled ? '#4a6090' : '#fff',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontSize: 14,
  fontWeight: 600,
  padding: '10px 28px',
  borderRadius: 8,
  transition: 'background 0.15s',
});

// ── Component ──────────────────────────────────────────────────────────────
interface Props {
  onClose?: () => void;
  onSuccess?: () => void;
}

const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Бэлэн' },
  { value: 'BankTransfer', label: 'Шилжүүлэг' },
  { value: 'Card', label: 'Карт' },
  { value: 'Credit', label: 'Зээл' },
] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value'];

export default function OrderForm2({ onClose, onSuccess }: Props) {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [orderType, setOrderType] = useState<'Store' | 'Market'>('Store');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [creditTermDays, setCreditTermDays] = useState(30);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([{ productId: '', qty: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    productsApi
      .getAll({ limit: 200 })
      .then((res) => {
        const raw = res.data?.data?.products ?? [];
        setProducts(
          raw.map((p) => ({
            id: p.id,
            name: p.nameMongolian,
            price: Number(p.priceRetail ?? p.priceWholesale ?? 0),
            stock: p.stockQuantity ?? 0,
            barCode: p.barcode ?? '',
            classificationCode: p.classificationCode ?? '',
          }))
        );
      })
      .catch(() => {})
      .finally(() => setProductsLoading(false));

    customersApi
      .getAll({ limit: 'all' })
      .then((res) => {
        setCustomers(res.data?.data?.customers ?? []);
      })
      .catch(() => {});
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedCustomer = customers.find((c) => c.id === Number(selectedCustomerId));

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.phoneNumber?.includes(q));
  }, [customers, customerSearch]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products;
    const q = productSearch.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.barCode.includes(q));
  }, [products, productSearch]);

  const getProduct = (id: string) => products.find((p) => p.id === Number(id));

  const isDuplicate = (idx: number) => {
    const item = orderItems[idx];
    if (!item) return false;
    const pid = item.productId;
    if (!pid) return false;
    return orderItems.some((oi, i) => i !== idx && oi.productId === pid);
  };

  const isOverStock = (idx: number) => {
    const oi = orderItems[idx];
    if (!oi) return false;
    const p = getProduct(oi.productId);
    return p ? oi.qty > p.stock : false;
  };

  const itemSubtotals = orderItems.map((oi) => {
    const p = getProduct(oi.productId);
    return p ? p.price * (oi.qty || 0) : 0;
  });
  const totalAmount = itemSubtotals.reduce((s, v) => s + v, 0);
  const vatAmount = Math.round(((totalAmount * 10) / 112) * 100) / 100;

  const validItemCount = orderItems.filter((oi) => oi.productId && oi.qty > 0).length;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const addItem = () => setOrderItems([...orderItems, { productId: '', qty: 1 }]);
  const removeItem = (i: number) => setOrderItems(orderItems.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: 'productId' | 'qty', val: string | number) => {
    const next = [...orderItems];
    const item = next[i];
    if (!item) return;
    if (field === 'productId') {
      item.productId = val as string;
      item.qty = 1;
    }
    if (field === 'qty') item.qty = Math.max(1, val as number);
    setOrderItems(next);
    setErrors((prev) => {
      const n = { ...prev };
      delete n[`item_${i}`];
      return n;
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selectedCustomerId) errs.customer = 'Харилцагч сонгоно уу';
    const validItems = orderItems.filter((oi) => oi.productId && oi.qty > 0);
    if (validItems.length === 0) errs.items = 'Дор хаяж нэг бараа сонгоно уу';
    orderItems.forEach((oi, i) => {
      if (oi.productId && isDuplicate(i)) errs[`item_${i}`] = 'Давтагдсан бараа';
      if (oi.productId && isOverStock(i)) errs[`item_${i}`] = 'Үлдэгдэл хүрэлцэхгүй';
    });
    if (paymentMethod === 'Credit' && (!creditTermDays || creditTermDays < 1))
      errs.credit = 'Зээлийн хугацаа оруулна уу';
    if (orderType === 'Market' && !deliveryDate) errs.delivery = 'Хүргэлтийн огноо сонгоно уу';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const validItems = orderItems.filter((oi) => oi.productId && oi.qty > 0);
    setIsSubmitting(true);
    try {
      const apiPaymentMethod: ApiPaymentMethod =
        paymentMethod === 'Card' ? 'BankTransfer' : paymentMethod;
      await ordersApi.create({
        customerId: Number(selectedCustomerId),
        paymentMethod: apiPaymentMethod,
        orderType,
        creditTermDays: paymentMethod === 'Credit' ? creditTermDays : undefined,
        deliveryDate: orderType === 'Market' && deliveryDate ? deliveryDate : undefined,
        items: validItems.map((oi) => ({ productId: Number(oi.productId), quantity: oi.qty })),
      });
      toast.success('Захиалга амжилттай үүслээ!');
      onSuccess?.();
      onClose?.();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Захиалга үүсгэхэд алдаа гарлаа');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            <h2 style={s.title}>Захиалга үүсгэх</h2>
            <span style={s.badge}>Шинэ</span>
          </div>
          <button style={s.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        <div style={s.body}>
          {/* ── Харилцагч ─────────────────────────────────── */}
          <div style={s.section}>
            <div style={s.sectionHeader}>
              <span style={s.sectionTitle}>Харилцагч</span>
            </div>
            <div style={s.grid2}>
              <div>
                <label style={s.label}>Хайлт</label>
                <input
                  style={s.input}
                  placeholder="Нэр, утасны дугаараар хайх..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>
              <div>
                <label style={s.label}>
                  Харилцагч сонгох{' '}
                  {errors.customer && <span style={{ color: C.red }}> — {errors.customer}</span>}
                </label>
                <select
                  style={{ ...s.select, ...(errors.customer ? s.inputError : {}) }}
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value ? Number(e.target.value) : '');
                    setErrors((p) => {
                      const n = { ...p };
                      delete n.customer;
                      return n;
                    });
                  }}
                >
                  <option value="">— Харилцагч сонгох —</option>
                  {filteredCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {selectedCustomer && (
              <div style={s.customerCard}>
                <span style={s.customerField}>Хаяг</span>
                <span style={s.customerValue}>{selectedCustomer.address || '—'}</span>
                <span style={s.customerField}>Дүүрэг</span>
                <span style={s.customerValue}>{selectedCustomer.district || '—'}</span>
                <span style={s.customerField}>Утас</span>
                <span style={s.customerValue}>{selectedCustomer.phoneNumber || '—'}</span>
                <span style={s.customerField}>Регистр</span>
                <span style={s.customerValue}>{selectedCustomer.registrationNumber || '—'}</span>
              </div>
            )}
          </div>

          <div style={s.divider} />

          {/* ── Захиалгын төрөл ────────────────────────────── */}
          <div style={{ ...s.section, marginBottom: 16 }}>
            <div style={s.grid2}>
              <div>
                <label style={s.label}>Захиалгын төрөл</label>
                <div style={s.typeGroup}>
                  {(['Store', 'Market'] as const).map((t) => (
                    <button
                      key={t}
                      style={typeBtn(orderType === t)}
                      onClick={() => setOrderType(t)}
                    >
                      {t === 'Store' ? '🏪 Дэлгүүр' : '🚚 Захын лангуу'}
                    </button>
                  ))}
                </div>
              </div>
              {orderType === 'Market' && (
                <div>
                  <label style={s.label}>
                    Хүргэлтийн огноо{' '}
                    {errors.delivery && <span style={{ color: C.red }}> — {errors.delivery}</span>}
                  </label>
                  <input
                    style={{ ...s.input, ...(errors.delivery ? s.inputError : {}) }}
                    type="date"
                    value={deliveryDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setDeliveryDate(e.target.value);
                      setErrors((p) => {
                        const n = { ...p };
                        delete n.delivery;
                        return n;
                      });
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div style={s.divider} />

          {/* ── Бараанууд ──────────────────────────────────── */}
          <div style={s.section}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <div style={s.sectionHeader}>
                <span style={s.sectionTitle}>Бараанууд</span>
                {validItemCount > 0 && (
                  <span style={{ ...s.tag, background: '#1e3a8a', color: '#93c5fd' }}>
                    {validItemCount} бараа
                  </span>
                )}
              </div>
              <div style={{ width: 200 }}>
                <input
                  style={{ ...s.input, fontSize: 12 }}
                  placeholder="Бараа хайх..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>
            </div>
            {errors.items && <div style={{ ...s.err, marginBottom: 8 }}>⚠ {errors.items}</div>}

            {/* Колонкийн гарчиг */}
            <div style={{ ...s.itemGrid, marginBottom: 4, padding: '0 14px' }}>
              {['Бараа', 'Тоо', 'Нэгж үнэ', 'Дүн', ''].map((h, i) => (
                <span key={i} style={{ fontSize: 11, color: C.textDim, fontWeight: 600 }}>
                  {h}
                </span>
              ))}
            </div>

            {orderItems.map((oi, idx) => {
              const prod = getProduct(oi.productId);
              const dup = isDuplicate(idx);
              const over = isOverStock(idx);
              const subtotal = itemSubtotals[idx] ?? 0;
              const stockStatus = prod
                ? prod.stock === 0
                  ? 'out'
                  : prod.stock < oi.qty
                    ? 'warn'
                    : 'ok'
                : null;
              return (
                <div
                  key={idx}
                  style={{
                    ...s.itemRow,
                    ...(dup ? s.itemRowDuplicate : over ? s.itemRowWarning : {}),
                  }}
                >
                  <div style={s.itemGrid}>
                    {/* Бараа */}
                    <select
                      style={{ ...s.select, fontSize: 13 }}
                      value={oi.productId}
                      onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                    >
                      <option value="">Бараа сонгох</option>
                      {productsLoading ? (
                        <option disabled>Ачааллаж байна...</option>
                      ) : (
                        filteredProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.stock === 0 ? '✕' : ''}
                          </option>
                        ))
                      )}
                    </select>

                    {/* Тоо */}
                    <input
                      style={{
                        ...s.input,
                        textAlign: 'center',
                        padding: '9px 6px',
                        ...(over ? { border: `1px solid ${C.yellow}` } : {}),
                      }}
                      type="number"
                      min={1}
                      value={oi.qty}
                      onChange={(e) => updateItem(idx, 'qty', Number(e.target.value))}
                    />

                    {/* Нэгж үнэ */}
                    <div
                      style={{
                        textAlign: 'right',
                        fontSize: 13,
                        color: C.textMuted,
                        paddingRight: 4,
                      }}
                    >
                      {prod ? `${prod.price.toLocaleString()}₮` : '—'}
                    </div>

                    {/* Дүн */}
                    <div
                      style={{ textAlign: 'right', fontSize: 14, fontWeight: 600, color: C.text }}
                    >
                      {subtotal > 0 ? `${subtotal.toLocaleString()}₮` : '—'}
                    </div>

                    {/* Устгах */}
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        color: C.textDim,
                        cursor: 'pointer',
                        fontSize: 18,
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onClick={() => removeItem(idx)}
                      title="Устгах"
                    >
                      ×
                    </button>
                  </div>

                  {/* Item meta */}
                  {prod && (
                    <div style={s.itemMeta}>
                      <span
                        style={{
                          ...s.tag,
                          ...(stockStatus === 'ok'
                            ? s.stockOk
                            : stockStatus === 'warn'
                              ? s.stockWarn
                              : s.stockOut),
                        }}
                      >
                        Үлдэгдэл: {prod.stock}
                      </span>
                      {dup && <span style={s.err}>⚠ Ижил бараа давхардсан байна</span>}
                      {!dup && over && (
                        <span style={s.warn}>⚠ Үлдэгдэл хүрэлцэхгүй ({prod.stock} байна)</span>
                      )}
                      {errors[`item_${idx}`] && !dup && !over && (
                        <span style={s.err}>⚠ {errors[`item_${idx}`]}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <button style={s.addBtn} onClick={addItem}>
              + Бараа нэмэх
            </button>
          </div>

          <div style={s.divider} />

          {/* ── Төлбөрийн мэдээлэл ────────────────────────── */}
          <div style={s.section}>
            <div style={{ ...s.sectionHeader, marginBottom: 12 }}>
              <span style={s.sectionTitle}>Төлбөрийн мэдээлэл</span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={s.label}>Төлбөрийн төрөл</label>
              <div style={s.pmGroup}>
                {PAYMENT_METHODS.map((pm) => (
                  <button
                    key={pm.value}
                    style={pmBtn(paymentMethod === pm.value)}
                    onClick={() => setPaymentMethod(pm.value)}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'Credit' && (
              <div style={{ width: 200 }}>
                <label style={s.label}>
                  Зээлийн хугацаа (хоног)
                  {errors.credit && <span style={{ color: C.red }}> — {errors.credit}</span>}
                </label>
                <input
                  style={{ ...s.input, ...(errors.credit ? s.inputError : {}) }}
                  type="number"
                  min={1}
                  max={365}
                  value={creditTermDays}
                  onChange={(e) => {
                    setCreditTermDays(Number(e.target.value));
                    setErrors((p) => {
                      const n = { ...p };
                      delete n.credit;
                      return n;
                    });
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Footer: Нийт дүн + товчнууд ───────────────────── */}
        <div style={s.footer}>
          <div style={{ marginBottom: 14 }}>
            {validItemCount > 0 && (
              <>
                <div style={s.summaryRow}>
                  <span style={s.summaryLabel}>Барааны тоо</span>
                  <span style={s.summaryValue}>
                    {validItemCount} нэр (
                    {orderItems.filter((o) => o.productId).reduce((s, o) => s + o.qty, 0)} ширхэг)
                  </span>
                </div>
                <div style={s.summaryRow}>
                  <span style={s.summaryLabel}>НӨАТ (10%)</span>
                  <span style={s.summaryValue}>{vatAmount.toLocaleString()}₮</span>
                </div>
              </>
            )}
            <div style={s.totalRow}>
              <span style={s.totalLabel}>Нийт дүн</span>
              <span style={s.totalValue}>{totalAmount.toLocaleString()}₮</span>
            </div>
          </div>
          <div style={s.actions}>
            <button style={s.cancelBtn} onClick={onClose}>
              Болих
            </button>
            <button
              style={submitBtn(isSubmitting || validItemCount === 0)}
              onClick={handleSubmit}
              disabled={isSubmitting || validItemCount === 0}
            >
              {isSubmitting ? 'Хадгалж байна...' : '✓  Захиалга үүсгэх'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
