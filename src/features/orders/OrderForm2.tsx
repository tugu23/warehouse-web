import { useState, useEffect, useMemo, useRef } from 'react';
import { productsApi, customersApi, customerTypesApi, ordersApi } from '../../api';
import {
  Customer,
  Order,
  ProductPrice,
  type PaymentMethod as ApiPaymentMethod,
  type Promotion,
} from '../../types';
import { toast } from 'react-hot-toast';

// ── Types ──────────────────────────────────────────────────────────────────
/** Харилцагчийн төрөл тус бүрийн үнэ (product_prices) */
interface ProductTypePriceRow {
  customerTypeId: number;
  price: number;
  typeName?: string;
}

interface ProductOption {
  id: number;
  name: string;
  isActive: boolean;
  productCode: string;
  categoryName: string;
  /** Төрлийн тусгай үнэ байхгүй үед */
  defaultPrice: number;
  stock: number;
  barCode: string;
  classificationCode: string;
  /** Нэг хайрцагт хэдэн ширхэг — backend `unitsPerBox` */
  unitsPerBox?: number | null;
  /** Хайрцагны үнэ (байвал хайрцагаар захиалахад ашиглана) */
  pricePerBox?: number | null;
  typePrices: ProductTypePriceRow[];
  /** Энэ бараанд одоо идэвхтэй урамшууллууд */
  promotions: Promotion[];
}

type PriceMode = 'customerType' | 'defaultPrice' | 'retail' | 'wholesale' | 'custom';

interface OrderItem {
  productId: string;
  productInput?: string;
  productQuery?: string;
  /** Нэмэлт ширхэг (хайрцагнаас тусад нь) */
  qtyPieces: number;
  /** Хайрцагийн тоо */
  qtyBoxes: number;
  priceMode: PriceMode;
  priceModeInput?: string;
  customUnitPrice?: number;
  /** Сонгосон урамшууллын ID (байхгүй үед урамшуулалгүй) */
  promotionId?: number;
}

interface SearchSelectOption<T extends string | number> {
  value: T;
  label: string;
  description?: string;
  meta?: string;
  searchText?: string;
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
    width: 'min(90vw, 1120px)',
    maxWidth: '90vw',
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
    gridTemplateColumns: 'minmax(0, 2fr) 152px 170px 100px 36px',
    gap: 10,
    alignItems: 'start',
  },
  qtyStack: { display: 'flex', flexDirection: 'column' as const, gap: 6 },
  qtyFieldLabel: { fontSize: 10, color: C.textDim, marginBottom: 2 },
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

