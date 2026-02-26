import { API_CONFIG } from '@/config/api';
import { StandardResponse } from '@/types';

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public details: Record<string, unknown> = {},
    public originalError?: Error
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public fields: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ============================================================================
// API REQUEST LOGGER
// ============================================================================

interface RequestLog {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  data?: unknown;
  response?: unknown;
  error?: unknown;
  duration: number;
  status?: number;
}

export class RequestLogger {
  private requests: RequestLog[] = [];
  private maxRequests = 100;

  log(
    id: string,
    method: string,
    url: string,
    data: unknown = null,
    response: unknown = null,
    error: unknown = null,
    duration: number = 0,
    status?: number
  ): void {
    const entry: RequestLog = {
      id,
      timestamp: new Date().toISOString(),
      method,
      url,
      data,
      response,
      error,
      duration,
      status
    };

    this.requests.push(entry);

    if (this.requests.length > this.maxRequests) {
      this.requests.shift();
    }

    // Only log if not in production or if error
    if (process.env.NODE_ENV !== 'production' || error) {
      console.log(`[${id}] ${method} ${url} - ${status} (${duration}ms)`, {
        data: data ? JSON.stringify(data).substring(0, 100) : null,
        error
      });
    }
  }

  getHistory(): RequestLog[] {
    return this.requests;
  }

  getErrorHistory(): RequestLog[] {
    return this.requests.filter(r => r.error);
  }

  exportLogs(): string {
    return JSON.stringify(this.requests, null, 2);
  }

  clear(): void {
    this.requests = [];
  }
}

export const requestLogger = new RequestLogger();

// ============================================================================
// AUTHENTICATION SERVICE
// ============================================================================

export class AuthService {
  private static TOKEN_KEY = 'auth_token';
  private static USER_KEY = 'auth_user';

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static getUser(): unknown {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  static setUser(user: unknown): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static clearUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  static async login(username: string, password: string): Promise<{ access_token: string; token_type: string, user?: any }> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new APIError(
          response.status,
          'Login failed',
          errorData
        );
      }

      const data = await response.json();
      this.setToken(data.access_token);
      if (data.user) {
        this.setUser(data.user);
      }
      return data;
    } catch (error) {
      console.error('[AuthService] Login failed:', error);
      throw error;
    }
  }

  static async signup(username: string, email: string, password: string): Promise<{ access_token: string; token_type: string, user?: any }> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new APIError(
          response.status,
          'Signup failed',
          errorData
        );
      }

      const data = await response.json();
      this.setToken(data.access_token);
      if (data.user) {
        this.setUser(data.user);
      }
      return data;
    } catch (error) {
      console.error('[AuthService] Signup failed:', error);
      throw error;
    }
  }

  static async getMe(): Promise<any> {
    const token = this.getToken();
    if (!token) throw new Error("No token found");

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      this.setUser(data);
      return data;
    } catch (error) {
      console.error('[AuthService] getMe failed:', error);
      throw error;
    }
  }

  static logout(): void {
    this.clearToken();
    this.clearUser();
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  static async checkBackendHealth(): Promise<boolean> {
    try {
      console.log(`[API] Health check starting. Base URL: ${API_CONFIG.BASE_URL}`);
      console.log(`[API] Full health endpoint: ${API_CONFIG.BASE_URL}/health`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Use simple GET without credentials to avoid CORS preflight issues
      const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
        method: 'GET',
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log(`[API] Health check response: ${response.status}`);
      return response.ok;
    } catch (error: any) {
      console.error(`[API] Health check failed:`, error);
      if (error?.name === 'AbortError') {
        console.error(`[API] Health check timeout - backend at ${API_CONFIG.BASE_URL} is not responding`);
      }
      return false;
    }
  }
}

// ============================================================================
// API CLIENT WITH RETRY & ERROR HANDLING
// ============================================================================

interface RequestOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  bypassCache?: boolean;
}

