// ============================================================
// QUOTATION DASHBOARD COMPONENT
// Lists all active quotations grouped by Store ID on main page
// ============================================================

import { useState, useEffect } from "react";
import { FileText, MapPin, Building2, ChevronRight, Hash, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { API_CONFIG } from "@/config/api";


interface QuotationSummary {
  id: number;
  store_id: string;
  store_location: string;
  company_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

const QuotationDashboard = () => {
  const [quotations, setQuotations] = useState<QuotationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllQuotations = async () => {
      try {
        // Fetch all (we might need a "list all" endpoint or just fetch for common store IDs)
        // Since the backend doesn't have a "list all" without store_id in the current router (it requires store_id Query)
        // I will update the backend to allow listing all if store_id is not provided.
        const response = await fetch(`${API_CONFIG.BASE_URL}/quotations/all`);
        const data = await response.json();

        if (data.status === "SUCCESS") {
          setQuotations(data.quotations);
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllQuotations();
  }, []);

  if (loading) return null;
  if (quotations.length === 0) return null;

  // Group by store_id
  const grouped = quotations.reduce((acc, q) => {
    if (!acc[q.store_id]) acc[q.store_id] = [];
    acc[q.store_id].push(q);
    return acc;
  }, {} as Record<string, QuotationSummary[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-foreground tracking-tight flex items-center gap-2">
           <FileText className="h-5 w-5 text-indigo-500" />
           Quotations Registry
        </h3>
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/quotation/create")}
            className="text-xs font-bold text-indigo-600 hover:bg-indigo-50"
        >
            New Quotation <ExternalLink className="h-3 w-3 ml-1.5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(grouped).map(([storeId, items]) => (
          <div key={storeId} className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className="bg-gradient-to-r from-indigo-500/5 to-violet-500/5 px-5 py-3 border-b border-border/40 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-indigo-500" />
                <span className="text-xs font-black uppercase tracking-widest">{storeId}</span>
              </div>
              <Badge variant="secondary" className="text-[9px] font-black">{items.length} Docs</Badge>
            </div>
            
            <div className="p-5 space-y-4">
              {items.slice(0, 3).map((q) => (
                <div 
                  key={q.id} 
                  onClick={() => navigate(`/quotation/view/${q.id}`)}
                  className="flex justify-between items-start border-b border-border/10 last:border-0 pb-3 last:pb-0 cursor-pointer hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors group/row"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-bold text-foreground group-hover/row:text-indigo-600 transition-colors">Q-{String(q.id).padStart(4, '0')}</span>
                       {q.status === 'saved' && (
                         <div className="h-1 w-1 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                       )}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase truncate max-w-[140px]">
                        {q.company_name}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-black text-emerald-600">{formatCurrency(q.total_amount)}</span>
                    <span className="text-[9px] text-muted-foreground opacity-60 font-mono tracking-tighter">
                        {new Date(q.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>
              ))}
              
              {items.length > 3 && (
                <div className="pt-2 text-center">
                   <button 
                     onClick={() => navigate(`/quotation/create?store_id=${storeId}`)}
                     className="text-[9px] text-muted-foreground hover:text-indigo-500 font-black uppercase tracking-widest transition-colors"
                   >
                     + {items.length - 3} more documents
                   </button>
                </div>
              )}
            </div>

            <div className="px-5 py-3 bg-muted/20 border-t border-border/40 group-hover:bg-indigo-500/5 transition-colors">
                  <div className="flex items-center gap-2">
                     <MapPin className="h-3 w-3 text-muted-foreground/40" />
                     <span className="text-[10px] text-muted-foreground font-bold truncate tracking-tight">{items[0].store_location}</span>
                  </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuotationDashboard;
