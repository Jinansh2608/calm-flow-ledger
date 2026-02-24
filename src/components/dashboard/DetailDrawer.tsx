import { useState, useRef, useEffect, useCallback } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  CreditCard, 
  Clock, 
  Calendar, 
  Trash2, 
  Edit, 
  Eye,
  Plus, 
  X,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Building2
} from "lucide-react";
import { poService } from "@/services/poService";
import { toast } from "@/hooks/use-toast";
import { useDashboard } from "@/contexts/DashboardContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn, formatCurrency } from "@/lib/utils";
import { Payment, PurchaseOrder, VendorOrder } from "@/types";
import { VendorOrderDialog } from "./VendorOrderDialog";
import { VendorOrderDetails } from "./VendorOrderDetails"; // Import Details Component



// Local interfaces definitions
interface APIResponseItem {
  id: number;
  description?: string;
  item_name?: string;
  quantity: number;
  unit_price?: number;
  rate?: number;
  amount?: number;
  total_price?: number;
}

interface PaymentFormData {
  amount: string;
  payment_date: string;
  payment_mode: string;
  reference_number: string;
  notes: string;
  status: string;
  is_tds_deducted: boolean;
  tds_amount: number;
  transaction_type: 'credit' | 'debit';
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploaded_at: string;
  uploaded_by?: string;
}

interface LineItem {
  id: number;
  client_po_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  created_at: string;
}

interface POFile {
  file_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  uploaded_at: string;
}

interface POPaymentSummary {
  total_paid: number;
  total_tds: number;
  cleared_count: number;
  pending_count: number;
  bounced_count: number;
}

interface VendorPaymentSummary {
    vendor_id?: number;
    total_bill_value: number;
    total_paid: number;
    pending_amount: number;
}

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  data: PurchaseOrder | null;
  onProjectDeleted?: (projectId: number) => void;
}

