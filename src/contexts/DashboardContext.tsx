import { createContext, useContext, useState, ReactNode, useMemo, useEffect } from "react";
import { 
  poService, 
  projectService, 
  vendorService,
  clientService
} from "@/services";
import { 
  PurchaseOrder as APIPurchaseOrder, 
  VendorOrder as APIVendorOrder, 
  Project, 
  Vendor,
  Client,
  VerbalAgreement,
  Payment,
  AggregatedPOBundle
} from "@/types";

// Original Frontend Types (Preserved for compatibility)
export interface ClientPO {
  id: string;
  client: string;
  project: string;
  piNo: string;
  poNo: string;
  poValue: number;
  receivable: number;
  paymentStatus: "paid" | "partial" | "pending" | "overdue";
  status: "draft" | "active" | "completed" | "cancelled" | "pending";
  vendorId?: string;
  vendor?: string; 
  createdAt: string;
  _original?: APIPurchaseOrder | any; // Allow bundled object
  clientId?: number;
  projectId?: number;
  // Aliases for PurchaseOrder compatibility (used by DetailDrawer)
  po_number?: string;
  po_value?: number;
  project_name?: string;
  client_name?: string;
  pi_number?: string;
  po_date?: string;
  created_at?: string;
  client_id?: number;
  project_id?: number;
  // Bundling fields
  isBundled?: boolean;
  poIds?: number[]; // IDs of POs in the bundle
  po_ids?: number[]; // Alias for compatibility with PurchaseOrder type
  badge?: {
    type: 'bundled' | 'single';
    label: string;
    color: string;
    icon: string;
  };
  systemProjectName?: string; // Name from our system
}

export interface VendorPO {
  id: string;
  clientPOId: string;
  vendor: string;
  poNo?: string;
  poValue: number;
  payable: number;
  paymentStatus: "paid" | "partial" | "pending" | "overdue";
  dueDate: string;
  progress: number;
  projectId?: number;
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
  
  projects: Project[];
  vendors: Vendor[];
  clients: Client[]; // Changed from string[] to Client[]
  statuses: string[];
  
  filteredClientPOs: ClientPO[];

  filteredVendorPOs: VendorPO[];
  verbalAgreements: VerbalAgreement[];
  allPayments: Payment[];
  
