import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import {
  Product,
  Customer,
  Order,
  Return,
  ProductBatch,
  MonthlyInventory,
} from '../types';

/**
 * Common Excel export utility functions
 */

// Style for header rows
const headerStyle = {
  font: { bold: true, color: { argb: 'FFFFFFFF' } },
  fill: {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: 'FF1976D2' },
  },
  alignment: { vertical: 'middle' as const, horizontal: 'center' as const },
  border: {
    top: { style: 'thin' as const },
    left: { style: 'thin' as const },
    bottom: { style: 'thin' as const },
    right: { style: 'thin' as const },
  },
};

/**
 * Auto-fit columns based on content
 */
const autoFitColumns = (worksheet: ExcelJS.Worksheet) => {
  worksheet.columns.forEach((column) => {
    if (!column.values) return;
    
    const lengths = column.values.map((v) => {
      const value = v?.toString() || '';
      return value.length;
    });
    
    const maxLength = Math.max(...lengths.filter((v) => typeof v === 'number'));
    column.width = Math.min(Math.max(maxLength + 2, 10), 50);
  });
};

/**
 * Trigger file download
 */
const downloadExcel = async (workbook: ExcelJS.Workbook, filename: string) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Export Products to Excel
 */
export const exportProductsToExcel = async (products: Product[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Бараа');

  // Add headers
  worksheet.columns = [
    { header: 'Барааны код', key: 'productCode', width: 15 },
    { header: 'Нэр (Англи)', key: 'nameEnglish', width: 25 },
    { header: 'Нэр (Монгол)', key: 'nameMongolian', width: 25 },
    { header: 'Нийлүүлэгч', key: 'supplier', width: 20 },
    { header: 'Үлдэгдэл', key: 'stockQuantity', width: 12 },
    { header: 'Бөөний үнэ', key: 'priceWholesale', width: 15 },
    { header: 'Жижиглэн үнэ', key: 'priceRetail', width: 15 },
  ];

  // Style header row
  worksheet.getRow(1).eachCell((cell) => {
    cell.style = headerStyle;
  });

  // Add data
  products.forEach((product) => {
    worksheet.addRow({
      productCode: product.productCode,
      nameEnglish: product.nameEnglish,
      nameMongolian: product.nameMongolian,
      supplier: product.supplier?.name || 'N/A',
      stockQuantity: product.stockQuantity,
      priceWholesale: Number(product.priceWholesale),
      priceRetail: Number(product.priceRetail),
    });
  });

  // Auto-fit columns
  autoFitColumns(worksheet);

  // Download
  await downloadExcel(workbook, 'products');
};

/**
 * Export Customers to Excel
 */
export const exportCustomersToExcel = async (customers: Customer[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Харилцагчид');

  worksheet.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Нэр', key: 'name', width: 25 },
    { header: 'Хаяг', key: 'address', width: 30 },
    { header: 'Утас', key: 'phoneNumber', width: 15 },
    { header: 'Төрөл', key: 'customerType', width: 12 },
    { header: 'Агент', key: 'agent', width: 20 },
    { header: 'Өрөг (Latitude)', key: 'latitude', width: 15 },
    { header: 'Уртраг (Longitude)', key: 'longitude', width: 15 },
  ];

  worksheet.getRow(1).eachCell((cell) => {
    cell.style = headerStyle;
  });

  customers.forEach((customer) => {
    worksheet.addRow({
      id: customer.id,
      name: customer.name,
      address: customer.address,
      phoneNumber: customer.phoneNumber,
      customerType: customer.customerType.name,
      agent: customer.assignedAgent?.name || 'N/A',
      latitude: customer.locationLatitude,
      longitude: customer.locationLongitude,
    });
  });

  autoFitColumns(worksheet);
  await downloadExcel(workbook, 'customers');
};

/**
 * Export Orders to Excel
 */
export const exportOrdersToExcel = async (orders: Order[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Захиалга');

  worksheet.columns = [
    { header: 'Захиалгын дугаар', key: 'id', width: 12 },
    { header: 'Харилцагч', key: 'customer', width: 25 },
    { header: 'Нийт дүн', key: 'totalAmount', width: 15 },
    { header: 'Төлбөрийн хэлбэр', key: 'paymentMethod', width: 15 },
    { header: 'Төлбөрийн төлөв', key: 'paymentStatus', width: 15 },
    { header: 'Төлсөн дүн', key: 'paidAmount', width: 15 },
    { header: 'Үлдэгдэл', key: 'remainingAmount', width: 15 },
    { header: 'Статус', key: 'status', width: 12 },
    { header: 'Үүсгэсэн', key: 'createdBy', width: 20 },
    { header: 'Огноо', key: 'createdAt', width: 20 },
  ];

  worksheet.getRow(1).eachCell((cell) => {
    cell.style = headerStyle;
  });

  orders.forEach((order) => {
    worksheet.addRow({
      id: order.id,
      customer: order.customer?.name || 'N/A',
      totalAmount: Number(order.totalAmount),
      paymentMethod: order.paymentMethod || 'N/A',
      paymentStatus: order.paymentStatus || 'N/A',
      paidAmount: order.paidAmount || 0,
      remainingAmount: order.remainingAmount || 0,
      status: order.status,
      createdBy: order.createdBy?.name || 'N/A',
      createdAt: format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm'),
    });
  });

  autoFitColumns(worksheet);
  await downloadExcel(workbook, 'orders');
};

/**
 * Export Returns to Excel
 */
export const exportReturnsToExcel = async (returns: Return[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Буцаалт');

  worksheet.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Захиалгын дугаар', key: 'orderId', width: 15 },
    { header: 'Бараа', key: 'product', width: 25 },
    { header: 'Тоо ширхэг', key: 'quantity', width: 12 },
    { header: 'Шалтгаан', key: 'reason', width: 30 },
    { header: 'Үүсгэсэн', key: 'createdBy', width: 20 },
    { header: 'Огноо', key: 'createdAt', width: 20 },
  ];

  worksheet.getRow(1).eachCell((cell) => {
    cell.style = headerStyle;
  });

  returns.forEach((returnItem) => {
    worksheet.addRow({
      id: returnItem.id,
      orderId: returnItem.orderId,
      product: returnItem.product?.nameEnglish || 'N/A',
      quantity: returnItem.quantity,
      reason: returnItem.reason,
      createdBy: returnItem.createdBy?.name || 'N/A',
      createdAt: format(new Date(returnItem.createdAt), 'yyyy-MM-dd HH:mm'),
    });
  });

  autoFitColumns(worksheet);
  await downloadExcel(workbook, 'returns');
};

/**
 * Export Product Batches to Excel
 */
export const exportProductBatchesToExcel = async (batches: ProductBatch[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Барааны багц');

  worksheet.columns = [
    { header: 'Багцын дугаар', key: 'batchNumber', width: 15 },
    { header: 'Бараа', key: 'product', width: 25 },
    { header: 'Тоо ширхэг', key: 'quantity', width: 12 },
    { header: 'Нийлүүлэгч', key: 'supplier', width: 20 },
    { header: 'Ирсэн огноо', key: 'receivedDate', width: 15 },
    { header: 'Дуусах хугацаа', key: 'expiryDate', width: 15 },
    { header: 'Бөөний үнэ', key: 'priceWholesale', width: 15 },
    { header: 'Жижиглэн үнэ', key: 'priceRetail', width: 15 },
  ];

  worksheet.getRow(1).eachCell((cell) => {
    cell.style = headerStyle;
  });

  batches.forEach((batch) => {
    worksheet.addRow({
      batchNumber: batch.batchNumber,
      product: batch.product?.nameEnglish || 'N/A',
      quantity: batch.quantity,
      supplier: batch.supplier?.name || 'N/A',
      receivedDate: format(new Date(batch.receivedDate), 'yyyy-MM-dd'),
      expiryDate: format(new Date(batch.expiryDate), 'yyyy-MM-dd'),
      priceWholesale: batch.priceWholesale,
      priceRetail: batch.priceRetail,
    });
  });

  autoFitColumns(worksheet);
  await downloadExcel(workbook, 'product_batches');
};

/**
 * Export Monthly Inventory to Excel
 */
export const exportMonthlyInventoryToExcel = async (
  inventory: MonthlyInventory[],
  month: string
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`Сарын тайлан - ${month}`);

  worksheet.columns = [
    { header: 'Бараа', key: 'product', width: 25 },
    { header: 'Эхлэх үлдэгдэл', key: 'openingStock', width: 15 },
    { header: 'Орлого', key: 'received', width: 12 },
    { header: 'Зарагдсан', key: 'sold', width: 12 },
    { header: 'Буцаалт', key: 'returned', width: 12 },
    { header: 'Тохиргоо', key: 'adjusted', width: 12 },
    { header: 'Эцсийн үлдэгдэл', key: 'closingStock', width: 15 },
  ];

  worksheet.getRow(1).eachCell((cell) => {
    cell.style = headerStyle;
  });

  inventory.forEach((item) => {
    worksheet.addRow({
      product: item.product?.nameEnglish || 'N/A',
      openingStock: item.openingStock,
      received: item.received,
      sold: item.sold,
      returned: item.returned,
      adjusted: item.adjusted,
      closingStock: item.closingStock,
    });
  });

  // Add totals row
  const totalsRow = worksheet.addRow({
    product: 'НИЙТ',
    openingStock: inventory.reduce((sum, item) => sum + item.openingStock, 0),
    received: inventory.reduce((sum, item) => sum + item.received, 0),
    sold: inventory.reduce((sum, item) => sum + item.sold, 0),
    returned: inventory.reduce((sum, item) => sum + item.returned, 0),
    adjusted: inventory.reduce((sum, item) => sum + item.adjusted, 0),
    closingStock: inventory.reduce((sum, item) => sum + item.closingStock, 0),
  });

  totalsRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE3F2FD' },
    };
  });

  autoFitColumns(worksheet);
  await downloadExcel(workbook, `monthly_inventory_${month}`);
};

