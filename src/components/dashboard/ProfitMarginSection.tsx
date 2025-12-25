import { TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfitItem {
  label: string;
  value: number;
  type: "revenue" | "cost" | "profit";
}

const profitData: ProfitItem[] = [
  { label: "Client PO Total", value: 4520000, type: "revenue" },
  { label: "Total Vendor Cost", value: 3280000, type: "cost" },
  { label: "Operational Expenses", value: 420000, type: "cost" },
  { label: "Net Profit", value: 820000, type: "profit" },
];

const formatCurrency = (value: number) => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
};

const ProfitMarginSection = () => {
  const revenue = profitData.find(d => d.type === "revenue")?.value || 0;
  const profit = profitData.find(d => d.type === "profit")?.value || 0;
  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0";

  return (
    <div className="rounded-xl border bg-card shadow-card opacity-0 animate-fade-in" style={{ animationDelay: "600ms" }}>
      <div className="flex items-center justify-between p-5 border-b">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Profit & Margin</h3>
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
          {profitData.map((item, index) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className={cn(
                  "font-semibold font-display",
                  item.type === "revenue" && "text-foreground",
                  item.type === "cost" && "text-muted-foreground",
                  item.type === "profit" && "text-success"
                )}>
                  {item.type === "cost" ? "-" : ""}{formatCurrency(item.value)}
                </span>
              </div>
              {item.type !== "profit" && (
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      item.type === "revenue" && "bg-primary",
                      item.type === "cost" && "bg-muted-foreground/40"
                    )}
                    style={{ width: `${(item.value / revenue) * 100}%` }}
                  />
                </div>
              )}
              {item.type === "profit" && (
                <div className="h-3 rounded-full bg-success/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-success transition-all duration-500"
                    style={{ width: `${(item.value / revenue) * 100}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-success-light">
              <p className="text-xs text-success-foreground mb-1">Net Profit</p>
              <p className="text-xl font-semibold font-display text-success">{formatCurrency(profit)}</p>
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
