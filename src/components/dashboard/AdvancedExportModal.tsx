// ============================================================
// ADVANCED EXPORT MODAL
// Export: Vendor Orders, Quotation, Final Invoice
// Frontend-only with mock data
// ============================================================

import { useState, useCallback } from "react";
import { Download, FileSpreadsheet, Check, AlertCircle, Filter, ShoppingCart, FileText, Receipt } from "lucide-react";
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
import {
  QUOTATION_COLUMNS,
  SAMPLE_ITEMS,
  getGrandTotals,
} from "@/config/DynamicColumnConfig";
import {
  exportCombined,
  exportSingleTable,
  ExportTableData,
} from "@/services/ExcelExportService";

type ExportCategory = "vendor_orders" | "quotation" | "final_invoice";

interface ExportFilter {
  storeId: string;
  dateFrom: string;
  dateTo: string;
}

// ============================================================
// MOCK DATA GENERATORS
// ============================================================

// Vendor Order columns
const VENDOR_ORDER_COLUMNS = [
  { key: 'vo_number', label: 'VO Number', width: 120, alignment: 'left' as const, inputType: 'text' as const },
  { key: 'vendor_name', label: 'Vendor Name', width: 200, alignment: 'left' as const, inputType: 'text' as const },
  { key: 'scope', label: 'Scope of Work', width: 220, alignment: 'left' as const, inputType: 'text' as const },
  { key: 'status', label: 'Status', width: 100, alignment: 'center' as const, inputType: 'text' as const },
  { key: 'amount', label: 'Order Value', width: 120, alignment: 'right' as const, inputType: 'number' as const, format: 'currency' as const },
  { key: 'paid', label: 'Paid', width: 120, alignment: 'right' as const, inputType: 'number' as const, format: 'currency' as const },
  { key: 'balance', label: 'Balance', width: 120, alignment: 'right' as const, inputType: 'number' as const, format: 'currency' as const },
];

const MOCK_VENDOR_ORDERS = [
  { vo_number: 'VO-001', vendor_name: 'Bajaj Furnishing Pvt Ltd', scope: 'Modular Kitchen & Wardrobes', status: 'In Progress', amount: 485000, paid: 200000, balance: 285000 },
  { vo_number: 'VO-002', vendor_name: 'Supreme Interior Solutions', scope: 'False Ceiling & Painting', status: 'Completed', amount: 220000, paid: 220000, balance: 0 },
  { vo_number: 'VO-003', vendor_name: 'Aristo Modular Systems', scope: 'Electrical & Plumbing Works', status: 'Pending', amount: 175000, paid: 50000, balance: 125000 },
  { vo_number: 'VO-004', vendor_name: 'Nexgen Furnishing Co', scope: 'Office Furniture Supply', status: 'In Progress', amount: 310000, paid: 155000, balance: 155000 },
];

// Final Invoice columns (derived from line items)
const FINAL_INVOICE_COLUMNS = [
  { key: 'sr_no', label: 'Sr No.', width: 60, alignment: 'center' as const, inputType: 'number' as const },
  { key: 'description', label: 'Description', width: 250, alignment: 'left' as const, inputType: 'text' as const },
  { key: 'hsn_code', label: 'HSN/SAC', width: 100, alignment: 'left' as const, inputType: 'text' as const },
  { key: 'quantity', label: 'Qty', width: 70, alignment: 'right' as const, inputType: 'number' as const, format: 'number' as const },
  { key: 'unit', label: 'Unit', width: 70, alignment: 'left' as const, inputType: 'text' as const },
  { key: 'rate', label: 'Rate', width: 100, alignment: 'right' as const, inputType: 'number' as const, format: 'currency' as const },
  { key: 'amount', label: 'Amount', width: 120, alignment: 'right' as const, inputType: 'number' as const, format: 'currency' as const },
  { key: 'gst_percent', label: 'GST %', width: 70, alignment: 'right' as const, inputType: 'number' as const },
  { key: 'gst_amount', label: 'GST Amt', width: 100, alignment: 'right' as const, inputType: 'number' as const, format: 'currency' as const },
  { key: 'total', label: 'Total', width: 120, alignment: 'right' as const, inputType: 'number' as const, format: 'currency' as const },
];

const MOCK_FINAL_INVOICE = SAMPLE_ITEMS.slice(0, 8).map((item, idx) => {
  const qty = Math.floor(Math.random() * 10) + 1;
  const rate = item.price || 0;
  const amount = qty * rate;
  const gst = amount * 0.18;
  return {
    sr_no: idx + 1,
    description: item.name,
    hsn_code: item.hsn_sac_code || '',
    quantity: qty,
    unit: item.units || 'Nos',
    rate: rate,
    amount: amount,
    gst_percent: 18,
    gst_amount: gst,
    total: amount + gst,
  };
});

// ============================================================
// COMPONENT
// ============================================================

