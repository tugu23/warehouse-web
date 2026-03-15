// import { EbarimtParams } from "@/types/ebarimt";

// const EBARIMT_URL = "http://localhost:7080/rest/receipt";

// export async function sendEbarimtRequest(params: EbarimtParams) {
//   try {
//     const payload = await createEbarimtRequest(params);

//     const response = await fetch(EBARIMT_URL, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(payload),
//     });

//     const result = await response.json();

//     if (!response.ok) {
//       throw new Error(result?.message || "eBarimt илгээхэд алдаа гарлаа");
//     }

//     return result;
//   } catch (error) {
//     console.error("eBarimt error:", error);
//     throw error;
//   }
// }

// export async function createEbarimtRequest({
//   items,
//   paymentType = "CASH",
//   type = "B2C_RECEIPT",
//   consumerNo = null,
//   customerTin = null,
// }: EbarimtParams) {

//   const merchantTin = "89001226559";

//   if (type === "B2B_RECEIPT" && !customerTin) {
//     throw new Error("B2B_RECEIPT үед customerTin заавал хэрэгтэй");
//   }

//   const calculatedItems = items.map((item) => {

//     const qty = item.qty || 1;

//     const basePrice = +(item.unitPrice / 1.12).toFixed(2);

//     const itemTotalVAT = +(basePrice * 0.1 * qty).toFixed(2);

//     const itemTotalAmount = +(item.unitPrice * qty).toFixed(2);

//     return {
//       name: item.name,
//       barCode: item.barCode,
//       barCodeType: "GS1",
//       classificationCode: item.classificationCode ?? "2399421",
//       taxProductCode: null,
//       measureUnit: "ш",
//       qty,
//       unitPrice: basePrice,
//       totalVAT: itemTotalVAT,
//       totalCityTax: 0,
//       totalAmount: itemTotalAmount,
//     };
//   });

//   const totalAmount = calculatedItems.reduce((sum, i) => sum + i.totalAmount, 0);
//   const totalVAT = calculatedItems.reduce((sum, i) => sum + i.totalVAT, 0);

//   return {
//     branchNo: "001",
//     totalAmount,
//     totalVAT,
//     totalCityTax: 0,
//     districtCode: "2506",
//     merchantTin,
//     posNo: "001",

//     customerTin: type === "B2B_RECEIPT" ? customerTin : null,
//     consumerNo: type === "B2C_RECEIPT" ? consumerNo : null,

//     type,
//     inactiveId: null,
//     reportMonth: null,
//     billIdSuffix: "01",

//     receipts: [
//       {
//         totalAmount,
//         taxType: "VAT_ABLE",
//         merchantTin,
//         customerTin: type === "B2B_RECEIPT" ? customerTin : null,
//         totalVAT,
//         totalCityTax: 0,
//         invoiceId: null,
//         bankAccountNo: "",
//         iBan: "",
//         items: calculatedItems,
//       },
//     ],

//     payments: [
//       {
//         code: paymentType,
//         status: "PAID",
//         paidAmount: totalAmount,
//       },
//     ],
//   };
// }

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

  let finalCustomerTin = customerTin;

  // Хэрвээ regNo ирвэл tin татаж авна
  if (regNo) {
    const tinInfo = await getTinInfo(regNo);
    finalCustomerTin = tinInfo.tinNumber;
  }

  if (type === 'B2B_RECEIPT' && !finalCustomerTin) {
    throw new Error('B2B_RECEIPT үед customerTin заавал хэрэгтэй');
  }

  const calculatedItems = items.map((item) => {
    const qty = item.qty || 1;

    const basePrice = +(item.unitPrice / 1.12).toFixed(2);

    const itemTotalVAT = +(basePrice * 0.1 * qty).toFixed(2);
    const itemTotalCityTax = +(basePrice * 0.02 * qty).toFixed(2);

    const itemTotalAmount = +(item.unitPrice * qty).toFixed(2);

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

  const totalAmount = calculatedItems.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalVAT = calculatedItems.reduce((sum, i) => sum + i.totalVAT, 0);
  const totalCityTax = calculatedItems.reduce((sum, i) => sum + i.totalCityTax, 0);

  return {
    branchNo: '001',
    totalAmount,
    totalVAT,
    totalCityTax,
    districtCode: '2506',
    merchantTin,
    posNo: '001',

    customerTin: type === 'B2B_RECEIPT' ? finalCustomerTin : null,
    consumerNo: type === 'B2C_RECEIPT' ? consumerNo : null,

    type,
    inactiveId: null,
    reportMonth: null,
    billIdSuffix: '01',

    receipts: [
      {
        totalAmount,
        taxType: 'VAT_ABLE',
        merchantTin,
        customerTin: type === 'B2B_RECEIPT' ? finalCustomerTin : null,
        totalVAT,
        totalCityTax,
        invoiceId: null,
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
