// Products API Service
import apiClient from '../config/api';
import { Product } from '../types';

interface ApiResponse<T> {
  status: string;
  data: T;
}

class ProductsService {
  /**
   * Get all products
   */
  async getAll(): Promise<Product[]> {
    const response = await apiClient.get<ApiResponse<Product[]>>('/products');
    return response.data.data;
  }

  /**
   * Get product by ID
   */
  async getById(id: string): Promise<Product> {
    const response = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data;
  }

  /**
   * Create new product
   */
  async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const response = await apiClient.post<ApiResponse<Product>>('/products', product);
    return response.data.data;
  }

  /**
   * Update product
   */
  async update(id: string, product: Partial<Product>): Promise<Product> {
    const response = await apiClient.put<ApiResponse<Product>>(`/products/${id}`, product);
    return response.data.data;
  }

  /**
   * Delete product
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  }

  /**
   * Search products
   */
  async search(query: string): Promise<Product[]> {
    const response = await apiClient.get<ApiResponse<Product[]>>('/products', {
      params: { search: query }
    });
    return response.data.data;
  }
}

export default new ProductsService();

