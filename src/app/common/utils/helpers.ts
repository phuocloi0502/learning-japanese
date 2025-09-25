// Common helper functions

import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export function ensureAuthenticated(authService: AuthService, router: Router): string | null {
  // Kiểm tra trạng thái đăng nhập (có thể dùng biến hoặc Observable tuỳ app)
  const isAuthenticated = !!authService.getCurrentUser?.() || !!authService.getUserId();
  if (!isAuthenticated) {
    router.navigate(['/login']);
    return null;
  }
  const userId = authService.getUserId();
  if (!userId) {
    router.navigate(['/login']);
    return null;
  }
  return userId;
}
/**
 * Generate a random ID
 */

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Check if device is mobile
 */
export function isMobile(): boolean {
  return window.innerWidth <= 768;
}

/**
 * Get random item from array
 */
export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Shuffle array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Format date to Vietnamese format
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get JLPT level color
 */
export function getJLPTLevelColor(level: string): string {
  const colors: Record<string, string> = {
    N5: '#4CAF50',
    N4: '#2196F3',
    N3: '#FF9800',
    N2: '#F44336',
    N1: '#9C27B0',
  };
  return colors[level] || '#666';
}
