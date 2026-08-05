import type { Promotion } from '../types';

export type BuyXGetYBonusResult = {
  freeQty: number;
  promotion: Promotion | null;
};

/** Огнооны хувьд идэвхтэй урамшуулал эсэх */
export function isPromotionCurrentlyActive(
  promo: Pick<Promotion, 'isActive' | 'startDate' | 'endDate'>,
  at = Date.now()
): boolean {
  if (!promo.isActive) return false;
  const start = promo.startDate ? new Date(promo.startDate).getTime() : 0;
  const end = promo.endDate ? new Date(promo.endDate).getTime() : Number.MAX_SAFE_INTEGER;
  return start <= at && at <= end;
}

/** Идэвхтэй BUY_X_GET_Y урамшууллууд */
export function getActiveBuyXGetYPromotions(
  promotions: Promotion[] | undefined,
  at = Date.now()
): Promotion[] {
  if (!promotions?.length) return [];
  return promotions.filter(
    (p) =>
      p.type === 'BUY_X_GET_Y' &&
      p.buyQty != null &&
      p.freeQty != null &&
      p.buyQty > 0 &&
      p.freeQty > 0 &&
      isPromotionCurrentlyActive(p, at)
  );
}

function calcBonusQty(quantity: number, promo: Promotion): number {
  const buyQty = Number(promo.buyQty || 0);
  const freeQty = Number(promo.freeQty || 0);
  if (buyQty < 1 || freeQty < 1 || quantity < buyQty) return 0;
  return Math.floor(quantity / buyQty) * freeQty;
}

/**
 * Төлбөртэй тооноос үнэгүй ширхэг тооцох.
 * promotionId өгвөл тэр урамшууллыг ашиглана; үгүй бол хамгийн их bonus өгөх идэвхтэй урамшуулал.
 */
export function getBuyXGetYBonus(
  quantity: number,
  promotions: Promotion[] | undefined,
  options?: { promotionId?: number; at?: number }
): BuyXGetYBonusResult {
  const at = options?.at ?? Date.now();
  const active = getActiveBuyXGetYPromotions(promotions, at);
  if (!active.length) return { freeQty: 0, promotion: null };

  if (options?.promotionId != null && options?.promotionId !== undefined) {
    // Зөвхөн тэр урамшууллыг ашиглана
    const selected = active.find((p) => p.id === options.promotionId);
    if (selected) {
      return { freeQty: calcBonusQty(quantity, selected), promotion: selected };
    }
    // Сонгогдсон урамшуулал олдсонгүй (хүчингүй болсон, устгагдсан г.м.) бол ямар ч урамшуулал тооцохгүй
    return { freeQty: 0, promotion: null };
  }

  // Хэд хэдэн урамшуулал давхцвал buyQty ихтэй (илүү тодорхой, жишээ нь 2+1) нь давуу
  let best: BuyXGetYBonusResult = { freeQty: 0, promotion: null };
  for (const p of active) {
    const buyQty = Number(p.buyQty || 0);
    if (quantity < buyQty) continue;
    const free = calcBonusQty(quantity, p);
    const currentBuy = Number(best.promotion?.buyQty || 0);
    if (
      !best.promotion ||
      buyQty > currentBuy ||
      (buyQty === currentBuy && free > best.freeQty)
    ) {
      best = { freeQty: free, promotion: p };
    }
  }
  return best;
}

/** Баримт/PDF: [үнэгүй мөр харуулах эсэх, үнэгүй ширхэгийн тоо]
 * Зөвхөн тухайн захиалгад ИДЭВХТЭЙ сонгогдсон урамшууллыг харуулна.
 * Хэрэв promotionId өгөгдөөгүй бол харуулахгүй — автоматаар бусад идэвхтэй
 * урамшууллуудыг тооцохгүй! */
export function getPromotionDisplayInfo(
  quantity: number,
  promotions: Promotion[] | undefined,
  options?: { promotionId?: number | null; at?: number }
): [boolean, number] {
  // Зөвхөн сонгогдсон урамшууллыг харуулна
  if (options?.promotionId == null || options.promotionId === 0) {
    return [false, 0];
  }
  const { freeQty } = getBuyXGetYBonus(quantity, promotions, { promotionId: options.promotionId, at: options?.at });
  return [freeQty > 0, freeQty];
}

export function getOrderItemBonusFreeQty(
  item: { quantity: number; product?: { promotions?: Promotion[] } | null },
  options?: { promotionId?: number; at?: number }
): number {
  if (options?.promotionId == null || options.promotionId === 0) {
    return 0;
  }
  return getBuyXGetYBonus(item.quantity, item.product?.promotions, options).freeQty;
}

/** Захиалгын мөр бүрийн үнэгүй ширхэгийн тоо (orderItem.id → freeQty)
 * Зөвхөн тухайн захиалгад ИДЭВХТЭЙ сонгогдсон урамшууллыг тооцоолно.
 * Хэрэв promotionId өгөгдөөгүй бол 0 — автоматаар бусад идэвхтэй
 * урамшууллуудыг тооцохгүй! */
export function buildOrderItemBonusMap(
  orderItems: Array<{
    id?: number;
    quantity: number;
    product?: { promotions?: Promotion[] } | null;
    promotionId?: number | null;
  }> = [],
  at?: number
): Map<number, number> {
  const map = new Map<number, number>();
  for (const item of orderItems) {
    if (item.id != null) {
      map.set(
        item.id,
        getOrderItemBonusFreeQty(item, { promotionId: item.promotionId ?? undefined, at })
      );
    }
  }
  return map;
}
