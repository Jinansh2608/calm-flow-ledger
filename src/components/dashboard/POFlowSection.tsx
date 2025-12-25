import { ArrowRight, FileText, Package, Truck, CreditCard, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlowStep {
  label: string;
  count: number;
  value: string;
  icon: React.ReactNode;
  status: "complete" | "active" | "pending";
}

const flowSteps: FlowStep[] = [
  {
    label: "Client PI",
    count: 24,
    value: "₹48.5L",
    icon: <FileText className="h-4 w-4" />,
    status: "complete",
  },
  {
    label: "Client PO",
    count: 22,
    value: "₹45.2L",
    icon: <Package className="h-4 w-4" />,
    status: "complete",
  },
  {
    label: "Vendor PO",
    count: 38,
    value: "₹32.8L",
    icon: <Truck className="h-4 w-4" />,
    status: "active",
  },
  {
    label: "Execution",
    count: 18,
    value: "78%",
    icon: <Package className="h-4 w-4" />,
    status: "active",
  },
  {
    label: "Payment",
    count: 15,
    value: "₹28.4L",
    icon: <CreditCard className="h-4 w-4" />,
    status: "pending",
  },
  {
    label: "Profit",
    count: 12,
    value: "₹8.2L",
    icon: <TrendingUp className="h-4 w-4" />,
    status: "pending",
  },
];

const POFlowSection = () => {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
      <h3 className="font-display font-semibold text-foreground mb-4">Project & PO Flow</h3>
      
      <div className="flex items-center justify-between overflow-x-auto pb-2">
        {flowSteps.map((step, index) => (
          <div key={step.label} className="flex items-center">
            <div
              className={cn(
                "flex flex-col items-center min-w-[100px]",
              )}
            >
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
