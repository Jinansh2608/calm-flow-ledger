// ============================================================
// ADVANCED EXPORT MODAL
// Export: Vendor Orders, Quotation, Final Invoice, Commercial Ledger
// Production-ready with real data integration
// ============================================================

import { useState, useCallback, useMemo } from "react";
import { 
  Download, 
  FileSpreadsheet, 
  Check, 
  AlertCircle, 
  Filter, 
  ShoppingCart, 
  FileText, 
  Receipt,
  Layers,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/contexts/DashboardContext";
import {
  QUOTATION_COLUMNS,
  getGrandTotals,
} from "@/config/DynamicColumnConfig";
import {
  exportCombined,
  exportSingleTable,
  ExportTableData,
} from "@/services/ExcelExportService";

type ExportCategory = "vendor_orders" | "quotation" | "final_invoice" | "commercial_ledger";

interface ExportFilter {
  storeId: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

// ============================================================
// COLUMN DEFINITIONS
// ============================================================

const VENDOR_ORDER_COLUMNS = [
  { key: 'poNo', label: 'VO Number', width: 120, alignment: 'left' as const, inputType: 'text' as const },
  { key: 'vendor', label: 'Vendor Name', width: 200, alignment: 'left' as const, inputType: 'text' as const },
  { key: 'poValue', label: 'Order Value', width: 120, alignment: 'right' as const, inputType: 'number' as const, format: 'currency' as const },
  { key: 'paymentStatus', label: 'Status', width: 100, alignment: 'center' as const, inputType: 'text' as const },
  { key: 'dueDate', label: 'Due Date', width: 120, alignment: 'right' as const, inputType: 'text' as const },
  { key: 'progress', label: 'Progress %', width: 100, alignment: 'right' as const, inputType: 'number' as const },
];

const COMMERCIAL_LEDGER_COLUMNS = [
  { key: 'date', label: 'Date', width: 100, alignment: 'left' as const, inputType: 'text' as const },
  { key: 'reference', label: 'Reference / PO', width: 150, alignment: 'left' as const, inputType: 'text' as const },
  { key: 'client', label: 'Client', width: 150, alignment: 'left' as const, inputType: 'text' as const },
  { key: 'project', label: 'Project', width: 200, alignment: 'left' as const, inputType: 'text' as const },
  { key: 'type', label: 'Type', width: 100, alignment: 'center' as const, inputType: 'text' as const },
  { key: 'value', label: 'Value', width: 120, alignment: 'right' as const, inputType: 'number' as const, format: 'currency' as const },
  { key: 'received', label: 'Received', width: 120, alignment: 'right' as const, inputType: 'number' as const, format: 'currency' as const },
  { key: 'balance', label: 'Balance', width: 120, alignment: 'right' as const, inputType: 'number' as const, format: 'currency' as const },
];

const FINAL_INVOICE_COLUMNS = [
  { key: 'sr_no', label: 'Sr No.', width: 60, alignment: 'center' as const, inputType: 'number' as const },
  { key: 'description', label: 'Description', width: 250, alignment: 'left' as const, inputType: 'text' as const },
  { key: 'hsn_code', label: 'HSN/SAC', width: 100, alignment: 'left' as const, inputType: 'text' as const },
  { key: 'quantity', label: 'Qty', width: 70, alignment: 'right' as const, inputType: 'number' as const, format: 'number' as const },
  { key: 'unit', label: 'Unit', width: 70, alignment: 'left' as const, inputType: 'text' as const },
  { key: 'rate', label: 'Rate', width: 100, alignment: 'right' as const, inputType: 'number' as const, format: 'currency' as const },
  { key: 'amount', label: 'Amount', width: 120, alignment: 'right' as const, inputType: 'number' as const, format: 'currency' as const },
];

// ============================================================
// COMPONENT
// ============================================================

const AdvancedExportModal = () => {
  const { 
    filteredClientPOs, 
    filteredVendorPOs, 
    filteredPayments,
    loading 
  } = useDashboard();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<ExportCategory>>(new Set());
  const [filters, setFilters] = useState<ExportFilter>({ 
    storeId: "", 
    dateFrom: "", 
    dateTo: "",
    search: "" 
  });
  const [isExporting, setIsExporting] = useState(false);

  // Apply internal filters to the already context-filtered data
  const finalVendorPOs = useMemo(() => {
    return filteredVendorPOs.filter(vo => {
      if (filters.dateFrom && new Date(vo.dueDate) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(vo.dueDate) > new Date(filters.dateTo)) return false;
      if (filters.search && !vo.vendor.toLowerCase().includes(filters.search.toLowerCase()) && !vo.poNo?.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [filteredVendorPOs, filters]);

  const finalClientPOs = useMemo(() => {
    return filteredClientPOs.filter(po => {
      if (filters.storeId && !po.storeId?.toLowerCase().includes(filters.storeId.toLowerCase())) return false;
      if (filters.dateFrom && new Date(po.createdAt) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(po.createdAt) > new Date(filters.dateTo)) return false;
      if (filters.search && !po.client.toLowerCase().includes(filters.search.toLowerCase()) && !po.project.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [filteredClientPOs, filters]);

  const toggleCategory = useCallback((cat: ExportCategory) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selected.size === 4) setSelected(new Set());
    else setSelected(new Set(["vendor_orders", "quotation", "final_invoice", "commercial_ledger"]));
  }, [selected]);

  const generateExportData = useCallback((category: ExportCategory): ExportTableData => {
    switch (category) {
      case 'vendor_orders': {
        const totalValue = finalVendorPOs.reduce((s, r) => s + (r.poValue || 0), 0);
        return {
          title: 'Vendor Orders',
          columns: VENDOR_ORDER_COLUMNS,
          rows: finalVendorPOs,
          totals: { poValue: totalValue },
        };
      }
      case 'quotation': {
        // Map Client PO line items if they exist, otherwise use placeholders
        const rows = finalClientPOs.flatMap(po => {
          const items = po._original?.line_items || [];
          if (items.length > 0) {
            return items.map((it: any) => ({
              _id: it.id,
              name: it.item_name || it.description,
              hsn_sac_code: it.hsn_sac_code || '',
              type_of_boq: it.type_of_boq || 'Movable',
              quantity: it.quantity || 1,
              units: it.units || 'Nos',
              price: it.unit_price || it.price || 0,
              tax: it.tax || 18,
            }));
          }
          // Fallback if no line items: use the PO itself as a single item
          return [{
            _id: po.id,
            name: `Project: ${po.project} (${po.poNo})`,
            hsn_sac_code: '',
            type_of_boq: 'Service',
            quantity: 1,
            units: 'Nos',
            price: po.poValue,
            tax: 18,
          }];
        });
        
        const totals = getGrandTotals(rows);
        return {
          title: 'Quotation Data',
          columns: QUOTATION_COLUMNS,
          rows,
          totals: { subtotal: totals.subtotal, totalGST: totals.totalGST, finalAmount: totals.finalAmount },
        };
      }
      case 'final_invoice': {
        // Simplified invoice view using PO summaries
        const rows = finalClientPOs.map((po, idx) => ({
          sr_no: idx + 1,
          description: `Work Order: ${po.project}`,
          hsn_code: '998311', // Default Interior Design HSN
          quantity: 1,
          unit: 'Nos',
          rate: po.poValue,
          amount: po.poValue,
        }));
        const total = rows.reduce((s, r) => s + r.amount, 0);
        return {
          title: 'Final Invoice Summary',
          columns: FINAL_INVOICE_COLUMNS,
          rows,
          totals: { amount: total },
        };
      }
      case 'commercial_ledger': {
        const rows = finalClientPOs.map(po => {
          const received = filteredPayments
            .filter(p => Number(p.po_id) === Number(po.id))
            .reduce((s, p) => s + (p.amount || 0), 0);
          
          return {
            date: po.createdAt.split('T')[0],
            reference: po.poNo,
            client: po.client,
            project: po.project,
            type: 'Credit',
            value: po.poValue,
            received: received,
            balance: po.poValue - received,
          };
        });
        
        const totalVal = rows.reduce((s, r) => s + r.value, 0);
        const totalRec = rows.reduce((s, r) => s + r.received, 0);
        const totalBal = rows.reduce((s, r) => s + r.balance, 0);
        
        return {
          title: 'Commercial Ledger',
          columns: COMMERCIAL_LEDGER_COLUMNS,
          rows,
          totals: { value: totalVal, received: totalRec, balance: totalBal },
        };
      }
    }
  }, [finalVendorPOs, finalClientPOs, filteredPayments]);

  const handleExport = useCallback(async () => {
    if (selected.size === 0) {
      toast({ title: "No Selection", description: "Please select at least one export category", variant: "destructive" });
      return;
    }

    setIsExporting(true);
    try {
      // Simulate processing time
      await new Promise((r) => setTimeout(r, 800));
      
      const tables = Array.from(selected).map((cat) => generateExportData(cat));
      
      if (tables.length === 1) {
        const table = tables[0];
        exportSingleTable(table, `${table.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`);
      } else {
        exportCombined(tables);
      }
      
      toast({ title: "Export Complete", description: `${tables.length} report(s) exported successfully` });
      setOpen(false);
    } catch (error) {
      console.error("Export Error:", error);
      toast({ title: "Export Failed", description: "An error occurred during Excel generation", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }, [selected, generateExportData]);

  const categories: { key: ExportCategory; label: string; description: string; color: string; icon: React.ReactNode; count: number }[] = [
    {
      key: "commercial_ledger",
      label: "Commercial Ledger",
      description: "Full financial ledger with receivables and payment tracking",
      color: "text-indigo-600 bg-indigo-500/10 border-indigo-500/30",
      icon: <Layers className="h-4 w-4" />,
      count: finalClientPOs.length,
    },
    {
      key: "vendor_orders",
      label: "Vendor Orders",
      description: "Procurement data with assignment, status and due dates",
      color: "text-blue-600 bg-blue-500/10 border-blue-500/30",
      icon: <ShoppingCart className="h-4 w-4" />,
      count: finalVendorPOs.length,
    },
    {
      key: "quotation",
      label: "BOQ Quotation",
      description: "Detailed line items with HSN codes and GST breakdown",
      color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30",
      icon: <FileText className="h-4 w-4" />,
      count: finalClientPOs.length,
    },
    {
      key: "final_invoice",
      label: "Final Invoice",
      description: "Billing summary suitable for client-side invoice generation",
      color: "text-amber-600 bg-amber-500/10 border-amber-500/30",
      icon: <Receipt className="h-4 w-4" />,
      count: finalClientPOs.length,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Advanced Export
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="px-6 pt-8 pb-6 border-b bg-gradient-to-br from-indigo-600/10 via-emerald-600/5 to-teal-600/10 relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <FileSpreadsheet className="h-32 w-32 rotate-12" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">Advanced Export Engine</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1 font-medium">Generate production-grade financial reports and spreadsheets</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Filters Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Filter className="h-3 w-3" />
                Report Filters
              </h4>
              <Badge variant="secondary" className="text-[9px] font-bold px-1.5 py-0">
                {isExporting ? "LOCK" : "ACTIVE"}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">Search Keywords</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={filters.search}
                    onChange={(e) => setFilters(p => ({ ...p, search: e.target.value }))}
                    placeholder="Client, Vendor, PO..."
                    className="h-9 text-xs pl-8 bg-muted/20 border-border/50 focus:bg-background transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">Store Ref</Label>
                <Input
                  value={filters.storeId}
                  onChange={(e) => setFilters(p => ({ ...p, storeId: e.target.value }))}
                  placeholder="Store ID"
                  className="h-9 text-xs bg-muted/20 border-border/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">Date Range</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(p => ({ ...p, dateFrom: e.target.value }))}
                    className="h-9 text-[10px] p-1 bg-muted/20 border-border/50"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(p => ({ ...p, dateTo: e.target.value }))}
                    className="h-9 text-[10px] p-1 bg-muted/20 border-border/50"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* Export Categories */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Select Datasets
              </h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={selectAll}
                className="h-6 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2"
              >
                {selected.size === 4 ? "Deselect All" : "Select All Reports"}
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => toggleCategory(cat.key)}
                  className={cn(
                    "relative flex flex-col gap-2 p-4 rounded-2xl border transition-all text-left group overflow-hidden",
                    selected.has(cat.key)
                      ? "border-current shadow-lg shadow-current/5 ring-1 ring-current/20"
                      : "bg-card border-border/50 hover:border-border hover:bg-muted/30"
                  )}
                  style={{ color: selected.has(cat.key) ? 'inherit' : undefined }}
                >
                  {selected.has(cat.key) && (
                    <div className={cn("absolute top-0 right-0 p-2", cat.color.split(' ')[0])}>
                      <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <Check className="h-3 w-3" />
                      </div>
                    </div>
                  )}
                  
                  <div className={cn(
                    "h-8 w-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                    cat.color
                  )}>
                    {cat.icon}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{cat.label}</span>
                      <Badge variant="outline" className="text-[9px] font-mono h-4 shrink-0 bg-background/50">
                        {cat.count} rec
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Side-by-side info */}
          {selected.size > 1 && (
            <div className="flex items-start gap-3 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
              <AlertCircle className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
              <div className="text-[11px] text-indigo-700/80 dark:text-indigo-400/80 leading-normal">
                <span className="font-bold text-indigo-700 dark:text-indigo-300">Composite Export Mode:</span>{" "}
                Multiple datasets detected. System will generate a single Excel workbook with tables arranged horizontally for side-by-side comparison.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t bg-muted/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Selected Payload</span>
            <span className="text-xs font-bold text-foreground">{selected.size} Report Type{selected.size !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-10 px-5 text-xs font-bold rounded-xl border-border/50 hover:bg-background"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={selected.size === 0 || isExporting || loading}
              className="h-10 px-6 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 shadow-xl shadow-indigo-600/20 text-white gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isExporting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download Excel
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedExportModal;
