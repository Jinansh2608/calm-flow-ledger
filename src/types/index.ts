export interface StandardResponse<T> {
  status: "SUCCESS" | "ERROR";
  message?: string;
  data?: T;
  timestamp?: string;
  error_code?: string;
  path?: string;
  errors?: Array<{ field: string; message: string; type: string }>;
}

export interface ErrorResponse {
  status: "ERROR";
  error_code: string;
  message: string;
  path: string;
  errors?: Array<{
    field: string;
    message: string;
    type: string;
  }>;
}

export interface Client {
  id: number;
  name: string;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  po_date: string;
  po_value: number;
  vendor_name?: string; // Sometimes used for vendor POs
  client_id: number;
  client_name?: string;
  project_id: number;
  project_name?: string;
  status: 'active' | 'completed' | 'cancelled' | 'draft' | 'pending';
  created_at: string;
  updated_at?: string;
  payment_amount?: number;
  payment_status?: string;
  pi_number?: string;
  notes?: string;
  receivable_amount?: number;
  po_ids?: number[];
}

export interface LineItem {
  id: number;
  client_po_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  created_at: string;
}

export interface Vendor {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  payment_terms?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLACKLISTED';
  created_at: string;
  updated_at: string;
}

export interface VendorPayment {
  id: number;
  vendor_id: number;
  vendor_order_id?: number;
  amount: number;
  payment_date: string;
  status: 'COMPLETED' | 'PENDING' | 'BOUNCED';
  created_at: string;
}

export interface VendorPaymentSummary {
  vendor_id: number;
  vendor_name: string;
  total_order_value: number;
  total_paid: number;
  payable_amount: number;
  payment_completion_percent: number;
  average_payment_days: number;
  last_payment?: {
    date: string;
    amount: number;
    status: string;
  };
  upcoming_due: Array<{
    vendor_order_id: number;
    po_number: string;
    amount: number;
    due_date: string;
  }>;
}

export interface VendorListResponse {
  data: Vendor[];
  total: number;
  limit: number;
  offset: number;
}

export interface VendorDetailsResponse {
  vendor: Vendor;
  total_orders: number;
  total_order_value: number;
  avg_order_value: number;
  pending_payment: number;
  total_paid: number;
  recent_orders: Array<{
    po_number: string;
    amount: number;
    status: string;
  }>;
  payment_health: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
}

export interface VendorDetails extends Vendor {
  active_orders: number;
  total_payable: number;
  total_paid: number;
}

// ============================================================
// PAYMENT TYPES
// ============================================================

