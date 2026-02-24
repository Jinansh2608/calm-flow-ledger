import { apiRequest } from './api';
import {
  PaymentRecord,
  PaymentDetail,
  PaymentListResponse,
  PaymentSummary,
  PaymentStatusResponse,
  BulkPaymentRequest,
  BulkPaymentResponse
} from '@/types';

interface ApiError {
  message: string;
  code?: string;
}

export const paymentService = {
  // ============================================================
  // PAYMENT CRUD OPERATIONS
  // ============================================================

  /**
   * Create a new payment record
   * POST /api/payments
   */
  createPayment: async (request: {
    vendor_id: number;
    vendor_order_id?: number;
    amount: number;
    payment_date: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    reference_number?: string;
    notes?: string;
  }) => {
    try {
      // Validate amount
      if (!request.amount || request.amount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      const response = await apiRequest<PaymentRecord>('/payments', {
        method: 'POST',
        body: JSON.stringify(request)
      });
      return response.data;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Failed to create payment:', apiError.message);
      throw error;
    }
  },

  /**
   * Get payment by ID
   * GET /api/payments/{payment_id}
   */
  getPaymentById: async (paymentId: number) => {
    try {
      const response = await apiRequest<PaymentDetail>(`/payments/${paymentId}`);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error(`Failed to fetch payment ${paymentId}:`, apiError.message);
      throw error;
    }
  },

  /**
   * List payments with advanced filtering and pagination
   * GET /api/payments?vendor_id=42&status=PENDING&limit=10&offset=0
   */
  listPayments: async (filters?: {
    vendor_id?: number;
    status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'RECONCILED';
    payment_date_from?: string; // YYYY-MM-DD
    payment_date_to?: string; // YYYY-MM-DD
    min_amount?: number;
    max_amount?: number;
    limit?: number;
    offset?: number;
    skip?: number; // Add skip for compatibility with backend "skip" param
  }) => {
    try {
      const params = new URLSearchParams();
      
      if (filters?.vendor_id) params.append('vendor_id', String(filters.vendor_id));
      if (filters?.status) params.append('status', filters.status);
      if (filters?.payment_date_from) params.append('payment_date_from', filters.payment_date_from);
      if (filters?.payment_date_to) params.append('payment_date_to', filters.payment_date_to);
      if (filters?.min_amount) params.append('min_amount', String(filters.min_amount));
      if (filters?.max_amount) params.append('max_amount', String(filters.max_amount));
      
      // Support both limit/offset and limit/skip
      const limit = filters?.limit || 50;
      const skip = filters?.skip !== undefined ? filters.skip : (filters?.offset || 0);
      
      params.append('limit', String(limit));
      params.append('skip', String(skip)); // Backend uses skip

      const response = await apiRequest<PaymentListResponse | { payments: PaymentRecord[], payment_count: number, total_count: number }>(
        `/payments${params.toString() ? '?' + params.toString() : ''}`
      );
      const data = response.data;
      
      // Handle the new response format from the fixed backend endpoint
      if (data && 'payments' in data && Array.isArray(data.payments)) {
          return {
              data: data.payments,
              total: data.total_count || data.payment_count || 0,
              limit: limit,
              offset: skip
          };
      }
      
      // Handle array response (if backend returns just list of payments)
      if (Array.isArray(data)) {
        return {
          data: data,
          total: data.length,
          limit: limit,
          offset: skip
        };
      }
      
      // Handle Standard PaymentListResponse
      return data as PaymentListResponse;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Failed to list payments:', apiError.message);
      // Return empty list as fallback
      return {
        data: [],
        total: 0,
        limit: filters?.limit || 50,
        offset: filters?.offset || 0
      };
    }
  },

  /**
   * Get all payments for a vendor
   * GET /api/vendors/{vendor_id}/payments
   */
  getVendorPayments: async (vendorId: number, limit: number = 50, offset: number = 0) => {
    try {
      const response = await apiRequest<PaymentListResponse>(
        `/vendors/${vendorId}/payments?limit=${limit}&offset=${offset}`
      );
      return response.data;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error(`Failed to fetch payments for vendor ${vendorId}:`, apiError.message);
      return { data: [], total: 0, limit, offset };
    }
  },

  /**
   * Update payment details
   * PUT /api/payments/{payment_id}
   */
  updatePayment: async (paymentId: number, request: Partial<PaymentRecord>) => {
    try {
      const response = await apiRequest<PaymentRecord>(`/payments/${paymentId}`, {
        method: 'PUT',
        body: JSON.stringify(request)
      });
      return response.data;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error(`Failed to update payment ${paymentId}:`, apiError.message);
      throw error;
    }
  },

  /**
   * Update payment status
   * PUT /api/payments/{payment_id}/status
   */
  updatePaymentStatus: async (paymentId: number, status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'RECONCILED') => {
    try {
      const response = await apiRequest<PaymentRecord>(`/payments/${paymentId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      return response.data;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error(`Failed to update status for payment ${paymentId}:`, apiError.message);
      throw error;
    }
  },

  /**
   * Delete payment record
   * DELETE /api/payments/{payment_id}
   */
  deletePayment: async (paymentId: number) => {
    try {
      const response = await apiRequest<{ status: string; message: string; data: { payment_id: number } }>(
        `/payments/${paymentId}`,
        { method: 'DELETE' }
      );
      return response.data;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error(`Failed to delete payment ${paymentId}:`, apiError.message);
      throw error;
    }
  },

  // ============================================================
  // PAYMENT ANALYTICS
  // ============================================================

  /**
   * Get payment summary by vendor
   * GET /api/payments/summary/by-vendor?start_date=2026-01-01&end_date=2026-02-28
   */
  getPaymentSummary: async (startDate?: string, endDate?: string) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await apiRequest<PaymentSummary>(
        `/payments/summary/by-vendor${params.toString() ? '?' + params.toString() : ''}`
      );
      return response.data;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Failed to fetch payment summary:', apiError.message);
      // Return default summary
      return {
        total_amount: 0,
        total_pending: 0,
        total_completed: 0,
        total_failed: 0,
        pending_count: 0,
        completed_count: 0,
        failed_count: 0,
        average_payment_amount: 0,
        vendors: []
      };
    }
  },

  /**
   * Get payment pending amounts by vendor
   * GET /api/payments/pending
   */
  getPendingPayments: async () => {
    try {
      const response = await apiRequest<PaymentListResponse>(`/payments?status=PENDING`);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Failed to fetch pending payments:', apiError.message);
      return { data: [], total: 0, limit: 50, offset: 0 };
    }
  },

  // ============================================================
  // PAYMENT STATUS TRACKING
  // ============================================================

  /**
   * Get payment status and history
   * GET /api/payments/{payment_id}/status
   */
  getPaymentStatus: async (paymentId: number) => {
    try {
      const response = await apiRequest<PaymentStatusResponse>(`/payments/${paymentId}/status`);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error(`Failed to fetch status for payment ${paymentId}:`, apiError.message);
      throw error;
    }
  },

  // ============================================================
  // BULK PAYMENT OPERATIONS
  // ============================================================

  /**
   * Process multiple payments in batch
   * POST /api/payments/bulk-process
   */
  bulkProcessPayments: async (request: BulkPaymentRequest) => {
    try {
      // Validate payment IDs
      if (!request.payment_ids || request.payment_ids.length === 0) {
        throw new Error('At least one payment ID is required');
      }

      const response = await apiRequest<BulkPaymentResponse>('/payments/bulk-process', {
        method: 'POST',
        body: JSON.stringify(request)
      });
      return response.data;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Failed to process bulk payments:', apiError.message);
      throw error;
    }
  },

  /**
   * Mark payments as completed (batch operation)
   * POST /api/payments/bulk-complete
   */
  bulkCompletePayments: async (paymentIds: number[], batchReference?: string) => {
    try {
      const response = await apiRequest<BulkPaymentResponse>('/payments/bulk-complete', {
        method: 'POST',
        body: JSON.stringify({
          payment_ids: paymentIds,
          batch_reference: batchReference || `BATCH-${Date.now()}`
        })
      });
      return response.data;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Failed to bulk complete payments:', apiError.message);
      throw error;
    }
  },

  // ============================================================
  // PAYMENT RECONCILIATION
   // ============================================================

  /**
   * Get payments for reconciliation
   * GET /api/payments/reconciliation?status=COMPLETED&limit=50
   */
  getPaymentsForReconciliation: async (limit: number = 50, offset: number = 0) => {
    try {
      const response = await apiRequest<PaymentListResponse>(
        `/payments?status=COMPLETED&limit=${limit}&offset=${offset}`
      );
      return response.data;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Failed to fetch payments for reconciliation:', apiError.message);
      return { data: [], total: 0, limit, offset };
    }
  },

  /**
   * Mark payment as reconciled
   * PUT /api/payments/{payment_id}/reconcile
   */
  reconcilePayment: async (paymentId: number, reference?: string) => {
    try {
      const response = await apiRequest<PaymentRecord>(`/payments/${paymentId}/reconcile`, {
        method: 'PUT',
        body: JSON.stringify({ reference_number: reference })
      });
      return response.data;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error(`Failed to reconcile payment ${paymentId}:`, apiError.message);
      throw error;
    }
  },

  // ============================================================
  // PAYMENT REPORTING
  // ============================================================

  /**
   * Get payment aging report
   * GET /api/payments/reports/aging
   */
  getAgingReport: async () => {
    try {
      const response = await apiRequest<Record<string, unknown>>('/payments/reports/aging');
      return response.data;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Failed to fetch aging report:', apiError.message);
      return null;
    }
  },

  /**
   * Get payment by date range
   * GET /api/payments/reports/by-date?from=2026-01-01&to=2026-02-28
   */
  getPaymentsByDateRange: async (fromDate: string, toDate: string) => {
    try {
      const response = await apiRequest<PaymentListResponse>(
        `/payments?payment_date_from=${fromDate}&payment_date_to=${toDate}`
      );
      return response.data;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Failed to fetch payments by date range:', apiError.message);
      return { data: [], total: 0, limit: 50, offset: 0 };
    }
  },

  /**
   * Get vendor payment statistics
   * GET /api/vendors/{vendor_id}/payment-stats
   */
  getVendorPaymentStats: async (vendorId: number) => {
    try {
      const response = await apiRequest<Record<string, unknown>>(`/vendors/${vendorId}/payment-stats`);
      return response.data;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error(`Failed to fetch payment stats for vendor ${vendorId}:`, apiError.message);
      return null;
    }
  }
};

