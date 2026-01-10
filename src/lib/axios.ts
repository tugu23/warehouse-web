import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-hot-toast';

// Base URL is replaced at build time:
// - Production: empty string (nginx proxies /api to backend)
// - Development: empty string (Vite proxy forwards /api to localhost:4000)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; status?: string }>) => {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');

          // Only redirect if not already on login page
          if (window.location.pathname !== '/login') {
            toast.error('Your session has expired. Please login again.');
            window.location.href = '/login';
          }
          break;

        case 403:
          // Forbidden
          toast.error('You do not have permission to perform this action.');
          break;

        case 404:
          toast.error('The requested resource was not found.');
          break;

        case 422: {
          // Validation error
          const message = data?.message || 'Validation error occurred.';
          toast.error(message);
          break;
        }

        case 500:
          toast.error('Internal server error. Please try again later.');
          break;

        default: {
          const errorMessage = data?.message || 'An unexpected error occurred.';
          toast.error(errorMessage);
        }
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your internet connection.');
    } else {
      toast.error('An unexpected error occurred.');
    }

    return Promise.reject(error);
  }
);

export default api;
