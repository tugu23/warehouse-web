import { ProductBatch, ExpiryStatus } from '../types';
import { format } from 'date-fns';

/**
 * Хугацааны статус тодорхойлох
 */
export function getExpiryStatus(batch?: ProductBatch): ExpiryStatus {
  if (!batch || !batch.expiryDate) return 'no-expiry';
  
  const today = new Date();
  const expiryDate = new Date(batch.expiryDate);
  const daysUntilExpiry = Math.floor(
    (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry < 30) return 'critical';
  if (daysUntilExpiry < 90) return 'warning';
  return 'good';
}

/**
 * Хугацаа хэдэн хоног үлдсэн тооцоолох
 */
export function getDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  const expiry = new Date(expiryDate);
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Статусын өнгө авах
 */
export function getStatusColor(status: ExpiryStatus): 'error' | 'warning' | 'info' | 'success' | 'default' {
  const colors = {
    expired: 'error',
    critical: 'warning',
    warning: 'info',
    good: 'success',
    'no-expiry': 'default',
  } as const;
  
  return colors[status];
}

/**
 * Статусын icon авах
 */
export function getStatusIcon(status: ExpiryStatus): string {
  const icons = {
    expired: '🔴',
    critical: '🟡',
    warning: '🔵',
    good: '🟢',
    'no-expiry': '⚪',
  };
  
  return icons[status];
}

/**
 * Статусын текст авах
 */
export function getStatusLabel(status: ExpiryStatus, days?: number): string {
  const labels = {
    expired: 'Хугацаа дууссан',
    critical: days ? `${days} хоног үлдсэн` : 'Эрсдэлтэй',
    warning: days ? `${days} хоног үлдсэн` : 'Анхааруулга',
    good: 'Хугацаа сайн',
    'no-expiry': 'Хугацаагүй',
  };
  
  return labels[status];
}

/**
 * Огноог форматлах
 */
export function formatExpiryDate(date: string | null): string {
  if (!date) return 'Хугацаагүй';
  try {
    return format(new Date(date), 'yyyy-MM-dd');
  } catch (error) {
    return 'Буруу огноо';
  }
}

