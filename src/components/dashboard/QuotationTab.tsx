// ============================================================
// QUOTATION TAB — For DetailDrawer (Client 2 Only)
// Fetches quotations from backend filtered by Store ID
// ============================================================

import { useState, useMemo, useEffect } from "react";
import { FileText, MapPin, Building2, Ruler, Hash, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";
import EditableGrid from "@/components/dashboard/EditableGrid";
import { API_CONFIG } from "@/config/api";


interface QuotationData {
  id: number;
  header: {
    storeId: string;
    storeLocation: string;
    fullAddress: string;
    companyName: string;
    totalArea: string;
    totalAmount: number;
  };
  lineItems: Record<string, any>[];
  status: string;
  created_at: string;
}

interface QuotationTabProps {
  storeId?: string;
  projectId?: number;
}

const QuotationTab = ({ storeId, projectId }: QuotationTabProps) => {
  const [quotations, setQuotations] = useState<QuotationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuotations = async () => {
      if (!storeId) return;
      setLoading(true);
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/quotations?store_id=${storeId}`);
        const data = await response.json();

        if (data.status === "SUCCESS") {
          // The backend returns a list of quotations. We need to map them.
          const mapped = data.quotations.map((q: any) => ({
            id: q.id,
            status: q.status,
            created_at: q.created_at,
            header: {
              storeId: q.store_id,
              storeLocation: q.store_location,
              fullAddress: q.full_address,
              companyName: q.company_name,
              totalArea: q.total_area,
              totalAmount: q.total_amount,
            },
            // We'll fetch line items when selected or assume they are not needed for list
            lineItems: [] 
          }));
          setQuotations(mapped);
          if (mapped.length > 0) setSelectedQuotationId(String(mapped[0].id));
        }
      } catch (error) {
        console.error("Failed to fetch quotations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotations();
  }, [storeId]);

  // Fetch line items when selected quotation changes
  const [activeQuotation, setActiveQuotation] = useState<QuotationData | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!selectedQuotationId) return;
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/quotations/${selectedQuotationId}`);
        const data = await response.json();

        if (data.status === "SUCCESS") {
          const detail = data.data;
          setActiveQuotation({
            id: detail.header.id,
            status: detail.header.status,
            created_at: detail.header.created_at,
            header: {
              storeId: detail.header.store_id,
              storeLocation: detail.header.store_location,
              fullAddress: detail.header.full_address,
              companyName: detail.header.company_name,
              totalArea: detail.header.total_area,
              totalAmount: detail.header.total_amount,
            },
            lineItems: detail.line_items.map((li: any) => ({
              _id: li.id,
              name: li.name,
              hsn_sac_code: li.hsn_sac_code,
              type_of_boq: li.type_of_boq,
              quantity: li.quantity,
              units: li.units,
              price: li.price,
              total: li.total,
            }))
          });
        }
      } catch (error) {
        console.error("Failed to fetch quotation details:", error);
      }
    };

    fetchDetails();
  }, [selectedQuotationId]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
      case "sent":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30";
      case "saved":
        return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30";
      default:
        return "bg-muted/50 text-muted-foreground border-border";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (quotations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-3xl bg-muted/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
          <FileText className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <h3 className="text-lg font-black text-foreground tracking-tight mb-1">
          No Quotations for Store {storeId}
        </h3>
        <p className="text-xs text-muted-foreground max-w-[240px] font-medium leading-relaxed">
          No records found in the backend for this Store ID.
          Quotations created via the creation module appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Quotation Selector & Overview */}
      <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-indigo-500/10 shadow-sm">
          <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-600/10 flex items-center justify-center">
                  <FileText className="h-4.5 w-4.5 text-indigo-600" />
              </div>
              <div>
                  <h4 className="text-xs font-black uppercase tracking-widest leading-none">Registered Quotations</h4>
                  <p className="text-[10px] text-muted-foreground mt-1 font-bold">{quotations.length} items found for this store</p>
              </div>
          </div>
          <Select
            value={selectedQuotationId}
            onValueChange={setSelectedQuotationId}
          >
            <SelectTrigger className="w-64 h-10 text-xs font-bold border-indigo-500/20 focus:ring-indigo-500/10 rounded-xl">
              <SelectValue placeholder="Select Record" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {quotations.map((q) => (
                <SelectItem key={q.id} value={String(q.id)} className="text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-indigo-600">Q-{q.id}</span>
                    <span className="text-muted-foreground opacity-60">— {new Date(q.created_at).toLocaleDateString()}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
      </div>

      {activeQuotation && (
        <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
          {/* Header Details */}
          <div className="bg-card rounded-3xl border shadow-xl shadow-foreground/5 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600/5 to-violet-600/5 px-6 py-4 border-b flex items-center justify-between">
              <span className="text-[10px] text-foreground font-black uppercase tracking-[0.2em] opacity-60">
                Document Metadata
              </span>
              <div className="flex items-center gap-3">
                <Button 
                   variant="ghost" 
                   size="sm" 
                   className="h-7 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 border border-indigo-200/50 rounded-lg px-3"
                   onClick={() => navigate(`/quotation/view/${activeQuotation.id}`)}
                >
                   View Full Document
                </Button>
                <div className="h-4 w-px bg-border/40 mx-1" />
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-full border-2",
                    getStatusColor(activeQuotation.status)
                  )}
                >
                  {activeQuotation.status}
                </Badge>
                <div className="h-6 w-px bg-border/40 mx-1" />
                <span className="text-[11px] font-mono font-black text-muted-foreground">ID: {activeQuotation.id}</span>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-indigo-500" /> Site Store ID
                </span>
                <p className="text-sm font-black text-foreground font-mono bg-muted/30 px-3 py-2 rounded-lg border border-border/40 inline-block">
                  {activeQuotation.header.storeId}
                </p>
              </div>
              
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-indigo-500" /> Beneficiary Company
                </span>
                <p className="text-sm font-black text-foreground">
                  {activeQuotation.header.companyName}
                </p>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-indigo-500" /> Site Location & Full Address
                </span>
                <div className="p-4 rounded-2xl bg-muted/20 border border-border/50">
                    <p className="text-sm font-bold text-foreground mb-1">
                      {activeQuotation.header.storeLocation}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                      {activeQuotation.header.fullAddress}
                    </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Ruler className="h-3.5 w-3.5 text-indigo-500" /> Surveyed Area
                </span>
                <p className="text-sm font-black text-foreground">
                  {activeQuotation.header.totalArea} SQFT
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" /> Total Quoted Amount
                </span>
                <p className="text-xl font-black text-emerald-600 tabular-nums tracking-tight">
                  {formatCurrency(activeQuotation.header.totalAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* Read-Only Grid */}
          <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">BOQ Itemized List</h5>
                  <span className="text-[10px] font-bold text-muted-foreground">{activeQuotation.lineItems.length} items</span>
              </div>
              <div className="rounded-3xl border shadow-lg overflow-hidden">
                  <EditableGrid
                    rows={activeQuotation.lineItems}
                    onRowsChange={() => {}}
                    readOnly
                    compact
                    minHeight="400px"
                  />
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationTab;
