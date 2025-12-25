import { Truck, Clock, AlertCircle, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDashboard } from "@/contexts/DashboardContext";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const paymentStatusConfig = {
  paid: { label: "Paid", className: "bg-success-light text-success border-success/20" },
  partial: { label: "Partial", className: "bg-warning-light text-warning-foreground border-warning/20" },
  pending: { label: "Pending", className: "bg-muted text-muted-foreground border-border" },
  overdue: { label: "Overdue", className: "bg-destructive-light text-destructive border-destructive/20" },
};

const VendorPOTracking = () => {
  const { filteredVendorPOs, isFiltered } = useDashboard();

  return (
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
              className={cn(
                "rounded-lg border p-4 transition-all hover:shadow-soft",
                vpo.paymentStatus === "overdue" && "border-destructive/30 bg-destructive-light/30"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-foreground">{vpo.vendor}</h4>
                  <p className="text-sm text-muted-foreground">
                    PO Value: <span className="font-medium text-foreground">{formatCurrency(vpo.poValue)}</span>
                  </p>
                </div>
                <Badge className={paymentStatusConfig[vpo.paymentStatus].className} variant="outline">
                  {paymentStatusConfig[vpo.paymentStatus].label}
                </Badge>
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
  );
};

export default VendorPOTracking;