  summaryData: {
    totalClientPOValue: number;
    totalVendorPOValue: number;
    dynamicRevenue?: number;
    dynamicCost?: number;
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
  loading: boolean;
  error: string | null;
  refreshData: (silent?: boolean) => Promise<void>;
  plAnalysisData: Map<number, any>;
  filteredPayments: Payment[];
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
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  
  // Initialize with fallback clients (Bajaj and Dava India)
  const [clients, setClients] = useState<Client[]>([
    { id: 1, name: "Bajaj" },
    { id: 2, name: "Dava India" }
  ]);
  
  const [clientPOs, setClientPOs] = useState<ClientPO[]>([]);
  const [vendorPOs, setVendorPOs] = useState<VendorPO[]>([]);
  const [verbalAgreements, setVerbalAgreements] = useState<VerbalAgreement[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [plAnalysisData, setPlAnalysisData] = useState<Map<number, any>>(new Map());
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      // PHASE 1: Load critical data only
      // PHASE 1: Load critical data only - Each with its own try/catch to be resilient
      let projects: Project[] = [];
      let vendors: Vendor[] = [];
      let bundles: AggregatedPOBundle[] = [];
      let clients: Client[] = [];
      let summary: any = null;

      try {
        const res = await projectService.getAllProjects();
        projects = res?.projects || [];
      } catch (e) { console.warn("Failed to load projects", e); }

      try {
        const res = await vendorService.getAllVendors();
        vendors = res?.data || (Array.isArray(res) ? res : []);
      } catch (e) { console.warn("Failed to load vendors", e); }

      try {
        const res = await poService.getAggregatedPOs();
        bundles = res?.bundles || [];
        summary = res?.summary || null;
      } catch (e) { console.warn("Failed to load aggregated POs", e); }

      try {
        const res = await clientService.getAllClients();
        clients = res?.data?.clients || (Array.isArray(res) ? res : []);
      } catch (e) { console.warn("Failed to load clients", e); }

      setProjects(projects);
      setVendors(vendors);

      // Merge clients
      const poClientMap = new Map<number, Client>();
      const fallbackClients: Client[] = [
        { id: 1, name: "Bajaj" },
        { id: 2, name: "Dava India" }
      ];
      fallbackClients.forEach(c => poClientMap.set(c.id, c));
      clients.forEach(c => poClientMap.set(c.id, c));
      
      bundles.forEach(bundle => {
        const clientId = bundle.client_id || (bundle.po_details && bundle.po_details[0]?.client_id);
        const clientName = bundle.client_name || (bundle.po_details && bundle.po_details[0]?.client_name);
        if (clientId && !poClientMap.has(clientId)) {
          poClientMap.set(clientId, {
            id: clientId,
            name: clientName || `Client ${clientId}`
          });
        }
      });
      
      const finalClients = Array.from(poClientMap.values());
      setClients(finalClients.length > 0 ? finalClients : fallbackClients);

      // Fetch Vendor Orders for all projects (this is still needed for initial summaries)
      const vendorOrderPromises = projects.map(p => 
        vendorService.getProjectVendorOrders(p.id).catch(() => [])
      );
      const vendorOrdersArrays = await Promise.all(vendorOrderPromises);
      const allVendorOrders = vendorOrdersArrays.flat();

       // Map Aggregated Bundles to ClientPO
      const mappedClientPOs: ClientPO[] = bundles.map(bundle => {
        const isBundled = !!bundle.is_bundled;
        
        // Robustly resolve projectId: check bundle, po_details, and name-based lookup
        const projectId = (() => {
          // 1. Check main bundle property
          if (bundle.project_id && bundle.project_id > 0) return bundle.project_id;
          
          // 2. Check individual PO details inside the bundle
          if (bundle.po_details && bundle.po_details.length > 0) {
            const fromDetail = bundle.po_details.find((d: any) => (d.project_id || d.projectId) > 0);
            const foundId = fromDetail ? (fromDetail.project_id || fromDetail.projectId) : 0;
            if (foundId > 0) return foundId;
          }
          
          // 3. Name-based lookup fallback (case-insensitive & trimmed)
          if (bundle.project_name && projects.length > 0) {
            const targetName = bundle.project_name.trim().toLowerCase();
            const matchedProject = projects.find(p => p.name.trim().toLowerCase() === targetName);
            if (matchedProject?.id) return matchedProject.id;
          }
          
          return 0;
        })();

        const project = projects.find(p => p.id === projectId);
        const totalValue = bundle.total_po_value || bundle.po_value || 0;
        const receivable = bundle.receivable_amount !== undefined ? bundle.receivable_amount : totalValue;
        
        // Use backend-provided payment_status if available, otherwise compute from financials
        let paymentStatus: "paid" | "partial" | "pending" | "overdue" = "pending";
        const backendPaymentStatus = bundle.payment_status;
        if (backendPaymentStatus) {
          // Normalize backend values to our union type
          const normalized = backendPaymentStatus.toLowerCase().replace('partially_paid', 'partial');
          if (['paid', 'partial', 'pending', 'overdue'].includes(normalized)) {
            paymentStatus = normalized as typeof paymentStatus;
          }
        } else {
          // Compute from financial data only as fallback
          const totalPaid = bundle.total_paid || 0;
          if (totalPaid > 0 && totalPaid >= totalValue) {
            paymentStatus = "paid";
          } else if (totalPaid > 0 && totalPaid < totalValue) {
            paymentStatus = "partial";
          }
        }

        // Resolve project name: backend data > project lookup > fallback
        const resolvedProjectName = bundle.project_name 
          || (project ? project.name : null)
          || `Project #${projectId || 'Unlinked'}`;

        // Use backend status directly if valid
        const backendStatus = bundle.status?.toLowerCase();
        const validStatuses = ['draft', 'active', 'completed', 'cancelled', 'pending'];
        const resolvedStatus = (backendStatus && validStatuses.includes(backendStatus)) 
          ? backendStatus as ClientPO['status']
          : 'active';

        return {
          id: String(bundle.bundle_id || bundle.id || bundle.client_po_id), 
          client: bundle.client_name || `Client ${bundle.client_id}`, 
          project: resolvedProjectName,
          piNo: bundle.pi_number || "", 
          poNo: bundle.display_identifier || bundle.po_number || `PO-${bundle.id}`, 
          poValue: totalValue,
          receivable: receivable,
          paymentStatus: paymentStatus,
          status: resolvedStatus,
          createdAt: bundle.created_at || new Date().toISOString(),
          clientId: bundle.client_id,
          projectId: projectId,
          vendor: bundle.vendor_name,
          po_number: bundle.po_number,
          po_value: totalValue,
          project_name: resolvedProjectName,
          client_name: bundle.client_name,
          pi_number: bundle.pi_number,
          po_date: bundle.po_date,
          created_at: bundle.created_at || new Date().toISOString(),
          client_id: bundle.client_id,
          project_id: projectId,
          isBundled: isBundled,
          poIds: bundle.po_ids || (bundle.id ? [bundle.id] : []),
          po_ids: bundle.po_ids || (bundle.id ? [bundle.id] : []),
          badge: bundle.badge,
          systemProjectName: project ? project.name : undefined,
          _original: bundle 
        };
      });
      setClientPOs(mappedClientPOs);

      // Map API VendorOrders to VendorPO
      const mappedVendorPOs: VendorPO[] = allVendorOrders.map(vo => {
        const vendor = vendors.find(v => v.id === vo.vendor_id);
        
        // Normalize payment status
        let paymentStatus: "paid" | "partial" | "pending" | "overdue" = "pending";
        const backendPaymentStatus = vo.payment_status?.toLowerCase();
        
        if (backendPaymentStatus === 'paid') paymentStatus = "paid";
        else if (backendPaymentStatus === 'partially_paid' || backendPaymentStatus === 'partial') paymentStatus = "partial";
        
        // Check for overdue (only if not paid/partial?)
        if (vo.due_date && new Date(vo.due_date) < new Date() && paymentStatus !== 'paid') {
           paymentStatus = "overdue";
        }

        return {
          id: String(vo.id),
          clientPOId: "", // Not directly linked in current DB schema
          vendor: vo.vendor_name || (vendor ? vendor.name : `Vendor ${vo.vendor_id}`),
          poNo: vo.po_number,
          poValue: vo.amount || vo.po_value || 0,
          payable: (vo.amount || vo.po_value || 0), // TODO: track actual payments to vendor
          paymentStatus: paymentStatus,
          dueDate: vo.due_date || "",
          progress: vo.work_status === 'completed' || vo.status === 'completed' ? 100 : 
                    vo.work_status === 'in_progress' ? 50 : 0,
          projectId: vo.project_id
        };
      });
      setVendorPOs(mappedVendorPOs);

      // PHASE 2: Load non-critical data in background (defer to next tick)
      // This prevents blocking the initial render
      Promise.resolve().then(async () => {
        try {
          // Load P&L Analysis data
          const plAnalysisPromises = projects.map(p =>
            projectService.getProjectPLAnalysis(p.id)
              .then(data => ({ projectId: p.id, data }))
              .catch((err) => {
                console.warn(`Failed to fetch P&L analysis for project ${p.id}:`, err);
                return { projectId: p.id, data: null };
              })
          );
          const plAnalysisResults = await Promise.all(plAnalysisPromises);
          const plDataMap = new Map<number, any>();
          plAnalysisResults.forEach(result => {
            if (result.data) {
              plDataMap.set(result.projectId, result.data);
            }
          });
          setPlAnalysisData(plDataMap);
        } catch (err) {
          console.error("Failed to load P&L data:", err);
        }

        try {
          // Load Verbal Agreements
          const projectIds = projects.map(p => p.id) || [];
          if (projectIds.length > 0) {
            const verbalAgreementsRes = await Promise.all(
              projectIds.map(id => poService.getProjectVerbalAgreements(id).catch(() => ({ agreements: [] })))
            );
            const allVerbalAgreements = verbalAgreementsRes.flatMap((res: any) => res?.agreements || []);
            setVerbalAgreements(allVerbalAgreements);
          }
        } catch (err) {
          console.error("Failed to load verbal agreements:", err);
        }

        try {
          // Load all payments from all POs
          const poIds = bundles.flatMap((bundle: any) => bundle.po_ids || [bundle.id]).filter(Boolean);
          if (poIds.length > 0) {
            const paymentsRes = await Promise.all(
              poIds.map(id => poService.getPayments(id, false)
                .then((res: any) => {
                  if (res && res.payments) return res.payments;
                  if (Array.isArray(res)) return res;
                  return [];
                })
                .catch(() => [])
              )
            );
            const allPaymentsFlat = paymentsRes.flat();
            setAllPayments(allPaymentsFlat);
          }
        } catch (err) {
          console.error("Failed to load payments:", err);
        }
      });
      
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
    return clientPOs.filter((po) => {
      if (appliedFilters.client !== "all" && po.client !== appliedFilters.client) return false;
      if (appliedFilters.project !== "all" && po.project !== appliedFilters.project) return false;
      if (appliedFilters.status !== "all" && po.status !== appliedFilters.status) return false;
      if (appliedFilters.piNumber && !po.piNo.toLowerCase().includes(appliedFilters.piNumber.toLowerCase())) return false;
      if (appliedFilters.clientPONumber && !po.poNo.toLowerCase().includes(appliedFilters.clientPONumber.toLowerCase())) return false;
      if (appliedFilters.fromDate && new Date(po.createdAt) < new Date(appliedFilters.fromDate)) return false;
      if (appliedFilters.toDate && new Date(po.createdAt) > new Date(appliedFilters.toDate)) return false;
      return true;
    });
  }, [clientPOs, appliedFilters]);

