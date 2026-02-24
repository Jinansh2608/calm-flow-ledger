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
    status === "paid" && "bg-emerald-950/60 text-emerald-400 border-emerald-700/40",
    status === "partial" && "bg-amber-950/60 text-amber-400 border-amber-700/40",
    status === "pending" && "bg-slate-800/60 text-slate-400 border-slate-600/40",
    status === "overdue" && "bg-rose-950/60 text-rose-400 border-rose-700/40"
  );

const statusBadgeStyle = (status: string) =>
  cn(
    "font-black text-[9px] w-full justify-center py-1 rounded-md border uppercase tracking-wider",
    status === "active" && "bg-blue-950/60 text-blue-400 border-blue-700/40",
    status === "completed" && "bg-emerald-950/60 text-emerald-400 border-emerald-700/40",
    status === "cancelled" && "bg-rose-950/60 text-rose-400 border-rose-700/40",
    status === "draft" && "bg-slate-800/60 text-slate-400 border-slate-600/40",
    status === "pending" && "bg-amber-950/60 text-amber-400 border-amber-700/40"
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
  const { filteredClientPOs, isFiltered, refreshData } = useDashboard();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

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
      <div className="flex items-center justify-between px-7 py-6 border-b border-border/40 glass-panel">
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
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-4 rounded-lg border-border/60 bg-muted/30 hover:bg-muted/60 text-[11px] font-bold transition-all"
        >
          View All
          <ChevronRight className="h-3.5 w-3.5 ml-1.5 opacity-50" />
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {filteredClientPOs.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/30">
                <TableHead className="py-3.5 pl-7 text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Client</TableHead>
                <TableHead className="py-3.5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Project</TableHead>
                <TableHead className="py-3.5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">PO Number</TableHead>
                <TableHead className="py-3.5 text-right text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">PO Value</TableHead>
                <TableHead className="py-3.5 text-right text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Outstanding</TableHead>
                <TableHead className="py-3.5 text-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Payment</TableHead>
                <TableHead className="py-3.5 text-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em]">Status</TableHead>
                <TableHead className="w-14"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientPOs.map((po) => {
                const isUpdating = updatingIds.has(po.id);

                return (
                  <TableRow
                    key={po.id}
                    className={cn(
                      "group cursor-pointer transition-colors duration-200 border-b border-border/20 last:border-0",
                      selectedId === po.id
                        ? "bg-primary/[0.08]"
                        : "hover:bg-muted/30"
                    )}
                    onClick={(e) => handleRowClick(po, e)}
                  >
                    {/* Client */}
                    <TableCell className="py-5 pl-7">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-foreground text-sm tracking-tight group-hover:text-primary transition-colors">
                          {po.client}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Client</span>
                      </div>
                    </TableCell>

                    {/* Project */}
                    <TableCell className="py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className={statusDotColor(po.status)} />
                          <span className="font-bold text-foreground text-[13px] leading-tight tracking-tight max-w-[200px] truncate">
                            {po.project}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-3.5 font-medium">
                          <FileText className="h-2.5 w-2.5" />
                          <span>ID: {po.projectId || '—'}</span>
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
