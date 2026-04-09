import { Order } from '../../types';

/** Захиалгын огноог орон нутгийн календарийн YYYY-MM-DD болгон хувиргана */
export function orderLocalYmd(createdAt: string): string | null {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export interface DailyAggregatedProduct {
  productId: number;
  name: string;
  quantity: number;
  barcode: string;
  /** Барааны нэг хайрцагт хэдэн ширхэг (байхгүй бол null) */
  unitsPerBox: number | null;
  /** Хайрцаг + үлдэгдэл ширхэг — жишээ 2+5ш эсвэл зөвхөн 3 */
  boxesLabel: string;
}

function formatBoxesLine(totalPieces: number, unitsPerBox: number | null | undefined): string {
  const upb = unitsPerBox != null && unitsPerBox > 0 ? unitsPerBox : null;
  if (!upb) return '—';
  const full = Math.floor(totalPieces / upb);
  const rem = totalPieces % upb;
  if (rem === 0) return String(full);
  return `${full}+${rem}ш`;
}

/**
 * Тодорхой өдөр захиалгад орсон бараануудыг productId-аар нэгтгэнэ.
 * Цуцлагдсан захиалгыг хасна.
 */
export function aggregateDailyOrderProducts(
  orders: Order[],
  ymd: string
): DailyAggregatedProduct[] {
  const map = new Map<
    number,
    { name: string; quantity: number; barcode: string; unitsPerBox: number | null }
  >();

  for (const order of orders) {
    if (order.status === 'Cancelled') continue;
    if (orderLocalYmd(order.createdAt) !== ymd) continue;

    for (const item of order.orderItems || []) {
      const pid = item.productId;
      const name = item.product?.nameMongolian?.trim() || `Бараа #${pid}`;
      const barcode = item.product?.barcode?.trim() || '—';
      const upb =
        item.product?.unitsPerBox != null && item.product.unitsPerBox > 0
          ? item.product.unitsPerBox
          : null;
      const qty = Number(item.quantity) || 0;
      const prev = map.get(pid);
      if (prev) {
        const mergedBarcode = prev.barcode !== '—' ? prev.barcode : barcode !== '—' ? barcode : '—';
        const mergedUpb = prev.unitsPerBox ?? upb;
        map.set(pid, {
          name: prev.name,
          quantity: prev.quantity + qty,
          barcode: mergedBarcode,
          unitsPerBox: mergedUpb,
        });
      } else {
        map.set(pid, { name, quantity: qty, barcode, unitsPerBox: upb });
      }
    }
  }

  return Array.from(map.entries())
    .map(([productId, v]) => ({
      productId,
      name: v.name,
      quantity: v.quantity,
      barcode: v.barcode,
      unitsPerBox: v.unitsPerBox,
      boxesLabel: formatBoxesLine(v.quantity, v.unitsPerBox),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'mn', { sensitivity: 'base' }));
}

export function todayLocalYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
