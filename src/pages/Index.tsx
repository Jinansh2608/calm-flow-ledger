import { useState } from "react";
import { Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp, DollarSign } from "lucide-react";
import { DashboardProvider, useDashboard, ClientPO } from "@/contexts/DashboardContext";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import FilterSidebar from "@/components/dashboard/FilterSidebar";
import SummaryCard from "@/components/dashboard/SummaryCard";
import POFlowSection from "@/components/dashboard/POFlowSection";
import ClientPOTable from "@/components/dashboard/ClientPOTable";
import VendorPOTracking from "@/components/dashboard/VendorPOTracking";
import ProfitMarginSection from "@/components/dashboard/ProfitMarginSection";
import DetailDrawer from "@/components/dashboard/DetailDrawer";

const formatCurrency = (value: number) => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
};

const DashboardContent = () => {
  const { summaryData, isFiltered, filteredClientPOs, filteredVendorPOs } = useDashboard();
  const [selectedPO, setSelectedPO] = useState<ClientPO | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSelectPO = (po: ClientPO) => {
    setSelectedPO(po);
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

          {/* PO Flow Section */}
          <div className="mb-6">
            <POFlowSection />
          </div>

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
        data={selectedPO}
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