const AdvancedExportModal = () => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<ExportCategory>>(new Set());
  const [filters, setFilters] = useState<ExportFilter>({ storeId: "", dateFrom: "", dateTo: "" });
  const [isExporting, setIsExporting] = useState(false);

  const toggleCategory = useCallback((cat: ExportCategory) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }, []);

  const generateExportData = useCallback((category: ExportCategory): ExportTableData => {
    switch (category) {
      case 'vendor_orders': {
        const voTotal = MOCK_VENDOR_ORDERS.reduce((s, r) => s + r.amount, 0);
        const voPaid = MOCK_VENDOR_ORDERS.reduce((s, r) => s + r.paid, 0);
        const voBalance = MOCK_VENDOR_ORDERS.reduce((s, r) => s + r.balance, 0);
        return {
          title: 'Vendor Orders',
          columns: VENDOR_ORDER_COLUMNS,
          rows: MOCK_VENDOR_ORDERS,
          totals: { amount: voTotal, paid: voPaid, balance: voBalance },
        };
      }
      case 'quotation': {
        const rows = SAMPLE_ITEMS.slice(0, 6).map((item) => ({
          _id: crypto.randomUUID(),
          name: item.name,
          hsn_sac_code: item.hsn_sac_code || '',
          type_of_boq: item.type_of_boq || '',
          quantity: Math.floor(Math.random() * 10) + 1,
          units: item.units || '',
          price: item.price || 0,
          tax: item.tax || 18,
        }));
        const totals = getGrandTotals(rows);
        return {
          title: 'Quotation',
          columns: QUOTATION_COLUMNS,
          rows,
          totals: { subtotal: totals.subtotal, totalGST: totals.totalGST, finalAmount: totals.finalAmount },
        };
      }
      case 'final_invoice': {
        const invTotal = MOCK_FINAL_INVOICE.reduce((s, r) => s + r.total, 0);
        const invSubtotal = MOCK_FINAL_INVOICE.reduce((s, r) => s + r.amount, 0);
        const invGST = MOCK_FINAL_INVOICE.reduce((s, r) => s + r.gst_amount, 0);
        return {
          title: 'Final Invoice',
          columns: FINAL_INVOICE_COLUMNS,
          rows: MOCK_FINAL_INVOICE,
          totals: { amount: invSubtotal, gst_amount: invGST, total: invTotal },
        };
      }
    }
  }, []);

  const handleExport = useCallback(async () => {
    if (selected.size === 0) {
      toast({ title: "No Selection", description: "Please select at least one export category", variant: "destructive" });
      return;
    }

    setIsExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      const tables = Array.from(selected).map((cat) => generateExportData(cat));
      if (tables.length === 1) {
        exportSingleTable(tables[0], `${tables[0].title.replace(/\s+/g, '_')}_Export`);
      } else {
        exportCombined(tables);
      }
      toast({ title: "Export Complete", description: `${tables.length} table(s) exported successfully` });
      setOpen(false);
    } catch (error) {
      toast({ title: "Export Failed", description: "An error occurred during export", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }, [selected, generateExportData]);

  const categories: { key: ExportCategory; label: string; description: string; color: string; icon: React.ReactNode; count: number }[] = [
    {
      key: "vendor_orders",
      label: "Vendor Orders",
      description: "All vendor order data with payment status and balances",
      color: "text-blue-600 bg-blue-500/10 border-blue-500/30",
      icon: <ShoppingCart className="h-4 w-4" />,
      count: MOCK_VENDOR_ORDERS.length,
    },
    {
      key: "quotation",
      label: "Quotation",
      description: "BOQ quotation with line items, HSN codes, and totals",
      color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30",
      icon: <FileText className="h-4 w-4" />,
      count: 6,
    },
    {
      key: "final_invoice",
      label: "Final Invoice",
      description: "Final invoice from existing line items with GST breakdown",
      color: "text-amber-600 bg-amber-500/10 border-amber-500/30",
      icon: <Receipt className="h-4 w-4" />,
      count: MOCK_FINAL_INVOICE.length,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-semibold">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Advanced Export
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-emerald-600/5 to-teal-600/5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Download className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Advanced Export</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">Export vendor orders, quotation, or final invoice to Excel</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Export Categories */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Select Export Data
            </h4>
            <div className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => toggleCategory(cat.key)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left",
                    selected.has(cat.key)
                      ? cat.color
                      : "bg-card border-border/50 hover:bg-muted/30"
                  )}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                      selected.has(cat.key)
                        ? "bg-current border-current"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {selected.has(cat.key) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {cat.icon}
                      <span className="font-bold text-sm">{cat.label}</span>
                      <Badge variant="outline" className="text-[9px] font-mono h-4 ml-auto shrink-0">
                        {cat.count} items
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {cat.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Filters */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Filter className="h-3 w-3" />
              Optional Filters
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Store ID
                </Label>
                <Input
                  value={filters.storeId}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, storeId: e.target.value }))
                  }
                  placeholder="Filter by Store"
                  className="h-9 text-sm bg-muted/30"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Date From
                </Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, dateFrom: e.target.value }))
                  }
                  className="h-9 text-sm bg-muted/30"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Date To
                </Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, dateTo: e.target.value }))
                  }
                  className="h-9 text-sm bg-muted/30"
                />
              </div>
            </div>
          </div>

          {/* Side-by-side info */}
          {selected.size > 1 && (
            <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
              <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-700 dark:text-blue-400">
                <span className="font-bold">Side-by-Side Export:</span>{" "}
                {selected.size} tables will be placed horizontally in a single
                Excel sheet.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/20 flex items-center justify-between">
          <Badge variant="outline" className="text-xs font-mono h-5">
            {selected.size} selected
          </Badge>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-9 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={selected.size === 0 || isExporting}
              className="h-9 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-600/20 gap-1.5"
            >
              {isExporting ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
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
