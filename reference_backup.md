# Integration Backup
## DashboardContext.tsx
import { createContext, useContext, useState, ReactNode, useMemo } from "react";

// Types
export interface ClientPO {
  id: string;
  client: string;
  project: string;
  piNo: string;
  poNo: string;
  poValue: number;
  receivable: number;
  paymentStatus: "paid" | "partial" | "pending" | "overdue";
  status: "draft" | "active" | "completed";
  vendorId?: string;
  createdAt: string;
}

export interface VendorPO {
  id: string;
  clientPOId: string;
  vendor: string;
  poValue: number;
  payable: number;
  paymentStatus: "paid" | "partial" | "pending" | "overdue";
  dueDate: string;
  progress: number;
}

export interface Filters {
  client: string;
  project: string;
  piNumber: string;
  clientPONumber: string;
  vendor: string;
  vendorPONumber: string;
  status: string;
  fromDate: string;
  toDate: string;
}

interface DashboardContextType {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  appliedFilters: Filters;
  filteredClientPOs: ClientPO[];
  filteredVendorPOs: VendorPO[];
  summaryData: {
    totalClientPOValue: number;
    totalVendorPOValue: number;
    receivables: number;
    payables: number;
    netProfit: number;
    activeOrders: number;
    vendorOrders: number;
    clientCount: number;
    vendorCount: number;
  };
  flowData: {
    clientPI: { count: number; value: number };
    clientPO: { count: number; value: number };
    vendorPO: { count: number; value: number };
    execution: { count: number; percentage: number };
    payment: { count: number; value: number };
    profit: { count: number; value: number };
  };
  isFiltered: boolean;
}

const initialFilters: Filters = {
  client: "all",
  project: "all",
  piNumber: "",
  clientPONumber: "",
  vendor: "all",
  vendorPONumber: "",
  status: "all",
  fromDate: "",
  toDate: "",
};

// Mock Data
const allClientPOs: ClientPO[] = [
  {
    id: "1",
    client: "Acme Corporation",
    project: "Retail Expansion Q1",
    piNo: "PI-2024-001",
    poNo: "CPO-2024-0012",
    poValue: 1250000,
    receivable: 450000,
    paymentStatus: "partial",
    status: "active",
    vendorId: "vendor-a",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    client: "Globex Industries",
    project: "Warehouse Setup",
    piNo: "PI-2024-002",
    poNo: "CPO-2024-0013",
    poValue: 890000,
    receivable: 890000,
    paymentStatus: "pending",
    status: "active",
    vendorId: "vendor-b",
    createdAt: "2024-01-18",
  },
  {
    id: "3",
    client: "Initech Solutions",
    project: "Office Renovation",
    piNo: "PI-2024-003",
    poNo: "CPO-2024-0014",
    poValue: 675000,
    receivable: 0,
    paymentStatus: "paid",
    status: "completed",
    vendorId: "vendor-c",
    createdAt: "2024-01-10",
  },
  {
    id: "4",
    client: "Massive Dynamic",
    project: "Store Fit-out",
    piNo: "PI-2024-004",
    poNo: "CPO-2024-0015",
    poValue: 2100000,
    receivable: 2100000,
    paymentStatus: "overdue",
    status: "active",
    vendorId: "vendor-a",
    createdAt: "2024-01-05",
  },
  {
    id: "5",
    client: "Stark Industries",
    project: "Lab Equipment",
    piNo: "PI-2024-005",
    poNo: "CPO-2024-0016",
    poValue: 450000,
    receivable: 225000,
    paymentStatus: "partial",
    status: "active",
    vendorId: "vendor-b",
    createdAt: "2024-01-20",
  },
  {
    id: "6",
    client: "Acme Corporation",
    project: "Warehouse Setup",
    piNo: "PI-2024-006",
    poNo: "CPO-2024-0017",
    poValue: 780000,
    receivable: 0,
    paymentStatus: "paid",
    status: "completed",
    vendorId: "vendor-c",
    createdAt: "2024-02-01",
  },
  {
    id: "7",
    client: "Globex Industries",
    project: "Office Renovation",
    piNo: "PI-2024-007",
    poNo: "CPO-2024-0018",
    poValue: 520000,
    receivable: 260000,
    paymentStatus: "partial",
    status: "active",
    vendorId: "vendor-a",
    createdAt: "2024-02-05",
  },
];

