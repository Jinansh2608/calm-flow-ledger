import { apiRequest } from './api';
import { 
  Vendor, 
  VendorDetails, 
  VendorOrder, 
  Payment, 
  VendorPayment,
  VendorPaymentSummary,
  VendorListResponse,
  VendorDetailsResponse
} from '@/types';

export const vendorService = {
  // ============================================================
  // VENDOR CRUD OPERATIONS
  // ============================================================

  /**
   * Create a new vendor
   * POST /api/vendors
   */
  createVendor: async (request: Partial<Vendor>) => {
    try {
      const response = await apiRequest<Vendor | any>('/vendors', {
        method: 'POST',
        body: JSON.stringify(request)
      });
      
      // Handle standard response wrapper
      if (response && response.data) {
          return response.data;
      }
      
      // Handle direct object response (if backend returns unwrapped object)
      if (response && (response as any).id) {
          return response as unknown as Vendor;
      }
      
      // Handle nested under 'vendor' key if applicable
      if (response && (response as any).vendor) {
           return (response as any).vendor;
      }

      console.warn("Unexpected createVendor response:", response);
      return response as unknown as Vendor;
    } catch (error: unknown) {
      console.error("Failed to create vendor:", error);
      throw error;
    }
  },

  /**
   * Get vendor by ID
   * GET /api/vendors/{vendor_id}
   */
  getVendorById: async (vendorId: number) => {
    try {
      const response = await apiRequest<Vendor>(`/vendors/${vendorId}`);
      return response.data;
    } catch (error: unknown) {
      console.error(`Failed to fetch vendor ${vendorId}:`, error);
      throw error;
    }
  },

  /**
   * Get all vendors with filtering and pagination
   * GET /api/vendors?status=ACTIVE&name=Supplier&limit=10&offset=0
   */
  getAllVendors: async (filters?: {
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLACKLISTED';
    name?: string;
    gstin?: string;
    limit?: number;
    offset?: number;
  }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.name) params.append('name', filters.name);
      if (filters?.gstin) params.append('gstin', filters.gstin);
      params.append('limit', String(filters?.limit || 50));
      params.append('offset', String(filters?.offset || 0));
      
      const response: any = await apiRequest<VendorListResponse>(
        `/vendors${params.toString() ? '?' + params.toString() : ''}`
      );
      return response.data || response;
    } catch (error: unknown) {
      console.error("Failed to fetch vendors:", error);
      // Return empty list as fallback
      return { data: [], total: 0, limit: filters?.limit || 50, offset: filters?.offset || 0 };
    }
  },

  /**
   * List vendors with pagination (legacy)
   * GET /api/vendors?limit=10&offset=0
   */
  listVendors: async (limit: number = 50, offset: number = 0) => {
    try {
      const response: any = await apiRequest<VendorListResponse>(
        `/vendors?limit=${limit}&offset=${offset}`
      );
      return response.data || response;
    } catch (error: unknown) {
      console.error("Failed to list vendors:", error);
      return { data: [], total: 0, limit, offset };
    }
  },

  /**
   * Update vendor details
   * PUT /api/vendors/{vendor_id}
   */
  updateVendor: async (vendorId: number, request: Partial<Vendor>) => {
    try {
      const response = await apiRequest<Vendor>(`/vendors/${vendorId}`, {
        method: 'PUT',
        body: JSON.stringify(request)
      });
      return response.data;
    } catch (error: unknown) {
      console.error(`Failed to update vendor ${vendorId}:`, error);
      throw error;
    }
  },

  /**
   * Delete vendor
   * DELETE /api/vendors/{vendor_id}
   */
  deleteVendor: async (vendorId: number) => {
    try {
      const response = await apiRequest<{ status: string; message: string; data: { vendor_id: number } }>(
        `/vendors/${vendorId}`,
        { method: 'DELETE' }
      );
      return response.data;
    } catch (error: unknown) {
      console.error(`Failed to delete vendor ${vendorId}:`, error);
      throw error;
    }
  },

  // ============================================================
  // VENDOR DETAILS & ANALYTICS
  // ============================================================

  /**
   * Get vendor details with orders and payments
   * GET /api/vendors/{vendor_id}/details
   */
  getVendorDetails: async (vendorId: number) => {
    try {
      const response = await apiRequest<VendorDetailsResponse>(`/vendors/${vendorId}/details`);
      return response.data;
    } catch (error: unknown) {
      console.error(`Failed to fetch vendor details for ${vendorId}:`, error);
      throw error;
    }
  },

  /**
   * Get vendor payment summary
   * GET /api/vendors/{vendor_id}/payment-summary
   */
  getVendorPaymentSummary: async (vendorId: number) => {
    try {
      const response = await apiRequest<VendorPaymentSummary>(
        `/vendors/${vendorId}/payment-summary`
      );
      return response.data;
    } catch (error: unknown) {
      console.error(`Failed to fetch payment summary for vendor ${vendorId}:`, error);
      throw error;
    }
  },

  // ============================================================
  // VENDOR PAYMENTS
  // ============================================================

  /**
   * Get vendor payments history
   * GET /api/vendors/{vendor_id}/payments?limit=20&offset=0
   */
  getVendorPayments: async (vendorId: number, limit: number = 20, offset: number = 0) => {
    try {
      const response = await apiRequest<any>(
        `/vendors/${vendorId}/payments?limit=${limit}&offset=${offset}`
      );
      // Handle wrapped response (standard list or specific key)
      const data = response.data;
      if (Array.isArray(data)) return data;
      return data?.data || data?.payments || [];
    } catch (error: unknown) {
      console.error(`Failed to fetch payments for vendor ${vendorId}:`, error);
      return [];
    }
  },

  /**
   * Record a payment for vendor order
   * Uses vendor order-level endpoint instead of vendor-level
   * POST /api/vendor-orders/{order_id}/payments
   * 
   * @param vendorOrderId - The vendor order ID (required)
   * @param payment - Payment details
   */
  recordVendorPayment: async (vendorOrderId: number, payment: {
    amount: number;
    payment_date: string;
    status: 'COMPLETED' | 'PENDING' | 'BOUNCED';
  }) => {
    try {
      // Note: Backend endpoint is at order level, not vendor level
      const response = await apiRequest<VendorPayment>(
        `/vendor-orders/${vendorOrderId}/payments`,
        {
          method: 'POST',
          body: JSON.stringify(payment)
        }
      );
      return response.data;
    } catch (error: unknown) {
      console.error(`Failed to record payment for vendor order ${vendorOrderId}:`, error);
      throw error;
    }
  },

  // ============================================================
  // VENDOR ORDERS
  // ============================================================

  /**
   * Create vendor order
   * POST /api/projects/{project_id}/vendor-orders
   */
  createVendorOrder: async (projectId: number, request: {
    vendor_id: number;
    po_number: string;
    amount: number;
    description?: string;
    status?: string;
  }) => {
    try {
      const response = await apiRequest<VendorOrder>(`/projects/${projectId}/vendor-orders`, {
        method: 'POST',
        body: JSON.stringify(request)
      });
      return response.data;
    } catch (error: unknown) {
      console.error(`Failed to create vendor order for project ${projectId}:`, error);
      throw error;
    }
  },

  /**
   * Get all vendor orders for a project
   * GET /api/projects/{project_id}/vendor-orders
   */
  getProjectVendorOrders: async (projectId: number) => {
    try {
      const response: any = await apiRequest<any>(`/projects/${projectId}/vendor-orders`);
      // Handle wrapped response
      const data = response.data || response;
      let orders = [];
      if (Array.isArray(data)) {
        orders = data;
      } else {
        orders = data?.data || data?.orders || data?.vendor_orders || [];
      }
      
      // Map po_value to amount for frontend consistency
      return orders.map((o: any) => ({
        ...o,
        amount: o.amount || o.po_value || 0
      }));
    } catch (error: unknown) {
      console.error(`Failed to fetch vendor orders for project ${projectId}:`, error);
      return [];
    }
  },

  /**
   * Get vendor order details
   * GET /api/vendor-orders/{order_id}
   */
  getVendorOrderDetails: async (orderId: number) => {
    try {
      const response = await apiRequest<VendorOrder>(`/vendor-orders/${orderId}`);
      return response.data;
    } catch (error: unknown) {
      console.error(`Failed to fetch vendor order details for ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Update vendor order
   * PUT /api/projects/{project_id}/vendor-orders/{order_id}
   */
  updateVendorOrder: async (projectId: number, orderId: number, request: Partial<VendorOrder>) => {
    try {
      const response = await apiRequest<VendorOrder>(
        `/projects/${projectId}/vendor-orders/${orderId}`,
        {
          method: 'PUT',
          body: JSON.stringify(request)
        }
      );
      return response.data;
    } catch (error: unknown) {
      console.error(`Failed to update vendor order ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Update vendor order status
   * PUT /api/vendor-orders/{order_id}/status
   */
  updateVendorOrderStatus: async (orderId: number, status: string) => {
    try {
      const response = await apiRequest<{ id: number; status: string }>(
        `/vendor-orders/${orderId}/status`,
        {
          method: 'PUT',
          body: JSON.stringify({ status })
        }
      );
      return response.data;
    } catch (error: unknown) {
      console.error(`Failed to update status for vendor order ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Delete vendor order
   * DELETE /api/projects/{project_id}/vendor-orders/{order_id}
   */
  deleteVendorOrder: async (projectId: number, orderId: number) => {
    try {
      const response = await apiRequest<{ success: boolean; message: string }>(
        `/projects/${projectId}/vendor-orders/${orderId}`,
        { method: 'DELETE' }
      );
      return response.data;
    } catch (error: unknown) {
      console.error(`Failed to delete vendor order ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Add line item to vendor order
   * POST /api/vendor-orders/{order_id}/line-items
   */
  addVendorOrderLineItem: async (orderId: number, item: {
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }) => {
    try {
      const response = await apiRequest<Record<string, unknown>>(`/vendor-orders/${orderId}/line-items`, {
        method: 'POST',
        body: JSON.stringify(item)
      });
      return response.data;
    } catch (error: unknown) {
      console.error(`Failed to add line item to vendor order ${orderId}:`, error);
      throw error;
    }
  }
};
