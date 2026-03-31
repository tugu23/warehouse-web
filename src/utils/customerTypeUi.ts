import type { ChipProps } from '@mui/material/Chip';

/** Харилцагчийн төрлийн нэр → Chip өнгө (Зах, Дэлгүүр, Номин, CU, Наш) */
export function chipColorForCustomerTypeName(typeName?: string | null): ChipProps['color'] {
  const m: Record<string, NonNullable<ChipProps['color']>> = {
    Зах: 'primary',
    Дэлгүүр: 'secondary',
    Номин: 'success',
    CU: 'info',
    Наш: 'warning',
  };
  return typeName && m[typeName] ? m[typeName]! : 'default';
}
