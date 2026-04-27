// API Configuration and Axios Instance
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();

// Older service modules call paths like /auth/login, so they need /api as their default base path.
export const API_BASE_URL = configuredApiBaseUrl || '/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: { response: { status: number; data: { message: string } }; message: string }) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Extract error message
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';

    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;
