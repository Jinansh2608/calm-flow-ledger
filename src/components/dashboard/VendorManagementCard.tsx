import { useState } from "react";
import { Building2, Users, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import VendorMasterDashboard from "./VendorMasterDashboard";
import { useDashboard } from "@/contexts/DashboardContext";

const VendorManagementCard = ({ projectId }: { projectId?: number }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { summaryData } = useDashboard();

  return (
    <>
      <Card className="group relative overflow-hidden h-full border-indigo-500/10 hover:border-indigo-500/30 transition-all duration-500 shadow-sm hover:shadow-xl bg-white dark:bg-slate-950">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Building2 className="h-24 w-24 text-indigo-600 -mr-8 -mt-8 rotate-12" />
        </div>
        
        <CardContent className="p-6 h-full flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(true)}
                className="rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-indigo-600"
              >
                <ArrowUpRight className="h-5 w-5" />
              </Button>
            </div>
            
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Vendor Management</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Directory • Bundles • Lifecycle</p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Entities</span>
                <p className="text-xl font-black text-indigo-600">{summaryData.vendorCount || 0}</p>
              </div>
              <div className="space-y-1 text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Orders</span>
                <p className="text-xl font-black text-indigo-600">{summaryData.vendorOrders || 0}</p>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => setIsOpen(true)}
            className="w-full mt-6 h-12 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-600/10 transition-all gap-2"
          >
            Launch Management Tool
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden border-none rounded-[2.5rem] bg-slate-50 dark:bg-slate-950">
          <DialogHeader className="px-10 py-8 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                        <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Procurement Master Console</DialogTitle>
                        <DialogDescription className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Full Lifecycle Entity Management • Unified Registry</DialogDescription>
                    </div>
                </div>
             </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-10 bg-slate-50 dark:bg-slate-950">
             <VendorMasterDashboard projectId={projectId} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VendorManagementCard;
