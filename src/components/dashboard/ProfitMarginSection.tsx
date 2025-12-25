import { TrendingUp, ArrowUpRight } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
};

const ProfitMarginSection = () => {
  const { summaryData, isFiltered } = useDashboard();
  
  const revenue = summaryData.totalClientPOValue;
  const vendorCost = summaryData.totalVendorPOValue;
  const operationalExpenses = revenue * 0.05; // 5% operational cost
  const profit = summaryData.netProfit;
  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0";

  const profitData = [
    { label: "Client PO Total", value: revenue, type: "revenue" as const },
    { label: "Total Vendor Cost", value: vendorCost, type: "cost" as const },
    { label: "Operational Expenses", value: operationalExpenses, type: "cost" as const },
    { label: "Net Profit", value: profit, type: "profit" as const },
  ];

  return (
    <div className="rounded-xl border bg-card shadow-card">
      <div className="flex items-center justify-between p-5 border-b">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-foreground">Profit & Margin</h3>
              {isFiltered && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  Filtered
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Current period overview</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <ArrowUpRight className="h-4 w-4 text-success" />
          <span className="font-medium text-success">{margin}% margin</span>
        </div>
      </div>

      <div className="p-5">
        <div className="space-y-4">
          {profitData.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className={cn(
                  "font-semibold font-display",
                  item.type === "revenue" && "text-foreground",
                  item.type === "cost" && "text-muted-foreground",
                  item.type === "profit" && (item.value >= 0 ? "text-success" : "text-destructive")
                )}>
                  {item.type === "cost" ? "-" : ""}{formatCurrency(Math.abs(item.value))}
                </span>
              </div>
              {item.type !== "profit" && revenue > 0 && (
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      item.type === "revenue" && "bg-primary",
                      item.type === "cost" && "bg-muted-foreground/40"
                    )}
                    style={{ width: `${Math.min((item.value / revenue) * 100, 100)}%` }}
                  />
                </div>
              )}
              {item.type === "profit" && revenue > 0 && (
                <div className={cn(
                  "h-3 rounded-full overflow-hidden",
                  item.value >= 0 ? "bg-success/20" : "bg-destructive/20"
                )}>
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      item.value >= 0 ? "bg-success" : "bg-destructive"
                    )}
                    style={{ width: `${Math.min(Math.abs((item.value / revenue) * 100), 100)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4">
            <div className={cn(
              "text-center p-3 rounded-lg",
              profit >= 0 ? "bg-success-light" : "bg-destructive-light"
            )}>
              <p className={cn("text-xs mb-1", profit >= 0 ? "text-success-foreground" : "text-destructive")}>Net Profit</p>
              <p className={cn("text-xl font-semibold font-display", profit >= 0 ? "text-success" : "text-destructive")}>
                {formatCurrency(Math.abs(profit))}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary-light">
              <p className="text-xs text-primary mb-1">Profit Margin</p>
              <p className="text-xl font-semibold font-display text-primary">{margin}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitMarginSection;
