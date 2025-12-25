import { ArrowRight, FileText, Package, Truck, CreditCard, TrendingUp } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";
import { cn } from "@/lib/utils";

const formatValue = (value: number) => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
};

const POFlowSection = () => {
  const { flowData } = useDashboard();

  const flowSteps = [
    {
      label: "Client PI",
      count: flowData.clientPI.count,
      value: formatValue(flowData.clientPI.value),
      icon: <FileText className="h-4 w-4" />,
      status: "complete" as const,
    },
    {
      label: "Client PO",
      count: flowData.clientPO.count,
      value: formatValue(flowData.clientPO.value),
      icon: <Package className="h-4 w-4" />,
      status: "complete" as const,
    },
    {
      label: "Vendor PO",
      count: flowData.vendorPO.count,
      value: formatValue(flowData.vendorPO.value),
      icon: <Truck className="h-4 w-4" />,
      status: "active" as const,
    },
    {
      label: "Execution",
      count: flowData.execution.count,
      value: `${flowData.execution.percentage}%`,
      icon: <Package className="h-4 w-4" />,
      status: "active" as const,
    },
    {
      label: "Payment",
      count: flowData.payment.count,
      value: formatValue(flowData.payment.value),
      icon: <CreditCard className="h-4 w-4" />,
      status: "pending" as const,
    },
    {
      label: "Profit",
      count: flowData.profit.count,
      value: formatValue(flowData.profit.value),
      icon: <TrendingUp className="h-4 w-4" />,
      status: "pending" as const,
    },
  ];

  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <h3 className="font-display font-semibold text-foreground mb-4">Project & PO Flow</h3>
      
      <div className="flex items-center justify-between overflow-x-auto pb-2">
        {flowSteps.map((step, index) => (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center min-w-[100px]">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl mb-2 transition-all",
                  step.status === "complete" && "bg-success/10 text-success",
                  step.status === "active" && "bg-primary/10 text-primary ring-2 ring-primary/20",
                  step.status === "pending" && "bg-muted text-muted-foreground"
                )}
              >
                {step.icon}
              </div>
              <span className="text-xs font-medium text-foreground">{step.label}</span>
              <span className="text-lg font-semibold font-display text-foreground mt-0.5">{step.value}</span>
              <span className="text-[10px] text-muted-foreground">{step.count} items</span>
            </div>
            
            {index < flowSteps.length - 1 && (
              <ArrowRight className="h-4 w-4 text-muted-foreground/50 mx-2 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default POFlowSection;
