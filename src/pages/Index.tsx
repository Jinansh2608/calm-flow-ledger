import { useState, useEffect, useMemo } from "react";
import { Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp, DollarSign } from "lucide-react";
import { DashboardProvider, useDashboard, ClientPO } from "@/contexts/DashboardContext";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import FilterSidebar from "@/components/dashboard/FilterSidebar";
import SummaryCard from "@/components/dashboard/SummaryCard";
import ClientPOTable from "@/components/dashboard/ClientPOTable";
import VendorManagementCard from "@/components/dashboard/VendorManagementCard";
import ProfitMarginSection from "@/components/dashboard/ProfitMarginSection";
import DetailDrawer from "@/components/dashboard/DetailDrawer";
import QuotationDashboard from "@/components/dashboard/QuotationDashboard";
import { Badge } from "@/components/ui/badge";

import { clientService } from "@/services/clientService";


const formatCurrency = (value: number) => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
};

const DashboardContent = () => {
  const { summaryData, isFiltered, appliedFilters, filteredClientPOs, filteredVendorPOs, projects, refreshData, loading } = useDashboard();
  const [selectedPO, setSelectedPO] = useState<ClientPO | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [clients, setClients] = useState<any[]>([]);

  // Memoize current project ID for context-aware sections
  const currentProjectId = useMemo(() => {
    if (appliedFilters.project === "all") return undefined;
    const project = projects.find(p => p.name === appliedFilters.project);
    return project?.id;
  }, [appliedFilters.project, projects]);

  // Load clients on mount
  const loadClients = async () => {
    try {
      const response = await clientService.getAllClients();
      if (response.data?.clients) {
        setClients(response.data.clients);
      } else {
        setClients(clientService.getFallbackClients());
      }
    } catch (error) {
      console.error("Failed to load clients:", error);
      setClients(clientService.getFallbackClients());
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleSelectPO = (po: ClientPO) => {
    // Resolve project ID robustly — don't let 0 fall through as falsy
    const resolvedProjectId = (() => {
      if (po.projectId != null && po.projectId > 0) return po.projectId;
      if (po.project_id != null && po.project_id > 0) return po.project_id;
      // Lookup by project name from context
      const projectName = po.project_name || po.project;
      if (projectName) {
        const matchedProject = projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());
        if (matchedProject?.id) return matchedProject.id;
      }
      // From _original bundle data
      if ((po as any)._original?.project_id > 0) return (po as any)._original.project_id;
      return 0;
    })();

    // Map frontend ClientPO to PurchaseOrder format for DetailDrawer
    const enrichedPO = {
      ...po,
      project_name: po.project_name || po.project,
      project_id: resolvedProjectId,
      client_name: po.client,
      client_id: po.clientId || po.client_id,
      po_number: po.poNo,
      po_value: po.poValue,
      pi_number: po.piNo,
      created_at: po.createdAt
    };
    setSelectedPO(enrichedPO as any);
    setDrawerOpen(true);
  };

  const margin = summaryData.totalClientPOValue > 0 
    ? ((summaryData.netProfit / summaryData.totalClientPOValue) * 100).toFixed(1)
    : "0";

  // Calculate breakdown data for summary cards
  const clientPOBreakdown = filteredClientPOs.reduce((acc, po) => {
    const status = po.status;
    if (!acc[status]) acc[status] = { count: 0, value: 0 };
    acc[status].count++;
    acc[status].value += po.poValue;
    return acc;
  }, {} as Record<string, { count: number; value: number }>);

  const vendorBreakdown = filteredVendorPOs.reduce((acc, vpo) => {
    if (!acc[vpo.vendor]) acc[vpo.vendor] = 0;
    acc[vpo.vendor] += vpo.poValue;
    return acc;
  }, {} as Record<string, number>);

  const receivableBreakdown = filteredClientPOs
    .filter(po => po.receivable > 0)
    .map(po => ({ label: po.client, value: po.receivable, poNo: po.poNo }));

  const payableBreakdown = filteredVendorPOs
    .filter(vpo => vpo.payable > 0)
    .map(vpo => ({ label: vpo.vendor, value: vpo.payable }));

  // Show loading skeleton during initial load
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex w-full">
          <FilterSidebar />
          <main className="flex-1 p-6 overflow-auto">
            <div className="space-y-6">
              {/* Summary Cards Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted rounded-lg animate-pulse"></div>
                ))}
              </div>
              {/* Charts Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-64 bg-muted rounded-lg animate-pulse"></div>
                <div className="h-64 bg-muted rounded-lg animate-pulse"></div>
              </div>
              {/* Table Skeleton */}
              <div className="h-96 bg-muted rounded-lg animate-pulse"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="flex w-full">
        <FilterSidebar />
        
        <main className="flex-1 p-6 overflow-auto">
          {/* Filter indicator */}
          {isFiltered && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-primary/5 border border-primary/20 text-sm text-primary">
              Showing filtered results. Reset filters to see all data.
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <SummaryCard
              title="Total Client PO Value"
              value={formatCurrency(summaryData.totalClientPOValue)}
              subtitle={`${summaryData.activeOrders} active order${summaryData.activeOrders !== 1 ? 's' : ''}`}
              icon={<Wallet className="h-5 w-5" />}
              details={{
                title: "Client PO Value",
                description: "Total value of all client purchase orders",
                items: [
                  { label: "Active Orders", value: `${summaryData.activeOrders}`, highlight: true },
                  { label: "Total Clients", value: `${summaryData.clientCount}` },
                  { label: "Average PO Value", value: formatCurrency(summaryData.totalClientPOValue / Math.max(filteredClientPOs.length, 1)) },
                ],
                breakdown: Object.entries(clientPOBreakdown).map(([status, data]) => ({
                  label: status.charAt(0).toUpperCase() + status.slice(1),
                  value: `${data.count} POs - ${formatCurrency(data.value)}`,
                  percentage: (data.value / summaryData.totalClientPOValue) * 100
                }))
              }}
            />
            <SummaryCard
              title="Total Vendor PO Value"
              value={formatCurrency(summaryData.totalVendorPOValue)}
              subtitle={`${summaryData.vendorOrders} vendor order${summaryData.vendorOrders !== 1 ? 's' : ''}`}
              icon={<DollarSign className="h-5 w-5" />}
              details={{
                title: "Vendor PO Value",
                description: "Total value across all vendor orders",
                items: [
                  { label: "Total Vendors", value: `${summaryData.vendorCount}` },
                  { label: "Total Orders", value: `${summaryData.vendorOrders}` },
                  { label: "Average Order Value", value: formatCurrency(summaryData.totalVendorPOValue / Math.max(summaryData.vendorOrders, 1)) },
                ],
                breakdown: Object.entries(vendorBreakdown).slice(0, 4).map(([vendor, value]) => ({
                  label: vendor,
                  value: formatCurrency(value),
                  percentage: (value / summaryData.totalVendorPOValue) * 100
                }))
              }}
            />
            <SummaryCard
              title="Receivables"
              value={formatCurrency(summaryData.receivables)}
              subtitle={`From ${summaryData.clientCount} client${summaryData.clientCount !== 1 ? 's' : ''}`}
              icon={<ArrowDownLeft className="h-5 w-5" />}
              variant={summaryData.receivables > 0 ? "warning" : "default"}
              details={{
                title: "Receivables",
                description: "Outstanding payments from clients",
                items: [
                  { label: "Total Outstanding", value: formatCurrency(summaryData.receivables), highlight: true },
                  { label: "Pending Invoices", value: `${receivableBreakdown.length}` },
                  { label: "Collection Rate", value: `${((1 - summaryData.receivables / Math.max(summaryData.totalClientPOValue, 1)) * 100).toFixed(0)}%` },
                ],
                breakdown: receivableBreakdown.slice(0, 5).map(item => ({
                  label: `${item.label} (${item.poNo})`,
                  value: formatCurrency(item.value),
                  percentage: (item.value / Math.max(summaryData.receivables, 1)) * 100
                }))
              }}
            />
          </div>

          {/* Project Context — Show Project Name and Vendor Master */}
          <div className="mb-12 space-y-6">
             {appliedFilters.project !== "all" && (
                <div className="flex items-end justify-between border-b border-indigo-500/10 pb-4">
                   <div className="space-y-1">
                     <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Active Project Context</p>
                     <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight italic">
                       {appliedFilters.project}
                     </h2>
                   </div>
                   <div className="flex items-center gap-2 mb-1">
                     <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-3 h-6 text-[10px] font-black uppercase tracking-widest">
                        Project Operations
                     </Badge>
                      {appliedFilters.client !== "all" && (
                         <Badge className="bg-indigo-500/10 text-indigo-600 border-none px-3 h-6 text-[10px] font-black uppercase tracking-widest">
                           {appliedFilters.client}
                         </Badge>
                      )}
                   </div>
                </div>
             )}
             
          </div>

          {/* Main Content Areas */}
          <div className="space-y-12">
            <QuotationDashboard />
            <ClientPOTable onSelectPO={handleSelectPO} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VendorManagementCard projectId={currentProjectId} />
              <ProfitMarginSection />
            </div>
          </div>
        </main>
      </div>

      <DetailDrawer
        open={drawerOpen}
        onClose={() => {
            setDrawerOpen(false);
            setSelectedPO(null);
        }}
        data={selectedPO as any}
        onProjectDeleted={() => {
           // Refresh data when a project is deleted
           refreshData();
           setDrawerOpen(false);
        }}
      />
    </div>
  );
};

const Index = () => {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
};

export default Index;