const DetailDrawer = ({ open, onClose, data, onProjectDeleted }: DetailDrawerProps) => {
  // Main PO Data State (initialized with props, enriched by fetch)
  const [poData, setPoData] = useState<PurchaseOrder | null>(data);

  const { refreshData, projects } = useDashboard();
  const [isEditing, setIsEditing] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<POPaymentSummary | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [vendorOrders, setVendorOrders] = useState<VendorOrder[]>([]);
  
  const [editedData, setEditedData] = useState<PurchaseOrder | null>(data);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState<PaymentFormData>({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_mode: 'neft',
    reference_number: '',
    notes: '',
    status: 'pending',
    is_tds_deducted: false,
    tds_amount: 0,
    transaction_type: 'credit'
  });

  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [isAddLineItemOpen, setIsAddLineItemOpen] = useState(false);
  const [lineItemFormData, setLineItemFormData] = useState({
    description: '',
    quantity: 1,
    unit_price: 0
  });
  
  // Vendor Order Dialog States
  const [isVendorOrderDialogOpen, setIsVendorOrderDialogOpen] = useState(false);
  const [selectedVendorOrder, setSelectedVendorOrder] = useState<VendorOrder | null>(null);
  
  // Vendor Order Details States
  const [isVendorOrderDetailsOpen, setIsVendorOrderDetailsOpen] = useState(false);
  const [selectedDetailsOrder, setSelectedDetailsOrder] = useState<VendorOrder | null>(null);
  
  // File Upload States
  const [file, setFile] = useState<File | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [category, setCategory] = useState<string>('other');
  const [multiPoData, setMultiPoData] = useState<PurchaseOrder[]>([]);
  
  // Derive project ID safely from various possible sources, including name lookup
  const currentProjectId = (() => {
    // 1. Direct project_id from fetched PO data
    const fromPoData = poData?.project_id || (poData as any)?.projectId;
    if (fromPoData && Number(fromPoData) > 0) return Number(fromPoData);
    
    // 2. From the original prop data
    const fromDataProjectId = (data as any)?.projectId || (data as any)?.project_id;
    if (fromDataProjectId && Number(fromDataProjectId) > 0) return Number(fromDataProjectId);

    // 2b. From nested project object in prop data
    const fromNestedProject = (data as any)?.project?.id || (data as any)?.project?.projectId;
    if (fromNestedProject && Number(fromNestedProject) > 0) return Number(fromNestedProject);
    
    // 3. From multi-PO data
    if (multiPoData && multiPoData.length > 0) {
      const fromMulti = multiPoData.find(p => (Number(p.project_id) || Number((p as any).projectId)) > 0);
      if (fromMulti) {
          const foundId = (fromMulti.project_id || (fromMulti as any).projectId);
          if (Number(foundId) > 0) return Number(foundId);
      }
    }
    
    // 4. Look up by project name in context projects list (Case-insensitive & Trimmed)
    const rawProjectName = poData?.project_name || (data as any)?.project_name || (data as any)?.project;
    if (rawProjectName && projects && projects.length > 0) {
      const targetName = String(rawProjectName).trim().toLowerCase();
      const matchedProject = projects.find(p => p.name && p.name.trim().toLowerCase() === targetName);
      if (matchedProject?.id) return Number(matchedProject.id);
    }

    // 5. From _original bundle data  
    const originalProjectId = (data as any)?._original?.project_id || (data as any)?._original?.projectId;
    if (originalProjectId && Number(originalProjectId) > 0) return Number(originalProjectId);
    
    return 0;
  })();

  useEffect(() => {
    if (data) {
      setPoData(data); // Reset to prop data initially
      setMultiPoData([]);
      setEditedData({
        ...data,
         status: ['active', 'completed', 'cancelled', 'draft', 'pending'].includes(data.status) ? data.status : 'active' 
      });
      fetchData(); // This will fetch fresh details and override poData if successful
    }
  }, [data]);
  

  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
      if (!data) return;
      try {
          // Check for multiple POs (bundled)
          if (data.po_ids && data.po_ids.length > 1) {
              const poIds = data.po_ids;
              
              const [detailsResults, lineItemsResults, paymentsResults] = await Promise.all([
                  Promise.all(poIds.map(id => poService.getPODetails(id).catch(() => null))),
                  Promise.all(poIds.map(id => poService.getLineItems(id).catch(() => []))),
                  Promise.all(poIds.map(id => poService.getPayments(id, forceRefresh).catch(() => ({ payments: [], summary: null }))))
              ]);

              const validPOs = detailsResults.filter((p): p is PurchaseOrder => p !== null);
              setMultiPoData(validPOs);

              // Aggregate PO Data
              if (validPOs.length > 0) {
                  const totalValue = validPOs.reduce((sum, p) => sum + (p.po_value || 0), 0);
                  
                  // Find the best PO to use as base (prefer one with project details)
                  const basePO = validPOs.find(p => p.project_name && p.client_name) || validPOs[0];
                  
                  const combinedNotes = validPOs
                      .map(p => p.notes ? `[${p.po_number || 'PO'}]: ${p.notes}` : null)
                      .filter(Boolean)
                      .join('\n\n');

                  setPoData(prev => ({
                      ...prev,
                      ...basePO, // Use best PO as base for shared fields
                      project_id: basePO.project_id || currentProjectId || (data as any)?.project_id || 0, // Prefer fresh data
                      po_number: validPOs.map(p => p.po_number).join(', '),
                      po_value: totalValue,
                      notes: combinedNotes,
                      status: validPOs.every(p => p.status === 'completed') ? 'completed' : 
                              validPOs.some(p => p.status === 'cancelled') ? 'active' : 'active', 
                      po_ids: poIds
                  }));
              }

              // Merge Line Items
              const allLineItems = lineItemsResults.flat().filter(Boolean).map((i: any) => ({
                    id: i.id,
                    client_po_id: i.client_po_id, // Keep ID to trace back if needed
                    description: i.description || i.item_name || "Item",
                    quantity: Number(i.quantity) || 0,
                    unit_price: Number(i.unit_price) || Number(i.rate) || 0,
                    amount: Number(i.amount) || Number(i.total_price) || 0,
                    created_at: new Date().toISOString()
              }));
              setLineItems(allLineItems);

              // Merge Payments
              const allPayments: Payment[] = [];
              let totalPaid = 0;
              let totalTds = 0;
              let clearedCount = 0;
              let pendingCount = 0;
              let bouncedCount = 0;

              paymentsResults.forEach((res: any) => {
                  if (res && res.payments && Array.isArray(res.payments)) {
                      allPayments.push(...res.payments);
                      if (res.summary) {
                          totalPaid += res.summary.total_paid || 0;
                          totalTds += res.summary.total_tds || 0;
                          clearedCount += res.summary.cleared_count || 0;
                          pendingCount += res.summary.pending_count || 0;
                          bouncedCount += res.summary.bounced_count || 0;
                      }
                  } else if (Array.isArray(res)) {
                      allPayments.push(...res);
                  }
              });
              
              setPayments(allPayments);
              setPaymentSummary({
                  total_paid: totalPaid,
                  total_tds: totalTds,
                  cleared_count: clearedCount,
                  pending_count: pendingCount,
                  bounced_count: bouncedCount
              });

               // Update poData with fresh payment info
               setPoData(prev => prev ? ({
                  ...prev,
                  payment_amount: totalPaid,
                  payment_status: totalPaid >= (prev.po_value || 0) ? 'paid' : totalPaid > 0 ? 'partially_paid' : 'unpaid'
               }) : null);

                // 4. Fetch Vendor Orders
                const resolvedId = validPOs.length > 0 ? (validPOs[0].project_id || currentProjectId || (data as any)?.project_id || 0) : 0;
                if (resolvedId > 0) {
                   try {
                     const voResponse = await poService.getProjectVendorOrders(resolvedId);
                     setVendorOrders(voResponse);
                   } catch (voError) {
                     console.warn('Failed to fetch vendor orders:', voError);
                     setVendorOrders([]);
                   }
                }


          } else {
              // Single PO Logic
              const poId = Number(data.id);
              if (!isNaN(poId)) {
                let resolvedProjectId = currentProjectId;

                // 1. Fetch Full PO Details
                try {
                    const freshDetails = await poService.getPODetails(poId);
                    if (freshDetails) {
                        const mappedId = freshDetails.project_id || (data as any).project_id || (data as any).projectId || 0;
                        setPoData(prev => prev ? ({ ...prev, ...freshDetails, project_id: mappedId }) : null);
                        
                        if (mappedId > 0) {
                            resolvedProjectId = mappedId;
                        } else if (freshDetails.project_name && projects.length > 0) {
                            // Fallback to name-based lookup
                            const targetName = freshDetails.project_name.trim().toLowerCase();
                            const matched = projects.find(p => p.name && p.name.trim().toLowerCase() === targetName);
                            if (matched?.id) resolvedProjectId = matched.id;
                        }
                    }
                } catch (detailsError) {
                    console.warn("Failed to fetch fresh PO details:", detailsError);
                }

                // 2. Fetch line items
                try {
                  const items = await poService.getLineItems(poId);
                  if (Array.isArray(items)) {
                    setLineItems((items as unknown as APIResponseItem[]).map((i) => ({
                      id: i.id,
                      client_po_id: poId,
                      description: i.description || i.item_name || "Item",
                      quantity: Number(i.quantity) || 0,
                      unit_price: Number(i.unit_price) || Number(i.rate) || 0,
                      amount: Number(i.amount) || Number(i.total_price) || 0,
                      created_at: new Date().toISOString()
                    })));
                  } else {
                    setLineItems([]);
                  }
                } catch (itemsError) {
                  console.warn('Failed to fetch line items:', itemsError);
                  setLineItems([]);
                }

                // 3. Fetch payments
                try {
                    const response = await poService.getPayments(poId, forceRefresh);
                    // Handle new object response format
                    if (response && 'payments' in response && Array.isArray(response.payments)) {
                       setPayments(response.payments);
                       if (response.summary) {
                         const summary = response.summary as POPaymentSummary;
                         setPaymentSummary(summary);
                         
                         // Update poData with fresh payment info
                         setPoData(prev => prev ? ({
                            ...prev,
                            payment_amount: summary.total_paid,
                            payment_status: summary.total_paid >= (prev.po_value || 0) ? 'paid' : summary.total_paid > 0 ? 'partially_paid' : 'unpaid'
                         }) : null);
                       }
                    } 
                    // Fallback for types that might still return array
                    else if (Array.isArray(response)) {
                      setPayments(response);
                      setPaymentSummary(null);
                    } else if (response && 'data' in response && Array.isArray((response as any).data)) {
                       setPayments((response as any).data);
                       setPaymentSummary(null);
                    } else {
                      setPayments([]);
                      setPaymentSummary(null);
                    }
                  } catch (paymentsError) {
                    console.warn('Failed to fetch payments:', paymentsError);
                    setPayments([]);
                    setPaymentSummary(null);
                  }

                // 4. Fetch Vendor Orders
                if (resolvedProjectId > 0) {
                    try {
                        const voResponse = await poService.getProjectVendorOrders(resolvedProjectId);
                        setVendorOrders(voResponse);
                    } catch (voError) {
                        console.warn('Failed to fetch vendor orders:', voError);
                        setVendorOrders([]);
                    }
                }
              }
          }

      } catch (error) {
          console.error("Error fetching detail data:", error);
      }
  }, [data, projects, currentProjectId]);

  const handleUpdatePaymentStatus = async (paymentId: number, newStatus: string) => {
      try {
          await poService.updatePayment(paymentId, { status: newStatus as any });
          toast({ title: "Success", description: "Payment status updated" });
          // Refresh detail data and dashboard data
          await Promise.all([fetchData(true), refreshData()]);
      } catch (error) {
          console.error("Update payment error:", error);
          toast({ title: "Error", description: "Failed to update payment status", variant: "destructive" });
      }
  };

  const handleCreatePayment = async () => {
       if (!data) return;
       try {
           const poId = Number(data.id);
           if (isNaN(poId)) return;
           
           const payload = {
               amount: Number(paymentFormData.amount),
               payment_date: paymentFormData.payment_date,
               payment_mode: paymentFormData.payment_mode,
               reference_number: paymentFormData.reference_number,
               notes: paymentFormData.notes,
               status: paymentFormData.status as any,
               is_tds_deducted: paymentFormData.is_tds_deducted,
               tds_amount: Number(paymentFormData.tds_amount),
               transaction_type: paymentFormData.transaction_type
           };
           
           await poService.createPayment(poId, payload);
           toast({ title: "Success", description: "Payment recorded" });
           setIsAddPaymentOpen(false);
           // Reset form
           setPaymentFormData({
                amount: '',
                payment_date: new Date().toISOString().split('T')[0],
                payment_mode: 'neft',
                reference_number: '',
                notes: '',
                status: 'pending',
                is_tds_deducted: false,
                tds_amount: 0,
                transaction_type: 'credit'
           });
           // Small delay to ensure backend processes the payment
           await new Promise(resolve => setTimeout(resolve, 500));
           // Refresh all dashboard data after payment is recorded
           await fetchData(true);
           await refreshData();
       } catch (error) {
           console.error('Create payment error:', error);
           toast({ title: "Error", description: "Failed to record payment", variant: "destructive" });
       }
  };

  const handleAddLineItem = async () => {
       if (!data) return;
       try {
           const poId = Number(data.id);
           if (isNaN(poId)) return;
           
           if (!lineItemFormData.description) {
               toast({ title: "Error", description: "Description is required", variant: "destructive" });
               return;
           }
           
           const amount = Number(lineItemFormData.quantity) * Number(lineItemFormData.unit_price);
           
           const payload = {
               description: lineItemFormData.description,
               quantity: Number(lineItemFormData.quantity),
               unit_price: Number(lineItemFormData.unit_price),
               amount: amount
           };
           
           await poService.addLineItem(poId, payload);
           toast({ title: "Success", description: "Line item added" });
           setIsAddLineItemOpen(false);
           setLineItemFormData({ description: '', quantity: 1, unit_price: 0 });
           // Refresh detail and dashboard data
           await Promise.all([fetchData(true), refreshData()]);
      } catch (error) {
           console.error('Line item error:', error);
           toast({ title: "Error", description: "Failed to add line item", variant: "destructive" });
      }
  };

  const handleDeleteLineItem = async (lineItemId: number) => {
    if (!window.confirm("Are you sure you want to delete this line item?")) return;
    try {
      await poService.deleteLineItem(lineItemId);
      toast({ title: "Success", description: "Line item deleted successfully" });
      await fetchData(true);
    } catch (error) {
      console.error('Delete line item error:', error);
      toast({ title: "Error", description: "Failed to delete line item", variant: "destructive" });
    }
  };

  const handleDeleteProject = async () => {
      if (!data) return;
      setIsDeleting(true);
      try {
          await poService.deletePO(Number(data.id));
          toast({ title: "Success", description: "Project deleted successfully" });
          if (onProjectDeleted) onProjectDeleted(Number(data.id));
          onClose(); // Close drawer
          // Refresh dashboard data after deletion
          await refreshData();
      } catch (error) {
          console.error("Delete error:", error);
          toast({ title: "Error", description: "Failed to delete project", variant: "destructive" });
      } finally {
          setIsDeleting(false);
          setDeleteProjectOpen(false);
      }
  };

  const handleViewVendorOrder = (order: VendorOrder) => {
      setSelectedDetailsOrder(order);
      setIsVendorOrderDetailsOpen(true);
  };

  const handleAddVendorOrder = () => {
      setSelectedVendorOrder(null);
      setIsVendorOrderDialogOpen(true);
  };

  const handleEditVendorOrder = (order: VendorOrder) => {
      setSelectedVendorOrder(order);
      setIsVendorOrderDialogOpen(true);
  };

  const handleDeleteVendorOrder = async (orderId: number) => {
      if (!data?.project_id) return;
      if (!window.confirm("Are you sure you want to delete this vendor order?")) return;
      try {
          await poService.deleteVendorOrder(data.project_id, orderId);
          toast({ title: "Success", description: "Vendor order deleted" });
          // Refresh detail data and dashboard data
          await Promise.all([fetchData(true), refreshData()]);
      } catch (error) {
          console.error("Delete VO error:", error);
          toast({ title: "Error", description: "Failed to delete vendor order", variant: "destructive" });
      }
  };
  
  // File Upload Handlers
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !data) return;

    try {
       await poService.uploadPOAttachment(data.id, file, category);
       toast({ title: "Success", description: "File uploaded successfully" });
       setIsUploadOpen(false);
       setFile(null);
       fetchData(); // Refresh to show new file
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
    }
  };

  const handleUpdateIndividualPO = async (poId: number, newValue: number) => {
    // Validation
    if (!newValue || newValue <= 0) {
      toast({ 
        title: "Invalid Value", 
        description: "PO value must be greater than 0", 
        variant: "destructive" 
      });
      return;
    }
    
    try {
      await poService.updatePO(poId, {
        po_value: newValue
      });
      toast({ title: "Success", description: `PO value updated to ${formatCurrency(newValue)} and dashboard synchronized` });
      // Refresh detail data and dashboard data in sequence to ensure proper sync
      await fetchData(true);
      await refreshData();
    } catch (error) {
      console.error('Update individual PO error:', error);
      toast({ title: "Error", description: "Failed to update individual PO value", variant: "destructive" });
    }
  };

  const handleSaveEdit = async () => {
    if (!editedData || !poData) return;
    
    // Validation: Check PO value if changed
    if (editedData.po_value !== poData.po_value) {
      // Validate that po_value is positive
      if (!editedData.po_value || editedData.po_value <= 0) {
        toast({ 
          title: "Invalid PO Value", 
          description: "PO value must be greater than 0", 
          variant: "destructive" 
        });
        return;
      }
      
      // Check if there's a significant change (more than 10% difference)
      const valueDifference = Math.abs(editedData.po_value - (poData.po_value || 0));
      const percentChange = ((valueDifference / (poData.po_value || 1)) * 100);
      
      if (percentChange > 10) {
        // Show confirmation dialog for large changes
        const confirmed = window.confirm(
          `You are changing the PO value from ${formatCurrency(poData.po_value || 0)} to ${formatCurrency(editedData.po_value)}.\n\nThis will affect receivables and payment calculations. Continue?`
        );
        if (!confirmed) return;
      }
    }
    
    try {
      // For bundled POs, use special handler that doesn't update value directly
      if (poData.po_ids && poData.po_ids.length > 1) {
        await poService.updateBundledPO(poData.po_ids, {
          notes: editedData.notes,
          status: editedData.status as any
        });
        toast({ 
          title: "Success", 
          description: "Bundled PO details updated and synchronized across dashboard"
        });
      } else {
        // Single PO can be updated normally
        await poService.updatePO(poData.id, {
          po_value: Number(editedData.po_value),
          notes: editedData.notes,
          status: editedData.status as any
        });
        toast({ title: "Success", description: "PO details updated and dashboard synchronized" });
      }
      setIsEditing(false);
      // Refresh detail data and dashboard data in sequence to ensure proper sync
      await fetchData(true);
      await refreshData();
    } catch (error) {
      console.error('Update PO error:', error);
      toast({ title: "Error", description: "Failed to update PO details", variant: "destructive" });
    }
  };

  if (!poData) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl p-0 flex flex-col h-full bg-background border-l shadow-2xl">
        <DialogTitle className="sr-only">Detailed View</DialogTitle>
        <DialogDescription className="sr-only">Detailed information and related data</DialogDescription>
        {/* Header - More Premium Design */}
        <div className="px-8 py-6 border-b flex items-start justify-between bg-gradient-to-r from-card to-card/50 shrink-0 relative overflow-hidden">
          {/* Subtle background accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mb-2 opacity-80">
              <span className="flex items-center gap-1.5">
                <FileText className="h-3 w-3" />
                Purchase Order Details
              </span>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-3xl font-black text-foreground tracking-tight">
                  {poData.po_number || `PO-${poData.id}`}
                </h2>
                <div className="flex gap-2">
                  <Badge variant="outline" className={cn(
                    "text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full border-2",
                    poData.status === 'active' ? "bg-blue-950/50 text-blue-400 border-blue-700/40" : 
                    poData.status === 'completed' ? "bg-emerald-950/50 text-emerald-400 border-emerald-700/40" :
                    poData.status === 'cancelled' ? "bg-rose-950/50 text-rose-400 border-rose-700/40" : 
                    "bg-slate-800/50 text-slate-400 border-slate-600/40"
                  )}>
                    {poData.status}
                  </Badge>
                  <Badge variant="outline" className={cn(
                    "text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full border-2",
                    poData.payment_status === 'paid' ? "text-emerald-400 bg-emerald-950/50 border-emerald-700/40" :
                    poData.payment_status === 'partially_paid' || poData.payment_status === 'partial' ? "text-amber-400 bg-amber-950/50 border-amber-700/40" :
                    "text-rose-400 bg-rose-950/50 border-rose-700/40"
                  )}>
                    {poData.payment_status ? (poData.payment_status === 'partially_paid' ? 'PARTIAL' : poData.payment_status.toUpperCase()) : 'UNPAID'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <div className="flex flex-col">
                    <span className="text-lg font-black text-foreground/80 tracking-tight leading-none">
                      {projects.find(p => Number(p.id) === Number(currentProjectId))?.name || poData.project_name || (data as any)?.project || (data as any)?.project_name || `Project #${poData.project_id || 'Unlinked'}`}
                    </span>
                    {projects.find(p => Number(p.id) === Number(currentProjectId))?.name && projects.find(p => Number(p.id) === Number(currentProjectId))?.name !== (poData.project_name || (data as any)?.project || (data as any)?.project_name) && (
                      <span className="text-[10px] text-primary/70 font-black uppercase tracking-widest mt-0.5">
                        {poData.project_name || (data as any)?.project || (data as any)?.project_name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-4 w-px bg-border mx-1" />
                <span className="text-sm font-medium text-muted-foreground">
                  {poData.client_name || (data as any)?.client || 'No Client'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10 ml-4">
            {isEditing ? (
                <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-xl border">
                  <Button variant="default" size="sm" onClick={handleSaveEdit} className="h-9 px-4 font-bold shadow-lg shadow-primary/20">
                    Save Changes
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="h-9">
                    Cancel
                  </Button>
                </div>
            ) : (
                <Button variant="outline" size="icon" onClick={() => {
                  setEditedData({...poData, status: ['active', 'completed', 'cancelled', 'draft', 'pending'].includes(poData.status) ? poData.status : 'active'});
                  setIsEditing(true);
                }} className="h-10 w-10 rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                  <Edit className="h-4.5 w-4.5" />
                </Button>
            )}
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-destructive hover:bg-destructive/10 transition-all duration-300" onClick={() => setDeleteProjectOpen(true)}>
                <Trash2 className="h-4.5 w-4.5" />
            </Button>
            <div className="h-8 w-px bg-border mx-1" />
            <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 rounded-full hover:bg-muted">
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
            <div className="px-8 border-b bg-card/30 shrink-0">
                <TabsList className="h-14 bg-transparent p-0 gap-8">
                    <TabsTrigger 
                        value="details" 
                        className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 text-xs font-black uppercase tracking-widest transition-all hover:text-primary/70"
                    >
                        Project Details
                    </TabsTrigger>
                    <TabsTrigger 
                        value="items" 
                        className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 text-xs font-black uppercase tracking-widest transition-all hover:text-primary/70"
                    >
                        Line Items
                    </TabsTrigger>
                    <TabsTrigger 
                        value="payments" 
                        className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 text-xs font-black uppercase tracking-widest transition-all hover:text-primary/70"
                    >
                        Payments
                    </TabsTrigger>
                    <TabsTrigger 
                        value="vendor-orders" 
                        className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 text-xs font-black uppercase tracking-widest transition-all hover:text-primary/70"
                    >
                        Vendor Orders
                    </TabsTrigger>
                </TabsList>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-muted/5">
                 <div className="p-8 pb-12">
                    <TabsContent value="details" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                         
                         {/* Multi-PO Bundle Table - Only shown for bundles */}
                         {multiPoData.length > 1 && (
                            <div className="bg-card rounded-2xl border shadow-md overflow-hidden animate-in zoom-in-95 duration-500">
                                <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
                                    <div>
                                        <Label className="text-[10px] text-white/70 uppercase tracking-[0.2em] font-black">Bundle Components</Label>
                                        <p className="text-white font-bold text-sm">{multiPoData.length} Combined Purchase Orders</p>
                                    </div>
                                    <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">Aggregated View</Badge>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 border-b">
                                            <tr>
                                                <th className="px-6 py-3 text-left font-black text-[10px] text-muted-foreground uppercase tracking-wider">PO Reference</th>
                                                <th className="px-6 py-3 text-left font-black text-[10px] text-muted-foreground uppercase tracking-wider">Issue Date</th>
                                                <th className="px-6 py-3 text-right font-black text-[10px] text-muted-foreground uppercase tracking-wider">Gross Value</th>
                                                <th className="px-6 py-3 text-right font-black text-[10px] text-muted-foreground uppercase tracking-wider">Settled</th>
                                                <th className="px-6 py-3 text-center font-black text-[10px] text-muted-foreground uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-right font-black text-[10px] text-muted-foreground uppercase tracking-wider">Control</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {multiPoData.map((po, idx) => (
                                                <tr key={po.id || `po-${idx}`} className="hover:bg-muted/30 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                                            <span className="font-bold text-foreground">{po.po_number || `PO-${po.id}`}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground font-medium">{po.po_date || '--'}</td>
                                                    <td className="px-6 py-4 text-right font-black text-foreground">
                                                        {formatCurrency(po.po_value)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                                                        {formatCurrency(po.payment_amount || 0)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <Badge variant="outline" className="h-5 text-[9px] font-black uppercase bg-muted/50 tracking-tighter">
                                                            {po.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button 
                                                          size="sm" 
                                                          variant="ghost"
                                                          className="h-8 px-3 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                                                          onClick={() => {
                                                            const newValue = prompt(`Update value for ${po.po_number || 'PO'}:`, String(po.po_value));
                                                            if (newValue && !isNaN(Number(newValue))) {
                                                              handleUpdateIndividualPO(po.id, Number(newValue));
                                                            }
                                                          }}
                                                        >
                                                          Edit Value
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-muted/40 font-black border-t-2">
                                                <td className="px-6 py-4 text-[11px] uppercase tracking-[0.1em]" colSpan={2}>Aggregated Total</td>
                                                <td className="px-6 py-4 text-right text-lg tracking-tighter">{formatCurrency(poData.po_value)}</td>
                                                <td className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400 text-lg tracking-tighter">{formatCurrency(poData.payment_amount || 0)}</td>
                                                <td colSpan={2}></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                         )}
 
                         <div className="grid md:grid-cols-2 gap-8">
                            {/* Left Column: Key Info */}
                            <div className="space-y-8">
                                <div className="bg-card rounded-2xl border shadow-sm overflow-hidden group">
                                    <div className="bg-muted/50 px-5 py-3 border-b flex items-center justify-between">
                                        <Label className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">Contract Identity</Label>
                                        <Badge variant="outline" className="text-[9px] font-bold bg-background/50 h-5">Verified</Badge>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center group/item p-2 hover:bg-muted/30 rounded-lg transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Package className="h-2.5 w-2.5 text-primary" />
                                                    </div>
                                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Project Name</span>
                                                </div>
                                                <span className="text-sm font-black text-foreground flex flex-col items-end gap-0.5">
                                                    <div className="flex items-center gap-2">
                                                        {(currentProjectId === 0 || !currentProjectId) && (
                                                            <AlertCircle className="h-3 w-3 text-amber-500" />
                                                        )}
                                                        <span>{projects.find(p => Number(p.id) === Number(currentProjectId))?.name || poData.project_name || (currentProjectId === 0 ? 'Not Linked to Project' : 'Generic Project')}</span>
                                                    </div>
                                                    {projects.find(p => Number(p.id) === Number(currentProjectId))?.name && projects.find(p => Number(p.id) === Number(currentProjectId))?.name !== (poData.project_name || (data as any)?.project) && (
                                                        <span className="text-[9px] text-primary/70 font-black uppercase tracking-widest">
                                                            {poData.project_name || (data as any)?.project}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                            {(currentProjectId === 0 || !currentProjectId) && (
                                                <div className="mx-2 mb-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
                                                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold leading-tight">
                                                        CRITICAL: This PO is not linked to any project. Vendor orders and financial tracking for this PO will be impaired.
                                                    </p>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        className="h-7 w-full text-[9px] font-black uppercase text-amber-600 border-amber-500/30 hover:bg-amber-500/20"
                                                        onClick={() => setIsVendorOrderDialogOpen(true)}
                                                    >
                                                        Link via Vendor Order
                                                    </Button>
                                                </div>
                                            )}
                                            <Separator className="opacity-30" />
                                            <div className="flex justify-between items-center group/item p-2 hover:bg-muted/30 rounded-lg transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Building2 className="h-2.5 w-2.5 text-primary" />
                                                    </div>
                                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client Identity</span>
                                                </div>
                                                <span className="text-sm font-black text-foreground">{poData.client_name || 'Individual'}</span>
                                            </div>
                                            <Separator className="opacity-30" />
                                            <div className="flex justify-between items-center group/item p-2 hover:bg-muted/30 rounded-lg transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Clock className="h-2.5 w-2.5 text-primary" />
                                                    </div>
                                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inclusion Date</span>
                                                </div>
                                                <span className="text-sm font-black text-foreground">{poData.created_at ? new Date(poData.created_at).toLocaleDateString(undefined, { dateStyle: 'long' }) : '--'}</span>
                                            </div>
                                        </div>

                                        <div className="mt-6">
                                            <Label className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mb-3 block">Internal Documentation</Label>
                                            <div className="relative">
                                                {isEditing ? (
                                                    <Textarea 
                                                        value={editedData?.notes || ''} 
                                                        onChange={(e) => setEditedData(prev => prev ? {...prev, notes: e.target.value} : prev)} 
                                                        placeholder="Record confidential notes, payment terms, or project caveats..."
                                                        className="min-h-[140px] w-full bg-muted/20 border-primary/10 focus:border-primary/20 transition-all rounded-xl text-sm leading-relaxed"
                                                    />
                                                ) : (
                                                    <div className="bg-muted/20 p-5 rounded-2xl border border-dashed border-muted-foreground/20 min-h-[140px] relative transition-all hover:border-primary/20 group">
                                                        <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap italic">
                                                            {poData.notes || "No internal documentation has been added to this purchase order record yet."}
                                                        </p>
                                                        {poData.notes && (
                                                           <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                              <Badge variant="outline" className="text-[8px] h-4">Read Only</Badge>
                                                           </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
 
                            {/* Right Column: Financials & Status */}
                            <div className="space-y-8">
                                 <div className="bg-card rounded-2xl border shadow-sm overflow-hidden group">
                                    <div className="bg-muted/50 px-5 py-3 border-b flex items-center justify-between">
                                        <Label className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">Project Status</Label>
                                        <Badge className="text-[9px] font-bold bg-primary/10 text-primary border-primary/20 h-5">Live Lifecycle</Badge>
                                    </div>
                                    <div className="p-6">
                                         <div className="flex flex-wrap gap-4">
                                            <div className="flex-1 space-y-2">
                                                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest pl-1">Contract Lifecycle</span>
                                                {isEditing ? (
                                                    <Select 
                                                        value={editedData?.status || 'active'} 
                                                        onValueChange={(val) => setEditedData(prev => prev ? {...prev, status: val as any} : prev)}
                                                    >
                                                        <SelectTrigger className="w-full h-11 text-xs font-bold uppercase tracking-wider rounded-xl border-primary/10 focus:ring-primary/20">
                                                            <SelectValue placeholder="Select Status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="active" className="text-xs font-bold uppercase text-blue-400">Active Stage</SelectItem>
                                                            <SelectItem value="completed" className="text-xs font-bold uppercase text-emerald-400">Completed</SelectItem>
                                                            <SelectItem value="cancelled" className="text-xs font-bold uppercase text-rose-400">Cancelled</SelectItem>
                                                            <SelectItem value="draft" className="text-xs font-bold uppercase text-slate-400">Draft Mode</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <div className={cn(
                                                        "w-full h-11 flex items-center justify-center rounded-xl border-2 px-4",
                                                        poData.status === 'active' ? "bg-blue-950/50 border-blue-700/30 text-blue-400 font-black" :
                                                        poData.status === 'completed' ? "bg-emerald-950/50 border-emerald-700/30 text-emerald-400 font-black" :
                                                        poData.status === 'cancelled' ? "bg-rose-950/50 border-rose-700/30 text-rose-400 font-black" :
                                                        "bg-slate-800/50 border-slate-600/30 text-slate-400 font-black"
                                                    )}>
                                                        <div className="flex items-center gap-2 text-xs uppercase tracking-widest">
                                                            <div className={cn("h-2 w-2 rounded-full", poData.status === 'active' ? "bg-blue-500 animate-pulse" : poData.status === 'completed' ? "bg-emerald-500" : "bg-rose-500")} />
                                                            {poData.status} Life Cycle
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex-1 space-y-2">
                                                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest pl-1">Financial State</span>
                                                <div className={cn(
                                                    "w-full h-11 flex items-center justify-center rounded-xl border-2 px-4",
                                                    poData.payment_status === 'paid' ? "bg-emerald-950/50 border-emerald-700/30 text-emerald-400 font-black" :
                                                    poData.payment_status === 'partially_paid' || poData.payment_status === 'partial' ? "bg-amber-950/50 border-amber-700/30 text-amber-400 font-black" :
                                                    "bg-rose-950/50 border-rose-700/30 text-rose-400 font-black"
                                                )}>
                                                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest">
                                                        <div className={cn("h-2 w-2 rounded-full", poData.payment_status === 'paid' ? "bg-emerald-500" : "bg-amber-500 animate-pulse")} />
                                                        {poData.payment_status ? (poData.payment_status === 'partially_paid' ? 'Partial Settlement' : poData.payment_status.toUpperCase()) : 'Not Started'}
                                                    </div>
                                                </div>
                                            </div>
                                         </div>
                                    </div>
                                 </div>

                                 <div className="bg-card rounded-2xl border shadow-sm overflow-hidden group">
                                     <div className="bg-muted/50 px-5 py-3 border-b flex items-center justify-between">
                                         <Label className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">Financial Performance</Label>
                                         <Badge variant="outline" className="text-[9px] font-bold bg-background/50 h-5">Real-time Data</Badge>
                                     </div>
                                     
                                     <div className="p-6 space-y-6">
                                         {poData.po_ids && poData.po_ids.length > 1 && (
                                           <div className="flex items-center gap-3 p-3 bg-amber-950/20 border border-amber-800/30 rounded-xl">
                                             <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
                                             <p className="text-[11px] text-amber-400 font-medium leading-normal">
                                               This is a <span className="font-bold underline">bundled PO</span>. Individual PO values are shown below.
                                             </p>
                                           </div>
                                         )}
                                         
                                         <div className="space-y-4">
                                             <div className="flex justify-between items-end">
                                                 <div className="flex flex-col gap-1">
                                                     <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Contract Value</span>
                                                     {isEditing && poData.po_ids && poData.po_ids.length === 1 ? (
                                                         <div className="flex items-center gap-2 mt-1">
                                                           <Input 
                                                              type="number" 
                                                              value={editedData?.po_value || ''} 
                                                              onChange={(e) => setEditedData(prev => prev ? {...prev, po_value: Number(e.target.value)} : prev)}
                                                              className="w-[180px] h-10 text-xl font-black border-primary/20 focus:border-primary focus:ring-primary/20 bg-muted/30"
                                                              min="0.01"
                                                              step="0.01"
                                                              placeholder="0.00"
                                                           />
                                                         </div>
                                                     ) : (
                                                        <span className="font-black text-3xl text-foreground tracking-tighter">{formatCurrency(poData.po_value)}</span>
                                                     )}
                                                 </div>
                                                 {isEditing && editedData?.po_value !== poData.po_value && editedData?.po_value !== undefined && (
                                                    <span className="text-[10px] bg-amber-950/50 text-amber-400 border border-amber-800/30 px-2 py-0.5 rounded font-black uppercase mb-1">Pending Sync</span>
                                                 )}
                                             </div>

                                             <div className="grid grid-cols-2 gap-4">
                                                 <div className="bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05] border border-emerald-500/10 rounded-xl p-4 transition-all hover:bg-emerald-500/[0.05]">
                                                     <div className="flex items-center gap-2 mb-1">
                                                         <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                         <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Received</span>
                                                     </div>
                                                     <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(poData.payment_amount || 0)}</span>
                                                 </div>
                                                 
                                                 <div className="bg-rose-500/[0.03] dark:bg-rose-500/[0.05] border border-rose-500/10 rounded-xl p-4 transition-all hover:bg-rose-500/[0.05]">
                                                     <div className="flex items-center gap-2 mb-1">
                                                         <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                                                         <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-widest">Outstanding</span>
                                                     </div>
                                                     <span className="text-xl font-black text-rose-700 dark:text-rose-400 tabular-nums">
                                                        {formatCurrency(Math.max(0, (poData.po_value || 0) - (poData.payment_amount || 0)))}
                                                     </span>
                                                 </div>
                                             </div>

                                             {isEditing && editedData?.po_value !== poData.po_value && (
                                               <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-xl border border-primary/20 space-y-2 animate-in fade-in slide-in-from-top-2">
                                                 <div className="flex items-center gap-2 mb-1">
                                                     <TrendingUp className="h-3.5 w-3.5 text-primary" />
                                                     <span className="text-[10px] font-black text-primary uppercase tracking-widest">Projected Balance</span>
                                                 </div>
                                                 <div className="flex justify-between items-center">
                                                   <span className="text-xs font-medium text-muted-foreground">New Outstanding:</span>
                                                   <span className="text-lg font-black text-primary">{formatCurrency(Math.max(0, (editedData.po_value || 0) - (poData.payment_amount || 0)))}</span>
                                                 </div>
                                                 {poData.payment_amount && poData.payment_amount > 0 && (
                                                   <div className="flex justify-between items-center">
                                                     <span className="text-xs font-medium text-muted-foreground">Updated Status:</span>
                                                     <Badge variant="outline" className="text-[9px] font-black uppercase h-5 bg-background border-primary/30 text-primary">
                                                       {poData.payment_amount >= (editedData.po_value || 0) ? 'Fully Paid' : 'Partially Paid'}
                                                     </Badge>
                                                   </div>
                                                 )}
                                               </div>
                                             )}
                                         </div>
                                     </div>
                                 </div>

                                 {poData.vendor_name && (
                                   <div>
                                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Associated Vendor</Label>
                                      <p className="font-medium mt-1">{poData.vendor_name}</p>
                                   </div>
                                 )}
                            </div>
                         </div>
                    </TabsContent>

                    <TabsContent value="items" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                       <div className="space-y-6">
                          <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-black text-foreground tracking-tight">Contract Line Items</h3>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Breakdown of goods and services</p>
                            </div>
                            <Button size="sm" onClick={() => setIsAddLineItemOpen(true)} className="bg-primary hover:bg-primary/90 font-bold px-4 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Item
                            </Button>
                          </div>
                          
                          {lineItems.length > 0 ? (
                              <div className="bg-card rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md">
                                  <table className="w-full text-sm">
                                      <thead className="bg-muted/50 border-b">
                                          <tr>
                                              <th className="px-6 py-4 text-left font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Description</th>
                                              <th className="px-6 py-4 text-center font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Qty</th>
                                              <th className="px-6 py-4 text-right font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Unit Rate</th>
                                              <th className="px-6 py-4 text-right font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Subtotal</th>
                                              <th className="px-6 py-4 text-center font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Action</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y">
                                          {lineItems.map((item, idx) => (
                                              <tr key={item.id || `item-${idx}`} className="group hover:bg-muted/20 transition-colors">
                                                  <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-foreground">{item.description}</span>
                                                        <span className="text-[10px] text-muted-foreground font-medium uppercase truncate max-w-[200px]">{item.notes || 'Service Item'}</span>
                                                    </div>
                                                  </td>
                                                  <td className="px-6 py-4 text-center font-mono font-bold text-foreground/80">{item.quantity}</td>
                                                  <td className="px-6 py-4 text-right font-medium text-muted-foreground">{formatCurrency(item.unit_price)}</td>
                                                  <td className="px-6 py-4 text-right font-black text-primary">{formatCurrency(item.amount)}</td>
                                                  <td className="px-6 py-4 text-center">
                                                    <Button 
                                                      size="sm" 
                                                      variant="ghost"
                                                      className="h-8 w-8 p-0 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-full transition-all"
                                                      onClick={() => handleDeleteLineItem(item.id)}
                                                    >
                                                      <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                  </td>
                                              </tr>
                                          ))}
                                          <tr className="bg-muted/5 border-t-2">
                                            <td colSpan={3} className="px-6 py-5 text-right font-black text-[10px] text-muted-foreground uppercase tracking-widest">Aggregate Total</td>
                                            <td className="px-6 py-5 text-right font-black text-lg text-primary tracking-tighter">{formatCurrency(lineItems.reduce((sum, item) => sum + (item.amount || 0), 0))}</td>
                                            <td></td>
                                          </tr>
                                      </tbody>
                                  </table>
                              </div>
                          ) : (
                              <div className="flex flex-col items-center justify-center py-20 bg-card rounded-3xl border-2 border-dashed border-primary/10 transition-all hover:border-primary/30 group">
                                  <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                    <FileText className="h-10 w-10 text-primary/40" />
                                  </div>
                                  <h4 className="text-lg font-black text-foreground tracking-tight">No Line Items Detected</h4>
                                  <p className="text-sm text-muted-foreground mt-2 mb-8 max-w-[300px] text-center font-medium">Structure your purchase order by adding detailed items to track quantities and individual rates.</p>
                                  <Button onClick={() => setIsAddLineItemOpen(true)} variant="outline" className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-bold px-6">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Initialize Line Items
                                  </Button>
                              </div>
                          )}
                       </div>
                    </TabsContent>

                    <TabsContent value="payments" className="mt-0">
                         <div className="space-y-6">
                              {/* Payment Summary Cards */}
                              {paymentSummary && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-emerald-950/30 p-5 rounded-xl border border-emerald-800/30 hover:border-emerald-700/50 transition-all">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[10px] font-black text-emerald-400/70 uppercase tracking-widest">Total Paid</p>
                                            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                                              <TrendingUp className="h-4 w-4 text-emerald-400" />
                                            </div>
                                        </div>
                                        <p className="text-2xl font-black text-emerald-400 tracking-tight">{formatCurrency(paymentSummary.total_paid)}</p>
                                        <p className="text-xs text-emerald-500/60 mt-2 font-medium">{paymentSummary.cleared_count} cleared transactions</p>
                                    </div>
                                    <div className="bg-blue-950/30 p-5 rounded-xl border border-blue-800/30 hover:border-blue-700/50 transition-all">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[10px] font-black text-blue-400/70 uppercase tracking-widest">Status</p>
                                            <div className="h-8 w-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                                              <CheckCircle2 className="h-4 w-4 text-blue-400" />
                                            </div>
                                        </div>
                                        <p className="text-2xl font-black text-blue-400 tracking-tight">{paymentSummary.cleared_count}</p>
                                        <p className="text-xs text-blue-500/60 mt-2 font-medium">cleared â€¢ {paymentSummary.pending_count} pending</p>
                                    </div>
                                    <div className="bg-amber-950/30 p-5 rounded-xl border border-amber-800/30 hover:border-amber-700/50 transition-all">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[10px] font-black text-amber-400/70 uppercase tracking-widest">TDS Deducted</p>
                                            <div className="h-8 w-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                                              <DollarSign className="h-4 w-4 text-amber-400" />
                                            </div>
                                        </div>
                                        <p className="text-2xl font-black text-amber-400 tracking-tight">{formatCurrency(paymentSummary.total_tds)}</p>
                                        <p className="text-xs text-amber-500/60 mt-2 font-medium">from {paymentSummary.cleared_count + paymentSummary.pending_count || 0} transactions</p>
                                    </div>
                                </div>
                              )}

                              {/* Income, Expense & Net Tiles */}
                              {(() => {
                                const creditTotal = payments.filter(p => p.transaction_type === 'credit').reduce((sum, p) => sum + (p.amount || 0), 0);
                                const debitTotal = payments.filter(p => p.transaction_type === 'debit').reduce((sum, p) => sum + (p.amount || 0), 0);
                                const net = creditTotal - debitTotal;
                                const creditCount = payments.filter(p => p.transaction_type === 'credit').length;
                                const debitCount = payments.filter(p => p.transaction_type === 'debit').length;
                                const isPositive = net >= 0;

                                return (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-emerald-950/20 p-5 rounded-xl border border-emerald-800/25 hover:border-emerald-700/40 transition-all">
                                      <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest">Total Income</p>
                                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                          <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                                        </div>
                                      </div>
                                      <p className="text-2xl font-black text-emerald-400 tracking-tight">{formatCurrency(creditTotal)}</p>
                                      <p className="text-xs text-emerald-500/50 mt-2 font-medium">{creditCount} transaction{creditCount !== 1 ? 's' : ''}</p>
                                    </div>
                                    <div className="bg-rose-950/20 p-5 rounded-xl border border-rose-800/25 hover:border-rose-700/40 transition-all">
                                      <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-black text-rose-400/60 uppercase tracking-widest">Total Expense</p>
                                        <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                                          <ArrowDownLeft className="h-4 w-4 text-rose-400" />
                                        </div>
                                      </div>
                                      <p className="text-2xl font-black text-rose-400 tracking-tight">{formatCurrency(debitTotal)}</p>
                                      <p className="text-xs text-rose-500/50 mt-2 font-medium">{debitCount} transaction{debitCount !== 1 ? 's' : ''}</p>
                                    </div>
                                    <div className={cn(
                                      "p-5 rounded-xl border transition-all",
                                      isPositive 
                                        ? "bg-blue-950/20 border-blue-800/25 hover:border-blue-700/40" 
                                        : "bg-orange-950/20 border-orange-800/25 hover:border-orange-700/40"
                                    )}>
                                      <div className="flex items-center justify-between mb-3">
                                        <p className={cn("text-[10px] font-black uppercase tracking-widest", isPositive ? "text-blue-400/60" : "text-orange-400/60")}>Net Cash Flow</p>
                                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", isPositive ? "bg-blue-500/10" : "bg-orange-500/10")}>
                                          <TrendingUp className={cn("h-4 w-4", isPositive ? "text-blue-400" : "text-orange-400")} />
                                        </div>
                                      </div>
                                      <p className={cn("text-2xl font-black tracking-tight", isPositive ? "text-blue-400" : "text-orange-400")}>
                                        {formatCurrency(net)}
                                      </p>
                                      <p className={cn("text-xs mt-2 font-medium", isPositive ? "text-blue-500/50" : "text-orange-500/50")}>
                                        {payments.length} total transactions
                                      </p>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Payment History */}
                              <div className="flex justify-between items-center pt-2">
                                  <div>
                                    <h3 className="font-bold text-lg text-foreground">Payment History</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">{payments.length} payment{payments.length !== 1 ? 's' : ''} recorded</p>
                                  </div>
                                  <Button size="sm" onClick={() => setIsAddPaymentOpen(true)} className="bg-primary hover:bg-primary/90">
                                      <Plus className="h-4 w-4 mr-2" />
                                      Record Payment
                                  </Button>
                              </div>

                              <div className="space-y-3">
                                  {payments.length > 0 ? payments.map((p) => (
                                      <div key={p.id} className={cn(
                                        "group rounded-xl border overflow-hidden transition-all duration-200",
                                        p.transaction_type === 'credit' 
                                          ? "bg-emerald-950/15 border-emerald-800/25 hover:border-emerald-700/40" 
                                          : p.transaction_type === 'debit' 
                                            ? "bg-rose-950/15 border-rose-800/25 hover:border-rose-700/40" 
                                            : "bg-muted/20 border-border/40"
                                      )}>
                                          <div className="p-4">
                                            <div className="flex items-start justify-between gap-4">
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-3">
                                                  <div className={cn(
                                                    "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0",
                                                    p.transaction_type === 'credit' ? "bg-emerald-500/15 text-emerald-400" : p.transaction_type === 'debit' ? "bg-rose-500/15 text-rose-400" : "bg-muted text-muted-foreground"
                                                  )}>
                                                    {p.transaction_type === 'credit' ? <ArrowUpRight className="h-4.5 w-4.5" /> : p.transaction_type === 'debit' ? <ArrowDownLeft className="h-4.5 w-4.5" /> : <DollarSign className="h-4.5 w-4.5" />}
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                      <span className={cn(
                                                        "text-base font-bold tracking-tight",
                                                        p.transaction_type === 'credit' ? "text-emerald-400" : p.transaction_type === 'debit' ? "text-rose-400" : "text-foreground"
                                                      )}>
                                                        {p.transaction_type === 'credit' ? '+' : p.transaction_type === 'debit' ? 'âˆ’' : ''}{formatCurrency(p.amount)}
                                                      </span>
                                                      <Badge className={cn(
                                                        "text-[10px] font-bold h-5 px-1.5 ml-auto rounded-md border",
                                                        p.transaction_type === 'credit' ? "bg-emerald-500/15 text-emerald-400 border-emerald-700/30" : p.transaction_type === 'debit' ? "bg-rose-500/15 text-rose-400 border-rose-700/30" : "bg-muted text-muted-foreground border-border"
                                                      )}>
                                                        {p.transaction_type === 'credit' ? 'Income' : p.transaction_type === 'debit' ? 'Expense' : 'Other'}
                                                      </Badge>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground space-x-1.5 flex flex-wrap items-center">
                                                      <span className="inline-flex items-center gap-1">
                                                        <Calendar className="h-3 w-3 text-muted-foreground/50" />
                                                        {p.payment_date}
                                                      </span>
                                                      <span className="text-muted-foreground/30">â€¢</span>
                                                      <span className="inline-flex items-center gap-1 capitalize">
                                                        <CreditCard className="h-3 w-3 text-muted-foreground/50" />
                                                        {p.payment_mode || 'neft'}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>
                                                
                                                {(p.reference_number || p.notes || (p.is_tds_deducted && p.tds_amount)) && (
                                                  <div className="space-y-2 mt-3 pt-3 border-t border-border/20">
                                                    {p.reference_number && (
                                                      <div className="flex items-center gap-2">
                                                        <span className="text-xs font-semibold text-muted-foreground">Reference:</span>
                                                        <code className="text-xs font-mono bg-muted/40 px-2 py-1 rounded text-foreground/70 border border-border/30">{p.reference_number}</code>
                                                      </div>
                                                    )}
                                                    {p.notes && (
                                                      <p className="text-xs text-muted-foreground italic leading-relaxed">
                                                        ðŸ’¬ {p.notes}
                                                      </p>
                                                    )}
                                                    {p.is_tds_deducted && p.tds_amount && (
                                                      <div className="flex items-center gap-2 bg-amber-950/30 px-3 py-2 rounded-lg border border-amber-800/30">
                                                        <AlertCircle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                                                        <span className="text-xs font-semibold text-amber-400">TDS Deducted: â‚¹{p.tds_amount}</span>
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                              
                                              <div className="flex items-center gap-2 flex-shrink-0">
                                                <Select 
                                                  value={p.status} 
                                                  onValueChange={(val) => handleUpdatePaymentStatus(p.id, val)}
                                                >
                                                  <SelectTrigger className="h-8 w-auto border-none p-0 focus:ring-0 shadow-none bg-transparent">
                                                    <Badge 
                                                      className={cn(
                                                        "cursor-pointer font-bold text-[10px] px-2.5 py-0.5 h-6 flex items-center gap-1.5 transition-all hover:opacity-80 rounded-md border uppercase tracking-wider",
                                                        (p.status === 'completed' || p.status === 'cleared') && "bg-emerald-950/40 text-emerald-400 border-emerald-700/40",
                                                        p.status === 'pending' && "bg-blue-950/40 text-blue-400 border-blue-700/40",
                                                        p.status === 'bounced' && "bg-rose-950/40 text-rose-400 border-rose-700/40"
                                                      )}
                                                    >
                                                      {p.status === 'cleared' || p.status === 'completed' ? (
                                                        <><CheckCircle2 className="h-3 w-3" /> {p.status}</>
                                                      ) : p.status === 'pending' ? (
                                                        <><Clock className="h-3 w-3" /> {p.status}</>
                                                      ) : (
                                                        <><AlertCircle className="h-3 w-3" /> {p.status}</>
                                                      )}
                                                    </Badge>
                                                  </SelectTrigger>
                                                  <SelectContent className="bg-popover border-border">
                                                    <SelectItem value="pending">
                                                      <span className="inline-flex items-center gap-1.5 text-blue-400"><Clock className="h-3 w-3" /> Pending</span>
                                                    </SelectItem>
                                                    <SelectItem value="cleared">
                                                      <span className="inline-flex items-center gap-1.5 text-emerald-400"><CheckCircle2 className="h-3 w-3" /> Cleared</span>
                                                    </SelectItem>
                                                    <SelectItem value="bounced">
                                                      <span className="inline-flex items-center gap-1.5 text-rose-400"><AlertCircle className="h-3 w-3" /> Bounced</span>
                                                    </SelectItem>
                                                    <SelectItem value="completed">
                                                      <span className="inline-flex items-center gap-1.5 text-emerald-400"><CheckCircle2 className="h-3 w-3" /> Completed</span>
                                                    </SelectItem>
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                            </div>
                                          </div>
                                      </div>
                                  )) : (
                                    <div className="py-16 rounded-xl border-2 border-dashed border-border/40 text-center flex flex-col items-center justify-center bg-muted/10">
                                      <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mb-3 mx-auto">
                                        <CreditCard className="h-6 w-6 text-muted-foreground/50" />
                                      </div>
                                      <p className="text-sm font-semibold text-foreground">No payments recorded</p>
                                      <p className="text-xs text-muted-foreground mt-1 mb-4">Start recording payments to track your finances</p>
                                      <Button size="sm" onClick={() => setIsAddPaymentOpen(true)} variant="outline" className="border-border/60 text-foreground hover:bg-muted/30">
                                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                                        Record First Payment
                                      </Button>
                                    </div>
                                  )}
                              </div>
                         </div>
                    </TabsContent>


                    <TabsContent value="vendor-orders" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                       <div className="space-y-6">
                          <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-black text-foreground tracking-tight">Project Vendor Orders</h3>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Sub-contractors and resource allocations</p>
                            </div>
                            <Button size="sm" onClick={handleAddVendorOrder} className="bg-primary hover:bg-primary/90 font-bold px-4 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                              <Plus className="h-4 w-4 mr-2" />
                              Create Vendor Order
                            </Button>
                          </div>

                          {vendorOrders.length > 0 ? (
                              <div className="bg-card rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md">
                                  <table className="w-full text-sm">
                                      <thead className="bg-muted/50 border-b">
                                          <tr>
                                              <th className="px-6 py-4 text-left font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">VO Number</th>
                                              <th className="px-6 py-4 text-left font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Scope of Work</th>
                                              <th className="px-6 py-4 text-center font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Status</th>
                                              <th className="px-6 py-4 text-right font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Order Value</th>
                                              <th className="px-6 py-4 text-right font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Actions</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y">
                                          {vendorOrders.map((order) => (
                                              <tr key={order.id} className="group hover:bg-muted/20 transition-colors">
                                                  <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                        <span className="font-black text-foreground">{order.po_number || `VO-${order.id}`}</span>
                                                    </div>
                                                  </td>
                                                  <td className="px-6 py-4">
                                                    <p className="text-muted-foreground font-medium max-w-[250px] truncate leading-relaxed">
                                                        {order.description || <span className="text-[10px] uppercase italic text-muted-foreground/50">No scope defined</span>}
                                                    </p>
                                                  </td>
                                                  <td className="px-6 py-4 text-center">
                                                      <Badge variant="outline" className={cn(
                                                          "text-[9px] h-5 px-2 font-black uppercase tracking-tighter rounded-md",
                                                          order.work_status === 'completed' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                                                          order.work_status === 'in_progress' ? "bg-blue-50 text-blue-700 border-blue-100" : 
                                                          "bg-muted/50 text-muted-foreground border-border"
                                                      )}>
                                                        {order.work_status || order.status}
                                                      </Badge>
                                                  </td>
                                                  <td className="px-6 py-4 text-right font-black text-foreground">{formatCurrency(order.amount)}</td>
                                                  <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5" onClick={() => handleViewVendorOrder(order)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5" onClick={() => handleEditVendorOrder(order)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive/40 hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteVendorOrder(order.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                  </td>
                                              </tr>
                                          ))}
                                          <tr className="bg-muted/5 border-t-2">
                                            <td colSpan={3} className="px-6 py-5 text-right font-black text-[10px] text-muted-foreground uppercase tracking-widest">Total Outflow</td>
                                            <td className="px-6 py-5 text-right font-black text-lg text-foreground tracking-tighter">{formatCurrency(vendorOrders.reduce((sum, order) => sum + (order.amount || 0), 0))}</td>
                                            <td></td>
                                          </tr>
                                      </tbody>
                                  </table>
                              </div>
                          ) : (
                              <div className="flex flex-col items-center justify-center py-20 bg-card rounded-3xl border-2 border-dashed border-primary/10 transition-all hover:border-primary/30 group">
                                  <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                    <Building2 className="h-10 w-10 text-primary/40" />
                                  </div>
                                  <h4 className="text-lg font-black text-foreground tracking-tight">No Vendor Orders Linked</h4>
                                  <p className="text-sm text-muted-foreground mt-2 mb-8 max-w-[300px] text-center font-medium">Outsource tasks or procure materials by creating orders for your registered vendors.</p>
                                  <Button onClick={handleAddVendorOrder} variant="outline" className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-bold px-6">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Vendor Allocation
                                  </Button>
                              </div>
                          )}
                       </div>
                    </TabsContent>


                 </div>
            </div>
       </Tabs>
      </SheetContent>



      <VendorOrderDialog 
        open={isVendorOrderDialogOpen} 
        onClose={() => setIsVendorOrderDialogOpen(false)} 
        projectId={currentProjectId}
        purchaseOrder={poData}
        existingOrder={selectedVendorOrder}
        onSuccess={async () => {
          await fetchData(); // Refresh DetailDrawer data
          await refreshData(); // Refresh dashboard data (updates VendorPOTracking)
        }}
      />

      <VendorOrderDetails 
        open={isVendorOrderDetailsOpen} 
        onClose={() => setIsVendorOrderDetailsOpen(false)} 
        vendorOrder={selectedDetailsOrder}
      />

      {/* Add Payment Dialog */}
      <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Add a new payment record to this purchase order</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Amount</Label>
                 <Input 
                   type="number" 
                   value={paymentFormData.amount} 
                   onChange={(e) => setPaymentFormData({...paymentFormData, amount: e.target.value})}
                   placeholder="0.00"
                 />
               </div>
               <div className="space-y-2">
                 <Label>Date</Label>
                 <Input 
                   type="date" 
                   value={paymentFormData.payment_date} 
                   onChange={(e) => setPaymentFormData({...paymentFormData, payment_date: e.target.value})}
                 />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Mode</Label>
                    <Select 
                      value={paymentFormData.payment_mode} 
                      onValueChange={(val) => setPaymentFormData({...paymentFormData, payment_mode: val})}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="neft">NEFT</SelectItem>
                            <SelectItem value="imap">IMPS</SelectItem>
                            <SelectItem value="rtgs">RTGS</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Type</Label>
                    <Select 
                      value={paymentFormData.transaction_type} 
                      onValueChange={(val: any) => setPaymentFormData({...paymentFormData, transaction_type: val})}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="credit">Income</SelectItem>
                            <SelectItem value="debit">Expense</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                      value={paymentFormData.status} 
                      onValueChange={(val) => setPaymentFormData({...paymentFormData, status: val})}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="cleared">Cleared</SelectItem>
                            <SelectItem value="bounced">Bounced</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                <Label>Reference Number</Label>
                <Input 
                  value={paymentFormData.reference_number} 
                  onChange={(e) => setPaymentFormData({...paymentFormData, reference_number: e.target.value})}
                  placeholder="e.g. REF123456"
                />
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="tds" 
                      checked={paymentFormData.is_tds_deducted}
                      onCheckedChange={(checked) => setPaymentFormData({...paymentFormData, is_tds_deducted: checked === true})}
                    />
                    <Label htmlFor="tds">TDS Deducted</Label>
                </div>
                {paymentFormData.is_tds_deducted && (
                    <div className="space-y-2">
                        <Label>TDS Amount</Label>
                        <Input 
                          type="number"
                          value={paymentFormData.tds_amount}
                          onChange={(e) => setPaymentFormData({...paymentFormData, tds_amount: Number(e.target.value)})}
                        />
                    </div>
                )}
                <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea 
                       value={paymentFormData.notes}
                       onChange={(e) => setPaymentFormData({...paymentFormData, notes: e.target.value})}
                       placeholder="Additional notes..."
                    />
                </div>
            </div>
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => setIsAddPaymentOpen(false)}>Cancel</Button>
             <Button onClick={handleCreatePayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Project Dialog */}
       <Dialog open={deleteProjectOpen} onOpenChange={setDeleteProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <p>Are you sure you want to delete this project? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProjectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteProject} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Line Item Dialog */}
      <Dialog open={isAddLineItemOpen} onOpenChange={setIsAddLineItemOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Line Item</DialogTitle>
            <DialogDescription>Add a new line item to this purchase order</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                value={lineItemFormData.description} 
                onChange={(e) => setLineItemFormData({...lineItemFormData, description: e.target.value})}
                placeholder="Item description or name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input 
                  type="number" 
                  value={lineItemFormData.quantity} 
                  onChange={(e) => setLineItemFormData({...lineItemFormData, quantity: Math.max(1, Number(e.target.value))})}
                  placeholder="1"
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Unit Price</Label>
                <Input 
                  type="number" 
                  value={lineItemFormData.unit_price} 
                  onChange={(e) => setLineItemFormData({...lineItemFormData, unit_price: Math.max(0, Number(e.target.value))})}
                  placeholder="0.00"
                  min="0"
                />
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-bold">{formatCurrency(lineItemFormData.quantity * lineItemFormData.unit_price)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddLineItemOpen(false)}>Cancel</Button>
            <Button onClick={handleAddLineItem}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Sheet>
  );
};

export default DetailDrawer;
