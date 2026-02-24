import { useState } from "react";
import { TrendingUp, ArrowUpRight, List, TrendingDown } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PMLDialog } from "./PMLDialog";

const formatCurrency = (value: number) => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
};

const ProfitMarginSection = () => {
  const { summaryData, isFiltered, filteredPayments } = useDashboard();
  
  // Calculate Income (Payments with transaction_type: 'credit')
  const income = filteredPayments
    .filter(p => p.transaction_type === 'credit')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  
  // Calculate Expense (Payments with transaction_type: 'debit')
  const expense = filteredPayments
    .filter(p => p.transaction_type === 'debit')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  
  // Use real backend P&L data with fallbacks
  const revenue = income || (summaryData.dynamicRevenue || summaryData.totalClientPOValue);
  const vendorCost = expense || (summaryData.dynamicCost || summaryData.totalVendorPOValue);
  const profit = income - expense;
  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0";

  const profitData = [
    { label: "Total Income", value: income, type: "income" as const },
    { label: "Total Expense", value: expense, type: "expense" as const },
    { label: "Net Profit", value: profit, type: "profit" as const },
  ];

  const [isPMLOpen, setIsPMLOpen] = useState(false);

  return (
    <div className="rounded-xl border bg-card shadow-card overflow-hidden premium-gradient">
      <div className="flex items-center justify-between p-5 border-b glass-panel">
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
        <div className="flex items-center gap-3 text-sm">
          <Button variant="outline" size="sm" onClick={() => setIsPMLOpen(true)} className="gap-2 h-8 font-medium">
             <List className="w-4 h-4" /> View Ledger
          </Button>
          <div className="flex items-center gap-1.5 border-l pl-3">
            <ArrowUpRight className="h-4 w-4 text-success" />
            <span className="font-medium text-success">{margin}% margin</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="space-y-4">
          {profitData.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  {item.type === 'income' && (
                    <span className="inline-block px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-success/10 text-success rounded">
                      Credit
                    </span>
                  )}
                  {item.type === 'expense' && (
                    <span className="inline-block px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-destructive/10 text-destructive rounded">
                      Debit
                    </span>
                  )}
                </div>
                <span className={cn(
                  "font-semibold font-display",
                  item.type === "income" && "text-success",
                  item.type === "expense" && "text-destructive",
                  item.type === "profit" && (item.value >= 0 ? "text-success" : "text-destructive")
                )}>
                  {item.type === "expense" ? "-" : ""}{formatCurrency(Math.abs(item.value))}
                </span>
              </div>
              {item.type !== "profit" && revenue > 0 && (
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      item.type === "income" && "bg-success",
                      item.type === "expense" && "bg-destructive"
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
              profit >= 0 ? "bg-success/10" : "bg-destructive/10"
            )}>
              <p className={cn("text-xs mb-1 font-medium", profit >= 0 ? "text-success-foreground" : "text-destructive")}>Net Profit</p>
              <p className={cn("text-xl font-semibold font-display", profit >= 0 ? "text-success" : "text-destructive")}>
                {formatCurrency(Math.abs(profit))}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/10">
              <p className="text-xs text-primary mb-1 font-medium">Profit Margin</p>
              <p className="text-xl font-semibold font-display text-primary">{margin}%</p>
            </div>
          </div>
        </div>
      </div>

      <PMLDialog open={isPMLOpen} onClose={() => setIsPMLOpen(false)} />
    </div>
  );
};

export default ProfitMarginSection;