class APIClient {
  private cache: Map<string, { data: unknown; time: number }> = new Map();
  private cacheTTL = 5000; // 5 seconds default

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client-Version': '1.0.0'
    };

    if (includeAuth) {
      const token = AuthService.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private getCacheKey(method: string, url: string): string {
    return `${method}:${url}`;
  }

  private isCached(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    return cached ? Date.now() - cached.time < this.cacheTTL : false;
  }

  private getFromCache(cacheKey: string): unknown {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.time < this.cacheTTL) {
      console.log(`[API] Cache hit: ${cacheKey}`);
      return cached.data;
    }
    return null;
  }

  private setCache(cacheKey: string, data: unknown): void {
    this.cache.set(cacheKey, { data, time: Date.now() });
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<StandardResponse<T>> {
    const requestId = this.generateRequestId();
    const method = (options.method || 'GET').toUpperCase();
    const retries = options.retries ?? 3;
    const retryDelay = options.retryDelay ?? 1000;
    const bypassCache = options.bypassCache ?? false;

    const fullUrl = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;
    const cacheKey = this.getCacheKey(method, fullUrl);

    // Check cache for GET requests
    if (method === 'GET' && !bypassCache && this.isCached(cacheKey)) {
      return this.getFromCache(cacheKey) as StandardResponse<T>;
    }

    let lastError: unknown;
    const startTime = performance.now();

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(
          `[${requestId}] ${method} ${endpoint}` +
          (attempt > 1 ? ` (Attempt ${attempt}/${retries})` : '')
        );

        const headers: HeadersInit = {
          ...this.getHeaders(),
          ...((options.headers || {}) as HeadersInit)
        };

        // For FormData, let the browser set Content-Type with boundary
        if (options.body instanceof FormData) {
          // If headers is a plain object (which this.getHeaders returns), we can delete
          if (typeof headers === 'object' && !Array.isArray(headers) && !(headers instanceof Headers)) {
             delete (headers as Record<string, string>)['Content-Type'];
          }
        } else {
             // Ensure JSON content type if not FormData
             // (this.getHeaders() already includes it, but for safety against overrides)
             if (typeof headers === 'object' && !Array.isArray(headers) && !(headers instanceof Headers)) {
                if (!(headers as Record<string, string>)['Content-Type']) {
                     (headers as Record<string, string>)['Content-Type'] = 'application/json';
                }
             }
        }

        console.log(`[${requestId}] Full URL: ${fullUrl}`);
        const response = await fetch(fullUrl, {
          ...options,
          headers,
          mode: 'cors',
          credentials: 'include',
          signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
        });

        const requestDuration = performance.now() - startTime;

        if (!response.ok) {
          let errorMessage = `API Error: ${response.status} ${response.statusText}`;
          let errorDetails: Record<string, unknown> = {};

          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
            errorDetails = errorData.details || errorData.errors || {};
          } catch (e) {
            console.warn(`[${requestId}] Could not parse error response`);
          }

          if (response.status === 401) {
            console.warn('[API] Unauthorized - clearing token');
            AuthService.logout();
            // Redirect to login would happen at app level
          }

          // Handle 422 validation errors
          if (response.status === 422) {
            requestLogger.log(requestId, method, endpoint, options.body, null, errorDetails, requestDuration, response.status);
            throw new ValidationError('Validation failed', errorDetails);
          }

          // Don't retry on client errors (except 429 rate limit)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            requestLogger.log(requestId, method, endpoint, options.body, null, errorMessage, requestDuration, response.status);
            throw new APIError(response.status, errorMessage, errorDetails);
          }

          // Retry-able errors
          if (response.status >= 500 || response.status === 429) {
            lastError = new APIError(response.status, errorMessage, errorDetails);

            if (attempt < retries) {
              const delay = retryDelay * Math.pow(2, attempt - 1);
              console.log(`[${requestId}] Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          }

          throw new APIError(response.status, errorMessage, errorDetails);
        }

        const data = await response.json();
        const successDuration = performance.now() - startTime;

        // Cache GET responses
        if (method === 'GET') {
          this.setCache(cacheKey, data);
        }

        requestLogger.log(requestId, method, endpoint, options.body, data, null, successDuration, response.status);
        return data;
      } catch (error) {
        const errorDuration = performance.now() - startTime;
        lastError = error;

        if (error instanceof APIError || error instanceof ValidationError) {
          throw error;
        }

        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          const networkError = new NetworkError(
            `Network request failed. Is the backend running at ${API_CONFIG.BASE_URL}?`,
            error as Error
          );
          requestLogger.log(requestId, method, endpoint, options.body, null, networkError, errorDuration);
          console.error(`[${requestId}] Network Error:`, networkError.message);

          if (attempt < retries) {
            const delay = retryDelay * Math.pow(2, attempt - 1);
            console.log(`[${requestId}] Network error, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          throw networkError;
        }

        if (error instanceof Error && error.name === 'AbortError') {
          const timeoutError = new TimeoutError(
            `Request timeout after ${API_CONFIG.TIMEOUT}ms. Backend at ${API_CONFIG.BASE_URL} may be unresponsive.`
          );
          requestLogger.log(requestId, method, endpoint, options.body, null, timeoutError, errorDuration);
          console.error(`[${requestId}] Timeout Error:`, timeoutError.message);

          if (attempt < retries) {
            const delay = retryDelay * Math.pow(2, attempt - 1);
            console.log(`[${requestId}] Timeout, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          throw timeoutError;
        }

        requestLogger.log(requestId, method, endpoint, options.body, null, error, errorDuration);

        if (attempt >= retries) {
          throw error;
        }
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  get<T>(endpoint: string, options?: RequestOptions): Promise<StandardResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<StandardResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<StandardResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<StandardResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  clearCache(): void {
    this.cache.clear();
  }

  getRequestHistory(): RequestLog[] {
    return requestLogger.getHistory();
  }

  exportLogs(): string {
    return requestLogger.exportLogs();
  }
}

export const apiClient = new APIClient();

// ============================================================================
// LEGACY API REQUEST FUNCTION (for backward compatibility)
// ============================================================================

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<StandardResponse<T>> {
  return apiClient.request<T>(endpoint, options as RequestOptions);
}
