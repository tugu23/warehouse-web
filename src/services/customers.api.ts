// Customers API Service
import apiClient from '../config/api';
import { Customer } from '../types';

interface ApiResponse<T> {
  status: string;
  data: T;
}

class CustomersService {
  /**
   * Get all customers
   */
  async getAll(): Promise<Customer[]> {
    const response = await apiClient.get<ApiResponse<Customer[]>>('/customers');
    return response.data.data;
  }

  /**
   * Get customer by ID
   */
  async getById(id: string): Promise<Customer> {
    const response = await apiClient.get<ApiResponse<Customer>>(`/customers/${id}`);
    return response.data.data;
  }

  /**
   * Create new customer
   */
  async create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const response = await apiClient.post<ApiResponse<Customer>>('/customers', customer);
    return response.data.data;
  }

  /**
   * Update customer
   */
  async update(id: string, customer: Partial<Customer>): Promise<Customer> {
    const response = await apiClient.put<ApiResponse<Customer>>(`/customers/${id}`, customer);
    return response.data.data;
  }

  /**
   * Delete customer
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/customers/${id}`);
  }

  /**
   * Search customers
   */
  async search(query: string): Promise<Customer[]> {
    const response = await apiClient.get<ApiResponse<Customer[]>>('/customers', {
      params: { search: query }
    });
    return response.data.data;
  }
}

export default new CustomersService();

