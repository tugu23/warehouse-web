// Item type-ийг экспортлох
export type Item = {
    name: string;
    barCode?: string;
    classificationCode?: string;
    qty: number;
    unitPrice: number;
  };
  
  // EbarimtParams type-ийг экспортлох
  export type EbarimtParams = {
    items: Item[];
    paymentType?: 'CASH' | 'PAYMENT_CARD';
    type?: 'B2C_RECEIPT' | 'B2B_RECEIPT';
    consumerNo?: string | null;
    customerTin?: string | null;
    regNo?: number | null;
  };