const allVendorPOs: VendorPO[] = [
  {
    id: "v1",
    clientPOId: "1",
    vendor: "Alpha Supplies Ltd",
    poValue: 450000,
    payable: 225000,
    paymentStatus: "partial",
    dueDate: "2024-02-15",
    progress: 65,
  },
  {
    id: "v2",
    clientPOId: "1",
    vendor: "Beta Materials Co",
    poValue: 320000,
    payable: 320000,
    paymentStatus: "pending",
    dueDate: "2024-02-20",
    progress: 40,
  },
  {
    id: "v3",
    clientPOId: "2",
    vendor: "Gamma Services",
    poValue: 180000,
    payable: 0,
    paymentStatus: "paid",
    dueDate: "2024-01-30",
    progress: 100,
  },
  {
    id: "v4",
    clientPOId: "3",
    vendor: "Alpha Supplies Ltd",
    poValue: 280000,
    payable: 0,
    paymentStatus: "paid",
    dueDate: "2024-01-25",
    progress: 100,
  },
  {
    id: "v5",
    clientPOId: "4",
    vendor: "Delta Contractors",
    poValue: 560000,
    payable: 560000,
    paymentStatus: "overdue",
    dueDate: "2024-01-25",
    progress: 85,
  },
  {
    id: "v6",
    clientPOId: "4",
    vendor: "Beta Materials Co",
    poValue: 480000,
    payable: 480000,
    paymentStatus: "pending",
    dueDate: "2024-02-28",
    progress: 50,
  },
  {
    id: "v7",
    clientPOId: "5",
    vendor: "Gamma Services",
    poValue: 200000,
    payable: 100000,
    paymentStatus: "partial",
    dueDate: "2024-02-10",
    progress: 70,
  },
  {
    id: "v8",
    clientPOId: "6",
    vendor: "Alpha Supplies Ltd",
    poValue: 350000,
    payable: 0,
    paymentStatus: "paid",
    dueDate: "2024-01-28",
    progress: 100,
  },
  {
    id: "v9",
    clientPOId: "7",
    vendor: "Delta Contractors",
    poValue: 220000,
    payable: 110000,
    paymentStatus: "partial",
    dueDate: "2024-02-25",
    progress: 55,
  },
];

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(initialFilters);

  const applyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  const isFiltered = useMemo(() => {
    return Object.entries(appliedFilters).some(([key, value]) => {
      if (key === "client" || key === "project" || key === "vendor" || key === "status") {
        return value !== "all";
      }
      return value !== "";
    });
  }, [appliedFilters]);

  const filteredClientPOs = useMemo(() => {
    return allClientPOs.filter((po) => {
      if (appliedFilters.client !== "all" && po.client !== appliedFilters.client) return false;
      if (appliedFilters.project !== "all" && po.project !== appliedFilters.project) return false;
      if (appliedFilters.status !== "all" && po.status !== appliedFilters.status) return false;
      if (appliedFilters.piNumber && !po.piNo.toLowerCase().includes(appliedFilters.piNumber.toLowerCase())) return false;
      if (appliedFilters.clientPONumber && !po.poNo.toLowerCase().includes(appliedFilters.clientPONumber.toLowerCase())) return false;
      if (appliedFilters.fromDate && new Date(po.createdAt) < new Date(appliedFilters.fromDate)) return false;
      if (appliedFilters.toDate && new Date(po.createdAt) > new Date(appliedFilters.toDate)) return false;
      return true;
    });
  }, [appliedFilters]);

  const filteredVendorPOs = useMemo(() => {
    const clientPOIds = filteredClientPOs.map((po) => po.id);
    let vendorPOs = allVendorPOs.filter((vpo) => clientPOIds.includes(vpo.clientPOId));
    
    if (appliedFilters.vendor !== "all") {
      vendorPOs = vendorPOs.filter((vpo) => vpo.vendor === appliedFilters.vendor);
    }
    if (appliedFilters.vendorPONumber) {
      vendorPOs = vendorPOs.filter((vpo) => vpo.id.toLowerCase().includes(appliedFilters.vendorPONumber.toLowerCase()));
    }
    
    return vendorPOs;
  }, [filteredClientPOs, appliedFilters.vendor, appliedFilters.vendorPONumber]);

  const summaryData = useMemo(() => {
    const totalClientPOValue = filteredClientPOs.reduce((sum, po) => sum + po.poValue, 0);
    const totalVendorPOValue = filteredVendorPOs.reduce((sum, vpo) => sum + vpo.poValue, 0);
    const receivables = filteredClientPOs.reduce((sum, po) => sum + po.receivable, 0);
    const payables = filteredVendorPOs.reduce((sum, vpo) => sum + vpo.payable, 0);
    const netProfit = totalClientPOValue - totalVendorPOValue - (totalClientPOValue * 0.05); // 5% operational cost
    const activeOrders = filteredClientPOs.filter((po) => po.status === "active").length;
    const vendorOrders = filteredVendorPOs.length;
    const clientCount = new Set(filteredClientPOs.map((po) => po.client)).size;
    const vendorCount = new Set(filteredVendorPOs.map((vpo) => vpo.vendor)).size;

    return {
      totalClientPOValue,
      totalVendorPOValue,
      receivables,
      payables,
      netProfit,
      activeOrders,
      vendorOrders,
      clientCount,
      vendorCount,
    };
  }, [filteredClientPOs, filteredVendorPOs]);

  const flowData = useMemo(() => {
    const totalClientPOValue = filteredClientPOs.reduce((sum, po) => sum + po.poValue, 0);
    const totalVendorPOValue = filteredVendorPOs.reduce((sum, vpo) => sum + vpo.poValue, 0);
    const totalPaid = filteredClientPOs.filter((po) => po.paymentStatus === "paid").reduce((sum, po) => sum + po.poValue, 0);
    const avgProgress = filteredVendorPOs.length > 0 
      ? Math.round(filteredVendorPOs.reduce((sum, vpo) => sum + vpo.progress, 0) / filteredVendorPOs.length)
      : 0;
    const profit = totalClientPOValue - totalVendorPOValue - (totalClientPOValue * 0.05);
    const completedCount = filteredClientPOs.filter((po) => po.status === "completed").length;

    return {
      clientPI: { count: filteredClientPOs.length, value: totalClientPOValue * 1.07 },
      clientPO: { count: filteredClientPOs.length, value: totalClientPOValue },
      vendorPO: { count: filteredVendorPOs.length, value: totalVendorPOValue },
      execution: { count: filteredVendorPOs.filter((v) => v.progress > 0 && v.progress < 100).length, percentage: avgProgress },
      payment: { count: filteredClientPOs.filter((po) => po.paymentStatus === "paid" || po.paymentStatus === "partial").length, value: totalPaid },
      profit: { count: completedCount, value: profit > 0 ? profit : 0 },
    };
  }, [filteredClientPOs, filteredVendorPOs]);

  return (
    <DashboardContext.Provider
      value={{
        filters,
        setFilters,
        applyFilters,
        resetFilters,
        appliedFilters,
        filteredClientPOs,
        filteredVendorPOs,
        summaryData,
        flowData,
        isFiltered,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

// Helper data exports for dropdowns
export const clients = ["Acme Corporation", "Globex Industries", "Initech Solutions", "Massive Dynamic", "Stark Industries"];
export const projects = ["Retail Expansion Q1", "Warehouse Setup", "Office Renovation", "Store Fit-out", "Lab Equipment"];
export const vendors = ["Alpha Supplies Ltd", "Beta Materials Co", "Gamma Services", "Delta Contractors"];
export const statuses = ["draft", "active", "completed"];
## api.ts
/**
 * API Service Functions
 *
 * High-level functions for all backend endpoints.
 * Use hooks from `@/hooks/useApi.ts` in components instead of calling these directly.
 */

import { apiClient, API_BASE_URL } from "./apiClient";
import type {
  Payment,
  ClientPaymentSummary,
  PaymentsResponse,
  ClientPO,
  LineItem,
  VerbalAgreement,
  FinancialSummary,
  BajajPOBulkUploadResponse,
  EnrichedPOsResponse,
  BillingPO,
  BillingSummary,
  CreateBillingPORequest,
  UpdateBillingPORequest,
  BillingLineItemRequest,
  CreateBillingPOResponse,
  GetBillingPOResponse,
  GetBillingLineItemsResponse,
  AddBillingLineItemResponse,
  UpdateBillingPOResponse,
  DeleteBillingLineItemResponse,
  GetProjectBillingSummaryResponse,
  GetProjectProfitLossResponse,
  CreateProjectRequest,
  CreateProjectResponse,
  DeleteProjectResponse,
} from "@/types/api";

// ============================================================================
// File Upload Response Types (service-specific, not reused elsewhere)
// ============================================================================

export interface ProformaInvoiceUploadResponse {
  status: "SUCCESS" | "VALIDATION_ERROR" | "PARSE_ERROR" | "ERROR";
  file_id?: string;
  session_id?: string;
  client_po_id?: number;
  po_details: {
    po_number: string;
    po_date: string;
    client_name?: string;
    vendor_name?: string;
    pi_number?: string;
    pi_date?: string;
    vendor_gstin?: string;
    bill_to_gstin?: string;
    vendor_address?: string;
    bill_to_address?: string;
    ship_to_address?: string;
    store_id?: string;
    site_name?: string;
    subtotal?: number;
    cgst?: number;
    sgst?: number;
    igst?: number;
    total_amount?: number;
  };
  line_items: Array<{
    description: string;
    quantity: number;
    amount: number;
    boq_name?: string;
    unit?: string;
    rate?: number;
    hsn_code?: string;
    gst_amount?: number;
    gross_amount?: number;
    taxable_amount?: number;
  }>;
  line_item_count: number;
  validation_errors?: string[];
  message?: string;
  detail?: string;
}

export interface OrderDetailsResponse {
  status: "SUCCESS" | "ERROR";
  client_po_id?: number;
  po?: {
    id: number;
    client_id: number;
    project_id: number;
    po_number: string;
    po_date: string;
    pi_number: string;
    pi_date: string;
    po_value: number;
    subtotal: number;
    cgst: number;
    sgst: number;
    igst: number;
    total_tax: number;
    receivable_amount: number;
    vendor_id: number;
    vendor_gstin: string;
    vendor_address: string;
    bill_to_gstin: string;
    bill_to_address: string;
    ship_to_address: string;
    site_id: number;
    status: string;
    created_at: string;
  };
  summary?: {
    subtotal: number;
    cgst: number;
    sgst: number;
    total: number;
  };
  line_items?: Array<{
    id: number;
    client_po_id: number;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
    hsn_code: string;
    unit: string;
    rate: number;
    gst_amount: number;
    gross_amount: number;
  }>;
  line_item_count?: number;
  detail?: string;
  message?: string;
}

export interface OrderValidationResponse {
  status: "VALID" | "INVALID" | "ERROR";
  client_po_id?: number;
  validation_results?: {
    required_fields: "PASS" | "FAIL";
    tax_calculations: "PASS" | "FAIL";
    line_item_integrity: "PASS" | "FAIL";
    gstin_format: "PASS" | "FAIL";
  };
  validation_errors?: string[];
  message?: string;
  detail?: string;
}

// Re-export the canonical types so existing `import â€¦ from "@/services/api"` don't break
export type { ClientPO, LineItem, VerbalAgreement, FinancialSummary };

// ============================================================================
// Health Check
// ============================================================================

export const healthCheck = async () => {
  return apiClient.get("/health");
};

// ============================================================================
// Bajaj PO Parser
// ============================================================================

export const uploadBajajPO = async (
  file: File,
  clientId: number,
  projectId: number
) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.postFormData(
    `/bajaj-po?client_id=${clientId}&project_id=${projectId}`,
    formData
  );
};

export const bulkUploadBajajPO = async (
  files: File[],
  clientId: number,
  projectId?: number
): Promise<BajajPOBulkUploadResponse> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  // Backend expects client_id and project_id as query params (FastAPI Query(...)), NOT FormData
  const params = new URLSearchParams({ client_id: String(clientId) });
  if (projectId) params.append("project_id", String(projectId));

  return apiClient.postFormData<BajajPOBulkUploadResponse>(
    `/bajaj-po/bulk?${params.toString()}`,
    formData
  );
};


// ============================================================================
// Line Items
// ============================================================================

export const addLineItem = async (
  poId: number,
  itemData: { item_name: string; quantity: number; unit_price: number }
) => {
  return apiClient.post(`/po/${poId}/line-items`, itemData);
};

export const getLineItems = async (poId: number): Promise<LineItem[]> => {
  const response = await apiClient.get<unknown>(`/po/${poId}/line-items`);

  if (Array.isArray(response)) return response;
  if (response && typeof response === "object") {
    const resp = response as Record<string, unknown>;
    if (Array.isArray(resp.line_items)) return resp.line_items;
    if (Array.isArray(resp.items)) return resp.items;
    if (Array.isArray(resp.data)) return resp.data;
  }
  return [];
};

export const updateLineItem = async (
  itemId: number,
  itemData: Partial<{ item_name: string; quantity: number; unit_price: number }>
) => {
  return apiClient.put(`/line-items/${itemId}`, itemData);
};

export const deleteLineItem = async (itemId: number) => {
  return apiClient.delete(`/line-items/${itemId}`);
};

// ============================================================================
// POs per Project
// ============================================================================

export const createPO = async (
  projectId: number,
  clientId: number,
  poData: {
    po_number: string;
    po_date: string;
    po_value: number;
    po_type?: string;
    parent_po_id?: number | null;
    notes?: string;
  }
) => {
  return apiClient.post(
    `/projects/${projectId}/po?client_id=${clientId}`,
    poData
  );
};

export const getAllPOs = async () => {
  return apiClient.get(`/po`);
};

export const getProjectPOs = async (projectId: number) => {
  return apiClient.get(`/projects/${projectId}/po`);
};

export const attachPOToProject = async (
  projectId: number,
  poId: number,
  sequenceOrder: number
) => {
  return apiClient.post(
    `/projects/${projectId}/po/${poId}/attach?sequence_order=${sequenceOrder}`,
    {}
  );
};

export const setPrimaryPO = async (projectId: number, poId: number) => {
  return apiClient.put(
    `/projects/${projectId}/po/${poId}/set-primary`,
    {}
  );
};

export const updatePO = async (
  poId: number,
  poData: Partial<{
    po_number: string;
    po_date: string;
    po_value: number;
    pi_number: string;
    pi_date: string;
    notes: string;
    status: string;
  }>
) => {
  return apiClient.put(`/po/${poId}`, poData);
};

export const deletePO = async (poId: number) => {
  return apiClient.delete(`/po/${poId}`);
};

// ============================================================================
// Payments
// ============================================================================

export const createPayment = async (
  poId: number,
  paymentData: Partial<Payment>
) => {
  return apiClient.post(`/po/${poId}/payments`, paymentData);
};

export const getPayments = async (poId: number): Promise<PaymentsResponse> => {
  return apiClient.get<PaymentsResponse>(`/po/${poId}/payments`);
};

export const updatePayment = async (
  paymentId: number,
  paymentData: Partial<Payment>
) => {
  return apiClient.put(`/payments/${paymentId}`, paymentData);
};

export const deletePayment = async (paymentId: number) => {
  return apiClient.delete(`/payments/${paymentId}`);
};

// ============================================================================
// Verbal Agreements
// ============================================================================

export const createVerbalAgreement = async (
  projectId: number,
  clientId: number,
  agreementData: {
    pi_number: string;
    pi_date: string;
    value: number;
    notes?: string;
  }
) => {
  return apiClient.post(
    `/projects/${projectId}/verbal-agreement?client_id=${clientId}`,
    agreementData
  );
};

export const addPOToVerbalAgreement = async (
  agreementId: number,
  poData: { po_number: string; po_date: string }
) => {
  return apiClient.put(`/verbal-agreement/${agreementId}/add-po`, poData);
};

export const getProjectVerbalAgreements = async (projectId: number) => {
  return apiClient.get(`/projects/${projectId}/verbal-agreements`);
};

// ============================================================================
// Financial Summary
// ============================================================================

export const getFinancialSummary = async (projectId: number) => {
  return apiClient.get(`/projects/${projectId}/financial-summary`);
};

// ============================================================================
// Enriched POs (with payment data)
// ============================================================================

export const getEnrichedProjectPOs = async (
  projectId: number
): Promise<EnrichedPOsResponse> => {
  return apiClient.get<EnrichedPOsResponse>(
    `/projects/${projectId}/po/enriched`
  );
};

// ============================================================================
// Client PO
// ============================================================================

export const getClientPO = async (clientPoId: number) => {
  return apiClient.get(`/client-po/${clientPoId}`);
};

// ============================================================================
// Projects
// ============================================================================

export const getProjects = async () => {
  return apiClient.get("/projects?limit=100");
};

export const createProject = async (
  projectData: CreateProjectRequest
): Promise<CreateProjectResponse> => {
  return apiClient.post<CreateProjectResponse>("/projects", projectData);
};

export const deleteProject = async (
  name: string
): Promise<DeleteProjectResponse> => {
  return apiClient.delete<DeleteProjectResponse>(
    `/projects?name=${encodeURIComponent(name)}`
  );
};

// ============================================================================
// Billing PO Operations
// ============================================================================

export const createBillingPO = async (
  projectId: number,
  request: CreateBillingPORequest
): Promise<CreateBillingPOResponse> => {
  return apiClient.post<CreateBillingPOResponse>(
    `/projects/${projectId}/billing-po`,
    request
  );
};

export const getBillingPO = async (
  billingPoId: string
): Promise<GetBillingPOResponse> => {
  return apiClient.get<GetBillingPOResponse>(`/billing-po/${billingPoId}`);
};

export const updateBillingPO = async (
  billingPoId: string,
  request: UpdateBillingPORequest
): Promise<UpdateBillingPOResponse> => {
  return apiClient.put<UpdateBillingPOResponse>(
    `/billing-po/${billingPoId}`,
    request
  );
};

export const getProjectBillingSummary = async (
  projectId: number
): Promise<GetProjectBillingSummaryResponse> => {
  return apiClient.get<GetProjectBillingSummaryResponse>(
    `/projects/${projectId}/billing-summary`
  );
};

export const addBillingLineItem = async (
  billingPoId: string,
  item: BillingLineItemRequest
): Promise<AddBillingLineItemResponse> => {
  return apiClient.post<AddBillingLineItemResponse>(
    `/billing-po/${billingPoId}/line-items`,
    item
  );
};

export const getBillingLineItems = async (
  billingPoId: string
): Promise<GetBillingLineItemsResponse> => {
  return apiClient.get<GetBillingLineItemsResponse>(
    `/billing-po/${billingPoId}/line-items`
  );
};

export const deleteBillingLineItem = async (
  billingPoId: string,
  lineItemId: string
): Promise<DeleteBillingLineItemResponse> => {
  return apiClient.delete<DeleteBillingLineItemResponse>(
    `/billing-po/${billingPoId}/line-items/${lineItemId}`
  );
};

export const getProjectProfitLoss = async (
  projectId: number
): Promise<GetProjectProfitLossResponse> => {
  return apiClient.get<GetProjectProfitLossResponse>(
    `/projects/${projectId}/billing-pl-analysis`
  );
};

// ============================================================================
// Proforma Invoice â€” File Upload
// ============================================================================

export const uploadProformaInvoice = async (
  file: File,
  clientId: number,
  projectId?: number
): Promise<ProformaInvoiceUploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const queryParams = new URLSearchParams({
    client_id: String(Number(clientId)),
  });

  if (projectId) {
    queryParams.append("project_id", String(Number(projectId)));
  }

  // Use apiClient.postFormData which builds on apiClient and includes interceptors/Auth headers
  // The endpoint is compatible with the new file upload system
  return apiClient.postFormData<ProformaInvoiceUploadResponse>(
    `/uploads/po/upload?${queryParams.toString()}`,
    formData
  );
};

// ============================================================================
// Order Details & Validation
// ============================================================================

export const getOrderDetails = async (
  clientPoId: number
): Promise<OrderDetailsResponse> => {
  return apiClient.get(`/po/${clientPoId}`);
};

export const validateOrder = async (
  clientPoId: number
): Promise<OrderValidationResponse> => {
  return apiClient.get(`/proforma-invoice/validate/${clientPoId}`);
};
