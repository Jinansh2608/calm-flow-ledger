import { useState } from "react";
import { ChevronRight, FileText, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboard, ClientPO } from "@/contexts/DashboardContext";
import { cn, formatCurrency } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { poService } from "@/services";

const paymentStatusConfig = {
  paid: { label: "Paid" },
  partial: { label: "Partial" },
  pending: { label: "Pending" },
  overdue: { label: "Overdue" },
} as const;

const statusConfig = {
  draft: { label: "Draft" },
  active: { label: "Active" },
  completed: { label: "Completed" },
  cancelled: { label: "Cancelled" },
  pending: { label: "Pending" },
} as const;

const getPaymentStatusConfig = (status: string) => {
  return paymentStatusConfig[status as keyof typeof paymentStatusConfig] ||
    { label: status };
};

const getStatusConfig = (status: string) => {
  return statusConfig[status as keyof typeof statusConfig] ||
    { label: status };
};

// Styling helpers — no white accents, dark-mode native
const paymentBadgeStyle = (status: string) =>
  cn(
    "font-black text-[9px] w-full justify-center py-1 rounded-md border uppercase tracking-wider",
    status === "paid" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    status === "partial" && "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    status === "pending" && "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
    status === "overdue" && "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
  );

const statusBadgeStyle = (status: string) =>
  cn(
    "font-black text-[9px] w-full justify-center py-1 rounded-md border uppercase tracking-wider",
    status === "active" && "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    status === "completed" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    status === "cancelled" && "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
    status === "draft" && "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
    status === "pending" && "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
  );

const statusDotColor = (status: string) =>
  cn(
    "h-1.5 w-1.5 rounded-full",
    status === "active" && "bg-blue-400 animate-pulse",
    status === "completed" && "bg-emerald-400",
    status === "cancelled" && "bg-rose-400",
    status === "draft" && "bg-slate-500",
    status === "pending" && "bg-amber-400 animate-pulse"
  );

interface ClientPOTableProps {
  onSelectPO?: (po: ClientPO) => void;
}

