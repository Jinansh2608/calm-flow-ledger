import { useState } from "react";
import { Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp, DollarSign } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import FilterSidebar from "@/components/dashboard/FilterSidebar";
import SummaryCard from "@/components/dashboard/SummaryCard";
import POFlowSection from "@/components/dashboard/POFlowSection";
import ClientPOTable from "@/components/dashboard/ClientPOTable";
import VendorPOTracking from "@/components/dashboard/VendorPOTracking";
import ProfitMarginSection from "@/components/dashboard/ProfitMarginSection";
import InsightsPanel from "@/components/dashboard/InsightsPanel";
import DetailDrawer from "@/components/dashboard/DetailDrawer";

const Index = () => {
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSelectPO = (po: any) => {
    setSelectedPO(po);
    setDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="flex w-full">
        <FilterSidebar />
        
        <main className="flex-1 p-6 overflow-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <SummaryCard
              title="Total Client PO Value"
              value="₹45.2L"
              subtitle="22 active orders"
              icon={<Wallet className="h-5 w-5" />}
              trend={{ value: "12%", positive: true }}
              delay={50}
            />
            <SummaryCard
              title="Total Vendor PO Value"
              value="₹32.8L"
              subtitle="38 vendor orders"
              icon={<DollarSign className="h-5 w-5" />}
              delay={100}
            />
            <SummaryCard
              title="Receivables"
              value="₹18.6L"
              subtitle="From 8 clients"
              icon={<ArrowDownLeft className="h-5 w-5" />}
              variant="warning"
              delay={150}
            />
            <SummaryCard
              title="Payables"
              value="₹12.4L"
              subtitle="To 12 vendors"
              icon={<ArrowUpRight className="h-5 w-5" />}
              delay={200}
            />
            <SummaryCard
              title="Net Profit"
              value="₹8.2L"
              subtitle="18.1% margin"
              icon={<TrendingUp className="h-5 w-5" />}
              variant="success"
              trend={{ value: "5%", positive: true }}
              delay={250}
            />
          </div>

          {/* PO Flow Section */}
          <div className="mb-6">
            <POFlowSection />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Tables */}
            <div className="lg:col-span-2 space-y-6">
              <ClientPOTable onSelectPO={handleSelectPO} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <VendorPOTracking />
                <ProfitMarginSection />
              </div>
            </div>

            {/* Right Column - Insights */}
            <div className="lg:col-span-1">
              <InsightsPanel />
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

export default Index;
