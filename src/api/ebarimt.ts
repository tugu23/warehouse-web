import axios from 'axios';
import { EbarimtParams } from '@/types/ebarimt';

const EBARIMT_PUBLIC_API = 'https://api.ebarimt.mn/api/info/check';

/** ТТД (жишээ 111655202982) — getInfo-аар нэр лавлана */
export async function getEbarimtInfoByTin(tin: string): Promise<{ name: string; tin: string }> {
  const t = tin.trim();
  if (!t) throw new Error('ТТД оруулна уу');

  try {
    const { data } = await axios.get<{
      status?: number;
      msg?: string;
      data?: { name?: string; vatpayer?: boolean };
    }>(`${EBARIMT_PUBLIC_API}/getInfo`, {
      params: { tin: t },
      headers: { Accept: 'application/json' },
      validateStatus: () => true,
    });

    if (data?.status !== 200) {
      throw new Error(typeof data?.msg === 'string' ? data.msg : 'ТТД-ээр мэдээлэл олдсонгүй');
    }

    const name = data?.data?.name?.trim() ?? '';
    if (!name) throw new Error('Иргэн/байгууллагын нэр олдсонгүй');

    return { name, tin: t };
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const msg =
        e.response?.data && typeof e.response.data === 'object' && 'msg' in e.response.data
          ? String((e.response.data as { msg?: string }).msg)
          : e.message;
      throw new Error(msg || 'eBarimt API холболтын алдаа');
    }
    throw e;
  }
}

export async function createEbarimtRequest({
  items,
  paymentType = 'CASH',
  type = 'B2C_RECEIPT',
  consumerNo = null,
  customerTin = null,
  regNo,
}: EbarimtParams) {
  const merchantTin = '89001226559';

  let finalCustomerTin: string | null = customerTin != null ? String(customerTin) : null;

  // Хэрвээ regNo ирвэл tin татаж авна
  if (regNo) {
    const tinInfo = await getTinInfo(regNo);
    finalCustomerTin = String(tinInfo.tinNumber);
  }

  if (type === 'B2B_RECEIPT' && !finalCustomerTin) {
    throw new Error('B2B_RECEIPT үед customerTin заавал хэрэгтэй');
  }

  // Захиалгын unitPrice нь НӨАТ орсон үнэ.
  // НӨАТ-гүй дүн ба НӨАТ-ыг нийт дүнгээс салгаж бодно.
  const calculatedItems = items.map((item) => {
    const qty = item.qty || 1;
    const lineGross = +(item.unitPrice * qty).toFixed(2);
    const itemTotalVAT = +(lineGross * 0.1).toFixed(2);
    const itemTotalCityTax = 0;
    const itemTotalAmount = lineGross;
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
  const response = await fetch(`${EBARIMT_PUBLIC_API}/getTinInfo?regNo=${regNo}`);
  if (!response.ok) throw new Error('MerchantTin авахад алдаа гарлаа');
  const tinData = await response.json();

  if (tinData?.status !== 200) {
    throw new Error(
      typeof tinData?.msg === 'string'
        ? tinData.msg
        : 'Ийм регистрийн дугаартай байгууллага олдсонгүй'
    );
  }

  const tinNumber = tinData?.data ?? null;
  if (!tinNumber) {
    throw new Error('Ийм регистрийн дугаартай байгууллага олдсонгүй');
  }

  // 2-р шат: tin → нэр (getInfo — ТТД-ээр ижил endpoint)
  const { name: tinName } = await getEbarimtInfoByTin(String(tinNumber));
  return { tinNumber, tinName };
}

/**
 * api.ebarimt.mn — зөвхөн 7 оронтой байгууллагын регистрээр нэр, ТТД лавлах.
 * (И-баримтын 8 оронтой хэрэглэгчийн дугаарт ижил нээлттэй API байхгүй.)
 */
export async function lookupEbarimtOrganizationBySevenDigitReg(regNo: string): Promise<{
  name: string;
  tin: string;
}> {
  const t = regNo.trim();
  if (!/^\d{7}$/.test(t)) {
    throw new Error('Байгууллагын регистр 7 оронтой тоо байна');
  }
  const { tinNumber, tinName } = await getTinInfo(Number(t));
  return { name: tinName, tin: String(tinNumber) };
}
