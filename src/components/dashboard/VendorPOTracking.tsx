import { useState } from "react";
import { Truck, Clock, AlertCircle, Package, ChevronRight, Building2, CreditCard, FileText, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useDashboard, VendorPO } from "@/contexts/DashboardContext";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const formatCurrency = (value: number) => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const paymentStatusConfig = {
  paid: { label: "Paid", className: "bg-success-light text-success border-success/20" },
  partial: { label: "Partial", className: "bg-warning-light text-warning-foreground border-warning/20" },
  pending: { label: "Pending", className: "bg-muted text-muted-foreground border-border" },
  overdue: { label: "Overdue", className: "bg-destructive-light text-destructive border-destructive/20" },
};

const VendorDetailDialog = ({ 
  vendor, 
  open, 
  onClose 
}: { 
  vendor: VendorPO | null; 
  open: boolean; 
  onClose: () => void;
}) => {
  if (!vendor) return null;

  const milestones = [
    { label: "PO Created", date: "Jan 15, 2024", completed: true },
    { label: "Materials Ordered", date: "Jan 18, 2024", completed: true },
    { label: "Production Started", date: "Jan 25, 2024", completed: vendor.progress >= 30 },
    { label: "Quality Check", date: "Feb 05, 2024", completed: vendor.progress >= 70 },
    { label: "Delivery", date: formatDate(vendor.dueDate), completed: vendor.progress === 100 },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="font-display">{vendor.vendor}</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={paymentStatusConfig[vendor.paymentStatus].className} variant="outline">
                  {paymentStatusConfig[vendor.paymentStatus].label}
                </Badge>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-5">
          {/* Financial Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">PO Value</p>
              <p className="text-xl font-bold font-display text-foreground">{formatCurrency(vendor.poValue)}</p>
            </div>
            <div className={cn(
              "p-4 rounded-lg text-center",
              vendor.payable > 0 ? "bg-warning-light" : "bg-success-light"
            )}>
              <p className="text-xs text-muted-foreground mb-1">Payable</p>
              <p className={cn(
                "text-xl font-bold font-display",
                vendor.payable > 0 ? "text-warning" : "text-success"
              )}>
                {formatCurrency(vendor.payable)}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Execution Progress</span>
              <span className="text-sm font-bold text-primary">{vendor.progress}%</span>
            </div>
            <Progress value={vendor.progress} className="h-2" />
          </div>

          <Separator />

          {/* Milestones */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Milestones</p>
            <div className="relative pl-4 space-y-3">
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />
              {milestones.map((milestone, index) => (
                <div key={index} className="relative flex items-center gap-3">
                  <div className={cn(
                    "absolute -left-4 w-3 h-3 rounded-full border-2 z-10",
                    milestone.completed 
                      ? "bg-success border-success" 
                      : "bg-background border-muted-foreground"
                  )} />
                  <div className="flex-1 flex items-center justify-between ml-2">
                    <span className={cn(
                      "text-sm",
                      milestone.completed ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {milestone.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{milestone.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Payment Details */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment Details</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total PO Value</span>
                <span className="font-medium">{formatCurrency(vendor.poValue)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-medium text-success">{formatCurrency(vendor.poValue - vendor.payable)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Balance Payable</span>
                <span className={cn("font-medium", vendor.payable > 0 ? "text-warning" : "text-success")}>
                  {formatCurrency(vendor.payable)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Due Date</span>
                <span className={cn(
                  "font-medium",
                  vendor.paymentStatus === "overdue" ? "text-destructive" : "text-foreground"
                )}>
                  {formatDate(vendor.dueDate)}
                </span>
              </div>
            </div>
          </div>

          {vendor.paymentStatus === "overdue" && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive-light border border-destructive/20">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <span className="text-sm text-destructive">
                Payment is overdue by {Math.floor((Date.now() - new Date(vendor.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const VendorPOTracking = () => {
  const { filteredVendorPOs, isFiltered } = useDashboard();
  const [selectedVendor, setSelectedVendor] = useState<VendorPO | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleVendorClick = (vpo: VendorPO) => {
    setSelectedVendor(vpo);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="rounded-xl border bg-card shadow-card">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Truck className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-foreground">Vendor PO Tracking</h3>
                {isFiltered && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    Filtered
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {filteredVendorPOs.length} vendor order{filteredVendorPOs.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
          {filteredVendorPOs.length > 0 ? (
            filteredVendorPOs.map((vpo) => (
              <div
                key={vpo.id}
                onClick={() => handleVendorClick(vpo)}
                className={cn(
                  "rounded-lg border p-4 transition-all hover:shadow-soft cursor-pointer group",
                  vpo.paymentStatus === "overdue" && "border-destructive/30 bg-destructive-light/30"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">{vpo.vendor}</h4>
                    <p className="text-sm text-muted-foreground">
                      PO Value: <span className="font-medium text-foreground">{formatCurrency(vpo.poValue)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={paymentStatusConfig[vpo.paymentStatus].className} variant="outline">
                      {paymentStatusConfig[vpo.paymentStatus].label}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Execution Progress</span>
                    <span className="font-medium text-foreground">{vpo.progress}%</span>
                  </div>
                  <Progress value={vpo.progress} className="h-1.5" />
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Due {formatDate(vpo.dueDate)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Payable: </span>
                    <span className={cn(
                      "font-semibold",
                      vpo.payable > 0 ? "text-warning" : "text-success"
                    )}>
                      {formatCurrency(vpo.payable)}
                    </span>
                  </div>
                </div>

                {vpo.paymentStatus === "overdue" && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    <span>Payment overdue by {Math.floor((Date.now() - new Date(vpo.dueDate).getTime()) / (1000 * 60 * 60 * 24))} days</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-2">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No vendor orders</p>
              <p className="text-xs text-muted-foreground mt-1">Adjust filters to see results</p>
            </div>
          )}
        </div>
      </div>

      <VendorDetailDialog 
        vendor={selectedVendor} 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
      />
    </>
  );
};

export default VendorPOTracking;
