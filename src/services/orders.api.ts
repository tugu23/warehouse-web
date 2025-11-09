// Orders API Service
import apiClient from '../config/api';
import { Order } from '../types';

interface ApiResponse<T> {
  status: string;
  data: T;
}

class OrdersService {
  /**
   * Get all orders
   */
  async getAll(): Promise<Order[]> {
    const response = await apiClient.get<ApiResponse<Order[]>>('/orders');
    return response.data.data;
  }

  /**
   * Get order by ID
   */
  async getById(id: string): Promise<Order> {
    const response = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data.data;
  }

  /**
   * Create new order
   */
  async create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'orderNumber'>): Promise<Order> {
    const response = await apiClient.post<ApiResponse<Order>>('/orders', order);
    return response.data.data;
  }

  /**
   * Update order
   */
  async update(id: string, order: Partial<Order>): Promise<Order> {
    const response = await apiClient.put<ApiResponse<Order>>(`/orders/${id}`, order);
    return response.data.data;
  }

  /**
   * Cancel order
   */
  async cancel(id: string): Promise<Order> {
    const response = await apiClient.patch<ApiResponse<Order>>(`/orders/${id}/cancel`);
    return response.data.data;
  }

  /**
   * Get orders by customer
   */
  async getByCustomer(customerId: string): Promise<Order[]> {
    const response = await apiClient.get<ApiResponse<Order[]>>('/orders', {
      params: { customerId }
    });
    return response.data.data;
  }
}

export default new OrdersService();