  const filteredVendorPOs = useMemo(() => {
    let vos = vendorPOs;
    
    // Filter by Project
    if (appliedFilters.project !== "all") {
      const project = projects.find(p => p.name === appliedFilters.project);
      if (project) {
        vos = vos.filter(v => v.projectId === project.id);
      }
    } else if (appliedFilters.client !== "all") {
       // If filtering by client but NOT project, only show vendor orders for that client's projects
       const relevantProjectIds = new Set(filteredClientPOs.map(p => Number(p.projectId)).filter(Boolean));
       vos = vos.filter(v => relevantProjectIds.has(Number(v.projectId)));
    }
    // If project is "all" and client is "all", we show ALL vendor orders (more inclusive)

    if (appliedFilters.vendor !== "all") {
       vos = vos.filter(v => v.vendor === appliedFilters.vendor);
    }
    
    if (appliedFilters.vendorPONumber) {
      const search = appliedFilters.vendorPONumber.toLowerCase();
      vos = vos.filter(v => 
        (v.poNo?.toLowerCase().includes(search)) || 
        v.id.includes(search)
      );
    }
    
    return vos;
  }, [vendorPOs, filteredClientPOs, appliedFilters, projects]);
  
  const filteredPayments = useMemo(() => {
    return allPayments.filter(payment => {
      // Find the associated PO to check client/project status
      const associatedPo = clientPOs.find(po => 
        (po.poIds && Array.isArray(po.poIds) && po.poIds.includes(Number(payment.po_id))) ||
        Number(po.id) === Number(payment.po_id) || 
        (po._original?.id && Number(po._original.id) === Number(payment.po_id))
      );
      
      if (appliedFilters.client !== "all") {
        if (!associatedPo || associatedPo.client !== appliedFilters.client) return false;
      }
      
      if (appliedFilters.project !== "all") {
        if (!associatedPo || associatedPo.project !== appliedFilters.project) return false;
      }
      
      if (appliedFilters.fromDate && payment.payment_date && new Date(payment.payment_date) < new Date(appliedFilters.fromDate)) return false;
      if (appliedFilters.toDate && payment.payment_date && new Date(payment.payment_date) > new Date(appliedFilters.toDate)) return false;
      
      return true;
    });
  }, [allPayments, clientPOs, appliedFilters]);

