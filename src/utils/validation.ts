import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const employeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(8, 'Phone number must be at least 8 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  roleName: z.enum(['Admin', 'Manager', 'SalesAgent']),
});

export const productSchema = z.object({
  nameMongolian: z.string().min(1, 'Монгол нэр оруулна уу'),
  productCode: z.string().optional(),
  barcode: z.string().optional(),
  classificationCode: z.string().optional(),
  categoryId: z.number().optional(),
  stockQuantity: z.number().min(0, 'Үлдэгдэл тоо хэрхэн байна').int('Бүхэл тоо оруулна уу'),
  unitsPerBox: z.number().min(1, 'Хамгийн багадаа 1 байх ёстой').optional(),
  netWeight: z.number().min(0, 'Жин 0-с их байна').optional(),
  grossWeight: z.number().min(0, 'Жин 0-с их байна').optional(),
  priceWholesale: z.number().min(1, 'Бөөний үнэ оруулна уу'),
  priceRetail: z.number().min(1, 'Жижиглэн үнэ оруулна уу'),
  pricePerBox: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const customerSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  name2: z.string().optional(),
  organizationType: z.string().optional(),
  registrationNumber: z.string().optional(),
  ebarimtConsumerNo: z.string().max(20, 'E-Barimt дугаар 20 тэмдэгтээс хэтрэхгүй').optional(),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  district: z.string().optional(),
  phoneNumber: z.string().min(8, 'Phone number must be at least 8 characters'),
  isVatPayer: z.boolean().optional(),
  locationLatitude: z.number().min(-90).max(90, 'Invalid latitude'),
  locationLongitude: z.number().min(-180).max(180, 'Invalid longitude'),
  customerTypeId: z.number().min(1, 'Customer type is required'),
  assignedAgentId: z.number().optional(),
});

export const orderItemSchema = z.object({
  productId: z.number().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
});

export const orderSchema = z
  .object({
    customerKind: z.enum(['organization', 'individual']).optional(),
    customerId: z.number().optional(),
    distributorId: z.number().optional(),
    paymentMethod: z.enum(['Cash', 'BankTransfer', 'Sales', 'Padan', 'Credit'], {
      message: 'Payment method is required',
    }),
    isCredit: z.boolean().optional(),
    paidAmount: z.number().min(0, 'Paid amount must be non-negative').optional(),
    creditTermDays: z.number().min(1, 'Credit term must be at least 1 day').optional(),
    items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  })
  .refine(
    (data) => {
      const kind = data.customerKind ?? 'organization';
      if (kind === 'organization') {
        return typeof data.customerId === 'number' && data.customerId >= 1;
      }
      return true;
    },
    {
      message: 'Customer is required',
      path: ['customerId'],
    }
  )
  .refine(
    (data) => {
      if (data.isCredit && data.creditTermDays) {
        return data.paidAmount !== undefined && data.paidAmount >= 0;
      }
      return true;
    },
    {
      message: 'Paid amount is required for credit orders',
      path: ['paidAmount'],
    }
  );

export const inventoryAdjustmentSchema = z.object({
  productId: z.number().min(1, 'Product is required'),
  adjustment: z.number().refine((val) => val !== 0, 'Adjustment cannot be zero'),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
});
