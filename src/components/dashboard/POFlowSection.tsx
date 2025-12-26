import { useState } from "react";
import { ArrowRight, FileText, Package, Truck, CreditCard, TrendingUp, ChevronRight } from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const formatValue = (value: number) => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
};

interface FlowStep {
  label: string;
  count: number;
  value: string;
  icon: JSX.Element;
  status: "complete" | "active" | "pending";
  details?: {
    title: string;
    items: { label: string; value: string; status?: string }[];
  };
}

const POFlowSection = () => {
  const { flowData, filteredClientPOs, filteredVendorPOs } = useDashboard();
  const [selectedStep, setSelectedStep] = useState<FlowStep | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const flowSteps: FlowStep[] = [
    {
      label: "Client PI",
      count: flowData.clientPI.count,
      value: formatValue(flowData.clientPI.value),
      icon: <FileText className="h-4 w-4" />,
      status: "complete",
      details: {
        title: "Client Proforma Invoices",
        items: filteredClientPOs.map(po => ({
          label: po.piNo,
          value: formatValue(po.poValue * 1.07),
          status: po.status
        }))
      }
    },
    {
      label: "Client PO",
      count: flowData.clientPO.count,
      value: formatValue(flowData.clientPO.value),
      icon: <Package className="h-4 w-4" />,
      status: "complete",
      details: {
        title: "Client Purchase Orders",
        items: filteredClientPOs.map(po => ({
          label: `${po.poNo} - ${po.client}`,
          value: formatValue(po.poValue),
          status: po.status
        }))
      }
    },
    {
      label: "Vendor PO",
      count: flowData.vendorPO.count,
      value: formatValue(flowData.vendorPO.value),
      icon: <Truck className="h-4 w-4" />,
      status: "active",
      details: {
        title: "Vendor Purchase Orders",
        items: filteredVendorPOs.map(vpo => ({
          label: vpo.vendor,
          value: formatValue(vpo.poValue),
          status: vpo.paymentStatus
        }))
      }
    },
    {
      label: "Execution",
      count: flowData.execution.count,
      value: `${flowData.execution.percentage}%`,
      icon: <Package className="h-4 w-4" />,
      status: "active",
      details: {
        title: "Execution Progress",
        items: filteredVendorPOs.map(vpo => ({
          label: vpo.vendor,
          value: `${vpo.progress}%`,
          status: vpo.progress === 100 ? "completed" : vpo.progress > 50 ? "active" : "pending"
        }))
      }
    },
    {
      label: "Payment",
      count: flowData.payment.count,
      value: formatValue(flowData.payment.value),
      icon: <CreditCard className="h-4 w-4" />,
      status: "pending",
      details: {
        title: "Payment Status",
        items: filteredClientPOs.map(po => ({
          label: `${po.poNo}`,
          value: formatValue(po.poValue - po.receivable),
          status: po.paymentStatus
        }))
      }
    },
    {
      label: "Profit",
      count: flowData.profit.count,
      value: formatValue(flowData.profit.value),
      icon: <TrendingUp className="h-4 w-4" />,
      status: "pending",
      details: {
        title: "Profit Summary",
        items: [
          { label: "Total Revenue", value: formatValue(flowData.clientPO.value) },
          { label: "Total Vendor Cost", value: formatValue(flowData.vendorPO.value) },
          { label: "Operational Cost (5%)", value: formatValue(flowData.clientPO.value * 0.05) },
          { label: "Net Profit", value: formatValue(flowData.profit.value), status: "success" },
        ]
      }
    },
  ];

  const handleStepClick = (step: FlowStep) => {
    if (step.details) {
      setSelectedStep(step);
      setDialogOpen(true);
    }
  };

  const statusColors = {
    complete: "text-success",
    active: "text-primary",
    pending: "text-muted-foreground",
    completed: "text-success",
    partial: "text-warning",
    paid: "text-success",
    overdue: "text-destructive",
    success: "text-success",
  };

  return (
    <>
      <div className="rounded-xl border bg-card p-5 shadow-card">
        <h3 className="font-display font-semibold text-foreground mb-4">Project & PO Flow</h3>
        
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {flowSteps.map((step, index) => (
            <div key={step.label} className="flex items-center">
              <div 
                className="flex flex-col items-center min-w-[100px] cursor-pointer group"
                onClick={() => handleStepClick(step)}
              >
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl mb-2 transition-all group-hover:scale-110",
                    step.status === "complete" && "bg-success/10 text-success",
                    step.status === "active" && "bg-primary/10 text-primary ring-2 ring-primary/20",
                    step.status === "pending" && "bg-muted text-muted-foreground"
                  )}
                >
                  {step.icon}
                </div>
                <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">{step.label}</span>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                selectedStep?.status === "complete" && "bg-success/10 text-success",
                selectedStep?.status === "active" && "bg-primary/10 text-primary",
                selectedStep?.status === "pending" && "bg-muted text-muted-foreground"
              )}>
                {selectedStep?.icon}
              </div>
              <div>
                <span className="font-display">{selectedStep?.details?.title}</span>
                <p className="text-sm font-normal text-muted-foreground mt-0.5">
                  {selectedStep?.count} item{selectedStep?.count !== 1 ? 's' : ''} • {selectedStep?.value}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
            {selectedStep?.details?.items.map((item, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <span className="text-sm font-medium text-foreground truncate flex-1 mr-3">{item.label}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    "text-sm font-semibold",
                    item.status ? statusColors[item.status as keyof typeof statusColors] || "text-foreground" : "text-foreground"
                  )}>
                    {item.value}
                  </span>
                  {item.status && (
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full capitalize",
                      item.status === "completed" || item.status === "complete" || item.status === "paid" || item.status === "success"
                        ? "bg-success/10 text-success" 
                        : item.status === "active" || item.status === "partial"
                        ? "bg-warning/10 text-warning"
                        : item.status === "overdue"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {item.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default POFlowSection;