const ClientPOTable = ({ onSelectPO }: ClientPOTableProps) => {
  const { filteredClientPOs, isFiltered, refreshData, isRefreshing } = useDashboard();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  // Bulk Selection State
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [lastSelectedIdx, setLastSelectedIdx] = useState<number | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const handleRowSelect = (e: React.MouseEvent, poId: string, idx: number) => {
      e.stopPropagation();
      const newSelected = new Set(selectedRows);
      
      if (e.shiftKey && lastSelectedIdx !== null) {
          const start = Math.min(lastSelectedIdx, idx);
          const end = Math.max(lastSelectedIdx, idx);
          for (let i = start; i <= end; i++) {
              newSelected.add(filteredClientPOs[i].id);
          }
      } else {
          if (newSelected.has(poId)) {
              newSelected.delete(poId);
          } else {
              newSelected.add(poId);
          }
      }
      setSelectedRows(newSelected);
      setLastSelectedIdx(idx);
  };

  const selectAll = () => {
      if (selectedRows.size === filteredClientPOs.length) {
          setSelectedRows(new Set());
      } else {
          setSelectedRows(new Set(filteredClientPOs.map(po => po.id)));
      }
  };

  const handleBulkAction = async (actionType: 'status' | 'vendor', val: string) => {
      if (selectedRows.size === 0) return;
      setIsBulkUpdating(true);
      try {
          const promises = Array.from(selectedRows).map(async (poId) => {
              const po = filteredClientPOs.find(p => p.id === poId);
              if (!po) return;
              const actualPoId = Number(po._original?.id || po.id);
              if (actionType === 'status') {
                 await poService.updatePO(actualPoId, { status: val as any, payment_status: po.paymentStatus });
              } else {
                 await new Promise(r => setTimeout(r, 200));
              }
          });
          await Promise.all(promises);
          toast({ title: "Bulk Update Successful", description: `Updated ${selectedRows.size} orders.` });
          setSelectedRows(new Set());
          await refreshData();
      } catch (e) {
          toast({ title: "Bulk Update Failed", description: "Some orders failed to update", variant: "destructive" });
      } finally {
          setIsBulkUpdating(false);
      }
  };

  const handleRowClick = (po: ClientPO, e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest('[role="combobox"]') ||
      (e.target as HTMLElement).closest('[role="listbox"]')
    ) {
      return;
    }
    setSelectedId(po.id);
    onSelectPO?.(po);
  };

  const handlePaymentStatusChange = async (poId: string, newStatus: string) => {
    try {
      setUpdatingIds((prev) => new Set(prev).add(poId));
      const po = filteredClientPOs.find((p) => p.id === poId);
      if (!po) return;

      const actualPoId = Number(po._original?.id || po.id);

      await poService.updatePO(actualPoId, {
        payment_status: newStatus as any,
        status: po.status,
      });

      toast({ title: "Updated", description: `Payment → ${newStatus}` });
      await refreshData();
    } catch {
      toast({ title: "Error", description: "Failed to update payment status", variant: "destructive" });
    } finally {
      setUpdatingIds((prev) => {
        const s = new Set(prev);
        s.delete(poId);
        return s;
      });
    }
  };

  const handleStatusChange = async (poId: string, newStatus: string) => {
    try {
      setUpdatingIds((prev) => new Set(prev).add(poId));
      const po = filteredClientPOs.find((p) => p.id === poId);
      if (!po) return;

      const actualPoId = Number(po._original?.id || po.id);

      await poService.updatePO(actualPoId, {
        status: newStatus as any,
        payment_status: po.paymentStatus,
      });

      toast({ title: "Updated", description: `Status → ${newStatus}` });
      await refreshData();
    } catch {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } finally {
      setUpdatingIds((prev) => {
        const s = new Set(prev);
        s.delete(poId);
        return s;
      });
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden premium-gradient">
      {/* Header */}
      <div className="flex items-center justify-between px-7 py-6 border-b border-border/40 glass-panel relative">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-black text-foreground tracking-tight">
              Client Purchase Orders
            </h3>
            {isFiltered && (
              <Badge
                variant="outline"
                className="text-[9px] font-black uppercase tracking-widest border-primary/30 text-primary bg-primary/5 rounded-full px-2"
              >
                Filtered
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.15em]">
              {filteredClientPOs.length} active records
            </p>
          </div>
        </div>
        
        {selectedRows.size > 0 ? (
           <div className="absolute inset-0 bg-primary/5 glass-panel flex items-center justify-between px-7 animate-in fade-in duration-200 border-b border-primary/20 z-10">
              <div className="flex items-center gap-3">
                 <Badge className="bg-primary text-primary-foreground font-black text-sm px-3">{selectedRows.size}</Badge>
                 <span className="font-bold text-sm text-foreground">Orders Selected</span>
              </div>
              <div className="flex items-center gap-3">
                <Select disabled={isBulkUpdating} onValueChange={(v) => handleBulkAction('status', v)}>
                  <SelectTrigger className="w-[180px] h-9 bg-background">
                    <SelectValue placeholder="Bulk Change Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key} className="text-xs font-bold">{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedRows(new Set())}
                  className="h-9 text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Clear Selection
                </Button>
                {isBulkUpdating && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              </div>
           </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-4 rounded-lg border-border/60 bg-muted/30 hover:bg-muted/60 text-[11px] font-bold transition-all"
          >
            View All
            <ChevronRight className="h-3.5 w-3.5 ml-1.5 opacity-50" />
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {filteredClientPOs.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/50 bg-muted/30">
                <TableHead className="w-12 pl-6">
                   <div 
                      className={cn(
                        "h-4 w-4 rounded-[4px] border border-muted-foreground/40 flex items-center justify-center cursor-pointer transition-all",
                        selectedRows.size === filteredClientPOs.length && filteredClientPOs.length > 0 ? "bg-primary border-primary" : "bg-transparent",
                        selectedRows.size > 0 && selectedRows.size < filteredClientPOs.length && "bg-primary/20 border-primary"
                      )}
                      onClick={selectAll}
                   >
                     {selectedRows.size === filteredClientPOs.length && filteredClientPOs.length > 0 && <div className="h-2 w-2 bg-white rounded-[2px]" />}
                     {selectedRows.size > 0 && selectedRows.size < filteredClientPOs.length && <div className="h-1.5 w-1.5 bg-primary rounded-[1px]" />}
                   </div>
                </TableHead>
                <TableHead className="py-4 text-[10px] font-black text-foreground/70 uppercase tracking-[0.2em]">Client</TableHead>
                <TableHead className="py-4 text-[10px] font-black text-foreground/70 uppercase tracking-[0.2em]">Project Name</TableHead>
                <TableHead className="py-4 text-[10px] font-black text-foreground/70 uppercase tracking-[0.2em]">PO Number</TableHead>
                <TableHead className="py-4 text-right text-[10px] font-black text-foreground/70 uppercase tracking-[0.2em]">PO Value</TableHead>
                <TableHead className="py-4 text-right text-[10px] font-black text-foreground/70 uppercase tracking-[0.2em]">Outstanding</TableHead>
                <TableHead className="py-4 text-center text-[10px] font-black text-foreground/70 uppercase tracking-[0.2em]">Payment</TableHead>
                <TableHead className="py-4 text-center text-[10px] font-black text-foreground/70 uppercase tracking-[0.2em]">Status</TableHead>
                <TableHead className="w-14"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isRefreshing ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm font-medium text-foreground">Refreshing orders...</p>
                  </TableCell>
                </TableRow>
              ) : filteredClientPOs.map((po, idx) => {
                const isUpdating = updatingIds.has(po.id);
                const isSelected = selectedRows.has(po.id);

                return (
                  <TableRow
                    key={po.id}
                    className={cn(
                      "group cursor-pointer transition-colors duration-200 border-b border-border/20 last:border-0",
                      selectedId === po.id || isSelected
                        ? "bg-primary/[0.08]"
                        : "hover:bg-muted/30"
                    )}
                    onClick={(e) => handleRowClick(po, e)}
                  >
                    <TableCell className="pl-6 w-12" onClick={(e) => handleRowSelect(e, po.id, idx)}>
                        <div 
                          className={cn(
                            "h-4 w-4 rounded-[4px] border flex items-center justify-center transition-all",
                            isSelected ? "bg-primary border-primary" : "border-muted-foreground/40 bg-transparent group-hover:border-primary/50"
                          )}
                        >
                          {isSelected && <div className="h-2 w-2 bg-white rounded-[2px]" />}
                        </div>
                    </TableCell>

                    {/* Client */}
                    <TableCell className="py-5">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-foreground text-sm tracking-tight group-hover:text-primary transition-colors">
                          {po.client}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Client</span>
                      </div>
                    </TableCell>

                    {/* Project Name */}
                    <TableCell className="py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className={statusDotColor(po.status)} />
                          <span className="font-bold text-foreground text-[13px] leading-tight tracking-tight max-w-[200px] truncate">
                            {po.systemProjectName || po.project || 'No Project'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 ml-3.5">
                          {po.storeId && (po.storeId !== (po.systemProjectName || po.project)) && (
                            <span className="text-[10px] text-primary/80 font-black uppercase tracking-widest">
                               {po.storeId}
                            </span>
                          )}
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                            <FileText className="h-2.5 w-2.5" />
                            <span>ID: {po.projectId || '—'}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* PO Number */}
                    <TableCell className="py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-[11px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/40">
                            {po.poNo}
                          </code>
                          {po.isBundled && (
                            <Badge className="bg-indigo-950/50 text-indigo-400 border border-indigo-700/30 px-1.5 py-0 h-4 text-[8px] font-black uppercase tracking-tight">
                              Bundle
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground/60 font-medium ml-0.5">
                          {po.piNo ? `PI: ${po.piNo}` : "—"}
                        </span>
                      </div>
                    </TableCell>

                    {/* PO Value */}
                    <TableCell className="text-right py-5">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="font-black text-foreground text-[14px] tabular-nums tracking-tight">
                          {formatCurrency(po.poValue)}
                        </span>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold opacity-50">Total</span>
                      </div>
                    </TableCell>

                    {/* Outstanding */}
                    <TableCell className="text-right py-5">
                      <div className="flex flex-col items-end gap-0.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {po.receivable > 0 ? (
                            <>
                              <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
                              <span className="font-black text-[14px] text-amber-500 tabular-nums tracking-tight">
                                {formatCurrency(po.receivable)}
                              </span>
                            </>
                          ) : (
                            <span className="font-black text-[14px] text-emerald-500 tabular-nums tracking-tight">
                              {formatCurrency(0)}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold opacity-50">Due</span>
                      </div>
                    </TableCell>

                    {/* Payment Status — Editable */}
                    <TableCell className="py-5">
                      <div className="flex justify-center">
                        <Select
                          value={po.paymentStatus}
                          onValueChange={(val) => handlePaymentStatusChange(po.id, val)}
                          disabled={isUpdating}
                        >
                          <SelectTrigger
                            className={cn(
                              "h-7 w-[100px] border-none bg-transparent p-0 focus:ring-0 shadow-none",
                              isUpdating && "opacity-50 animate-pulse"
                            )}
                          >
                            <Badge className={paymentBadgeStyle(po.paymentStatus)}>
                              {getPaymentStatusConfig(po.paymentStatus).label}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border shadow-xl">
                            {Object.entries(paymentStatusConfig).map(([key, config]) => (
                              <SelectItem
                                key={key}
                                value={key}
                                className="text-xs font-bold capitalize"
                              >
                                {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>

                    {/* Status — Editable */}
                    <TableCell className="py-5">
                      <div className="flex justify-center">
                        <Select
                          value={po.status}
                          onValueChange={(val) => handleStatusChange(po.id, val)}
                          disabled={isUpdating}
                        >
                          <SelectTrigger
                            className={cn(
                              "h-7 w-[100px] border-none bg-transparent p-0 focus:ring-0 shadow-none",
                              isUpdating && "opacity-50 animate-pulse"
                            )}
                          >
                            <Badge className={statusBadgeStyle(po.status)}>
                              {getStatusConfig(po.status).label}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border shadow-xl">
                            {Object.entries(statusConfig).map(([key, config]) => (
                              <SelectItem
                                key={key}
                                value={key}
                                className="text-xs font-bold capitalize"
                              >
                                {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right py-5 pr-5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground/50 hover:text-primary hover:bg-primary/10 rounded-full transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(po.id);
                          onSelectPO?.(po);
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">No orders found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your filters or adding a new order
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientPOTable;
