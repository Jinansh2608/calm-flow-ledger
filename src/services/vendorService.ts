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
      
      if (response && response.data) return response.data;
      if (response && (response as any).id) return response as unknown as Vendor;
      if (response && (response as any).vendor) return (response as any).vendor;

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
  }, bypassCache: boolean = false) => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.name) params.append('name', filters.name);
      if (filters?.gstin) params.append('gstin', filters.gstin);
      params.append('limit', String(filters?.limit || 50));
      params.append('offset', String(filters?.offset || 0));
      
      const response: any = await apiRequest<VendorListResponse>(
        `/vendors${params.toString() ? '?' + params.toString() : ''}`,
        { bypassCache } as any
      );
      return response.data || response;
    } catch (error: unknown) {
      console.error("Failed to fetch vendors:", error);
      return { vendors: [], data: [], total: 0, limit: filters?.limit || 50, offset: filters?.offset || 0 };
    }
  },

  /**
   * Get all vendors with their associated orders
   */
  getVendorsWithOrders: async (bypassCache: boolean = false) => {
    try {
      const result = await vendorService.getAllVendors({}, bypassCache);
      const vendors = result.vendors || result.data || [];
      const vendorsWithOrders = await Promise.all(vendors.map(async (v: any) => {
        const orders = await vendorService.getVendorOrdersByVendor(v.id, bypassCache);
        return {
          ...v,
          orders,
          order_count: orders.length,
          total_value: orders.reduce((sum: number, o: any) => sum + (o.po_value || o.amount || 0), 0)
        };
      }));
      return vendorsWithOrders;
    } catch (error: unknown) {
      console.error("Failed to fetch vendors with orders:", error);
      return [];
    }
  },

  /**
   * List vendors with pagination (legacy)
   * GET /api/vendors?limit=10&offset=0
   */
  listVendors: async (limit: number = 50, offset: number = 0, bypassCache: boolean = false) => {
    try {
      const response: any = await apiRequest<VendorListResponse>(
        `/vendors?limit=${limit}&offset=${offset}`,
        { bypassCache } as any
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
   */
  recordVendorPayment: async (vendorOrderId: number, payment: {
    amount: number;
    payment_date: string;
    status: 'COMPLETED' | 'PENDING' | 'BOUNCED';
  }) => {
    try {
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
   */
  getProjectVendorOrders: async (projectId: number, bypassCache: boolean = false) => {
    try {
      const response: any = await apiRequest<any>(`/projects/${projectId}/vendor-orders`, { bypassCache } as any);
      const data = response.data || response;
      let orders = [];
      if (Array.isArray(data)) {
        orders = data;
      } else {
        orders = data?.data || data?.orders || data?.vendor_orders || [];
      }
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
   * Get all vendor orders across all projects (Master View)
   */
  getAllVendorOrders: async (bypassCache: boolean = false) => {
    try {
      const response: any = await apiRequest<any>('/vendor-orders', { bypassCache } as any);
      const data = response.data || response;
      let orders = [];
      if (Array.isArray(data)) {
        orders = data;
      } else {
        orders = data?.vendor_orders || data?.data || [];
      }
      return orders.map((o: any) => ({
        ...o,
        amount: o.amount || o.po_value || 0
      }));
    } catch (error: unknown) {
      console.error("Failed to fetch all vendor orders:", error);
      return [];
    }
  },

  /**
   * Get all vendor orders grouped by category
   */
  getAllVendorOrdersGrouped: async (bypassCache: boolean = false) => {
    try {
      const response: any = await apiRequest<any>('/vendor-orders', { bypassCache } as any);
      const data = response.data || response;
      if (data && data.categories) {
        return data.categories;
      }
      return [];
    } catch (error: unknown) {
      console.error("Failed to fetch grouped vendor orders:", error);
      return [];
    }
  },

  /**
   * Get all vendor orders for a specific vendor
   */
  getVendorOrdersByVendor: async (vendorId: number, bypassCache: boolean = false) => {
    try {
      const response: any = await apiRequest<any>(`/vendors/${vendorId}/orders`, { bypassCache } as any);
      const data = response.data || response;
      let orders = [];
      if (Array.isArray(data)) {
        orders = data;
      } else {
        orders = data?.vendor_orders || data?.data || [];
      }
      return orders.map((o: any) => ({
        ...o,
        amount: o.amount || o.po_value || 0
      }));
    } catch (error: unknown) {
      console.error(`Failed to fetch orders for vendor ${vendorId}:`, error);
      return [];
    }
  },

  /**
   * Get vendor order details
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
   */
  addVendorOrderLineItem: async (orderId: number, item: {
    item_name: string;
    quantity: number;
    unit_price: number;
    vendor_id?: number;
    status?: string;
    delivery_progress?: number;
    order_date?: string;
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
  },

  /**
   * Get all line items for a category
   */
  getCategoryLineItems: async (category: string) => {
    try {
      const response: any = await apiRequest<any>(`/vendor-orders/by-category/${encodeURIComponent(category)}/line-items`);
      const data = response.data || response;
      return data.line_items || [];
    } catch (error: unknown) {
      console.error(`Failed to fetch line items for category ${category}:`, error);
      return [];
    }
  }
};
