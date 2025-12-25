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