function SearchSelect<T extends string | number>({
  value,
  valueLabel,
  placeholder,
  searchPlaceholder,
  options,
  onSelect,
  emptyText = 'Сонголт олдсонгүй',
}: {
  value?: T | '';
  valueLabel?: string;
  placeholder: string;
  searchPlaceholder?: string;
  options: Array<SearchSelectOption<T>>;
  onSelect: (option: SearchSelectOption<T>) => void;
  emptyText?: string;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedOption = useMemo(
    () => options.find((option) => String(option.value) === String(value)),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => {
      const haystack =
        option.searchText ||
        [option.label, option.description, option.meta].filter(Boolean).join(' ');
      return haystack.toLowerCase().includes(normalized);
    });
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const timer = window.setTimeout(() => {
      searchRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const triggerLabel = valueLabel || selectedOption?.label || '';

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        style={{
          ...s.input,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: C.bgInput,
          cursor: 'pointer',
          textAlign: 'left',
        }}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span
          style={{
            color: triggerLabel ? C.text : C.textDim,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {triggerLabel || placeholder}
        </span>
        <span style={{ color: C.textMuted, marginLeft: 10 }}>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 80,
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            boxShadow: '0 18px 48px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: 10, borderBottom: `1px solid ${C.border}` }}>
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder || placeholder}
              style={{ ...s.input, fontSize: 12, padding: '8px 10px' }}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px 14px', fontSize: 12, color: C.textDim }}>
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = String(option.value) === String(value);
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '10px 14px',
                      background: isSelected ? '#25365f' : 'transparent',
                      border: 'none',
                      borderBottom: `1px solid ${C.border}`,
                      color: C.text,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onClick={() => {
                      onSelect(option);
                      setOpen(false);
                      setQuery('');
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{option.label}</div>
                      {option.description ? (
                        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                          {option.description}
                        </div>
                      ) : null}
                    </div>
                    {option.meta ? (
                      <div style={{ fontSize: 11, color: C.textDim, whiteSpace: 'nowrap' }}>
                        {option.meta}
                      </div>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
  onSuccess?: (createdOrder?: Order) => void;
  initialOrder?: Order | null;
}

const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Бэлэн' },
  { value: 'BankTransfer', label: 'Шилжүүлэг' },
  { value: 'Card', label: 'Карт' },
  { value: 'Credit', label: 'Зээл' },
] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value'];

/** Төрөл nested эсвэл зөвхөн customerTypeId-аар тодорхой эсэх */
function customerRowHasType(c: Customer): boolean {
  if (c.customerType?.typeName || c.customerType?.name) return true;
  return c.customerTypeId != null && c.customerTypeId > 0;
}

/** Ижил нэр/утастай олон мөр байвал төрөлтэй, дараа нь бага id-г сонгоно */
function pickCustomerMatchingInput(value: string, list: Customer[]): Customer | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const vLower = trimmed.toLowerCase();

  const pickBest = (cands: Customer[]): Customer | undefined => {
    if (cands.length === 0) return undefined;
    return [...cands].sort((a, b) => {
      const ha = customerRowHasType(a) ? 0 : 1;
      const hb = customerRowHasType(b) ? 0 : 1;
      if (ha !== hb) return ha - hb;
      return a.id - b.id;
    })[0];
  };

  const byName = list.filter((c) => c.name.toLowerCase() === vLower);
  const fromName = pickBest(byName);
  if (fromName) return fromName;

  const byPhone = list.filter((c) => c.phoneNumber === trimmed);
  const fromPhone = pickBest(byPhone);
  if (fromPhone) return fromPhone;

  const byPartialName = list.filter((c) => c.name.toLowerCase().includes(vLower));
  return pickBest(byPartialName);
}

function resolveCustomerTypeId(c: Customer | undefined): number | undefined {
  if (!c) return undefined;
  const nested = c.customerType?.id;
  if (nested != null && nested > 0) return nested;
  if (c.customerTypeId != null && c.customerTypeId > 0) return c.customerTypeId;
  return undefined;
}

/**
 * Зарим орчин/прокси Prisma-ийн @map талбаруудыг snake_case-аар буцааж болно.
 * Nested `customerType` дутуу ч `customer_type_id` байж болно.
 */
function parseCustomerFromApi(row: Customer & Record<string, unknown>): Customer {
  const snakeTid = row.customer_type_id;
  const tidFromSnake =
    typeof snakeTid === 'number'
      ? snakeTid
      : snakeTid != null && snakeTid !== ''
        ? Number(snakeTid)
        : undefined;
  const mergedTid =
    row.customerTypeId != null && row.customerTypeId !== undefined
      ? Number(row.customerTypeId)
      : tidFromSnake !== undefined && Number.isFinite(tidFromSnake)
        ? tidFromSnake
        : row.customerTypeId;

  const snakeCt = row.customer_type as
    | { id?: number; type_name?: string; typeName?: string }
    | null
    | undefined;
  let customerType = row.customerType ?? null;
  if (!customerType && snakeCt) {
    customerType = {
      id: Number(snakeCt.id ?? mergedTid ?? 0),
      typeName: String(snakeCt.typeName ?? snakeCt.type_name ?? ''),
    };
  }

  return {
    ...row,
    id: Number(row.id),
    customerTypeId: mergedTid ?? row.customerTypeId ?? null,
    customerType,
  };
}

/** Жагсаалтад nested төрөл байхгүй бол төрлийн нэршлийн map-аас холбоно (нэмэлт HTTPгүй) */
function enrichCustomerWithTypeMap(c: Customer, typeNames: Record<number, string>): Customer {
  if (c.customerType?.typeName || c.customerType?.name) return c;
  const tid = resolveCustomerTypeId(c);
  if (tid == null) return c;
  const label = typeNames[tid];
  if (!label) return c;
  return { ...c, customerType: { id: tid, typeName: label } };
}

export default function OrderForm2({ onClose, onSuccess, initialOrder }: Props) {
  const isEditMode = Boolean(initialOrder);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerInput, setCustomerInput] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [creditTermDays, setCreditTermDays] = useState(30);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    {
      productId: '',
      productInput: '',
      productQuery: '',
      qtyPieces: 1,
      qtyBoxes: 0,
      priceMode: 'defaultPrice',
      priceModeInput: 'Үндсэн үнэ',
      customUnitPrice: undefined,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customerTypeNameById, setCustomerTypeNameById] = useState<Record<number, string>>({});

  useEffect(() => {
    customerTypesApi
      .getAll()
      .then((res) => {
        const rows = res.data.data?.customerTypes ?? [];
        const rec: Record<number, string> = {};
        for (const ct of rows) rec[ct.id] = ct.typeName;
        setCustomerTypeNameById(rec);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    productsApi
      .getAll({ limit: 'all' })
      .then((res) => {
        const raw = res.data?.data?.products ?? [];
        setProducts(
          raw.map((p) => {
            const prices = (p.prices ?? []) as ProductPrice[];
            return {
              id: p.id,
              name: p.nameMongolian,
              isActive: p.isActive !== false,
              productCode: p.productCode ?? '',
              categoryName: p.category?.nameMongolian ?? '',
              defaultPrice: Number(p.defaultPrice ?? 0),
              stock: p.stockQuantity ?? 0,
              barCode: p.barcode ?? '',
              classificationCode: p.classificationCode ?? p.category?.classificationCode ?? '',
              unitsPerBox: p.unitsPerBox != null && p.unitsPerBox > 0 ? p.unitsPerBox : null,
              pricePerBox:
                p.pricePerBox != null && Number(p.pricePerBox) > 0 ? Number(p.pricePerBox) : null,
              typePrices: prices.map((pp) => ({
                customerTypeId: pp.customerTypeId,
                price: Number(pp.price),
                typeName: pp.customerType?.typeName,
              })),
              promotions: p.promotions ?? [],
            };
          })
        );
      })
      .catch(() => {})
      .finally(() => setProductsLoading(false));

    customersApi
      .getAll({ limit: 'all', forOrder: true })
      .then((res) => {
        const rows = res.data?.data?.customers ?? [];
        setCustomers(
          rows.map((row) => parseCustomerFromApi(row as Customer & Record<string, unknown>))
        );
      })
      .catch(() => {});
  }, []);

  const customersForForm = useMemo(
    () => customers.map((c) => enrichCustomerWithTypeMap(c, customerTypeNameById)),
    [customers, customerTypeNameById]
  );

  /** Жагсаалт орсны дараа: ижил нэрээр буруу id сонгогдсон бол төрөлтэй мөр рүү шилжүүлнэ */
  useEffect(() => {
    if (customersForForm.length === 0 || !customerInput.trim()) return;
    const picked = pickCustomerMatchingInput(customerInput, customersForForm);
    if (!picked) return;
    setSelectedCustomerId((prev) => {
      if (prev === '' || prev === undefined) return picked.id;
      const cur = customersForForm.find((c) => c.id === Number(prev));
      if (!cur) return picked.id;
      const sameName = cur.name.toLowerCase() === picked.name.toLowerCase();
      if (sameName && !customerRowHasType(cur) && customerRowHasType(picked)) return picked.id;
      return prev;
    });
  }, [customersForForm, customerInput]);

  useEffect(() => {
    if (!initialOrder) return;

    setSelectedCustomerId(initialOrder.customerId || '');
    setCustomerInput(initialOrder.customer?.name || '');
    setPaymentMethod((initialOrder.paymentMethod as PaymentMethod) || 'Cash');
    setCreditTermDays(initialOrder.creditTermDays || 30);

    const mappedItems: OrderItem[] =
      initialOrder.orderItems?.map((item) => ({
        productId: String(item.productId),
        productInput: item.product?.nameMongolian || '',
        productQuery: item.product?.nameMongolian || '',
        qtyPieces: item.quantity,
        qtyBoxes: 0,
        priceMode: 'custom',
        priceModeInput: 'Гараар үнэ',
        customUnitPrice: Number(item.unitPrice || 0),
      })) || [];

    setOrderItems(
      mappedItems.length > 0
        ? mappedItems
        : [
            {
              productId: '',
              productInput: '',
              productQuery: '',
              qtyPieces: 1,
              qtyBoxes: 0,
              priceMode: 'defaultPrice',
              priceModeInput: 'Үндсэн үнэ',
              customUnitPrice: undefined,
            },
          ]
    );
  }, [initialOrder]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedCustomer = useMemo(() => {
    if (selectedCustomerId === '' || selectedCustomerId === undefined) return undefined;
    const id = Number(selectedCustomerId);
    if (!Number.isFinite(id)) return undefined;
    return customersForForm.find((c) => c.id === id);
  }, [customersForForm, selectedCustomerId]);

  const customerTypeId = resolveCustomerTypeId(selectedCustomer);
  const customerTypeLabel =
    selectedCustomer?.customerType?.typeName ||
    selectedCustomer?.customerType?.name ||
    (customerTypeId != null ? customerTypeNameById[customerTypeId] : undefined);

  const PRICE_MODE_OPTIONS: Array<{ value: PriceMode; label: string }> = useMemo(() => {
    const typeLabel = customerTypeLabel
      ? `Төрлийн үнэ (${customerTypeLabel})`
      : 'Төрлийн үнэ (Номин, Зах, Дэлгүүр …)';
    return [
      { value: 'customerType', label: typeLabel },
      { value: 'defaultPrice', label: 'Үндсэн үнэ' },
      { value: 'custom', label: 'Гараар үнэ' },
    ];
  }, [customerTypeLabel]);

  const priceForCustomerType = (p: ProductOption, ctId: number | undefined): number | null => {
    if (ctId == null) return null;
    const row = p.typePrices.find((t) => t.customerTypeId === ctId);
    if (!row) return null;
    const n = Number(row.price);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const pickDefaultPriceModeForProduct = (
    p: ProductOption | undefined
  ): { mode: PriceMode; label: string } => {
    if (!p) return { mode: 'defaultPrice', label: 'Үндсэн үнэ' };
    if (customerTypeId != null && priceForCustomerType(p, customerTypeId) != null) {
      const opt = PRICE_MODE_OPTIONS.find((o) => o.value === 'customerType');
      return { mode: 'customerType', label: opt?.label ?? 'Төрлийн үнэ' };
    }
    return { mode: 'defaultPrice', label: 'Үндсэн үнэ' };
  };

  useEffect(() => {
    setOrderItems((items) => {
      const next = items.map((oi) => {
        if (oi.priceMode !== 'customerType') return oi;
        const p = products.find((x) => x.id === Number(oi.productId));
        const opt = PRICE_MODE_OPTIONS.find((o) => o.value === 'customerType');
        if (!p || customerTypeId == null || priceForCustomerType(p, customerTypeId) == null) {
          return { ...oi, priceMode: 'defaultPrice' as PriceMode, priceModeInput: 'Үндсэн үнэ' };
        }
        const newLabel = opt?.label ?? oi.priceModeInput;
        if (newLabel === oi.priceModeInput) return oi;
        return { ...oi, priceModeInput: newLabel };
      });
      const unchanged = next.length === items.length && next.every((x, i) => x === items[i]);
      return unchanged ? items : next;
    });
  }, [customerTypeId, products, PRICE_MODE_OPTIONS]);

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
    if (!p) return false;
    const totalNeeded = getPieceQty(oi) + getBonusQty(oi);
    return totalNeeded > p.stock;
  };

  /** Барааны идэвхтэй (одоо хүчин төгөлдөр) урамшууллыг буцаана */
  const getActivePromotionsFor = (p?: ProductOption | null): Promotion[] => {
    if (!p?.promotions?.length) return [];
    const now = Date.now();
    return p.promotions.filter((pr) => {
      if (!pr.isActive) return false;
      const s = new Date(pr.startDate).getTime();
      const e = new Date(pr.endDate).getTime();
      return Number.isFinite(s) && Number.isFinite(e) && s <= now && e >= now;
    });
  };

  /** OrderItem дээр сонгогдсон урамшууллыг (хүчин төгөлдөр бол) олно */
  const getSelectedPromotion = (oi: OrderItem): Promotion | null => {
    if (oi.promotionId == null) return null;
    const p = getProduct(oi.productId);
    const active = getActivePromotionsFor(p);
    return active.find((pr) => pr.id === oi.promotionId) ?? null;
  };

  const getUnitPrice = (oi: OrderItem): number => {
    const p = getProduct(oi.productId);
    if (!p) return 0;

    let base: number;
    if (oi.priceMode === 'custom') {
      base = Number(oi.customUnitPrice || 0);
    } else if (oi.priceMode === 'customerType') {
      const tp = priceForCustomerType(p, customerTypeId);
      base = tp ?? p.defaultPrice ?? 0;
    } else {
      base = p.defaultPrice || 0;
    }

    const promo = getSelectedPromotion(oi);
    if (promo?.type === 'PERCENT_DISCOUNT' && promo.discountPercent != null) {
      const dp = Math.max(0, Math.min(100, Number(promo.discountPercent)));
      return Math.round(base * (1 - dp / 100) * 100) / 100;
    }
    return base;
  };

  /** Захиалгын мөрөнд орох нийт ширхэг (хадгалалт/API-д илгээгдэнэ) */
  const getPieceQty = (oi: OrderItem): number => {
    const p = getProduct(oi.productId);
    const boxes = Math.max(0, Math.floor(Number(oi.qtyBoxes) || 0));
    const pieces = Math.max(0, Math.floor(Number(oi.qtyPieces) || 0));
    if (p?.unitsPerBox && p.unitsPerBox > 0) {
      return boxes * p.unitsPerBox + pieces;
    }
    return pieces;
  };

  /** BUY_X_GET_Y төрөл сонгосон үед үнэгүй авах ширхэгийг тооцно */
  const getBonusQty = (oi: OrderItem): number => {
    const promo = getSelectedPromotion(oi);
    if (promo?.type !== 'BUY_X_GET_Y') return 0;
    const buyQty = Number(promo.buyQty || 0);
    const freeQty = Number(promo.freeQty || 0);
    if (buyQty < 1 || freeQty < 1) return 0;
    const qty = getPieceQty(oi);
    if (qty < buyQty) return 0;
    return Math.floor(qty / buyQty) * freeQty;
  };

  /** Хайрцаг + ширхэг холилдсон мөрийн дүн (урамшуулал тооцсон) */
  const getLineSubtotal = (oi: OrderItem): number => {
    const p = getProduct(oi.productId);
    if (!p) return 0;
    const boxes = Math.max(0, Math.floor(Number(oi.qtyBoxes) || 0));
    const pieces = Math.max(0, Math.floor(Number(oi.qtyPieces) || 0));
    const upb = p.unitsPerBox && p.unitsPerBox > 0 ? p.unitsPerBox : 0;
    const promo = getSelectedPromotion(oi);
    const isPercent = promo?.type === 'PERCENT_DISCOUNT';
    const discount = isPercent
      ? Math.max(0, Math.min(100, Number(promo!.discountPercent ?? 0))) / 100
      : 0;

    if (oi.priceMode === 'custom') {
      const baseUnit = Number(oi.customUnitPrice || 0);
      const unit = isPercent ? baseUnit * (1 - discount) : baseUnit;
      if (!upb) return unit * Math.max(1, pieces || 1);
      const totalP = boxes * upb + pieces;
      return totalP > 0 ? unit * totalP : 0;
    }

    const unit = getUnitPrice(oi);
    if (!upb) {
      return unit * Math.max(1, pieces || 1);
    }

    let boxPart = 0;
    if (boxes > 0) {
      const baseBoxPrice =
        p.pricePerBox != null && p.pricePerBox > 0 ? p.pricePerBox : upb * (p.defaultPrice || 0);
      const effBoxPrice = isPercent ? baseBoxPrice * (1 - discount) : baseBoxPrice;
      boxPart = boxes * effBoxPrice;
    }
    return boxPart + pieces * unit;
  };

  /** Нэг нэгжийн үнээр × тоо хийхэд мөрийн дүн таарахгүй бол API-д дундаж нэгж илгээнэ */
  const needsWeightedUnitForApi = (oi: OrderItem, p?: ProductOption): boolean => {
    if (!p) return false;
    // Урамшуулал хэрэглэгдэж байвал заавал дундаж нэгжийн үнэ илгээнэ
    if (getSelectedPromotion(oi)) return true;
    const upb = p.unitsPerBox && p.unitsPerBox > 0 ? p.unitsPerBox : 0;
    if (!upb) return false;
    const b = Math.max(0, Math.floor(Number(oi.qtyBoxes) || 0));
    const pc = Math.max(0, Math.floor(Number(oi.qtyPieces) || 0));
    if (b > 0 && pc > 0) return true;
    if (b > 0 && p.pricePerBox != null && p.pricePerBox > 0) return true;
    return false;
  };

  const itemSubtotals = orderItems.map((oi) => getLineSubtotal(oi));
  /** Барааны мөрийн дүнгийн нийлбэр (оруулж байгаа үнэ нь НӨАТ орсон үнэ) */
  const totalGross = Math.round(itemSubtotals.reduce((s, v) => s + v, 0) * 100) / 100;
  /** НӨАТ = (нийт дүн / 1.1) × 0.1 */
  const vatAmount = Math.round((totalGross / 1.1) * 0.1 * 100) / 100;
  /** НӨАТ-гүй дүн = нийт дүн - НӨАТ */
  const subtotalExVat = Math.round((totalGross - vatAmount) * 100) / 100;

  const validItemCount = orderItems.filter((oi) => oi.productId && getPieceQty(oi) >= 1).length;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const addItem = () =>
    setOrderItems([
      ...orderItems,
      {
        productId: '',
        productInput: '',
        productQuery: '',
        qtyPieces: 1,
        qtyBoxes: 0,
        priceMode: 'defaultPrice',
        priceModeInput: 'Үндсэн үнэ',
        customUnitPrice: undefined,
        promotionId: undefined,
      },
    ]);
  const removeItem = (i: number) => setOrderItems(orderItems.filter((_, idx) => idx !== i));
  const updateItem = (
    i: number,
    field:
      | 'productId'
      | 'productInput'
      | 'qtyPieces'
      | 'qtyBoxes'
      | 'priceMode'
      | 'priceModeInput'
      | 'customUnitPrice'
      | 'promotionId',
    val: string | number | undefined
  ) => {
    const next = [...orderItems];
    const item = next[i];
    if (!item) return;

    if (field === 'productId') {
      item.productId = val as string;
      item.qtyPieces = 1;
      item.qtyBoxes = 0;
      item.promotionId = undefined;
      const selected = products.find((p) => p.id === Number(val));
      item.productQuery = selected?.name || '';
      item.productInput = selected?.name || '';
      const def = pickDefaultPriceModeForProduct(selected);
      item.priceMode = def.mode;
      item.priceModeInput = def.label;
      if (def.mode !== 'custom') item.customUnitPrice = undefined;
    }

    if (field === 'productInput') {
      const input = String(val);
      item.productInput = input;
      item.productQuery = input;

      const exact = products.find((p) => p.name.toLowerCase() === input.toLowerCase());
      if (exact) {
        item.productId = String(exact.id);
        item.qtyPieces = 1;
        item.qtyBoxes = 0;
        item.promotionId = undefined;
        const def = pickDefaultPriceModeForProduct(exact);
        item.priceMode = def.mode;
        item.priceModeInput = def.label;
        if (def.mode !== 'custom') item.customUnitPrice = undefined;
      } else if (!input.trim()) {
        item.productId = '';
        item.promotionId = undefined;
      }
    }

    if (field === 'qtyPieces') {
      const p = getProduct(item.productId);
      const v = Math.max(0, Math.floor(Number(val) || 0));
      if (p?.unitsPerBox && p.unitsPerBox > 0) {
        item.qtyPieces = v;
      } else {
        item.qtyPieces = Math.max(1, v);
      }
    }
    if (field === 'qtyBoxes') {
      item.qtyBoxes = Math.max(0, Math.floor(Number(val) || 0));
    }

    if (field === 'priceMode') {
      item.priceMode = val as PriceMode;
      const modeLabel = PRICE_MODE_OPTIONS.find((m) => m.value === item.priceMode)?.label;
      item.priceModeInput = modeLabel || item.priceModeInput;
      if (item.priceMode !== 'custom') {
        item.customUnitPrice = undefined;
      }
    }

    if (field === 'priceModeInput') {
      item.priceModeInput = String(val);
    }

    if (field === 'customUnitPrice') {
      item.customUnitPrice = Number(val);
    }

    if (field === 'promotionId') {
      if (val === undefined || val === '' || val === null) {
        item.promotionId = undefined;
      } else {
        const num = Number(val);
        item.promotionId = Number.isFinite(num) && num > 0 ? num : undefined;
      }
    }

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
    const validItems = orderItems.filter((oi) => oi.productId && getPieceQty(oi) >= 1);
    if (validItems.length === 0) errs.items = 'Дор хаяж нэг бараа сонгоно уу';
    orderItems.forEach((oi, i) => {
      if (oi.productId && isDuplicate(i)) errs[`item_${i}`] = 'Давтагдсан бараа';
      if (oi.productId && isOverStock(i)) errs[`item_${i}`] = 'Үлдэгдэл хүрэлцэхгүй';
      if (oi.productId && oi.qtyBoxes > 0) {
        const p = getProduct(oi.productId);
        if (!p?.unitsPerBox || p.unitsPerBox < 1) {
          errs[`item_${i}`] = 'Энэ бараанд хайрцаг дахь тоо тохируулаагүй байна';
        }
      }
      if (oi.productId && oi.priceMode === 'custom' && Number(oi.customUnitPrice || 0) <= 0) {
        errs[`item_${i}`] = 'Гараар оруулсан үнэ 0-ээс их байх ёстой';
      }
      if (oi.productId && oi.priceMode === 'customerType') {
        if (customerTypeId == null) {
          errs[`item_${i}`] = 'Төрлийн үнэнд харилцагчийн төрөл шаардлагатай';
        } else {
          const p = getProduct(oi.productId);
          const tp = p ? priceForCustomerType(p, customerTypeId) : null;
          const hasDefault = p && Number(p.defaultPrice) > 0;
          if (!p || (tp == null && !hasDefault)) {
            errs[`item_${i}`] =
              'Энэ бараанд төрлийн үнэ эсвэл үндсэн үнэ тохируулаагүй (Бараа → Үнэ удирдлага)';
          }
        }
      }
    });
    if (paymentMethod === 'Credit' && (!creditTermDays || creditTermDays < 1))
      errs.credit = 'Зээлийн хугацаа оруулна уу';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const validItems = orderItems.filter((oi) => oi.productId && getPieceQty(oi) >= 1);
    setIsSubmitting(true);
    try {
      const apiPaymentMethod: ApiPaymentMethod =
        paymentMethod === 'Card' ? 'BankTransfer' : paymentMethod;
      const payload = {
        customerId: Number(selectedCustomerId),
        paymentMethod: apiPaymentMethod,
        orderType: 'Store' as const,
        creditTermDays: paymentMethod === 'Credit' ? creditTermDays : undefined,
        items: validItems.map((oi) => {
          const p = getProduct(oi.productId);
          const baseQty = getPieceQty(oi);
          const bonusQty = getBonusQty(oi);
          const totalQty = baseQty + bonusQty;
          const line = getLineSubtotal(oi);
          const promo = getSelectedPromotion(oi);
          // Урамшуулал хэрэглэгдсэн бол дундаж нэгжийн үнийг гаргаж "custom" хэлбэрээр илгээнэ
          if (promo) {
            const avg = totalQty > 0 ? Math.round((line / totalQty) * 100) / 100 : 0;
            return {
              productId: Number(oi.productId),
              quantity: totalQty,
              priceMode: 'custom' as const,
              customUnitPrice: avg,
            };
          }
          if (oi.priceMode === 'custom') {
            return {
              productId: Number(oi.productId),
              quantity: baseQty,
              priceMode: 'custom' as const,
              customUnitPrice: Number(oi.customUnitPrice || 0),
            };
          }
          if (needsWeightedUnitForApi(oi, p) && baseQty > 0) {
            const avg = Math.round((line / baseQty) * 100) / 100;
            return {
              productId: Number(oi.productId),
              quantity: baseQty,
              priceMode: 'custom' as const,
              customUnitPrice: avg,
            };
          }
          return {
            productId: Number(oi.productId),
            quantity: baseQty,
            priceMode: oi.priceMode,
            customUnitPrice: undefined,
          };
        }),
      };

      const response =
        isEditMode && initialOrder?.id
          ? await ordersApi.update(initialOrder.id, payload)
          : await ordersApi.create(payload);

      const savedOrder = response.data?.data?.order;

      toast.success(isEditMode ? 'Захиалга амжилттай шинэчлэгдлээ!' : 'Захиалга амжилттай үүслээ!');
      onSuccess?.(savedOrder);
      onClose?.();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message ||
          (isEditMode ? 'Захиалга шинэчлэхэд алдаа гарлаа' : 'Захиалга үүсгэхэд алдаа гарлаа')
      );
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
            <h2 style={s.title}>{isEditMode ? 'Захиалга засах' : 'Захиалга үүсгэх'}</h2>
            <span style={s.badge}>{isEditMode ? 'Засвар' : 'Шинэ'}</span>
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
            <div>
              <label style={s.label}>
                Харилцагч{' '}
                {errors.customer && <span style={{ color: C.red }}> — {errors.customer}</span>}
              </label>
              <SearchSelect
                value={selectedCustomerId}
                valueLabel={selectedCustomer?.name}
                placeholder="Харилцагч сонгоно уу"
                searchPlaceholder="Нэр, утас, регистр..."
                options={customersForForm.map((c) => ({
                  value: c.id,
                  label: c.name,
                  meta: c.phoneNumber || c.registrationNumber || '',
                }))}
                onSelect={(opt) => {
                  setSelectedCustomerId(opt.value);
                  setCustomerInput(opt.label);
                  setErrors((p) => {
                    const n = { ...p };
                    delete n.customer;
                    return n;
                  });
                }}
              />
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
                <span style={s.customerField}>Харилцагчийн төрөл</span>
                <span style={s.customerValue}>{customerTypeLabel || '—'}</span>
              </div>
            )}
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
            </div>
            {errors.items && <div style={{ ...s.err, marginBottom: 8 }}>⚠ {errors.items}</div>}

            {/* Колонкийн гарчиг */}
            <div style={{ ...s.itemGrid, marginBottom: 4, padding: '0 14px' }}>
              {['Бараа (хайх + сонгох)', 'Хайрцаг / ширхэг', 'Нэгж үнэ', 'Дүн', ''].map((h, i) => (
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
              const pieceQty = prod ? getPieceQty(oi) : 0;
              const activePromos = getActivePromotionsFor(prod);
              const selectedPromo = getSelectedPromotion(oi);
              const bonusQty = prod ? getBonusQty(oi) : 0;
              const totalQtyWithBonus = pieceQty + bonusQty;
              const stockStatus = prod
                ? prod.stock === 0
                  ? 'out'
                  : prod.stock < totalQtyWithBonus
                    ? 'warn'
                    : 'ok'
                : null;
              const productSelectOptions: Array<SearchSelectOption<string>> = productsLoading
                ? []
                : products
                    .filter((p) => p.isActive || String(p.id) === oi.productId)
                    .map((p) => ({
                      value: String(p.id),
                      label: p.name,
                      description: p.unitsPerBox
                        ? `1 хайрцаг = ${p.unitsPerBox} ширхэг`
                        : p.barCode
                          ? `Баркод: ${p.barCode}`
                          : undefined,
                      meta: `Үлдэгдэл: ${p.stock}`,
                      searchText: `${p.name} ${p.productCode} ${p.barCode} ${p.classificationCode} ${p.categoryName}`,
                    }));
              const priceModeSelectOptions: Array<SearchSelectOption<PriceMode>> =
                PRICE_MODE_OPTIONS.map((modeOption) => {
                  let meta: string | undefined;
                  let description: string | undefined;

                  if (modeOption.value === 'custom') {
                    description = 'Нэгж үнийг гараар оруулна';
                  } else if (prod) {
                    const preview =
                      modeOption.value === 'customerType'
                        ? (priceForCustomerType(prod, customerTypeId) ?? prod.defaultPrice ?? 0)
                        : (prod.defaultPrice ?? 0);
                    meta = `₮${Number(preview || 0).toLocaleString()}/ш`;
                    if (modeOption.value === 'customerType' && customerTypeId == null) {
                      description = 'Харилцагчийн төрөл сонгоогүй тул үндсэн үнэ ашиглана';
                    }
                  }

                  return {
                    value: modeOption.value,
                    label: modeOption.label,
                    description,
                    meta,
                    searchText: modeOption.label,
                  };
                });
              return (
                <div
                  key={idx}
                  style={{
                    ...s.itemRow,
                    ...(dup ? s.itemRowDuplicate : over ? s.itemRowWarning : {}),
                  }}
                >
                  <div style={s.itemGrid}>
                    {/* Бараа: searchable select */}
                    <div>
                      <SearchSelect
                        value={oi.productId}
                        valueLabel={prod?.name || oi.productInput || ''}
                        placeholder="Бараа хайх, сонгох..."
                        searchPlaceholder="Барааны нэр, баркодоор хайх..."
                        options={productSelectOptions}
                        emptyText="Бараа олдсонгүй"
                        onSelect={(option) => updateItem(idx, 'productId', option.value)}
                      />

                      {prod && (
                        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>
                          {prod.name}
                          {prod.unitsPerBox ? ` · 1 хайрцаг = ${prod.unitsPerBox} ширхэг` : ''}
                        </div>
                      )}
                    </div>

                    {/* Хайрцаг + ширхэг нэгэн зэрэг */}
                    <div style={s.qtyStack}>
                      {prod?.unitsPerBox ? (
                        <>
                          <div>
                            <div style={s.qtyFieldLabel}>Хайрцаг</div>
                            <input
                              style={{
                                ...s.input,
                                textAlign: 'center',
                                padding: '8px 6px',
                                fontSize: 12,
                                ...(over ? { border: `1px solid ${C.yellow}` } : {}),
                              }}
                              type="number"
                              min={0}
                              value={oi.qtyBoxes}
                              onChange={(e) => updateItem(idx, 'qtyBoxes', Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <div style={s.qtyFieldLabel}>Ширхэг</div>
                            <input
                              style={{
                                ...s.input,
                                textAlign: 'center',
                                padding: '8px 6px',
                                fontSize: 12,
                                ...(over ? { border: `1px solid ${C.yellow}` } : {}),
                              }}
                              type="number"
                              min={0}
                              value={oi.qtyPieces}
                              onChange={(e) => updateItem(idx, 'qtyPieces', Number(e.target.value))}
                            />
                          </div>
                          <div style={{ fontSize: 10, color: C.textMuted, lineHeight: 1.35 }}>
                            = нийт {pieceQty} ширхэг
                            {(() => {
                              if (!prod.unitsPerBox) return '';
                              const parts: string[] = [];
                              if ((oi.qtyBoxes || 0) > 0) {
                                parts.push(`${oi.qtyBoxes}×${prod.unitsPerBox}`);
                              }
                              if ((oi.qtyPieces || 0) > 0) {
                                parts.push(String(oi.qtyPieces));
                              }
                              return parts.length ? ` (${parts.join(' + ')})` : '';
                            })()}
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 10, color: C.textDim, marginBottom: 4 }}>
                            Ширхэг
                          </div>
                          <input
                            style={{
                              ...s.input,
                              textAlign: 'center',
                              padding: '9px 6px',
                              ...(over ? { border: `1px solid ${C.yellow}` } : {}),
                            }}
                            type="number"
                            min={1}
                            value={oi.qtyPieces || 1}
                            onChange={(e) => updateItem(idx, 'qtyPieces', Number(e.target.value))}
                          />
                        </>
                      )}
                    </div>

                    {/* Үнэ + price mode: searchable select */}
                    <div>
                      <SearchSelect
                        value={oi.priceMode}
                        valueLabel={oi.priceModeInput || ''}
                        placeholder="Үнийн төрөл..."
                        searchPlaceholder="Үнийн төрлөөр хайх..."
                        options={priceModeSelectOptions}
                        emptyText="Үнийн төрөл олдсонгүй"
                        onSelect={(option) => updateItem(idx, 'priceMode', option.value)}
                      />

                      {oi.priceMode === 'custom' ? (
                        <input
                          style={{
                            ...s.input,
                            textAlign: 'right',
                            padding: '6px 8px',
                            marginTop: 6,
                          }}
                          type="number"
                          min={1}
                          value={oi.customUnitPrice || ''}
                          onChange={(e) =>
                            updateItem(idx, 'customUnitPrice', Number(e.target.value))
                          }
                          placeholder="Үнэ"
                        />
                      ) : (
                        <div
                          style={{
                            textAlign: 'right',
                            fontSize: 13,
                            color: C.textMuted,
                            paddingRight: 4,
                            marginTop: 6,
                          }}
                        >
                          {prod ? (
                            <>
                              <span>{getUnitPrice(oi).toLocaleString()}₮/ш</span>
                              {prod.unitsPerBox && oi.qtyBoxes > 0 && prod.pricePerBox ? (
                                <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>
                                  хайрцаг {prod.pricePerBox.toLocaleString()}₮
                                </div>
                              ) : null}
                              {prod.unitsPerBox &&
                              needsWeightedUnitForApi(oi, prod) &&
                              totalQtyWithBonus > 0 ? (
                                <div style={{ fontSize: 10, color: C.textDim, marginTop: 2 }}>
                                  мөрний дундаж{' '}
                                  {(subtotal / totalQtyWithBonus).toLocaleString(undefined, {
                                    maximumFractionDigits: 2,
                                  })}
                                  ₮/ш
                                </div>
                              ) : null}
                            </>
                          ) : (
                            '—'
                          )}
                        </div>
                      )}

                      {/* Урамшуулал сонголт */}
                      {prod && activePromos.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <div
                            style={{
                              fontSize: 10,
                              color: C.textDim,
                              marginBottom: 2,
                              fontWeight: 600,
                            }}
                          >
                            Урамшуулал
                          </div>
                          <select
                            style={{
                              ...s.input,
                              padding: '6px 8px',
                              fontSize: 12,
                              width: '100%',
                            }}
                            value={oi.promotionId ?? ''}
                            onChange={(e) =>
                              updateItem(idx, 'promotionId', e.target.value || undefined)
                            }
                          >
                            <option value="">— Урамшуулалгүй —</option>
                            {activePromos.map((pr) => {
                              const desc =
                                pr.type === 'PERCENT_DISCOUNT'
                                  ? `${Number(pr.discountPercent ?? 0)}% хөнгөлөлт`
                                  : `${pr.buyQty ?? 0}+${pr.freeQty ?? 0}`;
                              return (
                                <option key={pr.id} value={pr.id}>
                                  {pr.name} ({desc})
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}
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
                      {selectedPromo && bonusQty > 0 && (
                        <span
                          style={{
                            ...s.tag,
                            background: '#14532d',
                            color: '#86efac',
                            border: '1px solid #166534',
                          }}
                        >
                          + {bonusQty} ширхэг үнэгүй (нийт {totalQtyWithBonus} ш)
                        </span>
                      )}
                      {selectedPromo?.type === 'PERCENT_DISCOUNT' && (
                        <span
                          style={{
                            ...s.tag,
                            background: '#1e3a8a',
                            color: '#93c5fd',
                            border: '1px solid #2563eb',
                          }}
                        >
                          {Number(selectedPromo.discountPercent ?? 0)}% хөнгөлөлт
                        </span>
                      )}
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
                    {orderItems.filter((o) => o.productId).reduce((s, o) => s + getPieceQty(o), 0)}{' '}
                    ширхэг)
                  </span>
                </div>
                <div style={s.summaryRow}>
                  <span style={s.summaryLabel}>Барааны нийт (НӨАТ-гүй)</span>
                  <span style={s.summaryValue}>{subtotalExVat.toLocaleString()}₮</span>
                </div>
                <div style={s.summaryRow}>
                  <span style={s.summaryLabel}>НӨАТ (10%)</span>
                  <span style={s.summaryValue}>{vatAmount.toLocaleString()}₮</span>
                </div>
              </>
            )}
            <div style={s.totalRow}>
              <span style={s.totalLabel}>Нийт дүн</span>
              <span style={s.totalValue}>{totalGross.toLocaleString()}₮</span>
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
