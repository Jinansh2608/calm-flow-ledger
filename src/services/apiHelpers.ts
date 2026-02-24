/**
 * API Helper Functions
 * Comprehensive utilities implementing best practices from the integration guide
 */

import { apiClient, APIError, ValidationError, TimeoutError, NetworkError, requestLogger } from './api';
import { StandardResponse } from '@/types';

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export const validators = {
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidPhone: (phone: string): boolean => {
    const phoneRegex = /^[\d\s\-+()]{10,}$/;
    return phoneRegex.test(phone);
  },

  isValidGSTIN: (gstin: string): boolean => {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  },

  isPositiveNumber: (num: unknown): boolean => {
    const parsed = Number(num);
    return !isNaN(parsed) && parsed > 0;
  },

  isNonNegativeNumber: (num: unknown): boolean => {
    const parsed = Number(num);
    return !isNaN(parsed) && parsed >= 0;
  }
};

// ============================================================================
// ERROR HANDLERS
// ============================================================================

export const handleError = (error: unknown, context: string = 'Operation'): never => {
  if (error instanceof ValidationError) {
    console.error(`[${context}] Validation Error:`, error.fields);
    throw error;
  }

  if (error instanceof APIError) {
    console.error(`[${context}] API Error (${error.status}):`, error.message);
    throw error;
  }

  if (error instanceof TimeoutError) {
    console.error(`[${context}] Request Timeout:`, error.message);
    throw error;
  }

  if (error instanceof NetworkError) {
    console.error(`[${context}] Network Error:`, error.message);
    throw error;
  }

  console.error(`[${context}] Unexpected Error:`, error);
  throw error;
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ValidationError) {
    const fields = Object.entries(error.fields)
      .map(([field, msg]) => `${field}: ${msg}`)
      .join(', ');
    return `Validation failed: ${fields}`;
  }

  if (error instanceof APIError) {
    return error.message;
  }

  if (error instanceof TimeoutError) {
    return 'Request timed out. Please check your connection and try again.';
  }

  if (error instanceof NetworkError) {
    return 'Network error. Please check your internet connection.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

// ============================================================================
// RETRY & RESILIENCE
// ============================================================================

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  label: string = 'Operation'
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${label}] Attempt ${attempt}/${maxRetries}`);
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on validation errors
      if (error instanceof ValidationError) {
        throw error;
      }

      // Don't retry on certain API errors
      if (error instanceof APIError && error.status >= 400 && error.status < 500) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(2, attempt - 1);
        console.log(`[${label}] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export function debounce<T extends (...args: Parameters<T>[]) => unknown>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}

export function throttle<T extends (...args: Parameters<T>[]) => unknown>(
  fn: T,
  intervalMs: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCallTime >= intervalMs) {
      lastCallTime = now;
      fn(...args);
    }
  };
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

export async function batchOperation<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  options?: {
    parallel?: boolean;
    batchSize?: number;
    onProgress?: (completed: number, total: number) => void;
  }
): Promise<Array<{ success: boolean; item: T; result?: R; error?: unknown }>> {
  const results: Array<{ success: boolean; item: T; result?: R; error?: unknown }> = [];
  const { parallel = false, batchSize = 5, onProgress } = options || {};

  if (parallel) {
    // Parallel with batch limiting
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(item => operation(item))
      );

      batchResults.forEach((result, index) => {
        const item = batch[index];
        if (result.status === 'fulfilled') {
          results.push({ success: true, item, result: result.value });
        } else {
          results.push({ success: false, item, error: result.reason });
        }
      });

      onProgress?.(Math.min(i + batchSize, items.length), items.length);
    }
  } else {
    // Sequential
    for (let i = 0; i < items.length; i++) {
      try {
        const result = await operation(items[i]);
        results.push({ success: true, item: items[i], result });
      } catch (error) {
        results.push({ success: false, item: items[i], error });
      }

      onProgress?.(i + 1, items.length);
    }
  }

  return results;
}

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export function createPaginationParams(
  page: number,
  pageSize: number
): PaginationParams {
  return {
    limit: pageSize,
    offset: (page - 1) * pageSize
  };
}

export function calculatePageInfo<T>(
  data: T[],
  total: number,
  limit: number,
  offset: number
): PaginatedResponse<T> {
  return {
    data,
    total,
    limit,
    offset,
    hasMore: offset + data.length < total
  };
}

// ============================================================================
// DATA TRANSFORMATION
// ============================================================================

export const transformers = {
  toQueryParams: (obj: Record<string, unknown>): string => {
    const params = new URLSearchParams();
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.append(key, String(value));
      }
    });
    return params.toString();
  },

  formatCurrency: (amount: number, currency: string = '₹'): string => {
    return `${currency}${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  },

  formatDate: (date: string | Date, pattern: 'full' | 'short' = 'short'): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (pattern === 'full') {
      return dateObj.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    return dateObj.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  parseJSONSafe: <T = unknown>(json: string, fallback: T | null = null): T | null => {
    try {
      return JSON.parse(json);
    } catch {
      return fallback;
    }
  }
};

// ============================================================================
// COMMON PATTERNS
// ============================================================================

export async function getResourceWithFallback<T>(
  fetchFn: () => Promise<StandardResponse<T>>,
  fallback: T
): Promise<T> {
  try {
    const response = await fetchFn();
    return response.data || fallback;
  } catch (error) {
    console.warn('Failed to fetch resource, using fallback:', error);
    return fallback;
  }
}

export async function createResourceSafely<T>(
  createFn: () => Promise<StandardResponse<T>>,
  context: string
): Promise<T | null> {
  try {
    const response = await createFn();
    console.log(`[${context}] Created successfully:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[${context}] Failed to create:`, error);
    return null;
  }
}

export async function updateResourceSafely<T>(
  updateFn: () => Promise<StandardResponse<T>>,
  context: string
): Promise<T | null> {
  try {
    const response = await updateFn();
    console.log(`[${context}] Updated successfully:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[${context}] Failed to update:`, error);
    return null;
  }
}

export async function deleteResourceSafely(
  deleteFn: () => Promise<unknown>,
  context: string
): Promise<boolean> {
  try {
    await deleteFn();
    console.log(`[${context}] Deleted successfully`);
    return true;
  } catch (error) {
    console.error(`[${context}] Failed to delete:`, error);
    return false;
  }
}

// ============================================================================
// LOGGING & MONITORING
// ============================================================================

export const diagnostics = {
  getRequestHistory: () => requestLogger.getHistory(),
  
  getErrorHistory: () => requestLogger.getErrorHistory(),
  
  exportLogs: () => requestLogger.exportLogs(),
  
  getSummary: () => {
    const history = requestLogger.getHistory();
    const errors = history.filter(r => r.error);
    const avgDuration = history.length > 0
      ? history.reduce((sum, r) => sum + r.duration, 0) / history.length
      : 0;

    return {
      totalRequests: history.length,
      totalErrors: errors.length,
      averageDuration: Math.round(avgDuration),
      slowestRequest: Math.max(...history.map(r => r.duration)),
      errorRate: errors.length / history.length
    };
  },

  clearLogs: () => requestLogger.clear()
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  validators,
  handleError,
  getErrorMessage,
  withRetry,
  debounce,
  throttle,
  batchOperation,
  createPaginationParams,
  calculatePageInfo,
  transformers,
  getResourceWithFallback,
  createResourceSafely,
  updateResourceSafely,
  deleteResourceSafely,
  diagnostics
};
