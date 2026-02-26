// ============================================================
// VIEW QUOTATION PAGE — Read-only BOQ Document
// ============================================================

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Download,
  MapPin,
  Building2,
  Ruler,
  Hash,
  Calculator,
  PieChart,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import EditableGrid from "@/components/dashboard/EditableGrid";
import { API_CONFIG } from "@/config/api";
import { exportQuotationWithHeader } from "@/services/ExcelExportService";

const ViewQuotation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/quotations/${id}`);
        const result = await response.json();
        if (result.status === "SUCCESS") {
          setData(result.data);
        } else {
          toast({ title: "Error", description: "Quotation not found", variant: "destructive" });
          navigate("/");
        }
      } catch (error) {
        console.error("Fetch error:", error);
        toast({ title: "Error", description: "Failed to load quotation", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchQuotation();
  }, [id, navigate]);

  const header = useMemo(() => {
    if (!data) return null;
    return {
      storeId: data.header.store_id,
      storeLocation: data.header.store_location,
      fullAddress: data.header.full_address,
      companyName: data.header.company_name,
      totalArea: data.header.total_area,
    };
  }, [data]);

  const lineItems = useMemo(() => {
    if (!data) return [];
    return data.line_items.map((item: any) => ({
      ...item,
      quantity: Number(item.quantity),
      price: Number(item.price),
      tax: Number(item.tax),
      gst_amount: Number(item.gst_amount),
      total: Number(item.total)
    }));
  }, [data]);

  const totals = useMemo(() => {
    if (!data) return { subtotal: 0, totalGST: 0, finalAmount: 0 };
    return {
      subtotal: Number(data.header.subtotal),
      totalGST: Number(data.header.total_gst),
      finalAmount: Number(data.header.total_amount)
    };
  }, [data]);

  const boqAnalysis = useMemo(() => {
    const movableCount = lineItems.filter((item: any) => item.type_of_boq === 'Movable').length;
    const nonMovableCount = lineItems.filter((item: any) => item.type_of_boq === 'Non Movable').length;
    const movableValue = lineItems
      .filter((item: any) => item.type_of_boq === 'Movable')
      .reduce((sum: number, item: any) => sum + item.total, 0);
    const nonMovableValue = lineItems
      .filter((item: any) => item.type_of_boq === 'Non Movable')
      .reduce((sum: number, item: any) => sum + item.total, 0);
      
    return { movableCount, nonMovableCount, movableValue, nonMovableValue };
  }, [lineItems]);

  const handleExport = () => {
    if (!header || !lineItems.length) return;
    exportQuotationWithHeader(header as any, lineItems);
    toast({ title: "Export Started", description: "Document is being generated..." });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#020617]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Retrieving Document...</p>
      </div>
    </div>
  );

  if (!data) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] text-foreground transition-all duration-500">
      {/* Top Bar */}
      <header className="h-20 border-b bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between px-8 shadow-md">
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                Quotation Q-{data.header.id}
              </h1>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none px-2 h-5 text-[9px] font-black uppercase tracking-widest">
                  Verified Document
                </Badge>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
                  STORE: {data.header.store_id}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handleExport}
            className="h-11 gap-2 text-xs font-bold border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all rounded-xl shadow-sm"
          >
            <Download className="h-4 w-4" />
            Download Excel
          </Button>
          <div className="h-11 px-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
             <CheckCircle2 className="h-4 w-4 text-emerald-500" />
             <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Final Ledger Sync Complete</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-6 lg:p-10 space-y-10">
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          {/* Header Column */}
          <div className="xl:col-span-2 space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
               <div className="p-10 space-y-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                        <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Site Registry</h2>
                        <p className="text-slate-500 text-sm font-medium">Official location records for this BOQ</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-border/50">
                       <Calendar className="h-3.5 w-3.5 text-slate-400" />
                       <span className="text-[10px] font-black uppercase text-slate-500">{new Date(data.header.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    <div className="space-y-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Dava India Store ID</span>
                       <p className="text-lg font-bold text-slate-700 dark:text-slate-300 font-mono flex items-center gap-2">
                          <Hash className="h-4 w-4 text-indigo-500/40" />
                          {data.header.store_id}
                       </p>
                    </div>
                    <div className="space-y-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Company Entity</span>
                       <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                          {data.header.company_name}
                       </p>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Primary Location</span>
                       <p className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-rose-500/50" />
                          {data.header.store_location}
                       </p>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Complete Physical Address</span>
                       <p className="text-lg font-medium text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-border/40">
                          {data.header.full_address}
                       </p>
                    </div>
                    <div className="space-y-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Calculated Area</span>
                       <div className="flex items-center gap-3">
                          <Badge variant="outline" className="h-10 px-4 rounded-xl border-indigo-500/20 text-lg font-bold gap-2">
                            <Ruler className="h-4 w-4 text-indigo-500" />
                            {data.header.total_area} SQFT
                          </Badge>
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8 h-full">
             <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Calculator className="h-20 w-20 text-indigo-500 rotate-12" />
                </div>
                
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 block relative z-10">
                   Commercial Summary
                </h3>

                <div className="space-y-8 relative z-10">
                   <div className="flex justify-between items-end border-b border-white/5 pb-6">
                      <div className="space-y-1">
                         <span className="text-xs font-bold text-slate-500">BOQ Subtotal</span>
                      </div>
                      <span className="text-2xl font-bold text-white tracking-tight">₹{totals.subtotal.toLocaleString("en-IN")}</span>
                   </div>

                   <div className="flex justify-between items-end border-b border-white/5 pb-6">
                      <div className="space-y-1">
                         <span className="text-xs font-bold text-slate-500">Aggegrated GST</span>
                      </div>
                      <span className="text-2xl font-bold text-emerald-400 tracking-tight">₹{totals.totalGST.toLocaleString("en-IN")}</span>
                   </div>

                   <div className="pt-6 space-y-4">
                      <div className="flex flex-col gap-1">
                         <span className="text-xs font-black text-indigo-400 uppercase tracking-widest pl-1">Final Quoted Value</span>
                         <span className="text-5xl font-black text-white tracking-tighter drop-shadow-lg tabular-nums">
                            ₹{totals.finalAmount.toLocaleString("en-IN")}
                         </span>
                      </div>
                   </div>
                </div>
             </div>

             {/* BOQ Mix Analysis */}
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-lg">
                <div className="flex items-center gap-3 mb-8">
                   <PieChart className="h-5 w-5 text-indigo-500" />
                   <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">BOQ Diversity Analysis</h4>
                </div>

                <div className="space-y-6">
                   <div className="space-y-3">
                      <div className="flex justify-between text-xs font-black uppercase tracking-tight">
                         <span className="text-slate-600 dark:text-slate-400">Movable Assets</span>
                         <span className="text-slate-400">{boqAnalysis.movableCount} Items</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                         <div 
                           className="h-full bg-indigo-500 rounded-full"
                           style={{ width: `${(boqAnalysis.movableCount / (lineItems.length || 1)) * 100}%` }}
                         />
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 block text-right">₹{boqAnalysis.movableValue.toLocaleString("en-IN")} Valuation</span>
                   </div>

                   <div className="space-y-3">
                      <div className="flex justify-between text-xs font-black uppercase tracking-tight">
                         <span className="text-slate-600 dark:text-slate-400">Non-Movable Assets</span>
                         <span className="text-slate-400">{boqAnalysis.nonMovableCount} Items</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                         <div 
                           className="h-full bg-violet-500 rounded-full" 
                           style={{ width: `${(boqAnalysis.nonMovableCount / (lineItems.length || 1)) * 100}%` }}
                         />
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 block text-right">₹{boqAnalysis.nonMovableValue.toLocaleString("en-IN")} Valuation</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* LINE ITEMS GRID */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
          <div className="px-10 py-8 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <Layers className="h-7 w-7 text-white" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">BOQ Specification List</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Formalized Line Item Registry</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-border/50">
               <div className="px-5 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block leading-none mb-1">Total Items</span>
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{lineItems.length}</span>
               </div>
            </div>
          </div>

          <div className="p-10 bg-slate-50/20 dark:bg-[#020617]/40">
            <EditableGrid
              rows={lineItems}
              onRowsChange={() => {}}
              readOnly={true}
              showExport={false}
              minHeight="600px"
            />
          </div>
          
          <div className="px-10 py-8 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-4 text-slate-400">
                <ShieldCheck className="h-5 w-5" />
                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                  Confidential Document • Internal Procurement Records • Not for External Publication
                </p>
             </div>
          </div>
        </div>

      </main>
      
      <footer className="py-20 flex flex-col items-center justify-center space-y-4 opacity-30 select-none pointer-events-none">
         <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center">
               <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.3em]">NEXGEN FINANCE</span>
         </div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified BOQ Document ID: Q-{data.header.id} • All Rights Reserved</p>
      </footer>
    </div>
  );
};

export default ViewQuotation;