export interface PaymentRecord {
  id: number;
  vendor_id: number;
  vendor_order_id?: number;
  amount: number;
  payment_date: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'RECONCILED';
  reference_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentDetail extends PaymentRecord {
  vendor_details?: {
    id: number;
    name: string;
    email?: string;
  };
}

export interface PaymentListResponse {
  data: PaymentRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface PaymentSummary {
  total_amount: number;
  total_pending: number;
  total_completed: number;
  total_failed: number;
  pending_count: number;
  completed_count: number;
  failed_count: number;
  average_payment_amount: number;
  vendors: Array<{
    vendor_id: number;
    vendor_name: string;
    total_paid: number;
    pending_payment: number;
    payment_completion_percent: number;
  }>;
}

export interface PaymentStatusHistory {
  status: string;
  timestamp: string;
  changed_by?: string;
  notes?: string;
}

export interface PaymentStatusResponse {
  payment_id: number;
  current_status: string;
  status_history: PaymentStatusHistory[];
}

export interface BulkPaymentRequest {
  payment_ids: number[];
  batch_reference: string;
  processing_date: string;
  notes?: string;
}

export interface BulkPaymentResponse {
  status: string;
  message: string;
  data: {
    batch_id: string;
    total_amount: number;
    payment_count: number;
    processing_date: string;
    queue_position: number;
  };
}

export interface VendorOrder {
  id: number;
  project_id: number;
  vendor_id?: number;
  vendor_name?: string;
  po_number: string;
  amount: number;
  status: string;
  category?: string;
  work_status?: 'pending' | 'in_progress' | 'completed';
  payment_status?: 'unpaid' | 'partially_paid' | 'paid';
  description?: string;
  po_date?: string;
  due_date?: string;
  line_item_count?: number;
  client_po_id?: number;
  po_value?: number;
  created_at: string;
  updated_at?: string;
  line_items?: VendorOrderLineItem[];
}

export interface VendorOrderLineItem {
  id: number;
  vendor_order_id: number;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  delivery_progress: number;
  vendor_id?: number;
  vendor_name?: string;
  order_date?: string;
}

export interface Payment {
  id: number;
  po_id: number;
  amount: number;
  payment_date: string;
  payment_mode: string;
  status: 'pending' | 'completed' | 'failed' | 'cleared' | 'bounced';
  reference_number?: string;
  notes?: string;
  transaction_type?: string;
  is_tds_deducted?: boolean;
  tds_amount?: number;
  created_at: string;
}

export interface PaymentSummary {
  total_paid: number;
  total_tds: number;
  cleared_count: number;
  pending_count: number;
  bounced_count: number;
}

export interface POPaymentsResponse {
  status: string;
  po_id: number;
  payments: Payment[];
  payment_count: number;
  summary: PaymentSummary;
}

export interface Project {
  id: number;
  name: string;
  client_id: number;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  status: 'active' | 'completed' | 'on-hold';
  created_at: string;
  updated_at: string;
}

export interface FinancialSummary {
  project_id: number;
  total_po_value: number;
  total_billing_value: number;
  total_vendor_order_value: number;
  total_payments: number;
  remaining_payable: number;
  profit_loss: number;
}

export interface BillingPO {
  id: string;
  project_id: number;
  po_number: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BillingPODetails extends BillingPO {
  line_items: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
}

export interface PLAnalysis {
  project_id: number;
  data: {
    total_po_value: number;
    total_billed: number;
    total_vendor_costs: number;
    net_profit: number;
    profit_margin_percentage: number;
    variance: number;
    variance_percentage: number;
    original_budget: number;
    final_revenue: number;
  }
}

export interface Document {
  id: number;
  document_name: string;
  document_path: string;
  compressed_filename: string;
  download_url: string;
  file_size: number;
  created_at: string;
}

export interface ParsedPOResponse {
  status: 'success' | 'error';
  po_details: {
    po_number: string;
    po_date: string;
    po_value: number;
    vendor_name: string;
  };
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
  client_po_id?: number;
  parsing_status: 'completed' | 'failed';
  error?: string;
  session_id?: string;
  file_id?: string;
  project_id?: number;
  project_name?: string;
  dashboard_info?: {
    project_name: string;
    po_number: string;
    client_po_id: number;
    line_items_count: number;
  };
}

// Aggregated PO Types
export interface POBadge {
  type: 'bundled' | 'single';
  label: string;
  color: string;
  icon: string;
}

export interface AggregatedPOBundle {
  bundle_id?: number;
  store_id?: string;
  display_identifier: string;
  is_bundled: boolean;
  po_ids: number[]; // Changed from string[] to match usage (and backend usually uses ints)
  total_po_value: number;
  badge: POBadge;
  bundling_note?: string;
  id?: number;
  client_po_id?: number;
  po_value?: number;
  receivable_amount?: number;
  po_number?: string;
  pi_number?: string;
  po_date?: string;
  // Additional fields from backend
  client_id?: number;
  client_name?: string;
  project_id?: number;
  project_name?: string;
  vendor_name?: string;
  status?: string;
  payment_status?: string;
  total_paid?: number;
  created_at?: string;
  po_details?: any[]; // Details of POs in the bundle
  line_items?: any[];
}

export interface AggregatedPOResponse {
  bundles: AggregatedPOBundle[];
  summary: {
    bundled_count: number;
    single_count: number;
  };
}

export interface SessionResponse {
  session_id: string;
  po_number?: string;
  status: 'active' | 'processing' | 'completed' | 'failed';
  created_at: string;
  files?: UploadFile[];
  file_count: number;
}

export interface HealthResponse {
  status: string;
  data: {
    status: string;
    service: string;
    database: string;
    version: string;
    timestamp: string;
    environment?: string;
    components?: {
      api: string;
      database: string;
    };
    database_tables?: number;
  };
}

export interface VerbalAgreement {
  id: number;
  client_id: number;
  project_id: number;
  pi_number: string;
  pi_date: string;
  value: number;
  notes?: string;
  po_number?: string;
  po_date?: string;
  created_at: string;
}

export interface BillingLineItem {
  id: string;
  billing_po_id: string;
  item_description: string;
  quantity?: number;
  unit_price?: number;
  amount: number;
}

// Upload Session Types
export interface UploadSessionMetadata {
  project?: string;
  project_name?: string;
  description?: string;
  department?: string;
  client_id?: number;
  client_name?: string;
}

export interface UploadSession {
  session_id: string;
  created_at: string;
  expires_at: string;
  status: 'active' | 'expired' | 'processing';
  metadata: UploadSessionMetadata;
  file_count: number;
}

export interface UploadSessionStats {
  session_id: string;
  total_files: number;
  total_size_bytes: number;
  total_downloads: number;
  created_at: string;
  expires_at: string;
  status: 'active' | 'expired' | 'processing';
}

export interface UploadFile {
  id: string;
  session_id: string;
  original_filename: string;
  file_size: number;
  compressed_size: number;
  is_compressed: boolean;
  mime_type: string;
  file_hash: string;
  compressed_hash?: string;
  upload_timestamp: string;
  uploaded_by?: string;
  status: 'active' | 'deleted';
  po_number?: string;
  access_url?: string;
  parse_status?: 'SUCCESS' | 'FAILED' | 'PENDING';
  parse_error?: string;
  po_id?: number;
}

export interface UploadFileResponse extends UploadFile {
  storage_filename: string;
}

export interface POParseResult {
  po_details: {
    po_number: string;
    po_date: string;
    vendor_name: string;
    vendor_gstin?: string;
    subtotal: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
  };
  line_items: Array<{
    item_name: string;
    quantity: number;
    unit_price: number;
    taxable_amount: number;
    gross_amount: number;
  }>;
}
