// ============================================================
// VENDOR MASTER DASHBOARD COMPONENT
// Lists all master vendors with summary of orders & payments
// ============================================================

import { useState, useEffect } from "react";
import { Building2, Plus, Zap, Phone, Mail, ChevronRight, LayoutGrid, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { vendorService } from "@/services/vendorService";
import { useDashboard } from "@/contexts/DashboardContext";
import VendorMasterDialog from "./VendorMasterDialog";

interface MasterVendor {
  id: number;
  name: string;
  master_type: string;
  contact_person: string;
  email: string;
  phone: string;
  order_count: number;
  total_order_value: number;
  paid_amount: number;
}

const VendorMasterDashboard = () => {
  const [vendors, setVendors] = useState<MasterVendor[]>([]);
  const [loading, setLoading] = useState(true);

  const { refreshData } = useDashboard();

  const fetchVendors = async (bypassCache: boolean = false) => {
    try {
      const result = await vendorService.getAllVendors(undefined, bypassCache);
      
      if (result.status === "SUCCESS") {
        setVendors(result.vendors || []);
      } else if (result.vendors) {
        setVendors(result.vendors);
      } else if (Array.isArray(result)) {
        setVendors(result);
      } else if (result.data && result.data.vendors) {
        setVendors(result.data.vendors);
      }
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = async () => {
    await fetchVendors(true);
    await refreshData(true);
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  if (loading) return null;
  if (vendors.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500 fill-indigo-500/20 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black text-foreground tracking-tight">Master Vendor Directory</h3>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-60">Global Procurement Registry</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs font-bold text-muted-foreground gap-2">
                <ListFilter className="h-3.5 w-3.5" />
                Filter Registry
            </Button>
            <VendorMasterDialog onSuccess={handleSuccess} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.map((v) => (
          <div 
            key={v.id} 
            className="group relative bg-card rounded-[2rem] border border-border/60 overflow-hidden shadow-sm hover:shadow-2xl hover:border-indigo-500/20 transition-all duration-500"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/5 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-indigo-500/10 transition-colors" />
            
            <div className="p-8 space-y-6">
               <div className="flex items-start justify-between">
                  <div className="space-y-1">
                     <h4 className="text-lg font-black text-foreground tracking-tight group-hover:text-indigo-600 transition-colors">{v.name}</h4>
                     <Badge variant="outline" className={cn("text-[8px] h-5 font-black uppercase tracking-widest", v.master_type === 'movable' ? "text-blue-600 border-blue-500/20 bg-blue-50" : "text-amber-600 border-amber-500/20 bg-amber-50")}>
                        {v.master_type}
                     </Badge>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-border/50">
                    <Zap className="h-4 w-4 text-indigo-500 fill-indigo-500/20" />
                  </div>
               </div>

               <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                     <Phone className="h-3.5 w-3.5 opacity-40" />
                     {v.phone || "---"}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium truncate">
                     <Mail className="h-3.5 w-3.5 opacity-40" />
                     {v.email || "---"}
                  </div>
               </div>

               <div className="pt-4 border-t border-border/40 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Active Orders</span>
                     <p className="text-sm font-bold text-foreground">{(v as any).order_count || 0} Projects</p>
                  </div>
                  <div className="space-y-1 text-right">
                     <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Total Value</span>
                     <p className="text-sm font-black text-emerald-600">{formatCurrency((v as any).total_order_value || 0)}</p>
                  </div>
               </div>
            </div>

            <VendorMasterDialog 
              initialData={v} 
              onSuccess={handleSuccess}
              trigger={
                <button className="w-full py-4 bg-muted/30 border-t border-border/40 flex items-center justify-center gap-2 hover:bg-indigo-500/5 transition-colors group/btn">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover/btn:text-indigo-600">Enter Vendor Portal</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover/btn:text-indigo-600 group-hover/btn:translate-x-1 transition-all" />
                </button>
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VendorMasterDashboard;
