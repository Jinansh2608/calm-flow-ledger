import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/contexts/DashboardContext";
import { cn } from "@/lib/utils";
import { RefreshCw, Download } from "lucide-react";

const formatCurrency = (value: number) => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
};

export function PMLDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { filteredClientPOs, filteredVendorPOs, projects, filteredPayments, refreshData } = useDashboard();
  const [selectedTab, setSelectedTab] = useState("transactions");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      handleRefresh();
    }
  }, [open]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await refreshData(true);
    } finally {
      setIsLoading(false);
    }
  };

  const projectStats = (projects || []).map((project) => {
    const projectClientPOs = (filteredClientPOs || []).filter((po) =>
      po.project === project.name || po.projectId === project.id || po.project_name === project.name
    );

    const projectVendorPOs = (filteredVendorPOs || []).filter((vpo) => vpo.projectId === project.id);

    const projectPayments = (filteredPayments || []).filter((p) => {
      const paymentPO = (filteredClientPOs || []).find((po) =>
        (po.poIds && Array.isArray(po.poIds) && po.poIds.includes(Number(p.po_id))) ||
        (po.id && Number(po.id) === Number(p.po_id)) || 
        (po._original?.id && p.po_id === po._original.id)
      );
      return paymentPO && (paymentPO.projectId === project.id || paymentPO.project === project.name);
    });

    const creditPayments = projectPayments.filter((p) => p.transaction_type === "credit");
    const totalCredit = creditPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const debitPayments = projectPayments.filter((p) => p.transaction_type === "debit");
    const totalDebit = debitPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const netProfit = totalCredit - totalDebit;

    return {
      id: project.id,
      name: project.name,
      credit: totalCredit,
      debit: totalDebit,
      profit: netProfit,
      poCount: projectClientPOs.length,
      paymentCount: projectPayments.length,
    };
  }).filter((p) => p.credit > 0 || p.debit > 0 || p.paymentCount > 0);

  const totalCredit = projectStats.reduce((sum, p) => sum + p.credit, 0);
  const totalDebit = projectStats.reduce((sum, p) => sum + p.debit, 0);
  const totalProfit = projectStats.reduce((sum, p) => sum + p.profit, 0);

  const incomePayments = (filteredPayments || []).filter((p) => p.transaction_type === "credit");
  const expensePayments = (filteredPayments || []).filter((p) => p.transaction_type === "debit");
  const totalIncome = incomePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalExpense = expensePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const transactionNetProfit = totalIncome - totalExpense;

  const exportToCSV = () => {
    const headers = ["Type", "Date", "Payment Mode", "Reference", "Amount", "Status", "Notes"];
    const rows = filteredPayments
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
      .map((p) => [
        p.transaction_type === "credit" ? "Income" : "Expense",
        p.payment_date,
        p.payment_mode || "",
        p.reference_number || "-",
        p.amount || 0,
        p.status || "",
        p.notes || "",
      ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toISOString().split("T")[0];
    a.download = `ledger-${dateStr}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-5xl bg-card shadow-2xl overflow-hidden p-6 premium-gradient border-border/40">
        <div className="mb-4 flex flex-row items-center justify-between gap-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Accounting Ledger</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions">Transaction Details</TabsTrigger>
            <TabsTrigger value="summary">Project Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-1">Total Income</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totalIncome)}
                  </p>
                  <p className="text-[10px] font-medium text-emerald-600/70 mt-1 uppercase tracking-widest">{incomePayments.length} transactions</p>
                </div>
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <p className="text-xs font-black uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-1">Total Expense</p>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                    {formatCurrency(totalExpense)}
                  </p>
                  <p className="text-[10px] font-medium text-rose-600/70 mt-1 uppercase tracking-widest">{expensePayments.length} transactions</p>
                </div>
                <div
                  className={cn(
                    "p-4 rounded-xl border transition-colors",
                    transactionNetProfit >= 0
                      ? "bg-primary/10 border-primary/20"
                      : "bg-rose-500/10 border-rose-500/20"
                  )}
                >
                  <p
                    className={cn(
                      "text-xs font-black uppercase tracking-wider mb-1",
                      transactionNetProfit >= 0 ? "text-primary" : "text-rose-800 dark:text-rose-300"
                    )}
                  >
                    Net Profit
                  </p>
                  <p
                    className={cn(
                      "text-2xl font-bold font-display tracking-tight",
                      transactionNetProfit >= 0 ? "text-primary" : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {formatCurrency(transactionNetProfit)}
                  </p>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden max-h-96 flex flex-col">
                <div className="overflow-auto flex-1">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Type</th>
                        <th className="px-4 py-3 text-left font-medium">Date</th>
                        <th className="px-4 py-3 text-left font-medium">Mode</th>
                        <th className="px-4 py-3 text-left font-medium">Reference</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredPayments && filteredPayments.length > 0 ? (
                        filteredPayments
                          .slice()
                          .sort((a, b) => {
                            const dateA = a.payment_date ? new Date(a.payment_date).getTime() : 0;
                            const dateB = b.payment_date ? new Date(b.payment_date).getTime() : 0;
                            return dateB - dateA;
                          })
                          .map((payment, idx) => {
                            const isCredit = payment.transaction_type === "credit";
                            return (
                              <tr
                                key={payment.id || idx}
                                className={cn(
                                  "hover:bg-muted transition-colors",
                                  isCredit 
                                    ? "bg-emerald-500/5 hover:bg-emerald-500/10" 
                                    : "bg-rose-500/5 hover:bg-rose-500/10"
                                )}
                              >
                                <td className="px-4 py-3">
                                  <span
                                    className={cn(
                                      "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                                      isCredit
                                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                        : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                                    )}
                                  >
                                    {isCredit ? "Income" : "Expense"}
                                  </span>
                                </td>
                                <td className="px-4 py-3">{payment.payment_date}</td>
                                <td className="px-4 py-3 capitalize">{payment.payment_mode || "-"}</td>
                                <td className="px-4 py-3 text-xs font-mono">{payment.reference_number || "-"}</td>
                                <td className="px-4 py-3">
                                  <span
                                    className={cn(
                                      "text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest",
                                      payment.status === "cleared" || payment.status === "completed"
                                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                        : payment.status === "pending"
                                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                        : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                                    )}
                                  >
                                    {payment.status}
                                  </span>
                                </td>
                                <td
                                  className={cn(
                                    "px-4 py-3 text-right font-medium",
                                    isCredit ? "text-green-700" : "text-red-700"
                                  )}
                                >
                                  {formatCurrency(payment.amount)}
                                </td>
                              </tr>
                            );
                          })
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-muted-foreground">
                            No transactions recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="summary" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                  <p className="text-sm font-medium text-green-900 mb-1">Total Credit</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(totalCredit)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">{projectStats.length} projects</p>
                </div>
                <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-sm font-medium text-red-900 mb-1">Total Debit</p>
                  <p className="text-2xl font-bold text-red-700">
                    {formatCurrency(totalDebit)}
                  </p>
                  <p className="text-xs text-red-600 mt-1">Vendor costs</p>
                </div>
                <div
                  className={cn(
                    "p-4 rounded-xl border transition-colors",
                    totalProfit >= 0 ? "bg-primary/10 border-primary/20" : "bg-rose-500/10 border-rose-500/20"
                  )}
                >
                  <p
                    className={cn(
                      "text-xs font-black uppercase tracking-wider mb-1",
                      totalProfit >= 0 ? "text-primary" : "text-rose-800 dark:text-rose-300"
                    )}
                  >
                    Net Profit
                  </p>
                  <p
                    className={cn(
                      "text-2xl font-bold font-display tracking-tight",
                      totalProfit >= 0 ? "text-primary" : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {formatCurrency(totalProfit)}
                  </p>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden max-h-96 flex flex-col">
                <div className="overflow-auto flex-1">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Project</th>
                        <th className="px-4 py-3 text-center font-medium">POs</th>
                        <th className="px-4 py-3 text-center font-medium">Payments</th>
                        <th className="px-4 py-3 text-right font-medium">Credit</th>
                        <th className="px-4 py-3 text-right font-medium">Debit</th>
                        <th className="px-4 py-3 text-right font-medium">Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {projectStats.length > 0 ? (
                        <>
                           {projectStats.map((stat) => (
                            <tr key={stat.id} className="hover:bg-muted/50 transition-colors">
                              <td className="px-4 py-3 font-medium">{stat.name}</td>
                              <td className="px-4 py-3 text-center">{stat.poCount}</td>
                              <td className="px-4 py-3 text-center">{stat.paymentCount}</td>
                              <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">{formatCurrency(stat.credit)}</td>
                              <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400 font-medium">{formatCurrency(stat.debit)}</td>
                              <td
                                className={cn(
                                  "px-4 py-3 text-right font-bold text-base font-display",
                                  stat.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                )}
                              >
                                {formatCurrency(stat.profit)}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-muted/30 font-bold border-t-2 border-border/60">
                            <td className="px-4 py-3">Total</td>
                            <td className="px-4 py-3 text-center">
                              {projectStats.reduce((s, p) => s + p.poCount, 0)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {projectStats.reduce((s, p) => s + p.paymentCount, 0)}
                            </td>
                            <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(totalCredit)}</td>
                            <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400">{formatCurrency(totalDebit)}</td>
                            <td
                              className={cn(
                                "px-4 py-3 text-right font-display text-base",
                                totalProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                              )}
                            >
                              {formatCurrency(totalProfit)}
                            </td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-muted-foreground">
                            No project data available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
