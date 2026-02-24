import { useState, useEffect } from "react";
import { Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp, DollarSign, Folder } from "lucide-react";
import { DashboardProvider, useDashboard, ClientPO } from "@/contexts/DashboardContext";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import FilterSidebar from "@/components/dashboard/FilterSidebar";
import SummaryCard from "@/components/dashboard/SummaryCard";
import ClientPOTable from "@/components/dashboard/ClientPOTable";
import VendorPOTracking from "@/components/dashboard/VendorPOTracking";
import ProfitMarginSection from "@/components/dashboard/ProfitMarginSection";
import DetailDrawer from "@/components/dashboard/DetailDrawer";
import { clientService } from "@/services/clientService";

const formatCurrency = (value: number) => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
};

const DashboardContent = () => {
  const { summaryData, isFiltered, filteredClientPOs, filteredVendorPOs, projects, refreshData, loading } = useDashboard();
  const [selectedPO, setSelectedPO] = useState<ClientPO | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [clients, setClients] = useState<any[]>([]);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
            <SummaryCard
              title="Payables"
              value={formatCurrency(summaryData.payables)}
              subtitle={`To ${summaryData.vendorCount} vendor${summaryData.vendorCount !== 1 ? 's' : ''}`}
              icon={<ArrowUpRight className="h-5 w-5" />}
              details={{
                title: "Payables",
                description: "Outstanding payments to vendors",
                items: [
                  { label: "Total Outstanding", value: formatCurrency(summaryData.payables), highlight: true },
                  { label: "Pending Payments", value: `${payableBreakdown.length}` },
                  { label: "Payment Rate", value: `${((1 - summaryData.payables / Math.max(summaryData.totalVendorPOValue, 1)) * 100).toFixed(0)}%` },
                ],
                breakdown: payableBreakdown.slice(0, 5).map(item => ({
                  label: item.label,
                  value: formatCurrency(item.value),
                  percentage: (item.value / Math.max(summaryData.payables, 1)) * 100
                }))
              }}
            />
            <SummaryCard
              title="Net Profit"
              value={formatCurrency(Math.abs(summaryData.netProfit))}
              subtitle={`${margin}% margin`}
              icon={<TrendingUp className="h-5 w-5" />}
              variant={summaryData.netProfit >= 0 ? "success" : "default"}
              details={{
                title: "Profit Analysis",
                description: "Revenue minus costs breakdown",
                items: [
                  { label: "Total Revenue", value: formatCurrency(summaryData.totalClientPOValue) },
                  { label: "Total Vendor Cost", value: `-${formatCurrency(summaryData.totalVendorPOValue)}` },
                  { label: "Operational Cost (5%)", value: `-${formatCurrency(summaryData.totalClientPOValue * 0.05)}` },
                  { label: "Net Profit", value: formatCurrency(summaryData.netProfit), highlight: true },
                ],
                breakdown: [
                  { label: "Gross Margin", value: `${((summaryData.totalClientPOValue - summaryData.totalVendorPOValue) / Math.max(summaryData.totalClientPOValue, 1) * 100).toFixed(1)}%`, percentage: ((summaryData.totalClientPOValue - summaryData.totalVendorPOValue) / Math.max(summaryData.totalClientPOValue, 1) * 100) },
                  { label: "Net Margin", value: `${margin}%`, percentage: parseFloat(margin) },
                ]
              }}
            />
          </div>

          {/* Projects Section */}
          {projects && projects.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Projects ({projects.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-foreground truncate flex-1">{project.name}</h4>
                      <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded font-medium whitespace-nowrap ml-2">
                        {project.status || 'Active'}
                      </span>
                    </div>
                    {project.created_at && (
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(project.created_at).toLocaleDateString('en-IN')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Content Grid - Now full width without insights panel */}
          <div className="space-y-6">
            <ClientPOTable onSelectPO={handleSelectPO} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VendorPOTracking />
              <ProfitMarginSection />
            </div>
          </div>
        </main>
      </div>

      <DetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
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