  const summaryData = useMemo(() => {
    const totalClientPOValue = filteredClientPOs.reduce((sum, po) => sum + po.poValue, 0);
    const totalVendorPOValue = filteredVendorPOs.reduce((sum, vpo) => sum + vpo.poValue, 0);
    
    // Calculate receivables as: Total PO Value - Total Paid Amount (real-time)
    const receivables = filteredClientPOs.reduce((sum, po) => {
      // Get total paid for this specific PO from filteredPayments
      const paidForThisPo = filteredPayments
        .filter(p => p.po_id === (po.id || po.project_id) || Number(p.po_id) === Number(po.id))
        .filter(p => p.transaction_type === 'credit')
        .reduce((total, p) => total + (p.amount || 0), 0);
      
      // Receivable = PO Value - Amount Paid
      const poReceivable = (po.poValue || 0) - paidForThisPo;
      return sum + Math.max(0, poReceivable);
    }, 0);
    
    const payables = filteredVendorPOs.reduce((sum, vpo) => sum + vpo.payable, 0);
    
    // Calculate net profit from real backend P&L data
    const projectIds = filteredClientPOs
      .map(po => po.projectId)
      .filter(Boolean);
    
    let netProfit = 0;
    let dynamicRevenue = 0;
    let dynamicCost = 0;
    
    projectIds.forEach(projectId => {
      const plData = plAnalysisData.get(Number(projectId));
      if (plData?.data) {
        netProfit += plData.data.net_profit || 0;
        dynamicRevenue += plData.data.final_revenue || 0;
        dynamicCost += plData.data.total_vendor_costs || 0;
      }
    });
    
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
      dynamicRevenue,
      dynamicCost,
      activeOrders,
      vendorOrders,
      clientCount,
      vendorCount,
    };
  }, [filteredClientPOs, filteredVendorPOs, plAnalysisData, allPayments]);

  const flowData = useMemo(() => {
    const totalClientPOValue = filteredClientPOs.reduce((sum, po) => sum + po.poValue, 0);
    const totalVendorPOValue = filteredVendorPOs.reduce((sum, vpo) => sum + vpo.poValue, 0);
    const totalPaid = filteredClientPOs.filter((po) => po.paymentStatus === "paid").reduce((sum, po) => sum + po.poValue, 0);
    const avgProgress = filteredVendorPOs.length > 0 
      ? Math.round(filteredVendorPOs.reduce((sum, vpo) => sum + vpo.progress, 0) / filteredVendorPOs.length)
      : 0;
    
    // Use real backend P&L data for profit calculation
    const projectIds = filteredClientPOs
      .map(po => po.projectId)
      .filter(Boolean);
    
    let profit = 0;
    projectIds.forEach(projectId => {
      const plData = plAnalysisData.get(Number(projectId));
      if (plData?.data) {
        profit += plData.data.net_profit || 0;
      }
    });
    
    const completedCount = filteredClientPOs.filter((po) => po.status === "completed").length;

    return {
      clientPI: { count: filteredClientPOs.length, value: totalClientPOValue * 1.07 },
      clientPO: { count: filteredClientPOs.length, value: totalClientPOValue },
      vendorPO: { count: filteredVendorPOs.length, value: totalVendorPOValue },
      execution: { count: filteredVendorPOs.filter((v) => v.progress > 0 && v.progress < 100).length, percentage: avgProgress },
      payment: { count: filteredClientPOs.filter((po) => po.paymentStatus === "paid" || po.paymentStatus === "partial").length, value: totalPaid },
      profit: { count: completedCount, value: profit > 0 ? profit : 0 },
    };
  }, [filteredClientPOs, filteredVendorPOs, plAnalysisData]);

  // Use fetched clients combined with uniq from POs? 
  // For now, let's just use fetched clients for the list, and ensure filtering works.
  // Actually, filtering relies on strings. 
  
  const statuses = ["active", "completed", "cancelled"];

  return (
    <DashboardContext.Provider
      value={{
        filters,
        setFilters,
        applyFilters,
        resetFilters,
        appliedFilters,
        projects,
        vendors,
        clients,
        statuses,
        filteredClientPOs,
        filteredVendorPOs,
        verbalAgreements,
        allPayments,
        summaryData,
        flowData,
        isFiltered,
        loading,
        error,
        refreshData: fetchData,
        plAnalysisData,
        filteredPayments,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};
