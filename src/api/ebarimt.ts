import axios from 'axios';
import { EbarimtParams } from '@/types/ebarimt';
import api from '../lib/axios';

type OrganizationLookupResponse = {
  organization?: {
    regno: string;
    tin?: string;
    name: string;
    address?: string;
    vatPayer?: boolean;
    status?: string;
  };
};

type RegNoLookupResult = {
  regno: string;
  tin: string;
  name: string;
  address?: string;
  vatPayer?: boolean;
  status?: string;
};

export async function getEbarimtInfoByTin(tin: string): Promise<{ name: string; tin: string }> {
  const normalizedTin = tin.trim();
  if (!normalizedTin) {
    throw new Error('\u0422\u0422\u0414 \u043e\u0440\u0443\u0443\u043b\u043d\u0430 \u0443\u0443');
  }

  try {
    const response = await api.get<{
      data?: {
        organization?: {
          tin?: string;
          name?: string;
        };
      };
    }>(`/api/etax/organization/${encodeURIComponent(normalizedTin)}`);

    const name = response.data.data?.organization?.name?.trim() ?? '';
    if (!name) {
      throw new Error(
        '\u0418\u0440\u0433\u044d\u043d/\u0431\u0430\u0439\u0433\u0443\u0443\u043b\u043b\u0430\u0433\u044b\u043d \u043d\u044d\u0440 \u043e\u043b\u0434\u0441\u043e\u043d\u0433\u04af\u0439'
      );
    }

    return { name, tin: response.data.data?.organization?.tin?.trim() || normalizedTin };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const msg =
        error.response?.data &&
        typeof error.response.data === 'object' &&
        'msg' in error.response.data
          ? String((error.response.data as { msg?: string }).msg)
          : error.message;
      throw new Error(msg || 'eBarimt API \u0445\u043e\u043b\u0431\u043e\u043b\u0442\u044b\u043d \u0430\u043b\u0434\u0430\u0430');
    }
    throw error;
  }
}

async function lookupOrganizationViaBackend(regNo: string | number) {
  const normalizedRegNo = String(regNo ?? '').trim();
  if (
    !/^\d{7}$/.test(normalizedRegNo) &&
    !/^\d{10,12}$/.test(normalizedRegNo) &&
    !/^[A-Z\u0410-\u042f\u0401\u04e8\u04ae]{2}\d{8}$/.test(normalizedRegNo)
  ) {
    throw new Error(
      '\u0420\u0435\u0433\u0438\u0441\u0442\u0440 7 \u043e\u0440\u043e\u043d, 10\u201312 \u043e\u0440\u043e\u043d, \u044d\u0441\u0432\u044d\u043b 2 \u04af\u0441\u044d\u0433 + 8 \u0442\u043e\u043e \u0445\u044d\u043b\u0431\u044d\u0440\u0442\u044d\u0439 \u0431\u0430\u0439\u043d\u0430'
    );
  }

  const response = await api.get<{ data?: OrganizationLookupResponse }>(
    `/api/etax/organization/${normalizedRegNo}`
  );
  const organization = response.data.data?.organization;

  if (!organization?.tin || !organization?.name) {
    throw new Error(
      '\u0411\u0430\u0439\u0433\u0443\u0443\u043b\u043b\u0430\u0433\u044b\u043d \u043c\u044d\u0434\u044d\u044d\u043b\u044d\u043b \u043e\u043b\u0434\u0441\u043e\u043d\u0433\u04af\u0439'
    );
  }

  return organization;
}

export async function lookupEbarimtByRegNo(regNo: string | number): Promise<RegNoLookupResult> {
  const normalizedRegNo = String(regNo ?? '').trim().toUpperCase();
  if (
    !/^\d{7}$/.test(normalizedRegNo) &&
    !/^\d{10,12}$/.test(normalizedRegNo) &&
    !/^[A-Z\u0410-\u042f\u0401\u04e8\u04ae]{2}\d{8}$/.test(normalizedRegNo)
  ) {
    throw new Error(
      '\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0439\u043d \u0434\u0443\u0433\u0430\u0430\u0440 7 \u043e\u0440\u043e\u043d, 10\u201312 \u043e\u0440\u043e\u043d, \u044d\u0441\u0432\u044d\u043b 2 \u04af\u0441\u044d\u0433 + 8 \u0442\u043e\u043e \u0445\u044d\u043b\u0431\u044d\u0440\u0442\u044d\u0439 \u0431\u0430\u0439\u043d\u0430'
    );
  }

  const response = await api.get<{ data?: OrganizationLookupResponse }>(
    `/api/etax/organization/${normalizedRegNo}`
  );
  const organization = response.data.data?.organization;

  if (!organization?.tin || !organization?.name) {
    throw new Error(
      '\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0439\u043d \u0434\u0443\u0433\u0430\u0430\u0440\u0430\u0430\u0440 \u043c\u044d\u0434\u044d\u044d\u043b\u044d\u043b \u043e\u043b\u0434\u0441\u043e\u043d\u0433\u04af\u0439'
    );
  }

  return {
    regno: organization.regno,
    tin: organization.tin,
    name: organization.name,
    address: organization.address,
    vatPayer: organization.vatPayer,
    status: organization.status,
  };
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

  if (regNo) {
    const tinInfo = await getTinInfo(regNo);
    finalCustomerTin = String(tinInfo.tinNumber);
  }

  if (type === 'B2B_RECEIPT' && !finalCustomerTin) {
    throw new Error('B2B_RECEIPT \u04af\u0435\u0434 customerTin \u0437\u0430\u0430\u0432\u0430\u043b \u0445\u044d\u0440\u044d\u0433\u0442\u044d\u0439');
  }

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
      measureUnit: '\u0448',
      qty,
      unitPrice: basePrice,
      totalVAT: itemTotalVAT,
      totalCityTax: itemTotalCityTax,
      totalAmount: itemTotalAmount,
    };
  });

  const totalAmount = +calculatedItems.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2);
  const totalVAT = +calculatedItems.reduce((sum, item) => sum + item.totalVAT, 0).toFixed(2);

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

export async function getTinInfo(regNo: number | string) {
  const organization = await lookupEbarimtByRegNo(regNo);
  return {
    tinNumber: organization.tin,
    tinName: organization.name,
  };
}

export async function lookupEbarimtOrganizationBySevenDigitReg(regNo: string): Promise<{
  name: string;
  tin: string;
}> {
  const organization = await lookupOrganizationViaBackend(regNo);
  return { name: organization.name, tin: organization.tin };
}
