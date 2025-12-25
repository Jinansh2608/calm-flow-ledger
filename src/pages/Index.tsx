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
  const { summaryData, isFiltered } = useDashboard();
  const [selectedPO, setSelectedPO] = useState<ClientPO | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSelectPO = (po: ClientPO) => {
    setSelectedPO(po);
    setDrawerOpen(true);
  };

  const margin = summaryData.totalClientPOValue > 0 
    ? ((summaryData.netProfit / summaryData.totalClientPOValue) * 100).toFixed(1)
    : "0";

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
            />
            <SummaryCard
              title="Total Vendor PO Value"
              value={formatCurrency(summaryData.totalVendorPOValue)}
              subtitle={`${summaryData.vendorOrders} vendor order${summaryData.vendorOrders !== 1 ? 's' : ''}`}
              icon={<DollarSign className="h-5 w-5" />}
            />
            <SummaryCard
              title="Receivables"
              value={formatCurrency(summaryData.receivables)}
              subtitle={`From ${summaryData.clientCount} client${summaryData.clientCount !== 1 ? 's' : ''}`}
              icon={<ArrowDownLeft className="h-5 w-5" />}
              variant={summaryData.receivables > 0 ? "warning" : "default"}
            />
            <SummaryCard
              title="Payables"
              value={formatCurrency(summaryData.payables)}
              subtitle={`To ${summaryData.vendorCount} vendor${summaryData.vendorCount !== 1 ? 's' : ''}`}
              icon={<ArrowUpRight className="h-5 w-5" />}
            />
            <SummaryCard
              title="Net Profit"
              value={formatCurrency(Math.abs(summaryData.netProfit))}
              subtitle={`${margin}% margin`}
              icon={<TrendingUp className="h-5 w-5" />}
              variant={summaryData.netProfit >= 0 ? "success" : "default"}
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