/**
 * Export Sales Report to Excel
 */
export const exportSalesReportToExcel = async (
  orders: Order[],
  startDate: string,
  endDate: string
) => {
  const workbook = new ExcelJS.Workbook();
  
  // Summary sheet
  const summarySheet = workbook.addWorksheet('Хураангуй');
  summarySheet.addRow(['Борлуулалтын тайлан']);
  summarySheet.addRow(['Хугацаа', `${startDate} - ${endDate}`]);
  summarySheet.addRow([]);
  
  const totalSales = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  
  summarySheet.addRow(['Нийт борлуулалт', totalSales]);
  summarySheet.addRow(['Нийт захиалга', totalOrders]);
  summarySheet.addRow(['Дундаж захиалгын үнэ', avgOrderValue]);

  // Orders detail sheet
  const detailSheet = workbook.addWorksheet('Дэлгэрэнгүй');
  detailSheet.columns = [
    { header: 'Захиалгын №', key: 'id', width: 12 },
    { header: 'Харилцагч', key: 'customer', width: 25 },
    { header: 'Дүн', key: 'totalAmount', width: 15 },
    { header: 'Төлбөр', key: 'paymentMethod', width: 12 },
    { header: 'Статус', key: 'status', width: 12 },
    { header: 'Агент', key: 'agent', width: 20 },
    { header: 'Огноо', key: 'createdAt', width: 20 },
  ];

  detailSheet.getRow(1).eachCell((cell) => {
    cell.style = headerStyle;
  });

  orders.forEach((order) => {
    detailSheet.addRow({
      id: order.id,
      customer: order.customer?.name || 'N/A',
      totalAmount: Number(order.totalAmount),
      paymentMethod: order.paymentMethod || 'N/A',
      status: order.status,
      agent: order.createdBy?.name || 'N/A',
      createdAt: format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm'),
    });
  });

  autoFitColumns(summarySheet);
  autoFitColumns(detailSheet);
  await downloadExcel(workbook, `sales_report_${startDate}_${endDate}`);
};

