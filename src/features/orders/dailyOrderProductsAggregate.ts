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
  /** Бүтэн хайрцаг — жишээ 2 эсвэл 0 (remainder нь 0 үед) */
  boxes: number;
  /** Үлдэгдэл ширхэг (хүрэхгүй бол 0) */
  pieces: number;
  /** "N хайрцаг M ширхэг" форматтай текст */
  boxesLabel: string;
  /** Зөвхөн хайрцаг тоо */
  boxesDisplay: string;
  /** Зөвхөн ширхэг тоо */
  piecesDisplay: string;
  /** Агуулахад байгаа хайрцаг + ширхэг */
  stockBoxesLabel: string;
}

/**
 * Нэг мөрөн дотроо хайрцаг + ширхэг харьцуулах string үүсгэнэ.
 * Жишээ: "2 хайрцаг 5 ширхэг" эсвэл "3 хайрцаг 0 ширхэг"
 */
function formatBoxesLine(totalPieces: number, unitsPerBox: number | null | undefined): string {
  const upb = unitsPerBox != null && unitsPerBox > 0 ? unitsPerBox : null;
  if (!upb) return '—';
  const full = Math.floor(totalPieces / upb);
  const rem = totalPieces % upb;
  return `${full} хайрцаг ${rem} ширхэг`;
}

/** Агуулах库存т хайрцаг + ширхэг текст */
function formatStockLine(totalPieces: number, unitsPerBox: number | null | undefined): string {
  const upb = unitsPerBox != null && unitsPerBox > 0 ? unitsPerBox : null;
  if (!upb) return '—';
  const full = Math.floor(totalPieces / upb);
  const rem = totalPieces % upb;
  return `${full} хайрцаг ${rem} ширхэг`;
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
    {
      name: string;
      quantity: number;
      barcode: string;
      unitsPerBox: number | null;
      stockQuantity: number;
    }
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
      const stock = item.product?.stockQuantity || 0;
      const prev = map.get(pid);
      if (prev) {
        const mergedBarcode = prev.barcode !== '—' ? prev.barcode : barcode !== '—' ? barcode : '—';
        const mergedUpb = prev.unitsPerBox ?? upb;
        map.set(pid, {
          name: prev.name,
          quantity: prev.quantity + qty,
          barcode: mergedBarcode,
          unitsPerBox: mergedUpb,
          stockQuantity: stock,
        });
      } else {
        map.set(pid, { name, quantity: qty, barcode, unitsPerBox: upb, stockQuantity: stock });
      }
    }
  }

  return Array.from(map.entries())
    .map(([productId, v]) => {
      const upb = v.unitsPerBox;
      const full = upb != null && upb > 0 ? Math.floor(v.quantity / upb) : 0;
      const rem = upb != null && upb > 0 ? v.quantity % upb : v.quantity;
      const boxesDisplay = upb != null && upb > 0 ? String(full) : '—';
      const piecesDisplay = upb != null && upb > 0 ? String(rem) : '—';
      return {
        productId,
        name: v.name,
        quantity: v.quantity,
        barcode: v.barcode,
        unitsPerBox: v.unitsPerBox,
        boxes: full,
        pieces: rem,
        boxesLabel: formatBoxesLine(v.quantity, v.unitsPerBox),
        boxesDisplay,
        piecesDisplay,
        stockBoxesLabel:
          v.stockQuantity > 0 ? formatStockLine(v.stockQuantity, v.unitsPerBox) : '—',
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'mn', { sensitivity: 'base' }));
}

export function todayLocalYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
