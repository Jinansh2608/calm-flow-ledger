// ============================================================
// CREATE QUOTATION PAGE — Client 2 Only
// Document-style quotation with 5 header fields + BOQ grid (GST Included)
// ============================================================

import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Save,
  RotateCcw,
  Download,
  MapPin,
  Building2,
  Ruler,
  Hash,
  Calculator,
  PieChart,
  ShieldCheck,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import EditableGrid from "@/components/dashboard/EditableGrid";
import {
  QuotationHeader,
  EMPTY_QUOTATION_HEADER,
  createEmptyRow,
  getGrandTotals,
  calculateRowTotals,
  validateHeader,
  validateLineItems,
} from "@/config/DynamicColumnConfig";
import { exportQuotationWithHeader } from "@/services/ExcelExportService";
import { API_CONFIG } from "@/config/api";

const CreateQuotation = () => {
  const navigate = useNavigate();

  // Header fields
  const [header, setHeader] = useState<QuotationHeader>({ ...EMPTY_QUOTATION_HEADER });

  // Grid rows
  const [lineItems, setLineItems] = useState<Record<string, any>[]>([createEmptyRow(0)]);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Calculations
  const totals = useMemo(() => getGrandTotals(lineItems), [lineItems]);
  
  const boqAnalysis = useMemo(() => {
    const movableCount = lineItems.filter(item => item.type_of_boq === 'Movable').length;
    const nonMovableCount = lineItems.filter(item => item.type_of_boq === 'Non Movable').length;
    const movableValue = lineItems
      .filter(item => item.type_of_boq === 'Movable')
      .reduce((sum, item) => sum + (calculateRowTotals(item).rowGrand), 0);
    const nonMovableValue = lineItems
      .filter(item => item.type_of_boq === 'Non Movable')
      .reduce((sum, item) => sum + (calculateRowTotals(item).rowGrand), 0);
      
    return { movableCount, nonMovableCount, movableValue, nonMovableValue };
  }, [lineItems]);

  // Update header field
  const updateHeader = useCallback((field: keyof QuotationHeader, value: string) => {
    setHeader((prev) => ({ ...prev, [field]: value }));
    if (validationErrors.length > 0) setValidationErrors([]);
  }, [validationErrors]);

  // Reset form
  const resetForm = useCallback(() => {
    if (window.confirm("Are you sure you want to clear all fields? This cannot be undone.")) {
      setHeader({ ...EMPTY_QUOTATION_HEADER });
      setLineItems([createEmptyRow(0)]);
      setValidationErrors([]);
    }
  }, []);

  // Full validation
  const runValidation = useCallback((): boolean => {
    const headerErrors = validateHeader(header);
    const itemErrors = validateLineItems(lineItems);
    const allErrors = [...headerErrors, ...itemErrors];
    setValidationErrors(allErrors);
    return allErrors.length === 0;
  }, [header, lineItems]);

  // Save quotation
  const handleSave = useCallback(async () => {
    if (!runValidation()) {
      toast({
        title: "Validation Failed",
        description: "Please provide all required site details and line items",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        header: {
          ...header,
          subtotal: totals.subtotal,
          totalGST: totals.totalGST,
          totalAmount: totals.finalAmount
        },
        lineItems: lineItems.map(row => {
          const { rowTotal, rowGST, rowGrand } = calculateRowTotals(row);
          return {
            name: row.name,
            hsn_sac_code: row.hsn_sac_code,
            type_of_boq: row.type_of_boq,
            quantity: Number(row.quantity),
            units: row.units,
            price: Number(row.price),
            tax: Number(row.tax),
            gst_amount: rowGST,
            total: rowGrand
          };
        })
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/quotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save to database");

      toast({
        title: "Quotation Generated",
        description: `Successfully saved for ${header.storeId}. Total: ₹${totals.finalAmount.toLocaleString("en-IN")}`,
      });

      navigate("/");
    } catch (error) {
      console.error("Save error:", error);
      toast({ 
        title: "System Error", 
        description: "Could not persist quotation. Please check your network connection.", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  }, [header, lineItems, navigate, runValidation, totals]);

  // Export
  const handleExport = useCallback(() => {
    if (!runValidation()) {
        toast({ title: "Validation Error", description: "Complete form before exporting", variant: "destructive" });
        return;
    }
    exportQuotationWithHeader(header, lineItems);
    toast({ title: "Export Started", description: "Document is being generated..." });
  }, [header, lineItems, runValidation]);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] text-foreground transition-colors duration-500">
      {/* Top Bar - Sticky with Glass Effect */}
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
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-xl shadow-indigo-600/20 ring-1 ring-white/20">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                BOQ Builder
              </h1>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none px-2 h-5 text-[9px] font-black uppercase tracking-widest">
                  Active Session
                </Badge>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
                  DAVA INDIA PROCUREMENT
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="hidden xl:flex items-center gap-6 mr-6 bg-slate-50 dark:bg-slate-800/50 px-6 py-2 rounded-2xl border border-slate-200 dark:border-slate-700/50">
             <div className="flex flex-col">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Running Subtotal</span>
               <span className="text-sm font-bold text-slate-600 dark:text-slate-300">₹{totals.subtotal.toLocaleString("en-IN")}</span>
             </div>
             <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
             <div className="flex flex-col">
               <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Total (Incl. GST)</span>
               <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">₹{totals.finalAmount.toLocaleString("en-IN")}</span>
             </div>
           </div>

          <Button
            variant="outline"
            onClick={resetForm}
            className="hidden md:flex h-11 gap-2 text-xs font-bold border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all rounded-xl"
          >
            <RotateCcw className="h-4 w-4 text-slate-400" />
            Reset
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="h-11 gap-2 text-xs font-bold border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all rounded-xl shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export BOQ</span>
            <span className="sm:hidden">Excel</span>
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="h-11 gap-2 px-6 text-xs font-black bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400/20 active:scale-95 transition-all rounded-xl"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 animate-spin" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Build Quotation
              </div>
            )}
          </Button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-6 lg:p-10 space-y-10">
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          {/* Header Column - Sites & Client */}
          <div className="xl:col-span-2 space-y-8">
             <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="p-8 lg:p-10 space-y-10">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                         <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                       </div>
                       <div>
                         <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Site Registry</h2>
                         <p className="text-slate-500 text-sm font-medium">Verify location details for the BOQ</p>
                       </div>
                     </div>
                     <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                       Mandatory Entry
                     </Badge>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                      {/* Store ID */}
                      <div className="space-y-3">
                        <Label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                          <Hash className="h-3.5 w-3.5" />
                          Dava India Store ID
                        </Label>
                        <Input
                          value={header.storeId}
                          onChange={(e) => updateHeader("storeId", e.target.value)}
                          placeholder="CMHNAS1812"
                          className={cn(
                            "h-14 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 rounded-2xl font-mono text-base focus:ring-[6px] focus:ring-indigo-500/10 transition-all",
                            validationErrors.some(e => e.includes("Store ID")) && "border-rose-500 ring-rose-500/5 bg-rose-50"
                          )}
                        />
                      </div>

                      {/* Company Name */}
                      <div className="space-y-3">
                        <Label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                          <Building2 className="h-3.5 w-3.5" />
                          Company Entity
                        </Label>
                        <Input
                          value={header.companyName}
                          onChange={(e) => updateHeader("companyName", e.target.value)}
                          placeholder="U&V Nexgen Exim PVT LTD"
                          className={cn(
                            "h-14 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 rounded-2xl text-base font-bold focus:ring-[6px] focus:ring-indigo-500/10 transition-all",
                             validationErrors.some(e => e.includes("Company Name")) && "border-rose-500 ring-rose-500/5 bg-rose-50"
                          )}
                        />
                      </div>

                      {/* Store Location */}
                      <div className="space-y-3 md:col-span-2">
                        <Label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                          <MapPin className="h-3.5 w-3.5" />
                          Primary Location / Landmark
                        </Label>
                        <Input
                          value={header.storeLocation}
                          onChange={(e) => updateHeader("storeLocation", e.target.value)}
                          placeholder="Indra Nagar, Nashik Maharashtra"
                          className={cn(
                            "h-14 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 rounded-2xl text-base focus:ring-[6px] focus:ring-indigo-500/10 transition-all",
                             validationErrors.some(e => e.includes("Store Location")) && "border-rose-500 ring-rose-500/5 bg-rose-50"
                          )}
                        />
                      </div>

                      {/* Full Address */}
                      <div className="space-y-3 md:col-span-2">
                        <Label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                          <Info className="h-3.5 w-3.5" />
                          Complete Site Address
                        </Label>
                        <Textarea
                          value={header.fullAddress}
                          onChange={(e) => updateHeader("fullAddress", e.target.value)}
                          placeholder="Full address excluding district/state if already mentioned above..."
                          className={cn(
                            "min-h-[120px] bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 rounded-[2rem] text-base p-6 leading-relaxed focus:ring-[6px] focus:ring-indigo-500/10 transition-all resize-none",
                             validationErrors.some(e => e.includes("Full Address")) && "border-rose-500 ring-rose-500/5 bg-rose-50"
                          )}
                        />
                      </div>

                      {/* Area SQFT */}
                      <div className="space-y-3">
                        <Label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                          <Ruler className="h-3.5 w-3.5" />
                          Calculated Area (SQFT)
                        </Label>
                        <div className="relative">
                          <Input
                            value={header.totalArea}
                            onChange={(e) => updateHeader("totalArea", e.target.value)}
                            placeholder="363"
                            className={cn(
                              "h-14 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 rounded-2xl text-base pr-16 focus:ring-[6px] focus:ring-indigo-500/10 transition-all",
                               validationErrors.some(e => e.includes("Total Area")) && "border-rose-500 ring-rose-500/5 bg-rose-50"
                            )}
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase tracking-tighter">
                            ±0.5% Tol.
                          </div>
                        </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Right Sidebar - Dynamic Analysis & Totals */}
          <div className="space-y-8 h-full">
             {/* Financial Summary Card */}
             <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                   <Calculator className="h-20 w-20 text-indigo-500 rotate-12" />
                </div>
                
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-10 block relative z-10">
                   Commercial Summary
                </h3>

                <div className="space-y-8 relative z-10">
                   <div className="flex justify-between items-end border-b border-slate-800/50 pb-6 group/item cursor-default">
                      <div className="space-y-1">
                         <span className="text-xs font-bold text-slate-500">BOQ Subtotal</span>
                         <div className="flex items-center gap-2">
                            <Badge className="bg-slate-800 text-slate-400 h-5 border-none text-[8px] font-black">EXCL. GST</Badge>
                         </div>
                      </div>
                      <span className="text-2xl font-bold text-white tracking-tight group-hover/item:text-indigo-400 transition-colors">₹{totals.subtotal.toLocaleString("en-IN")}</span>
                   </div>

                   <div className="flex justify-between items-end border-b border-slate-800/50 pb-6 group/item cursor-default">
                      <div className="space-y-1">
                         <span className="text-xs font-bold text-slate-500">Aggegrated GST</span>
                         <Badge className="bg-emerald-500/10 text-emerald-400 h-5 border-none text-[8px] font-black">COMPLETION RATE 18%</Badge>
                      </div>
                      <span className="text-2xl font-bold text-emerald-400 tracking-tight group-hover/item:text-emerald-300 transition-colors">₹{totals.totalGST.toLocaleString("en-IN")}</span>
                   </div>

                   <div className="pt-6 space-y-4">
                      <div className="flex flex-col gap-1">
                         <span className="text-xs font-black text-indigo-400 uppercase tracking-widest pl-1">Final Quoted Value</span>
                         <span className="text-5xl font-black text-white tracking-tighter drop-shadow-lg tabular-nums">
                            ₹{totals.finalAmount.toLocaleString("en-IN")}
                         </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-semibold italic pl-1">
                         * Comprehensive valuation including materials and services as listed in the BOQ specification.
                      </p>
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
                      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                         <div 
                           className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                           style={{ width: `${(boqAnalysis.movableCount / (lineItems.length || 1)) * 100}%` }}
                         />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 block text-right mt-1">₹{boqAnalysis.movableValue.toLocaleString("en-IN")} (Valuation)</span>
                   </div>

                   <div className="space-y-3">
                      <div className="flex justify-between text-xs font-black uppercase tracking-tight">
                         <span className="text-slate-600 dark:text-slate-400">Non-Movable Assets</span>
                         <span className="text-slate-400">{boqAnalysis.nonMovableCount} Items</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                         <div 
                           className="h-full bg-violet-500 rounded-full transition-all duration-700" 
                           style={{ width: `${(boqAnalysis.nonMovableCount / (lineItems.length || 1)) * 100}%` }}
                         />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 block text-right mt-1">₹{boqAnalysis.nonMovableValue.toLocaleString("en-IN")} (Valuation)</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* ============================================== */}
        {/* LINE ITEMS GRID — Massive & Immersive          */}
        {/* ============================================== */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-indigo-500/5 overflow-hidden">
          <div className="px-10 py-8 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/10">
                <Calculator className="h-7 w-7 text-white" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">BOQ Specification Grid</h3>
                <div className="flex items-center gap-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Real-time Calculation Engine 2.0</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
               <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Total Items</span>
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{lineItems.length}</span>
                  </div>
               </div>
               <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest leading-none">Net Total</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">₹{totals.finalAmount.toLocaleString("en-IN")}</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="p-2 lg:p-6 bg-slate-50/20 dark:bg-[#020617]/40 min-h-[500px]">
            <EditableGrid
              rows={lineItems}
              onRowsChange={setLineItems}
              showExport={false}
              compact={false}
              validationErrors={validationErrors.filter(e => e.startsWith("Row") || e.includes("line item"))}
              minHeight="600px"
            />
          </div>
          
          <div className="px-10 py-8 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500">
                <ShieldCheck className="h-5 w-5" />
                <p className="text-[11px] font-black uppercase tracking-widest leading-relaxed">
                  All items are subjected to standard DAVA India procurement quality checks before approval. 
                  Calculated totals are inclusive of applicable GST (as entered) and transit insurance.
                </p>
             </div>
          </div>
        </div>

        {/* Floating Save Action (Large screens only) */}
        <div className="hidden xl:flex fixed bottom-10 left-1/2 -translate-x-1/2 items-center gap-4 bg-slate-900 shadow-2xl shadow-indigo-500/20 rounded-full px-8 py-4 border border-slate-800 z-50 animate-in fade-in slide-in-from-bottom-10 duration-1000">
           <div className="flex flex-col pr-8 border-r border-slate-800">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] leading-none mb-1">Store</span>
              <span className="text-sm font-bold text-white uppercase tracking-tight">{header.storeId || 'UNNAMED SITE'}</span>
           </div>
           
           <div className="flex items-center gap-8 px-6 border-r border-slate-800">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Subtotal</span>
                <span className="text-lg font-black text-white tabular-nums">₹{totals.subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest leading-none mb-1">Total (GST Inc.)</span>
                <span className="text-lg font-black text-emerald-400 tabular-nums">₹{totals.finalAmount.toLocaleString("en-IN")}</span>
              </div>
           </div>

           <Button
            onClick={handleSave}
            disabled={isSaving}
            className="h-12 px-8 text-xs font-black bg-white hover:bg-slate-100 text-slate-900 shadow-xl shadow-white/5 active:scale-95 transition-all rounded-full gap-2"
          >
             {isSaving ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
             Commit To Database
          </Button>
        </div>

      </main>
      
      {/* Footer Branding */}
      <footer className="py-20 flex flex-col items-center justify-center space-y-4 opacity-30 select-none pointer-events-none">
         <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center">
               <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.3em]">NEXGEN FINANCE</span>
         </div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Proprietary Architecture • Real-Time Ledger Sync • All Rights Reserved</p>
      </footer>
    </div>
  );
};

export default CreateQuotation;
