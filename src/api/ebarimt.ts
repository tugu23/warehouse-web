import { EbarimtParams } from '@/types/ebarimt';

export async function createEbarimtRequest({
  items,
  paymentType = 'CASH',
  type = 'B2C_RECEIPT',
  consumerNo = null,
  customerTin = null,
  regNo,
}: EbarimtParams) {
  const merchantTin = '37900846788';

  let finalCustomerTin: string | null = customerTin != null ? String(customerTin) : null;

  // Хэрвээ regNo ирвэл tin татаж авна
  if (regNo) {
    const tinInfo = await getTinInfo(regNo);
    finalCustomerTin = String(tinInfo.tinNumber);
  }

  if (type === 'B2B_RECEIPT' && !finalCustomerTin) {
    throw new Error('B2B_RECEIPT үед customerTin заавал хэрэгтэй');
  }

  // Захиалгын unitPrice нь НӨАТ-аас өмнөх (backend addVAT-тай тааруулна).
  // Мөрийн нийт: lineNet + 10% НӨАТ = НӨАТ багтсан дүн (POS-ийн 10/110 шалгалттай нийцнэ).
  const calculatedItems = items.map((item) => {
    const qty = item.qty || 1;
    const lineNet = +(item.unitPrice * qty).toFixed(2);
    const itemTotalVAT = +(lineNet * 0.1).toFixed(2);
    const itemTotalCityTax = 0;
    const itemTotalAmount = +(lineNet + itemTotalVAT).toFixed(2);
    const basePrice = +item.unitPrice.toFixed(2);

    return {
      name: item.name,
      barCode: item.barCode,
      barCodeType: 'GS1',
      classificationCode: item.classificationCode ?? '2399421',
      taxProductCode: null,
      measureUnit: 'ш',
      qty: qty,
      unitPrice: basePrice,
      totalVAT: itemTotalVAT,
      totalCityTax: itemTotalCityTax,
      totalAmount: itemTotalAmount,
    };
  });

  const totalAmount = +calculatedItems.reduce((sum, i) => sum + i.totalAmount, 0).toFixed(2);
  const totalVAT = +calculatedItems.reduce((sum, i) => sum + i.totalVAT, 0).toFixed(2);

  return {
    branchNo: '001',
    totalAmount,
    totalVAT,
    totalCityTax: 0,
    districtCode: '2506',
    merchantTin,
    posNo: '001',

    customerTin: type === 'B2B_RECEIPT' ? finalCustomerTin : null,
    ...(type === 'B2C_RECEIPT' ? { consumerNo: consumerNo ?? '' } : {}),

    type,
    inactiveId: null,
    invoiceId: null,
    reportMonth: null,
    billIdSuffix: '01',

    receipts: [
      {
        totalAmount,
        taxType: 'VAT_ABLE',
        merchantTin,
        customerTin: type === 'B2B_RECEIPT' ? finalCustomerTin : null,
        totalVAT,
        totalCityTax: 0,
        bankAccountNo: '',
        iBan: '',
        items: calculatedItems,
      },
    ],

    payments: [
      {
        code: paymentType,
        status: 'PAID',
        paidAmount: totalAmount,
      },
    ],
  };
}
export async function getTinInfo(regNo: number) {
  // 1-р шат: regNo → tin авах
  const response = await fetch(`https://api.ebarimt.mn/api/info/check/getTinInfo?regNo=${regNo}`);
  if (!response.ok) throw new Error('MerchantTin авахад алдаа гарлаа');
  const tinData = await response.json();

  const tinNumber = tinData?.data ?? null;
  if (!tinNumber) {
    throw new Error('Ийм регистрийн дугаартай байгууллага олдсонгүй');
  }

  // 2-р шат: tin → байгууллагын нэр авах
  const resName = await fetch(`https://api.ebarimt.mn/api/info/check/getInfo?tin=${tinNumber}`);
  if (!resName.ok) throw new Error('Байгууллагын нэр авахад алдаа гарлаа');
  const nameData = await resName.json();

  const tinName = nameData?.data?.name ?? '';
  if (!tinName) {
    throw new Error('Ийм нэртэй байгууллага олдсонгүй');
  }

  return { tinNumber, tinName };
}
