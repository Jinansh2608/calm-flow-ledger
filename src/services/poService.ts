import { apiRequest } from './api';
import { PurchaseOrder, StandardResponse, LineItem, ParsedPOResponse, UploadFile, Payment, VerbalAgreement, AggregatedPOResponse, VendorOrder } from '@/types';

export const poService = {
  // 1. Get All POs
  getAllPOs: async (skip: number = 0, limit: number = 50) => {
    try {
      const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
      const response = await apiRequest<{ pos: PurchaseOrder[]; total_count: number }>(`/po?${params}`);
      return response.data;
    } catch (error: any) {
      // If pagination fails, try without parameters
      console.warn("Failed to fetch POs with pagination:", error.message);
      try {
        const response = await apiRequest<{ pos: PurchaseOrder[]; total_count: number }>(`/po`);
        return response.data;
      } catch (fallbackError) {
        console.error("Failed to fetch POs:", fallbackError);
        return { pos: [], total_count: 0 };
      }
    }
  },

  // 2. Get Single PO
  getPODetails: async (poId: number, bypassCache: boolean = false) => {
    const response = await apiRequest<any>(`/client-po/${poId}`, { bypassCache } as any);
    // Backend returns flat structure for this endpoint (no 'data' wrapper)
    const data = response.data || response;
    if (!data) return null;

    // Map nested backend response to flat PurchaseOrder object
    const mappedPO: PurchaseOrder = {
      id: data.client_po_id,
      po_number: data.po?.po_number,
      po_date: data.po?.po_date,
      po_value: data.summary?.grand_total || 0,
      vendor_name: data.vendor?.vendor_name,
      client_id: data.client?.id,
      client_name: data.client?.name,
      project_id: data.project_id || data.project?.id,
      project_name: data.project_name || data.project?.name,
      status: data.status || 'active',
      created_at: data.created_at || data.po?.po_date || new Date().toISOString(), // Fallback
      pi_number: data.po?.pi_number,
      receivable_amount: data.summary?.grand_total, // Default to total value
      notes: data.notes
    };

    return mappedPO;
  },

  getPOOrderDetails: async (poId: number) => {
    const response = await apiRequest<PurchaseOrder>(`/po/${poId}/details`);
    return response.data;
  },

  // 3. Get POs for Project
  getProjectPOs: async (projectId: number) => {
    const response = await apiRequest<{ pos: PurchaseOrder[]; total_project_value: number }>(`/projects/${projectId}/po`);
    // Backend returns flat structure
    return response.data || (response as any);
  },

  // 3a. Get Aggregated POs
  getAggregatedPOs: async (clientId?: number, bypassCache: boolean = false) => {
    const params = new URLSearchParams();
    if (clientId) params.append('client_id', String(clientId));
    
    const response = await apiRequest<AggregatedPOResponse>(`/po/aggregated/by-store?${params}`, { bypassCache } as any);
    return response.data;
  },

  // 3b. Attach PO to Project
  attachPOToProject: async (projectId: number, poId: number) => {
    const response = await apiRequest<{ status: string; message: string }>(`/projects/${projectId}/po/${poId}/attach`, {
      method: 'POST'
    });
    return response.data;
  },

  // 4. Create PO (Project-Based)
  createPO: async (projectId: number, request: { po_number: string; po_date: string; po_value: number; vendor_name: string; notes?: string; client_id: number; po_type?: string }) => {
    const { client_id, vendor_name, ...bodyData } = request;
    const response = await apiRequest<any>(`/projects/${projectId}/po?client_id=${client_id}`, {
      method: 'POST',
      body: JSON.stringify(bodyData)
    });
    const data = response.data || response;
    return data?.po || data?.client_po || data;
  },

  // 4b. Create PO (Generic) - DEPRECATED: Use createPO with projectId instead
  // Backend does not support POST /po - requires project context
  createPOGeneric: async (request: { po_number: string; po_date: string; po_value: number; vendor_name: string; client_id: number; description?: string; project_id?: number }) => {
    // Fallback: if projectId provided, use project-scoped endpoint
    if (request.project_id) {
      const { project_id, ...bodyData } = request;
      const response = await apiRequest<PurchaseOrder>(`/projects/${project_id}/po?client_id=${request.client_id}`, {
        method: 'POST',
        body: JSON.stringify(bodyData)
      });
      return response.data;
    }
    
    // If no projectId provided, throw error with helpful message
    throw new Error(
      'POST /po endpoint not available on backend. Please use createPO() with a projectId instead. ' +
      'Example: poService.createPO(projectId, { po_number, po_date, po_value, vendor_name, notes?, client_id })'
    );
  },

  // 5. Update PO
  updatePO: async (poId: number, request: Partial<PurchaseOrder>) => {
    const response = await apiRequest<PurchaseOrder>(`/po/${poId}`, {
      method: 'PUT',
      body: JSON.stringify(request)
    });
    return response.data;
  },

  // 5b. Update Bundled PO - distributes value change proportionally across all POs
  updateBundledPO: async (poIds: number[], request: Partial<PurchaseOrder>) => {
    // For bundled POs, we update the notes and status for all POs
    // We do NOT update po_value directly as it's aggregated
    const updatePromises = poIds.map(poId =>
      apiRequest<PurchaseOrder>(`/po/${poId}`, {
        method: 'PUT',
        body: JSON.stringify({
          notes: request.notes,
          status: request.status
          // DO NOT include po_value - it cannot be updated on a bundled PO this way
        })
      }).catch(() => null)
    );
    
    const results = await Promise.all(updatePromises);
    return results.filter(Boolean).map(r => r?.data).filter(Boolean);
  },

  // 6. Delete PO
  deletePO: async (poId: number) => {
    const response = await apiRequest<{ success: boolean; message: string; client_po_id: number }>(`/po/${poId}`, {
      method: 'DELETE'
    });
    return response.data;
  },

  // 7. Get Enriched POs
  getEnrichedPOs: async (projectId: number) => {
    const response = await apiRequest<{ pos: Array<PurchaseOrder & { payment_amount: number; payment_status: string }> }>(`/projects/${projectId}/po/enriched`);
    // Backend returns flat structure
    return response.data || (response as any);
  },

  // Line Items
  addLineItem: async (poId: number, item: { description: string; quantity: number; unit_price: number; amount: number }) => {
    const response = await apiRequest<LineItem>(`/po/${poId}/line-items`, {
      method: 'POST',
      body: JSON.stringify({
        ...item,
        item_name: item.description // Compatibility with backend
      })
    });
    return response.data;
  },

  getLineItems: async (poId: number, bypassCache: boolean = false) => {
    // Backend returns { status: "SUCCESS", line_items: [...] } OR sometimes just the array
    const response = await apiRequest<any>(`/po/${poId}/line-items`, { bypassCache } as any);
    const data = response.data;
    
    // Check if response itself is the array or has line_items
    if (Array.isArray(response)) return response;
    if (Array.isArray((response as any).line_items)) return (response as any).line_items;
    
    // Check data property
    if (Array.isArray(data)) return data;
    return data?.line_items || [];
  },

  updateLineItem: async (lineItemId: number, request: Partial<LineItem>) => {
    const response = await apiRequest<LineItem>(`/line-items/${lineItemId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...request,
        item_name: request.description // Compatibility with backend
      })
    });
    return response.data;
  },

  deleteLineItem: async (lineItemId: number) => {
    const response = await apiRequest<{ success: boolean; message: string }>(`/line-items/${lineItemId}`, {
      method: 'DELETE'
    });
    return response.data;
  },

  uploadAndParsePO: async (file: File, clientId: number, projectName?: string, autoSave: boolean = true) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('client_id', String(clientId));
    if (projectName) formData.append('project_name', projectName);
    formData.append('auto_save', autoSave ? 'true' : 'false');
    
    // Also add to query params since backend might look for them there initially
    const params = new URLSearchParams();
    params.append('client_id', String(clientId));
    params.append('auto_save', autoSave ? 'true' : 'false');
    if (projectName) params.append('project_name', projectName);
    
    // Using /uploads/po/upload
    const response = await apiRequest<ParsedPOResponse>(`/uploads/po/upload?${params.toString()}`, {
      method: 'POST',
      body: formData
    });
    
    return response.data || (response as unknown as ParsedPOResponse);
  },

  // Files
  getPOFiles: async (poNumber: string) => {
    const response = await apiRequest<UploadFile[]>(`/uploads/po/${poNumber}`);
    return response.data || (response as unknown as UploadFile[]);
  },

  uploadFileToSession: async (sessionId: string, file: File, poNumber?: string, category?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add additional fields to FormData as well to ensure backend receives them
    if (poNumber) formData.append('po_number', poNumber);
    if (category) formData.append('category', category);
    
    const params = new URLSearchParams();
    if (poNumber) params.append('po_number', poNumber);
    if (category) params.append('category', category);

    const response = await apiRequest<UploadFile>(`/uploads/session/${sessionId}/files?${params}`, {
      method: 'POST',
      body: formData
    });
    return response.data || (response as unknown as UploadFile);
  },

  deleteFile: async (sessionId: string, fileId: string) => {
    const response = await apiRequest<{ success: boolean; message: string }>(`/uploads/session/${sessionId}/files/${fileId}`, {
      method: 'DELETE'
    });
    return response.data;
  },

  // Payments
  getPayments: async (poId: number, forceRefresh: boolean = false) => {
      const response = await apiRequest<any>(`/po/${poId}/payments`, {
        bypassCache: forceRefresh
      } as any);
      
      const res = response as any;
      
      // If it's just an array, wrap it in a pseudo-response
      if (Array.isArray(res)) return { payments: res, summary: {}, payment_count: res.length };
      
      // If it has payments array, return the full object as is
      if (res && Array.isArray(res.payments)) return res;
      
      // Fallback
      if (res && res.data && Array.isArray(res.data)) return { payments: res.data, summary: {}, payment_count: res.data.length };
      
      return { payments: [], summary: {}, payment_count: 0 };
  },

  createPayment: async (poId: number, payment: Partial<Payment>) => {
      const response = await apiRequest<Payment>(`/po/${poId}/payments`, {
          method: 'POST',
          body: JSON.stringify(payment)
      });
      return response.data;
  },

  deletePayment: async (paymentId: number) => {
      const response = await apiRequest<{ success: boolean; message: string }>(`/payments/${paymentId}`, {
          method: 'DELETE'
      });
      return response.data;
  },

  updatePayment: async (paymentId: number, payment: Partial<Payment>) => {
      const response = await apiRequest<{ status: string; message: string }>(`/payments/${paymentId}`, {
          method: 'PUT',
          body: JSON.stringify(payment)
      });
      return response.data;
  },

  // Verbal Agreements
  createVerbalAgreement: async (projectId: number, agreement: { pi_number: string; pi_date: string; value: number; notes: string; client_id: number }) => {
    const { client_id, ...bodyData } = agreement;
    const response = await apiRequest<VerbalAgreement>(`/projects/${projectId}/verbal-agreement?client_id=${client_id}`, {
      method: 'POST',
      body: JSON.stringify(bodyData)
    });
    return response.data;
  },

  addPOToVerbalAgreement: async (agreementId: number, data: { po_number: string; po_date: string }) => {
    const response = await apiRequest<VerbalAgreement>(`/verbal-agreement/${agreementId}/add-po`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response.data;
  },

  getProjectVerbalAgreements: async (projectId: number) => {
    const response = await apiRequest<{ agreements: VerbalAgreement[]; total_agreement_count: number }>(`/projects/${projectId}/verbal-agreements`);
    return response.data;
  },

  // Vendor Orders
  // Vendor Orders
  getProjectVendorOrders: async (projectId: number, bypassCache: boolean = false) => {
      const response = await apiRequest<{ status: string; vendor_order_count: number; vendor_orders: any[] }>(`/projects/${projectId}/vendor-orders`, { bypassCache } as any);
      // Backend returns flat structure
      const data: any = response.data || response;
      let rawOrders = [];
      if (Array.isArray(data)) {
        rawOrders = data;
      } else {
        rawOrders = data?.vendor_orders || data?.orders || data?.data || [];
      }
      return rawOrders.map((vo: any) => ({
          ...vo,
          id: vo.id || vo.vendor_order_id,
          vendor_name: vo.vendor_name || vo.vendor?.name,
          amount: vo.amount || vo.po_value || 0
      })) as VendorOrder[];
  },

  createVendorOrder: async (projectId: number, order: Partial<VendorOrder>) => {
      const response = await apiRequest<{ status: string; message: string; vendor_order: VendorOrder }>(`/projects/${projectId}/vendor-orders`, {
          method: 'POST',
          body: JSON.stringify(order)
      });
      return response.data?.vendor_order;
  },

  getVendorOrder: async (orderId: number, bypassCache: boolean = false) => {
      const response = await apiRequest<{ status: string; vendor_order: VendorOrder }>(`/vendor-orders/${orderId}`, { bypassCache } as any);
      return response.data?.vendor_order;
  },

  updateVendorOrder: async (projectId: number, orderId: number, order: Partial<VendorOrder>) => {
      const response = await apiRequest<{ status: string; message: string; vendor_order: VendorOrder }>(`/projects/${projectId}/vendor-orders/${orderId}`, {
          method: 'PUT',
          body: JSON.stringify(order)
      });
      return response.data?.vendor_order;
  },

  updateVendorOrderStatus: async (orderId: number, status: { work_status?: string; payment_status?: string }) => {
      const response = await apiRequest<{ status: string; message: string; vendor_order: VendorOrder }>(`/vendor-orders/${orderId}/status`, {
          method: 'PUT',
          body: JSON.stringify(status)
      });
      return response.data?.vendor_order;
  },

  deleteVendorOrder: async (projectId: number, orderId: number) => {
      const response = await apiRequest<{ status: string; message: string }>(`/projects/${projectId}/vendor-orders/${orderId}`, {
          method: 'DELETE'
      });
      return response.data;
  },

  // Vendor Order Line Items
  addVendorOrderLineItem: async (orderId: number, item: { item_name: string; quantity: number; unit_price: number }) => {
      const response = await apiRequest<{ status: string; message: string; line_item: any }>(`/vendor-orders/${orderId}/line-items`, {
          method: 'POST',
          body: JSON.stringify(item)
      });
      return response.data?.line_item;
  },

  getVendorOrderLineItems: async (orderId: number, bypassCache: boolean = false) => {
      const response = await apiRequest<{ status: string; vendor_order_id: number; line_item_count: number; line_items: any[] }>(`/vendor-orders/${orderId}/line-items`, { bypassCache } as any);
      // Backend returns flat structure
      const data: any = response.data || response;
      return data?.line_items || [];
  },

  updateVendorOrderLineItem: async (itemId: number, item: { quantity?: number; unit_price?: number }) => {
      const response = await apiRequest<{ status: string; message: string; line_item: any }>(`/vendor-line-items/${itemId}`, {
          method: 'PUT',
          body: JSON.stringify(item)
      });
      return response.data?.line_item;
  },

  deleteVendorOrderLineItem: async (itemId: number) => {
      const response = await apiRequest<{ status: string; message: string }>(`/vendor-line-items/${itemId}`, {
          method: 'DELETE'
      });
      return response.data;
  },

  // Vendor Order Payments
  linkVendorOrderPayment: async (orderId: number, payment: { link_type: string; amount: number; payment_id: string }) => {
      const response = await apiRequest<{ status: string; message: string; linked_payment: any }>(`/vendor-orders/${orderId}/link-payment`, {
          method: 'POST',
          body: JSON.stringify(payment)
      });
      return response.data?.linked_payment;
  },

  getVendorOrderPaymentSummary: async (orderId: number, bypassCache: boolean = false) => {
      const response = await apiRequest<{ status: string; vendor_order_id: number; po_amount: number; paid_amount: number; pending_amount: number; payment_status: string; payment_count: number; payments: any[] }>(`/vendor-orders/${orderId}/payment-summary`, { bypassCache } as any);
      return response.data;
  },
  
  getVendorOrderProfitAnalysis: async (orderId: number, bypassCache: boolean = false) => {
      const response = await apiRequest<{ status: string; profit: number; profit_margin: number; linked_client_pos: number[] }>(`/vendor-orders/${orderId}/profit-analysis`, { bypassCache } as any);
      return response.data;
  },

  // PO Attachments
  uploadPOAttachment: async (poId: number, file: File, documentType: string) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', documentType);
      
      const response = await apiRequest<{ status: string; message: string; file: any }>(`/client-po/${poId}/files`, {
          method: 'POST',
          body: formData
      });
      return response.data;
  }
};
