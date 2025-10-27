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
  nameMongolian: z.string().min(1, 'Mongolian name is required'),
  nameEnglish: z.string().min(1, 'English name is required'),
  productCode: z.string().min(1, 'Product code is required'),
  supplierId: z.number().min(1, 'Supplier is required'),
  stockQuantity: z.number().min(0, 'Stock quantity must be non-negative'),
  priceWholesale: z.number().min(0, 'Wholesale price must be non-negative'),
  priceRetail: z.number().min(0, 'Retail price must be non-negative'),
});

export const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  phoneNumber: z.string().min(8, 'Phone number must be at least 8 characters'),
  locationLatitude: z.number().min(-90).max(90, 'Invalid latitude'),
  locationLongitude: z.number().min(-180).max(180, 'Invalid longitude'),
  customerTypeId: z.number().min(1, 'Customer type is required'),
  assignedAgentId: z.number().optional(),
});

export const orderItemSchema = z.object({
  productId: z.number().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
});

export const orderSchema = z.object({
  customerId: z.number().min(1, 'Customer is required'),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
});

export const returnSchema = z.object({
  orderId: z.number().min(1, 'Order is required'),
  productId: z.number().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export const inventoryAdjustmentSchema = z.object({
  productId: z.number().min(1, 'Product is required'),
  adjustment: z.number().refine((val) => val !== 0, 'Adjustment cannot be zero'),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
});
