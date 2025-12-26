import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface DetailItem {
  label: string;
  value: string;
  subtext?: string;
  highlight?: boolean;
}

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  variant?: "default" | "success" | "warning" | "primary";
  className?: string;
  delay?: number;
  details?: {
    title: string;
    description?: string;
    items: DetailItem[];
    breakdown?: { label: string; value: string; percentage?: number }[];
  };
}

const SummaryCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
  className,
  delay = 0,
  details,
}: SummaryCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const variantStyles = {
    default: "bg-card hover:bg-card/80",
    success: "bg-success-light border-success/20 hover:bg-success-light/80",
    warning: "bg-warning-light border-warning/20 hover:bg-warning-light/80",
    primary: "bg-primary-light border-primary/20 hover:bg-primary-light/80",
  };

  const iconStyles = {
    default: "bg-muted text-muted-foreground",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    primary: "bg-primary/10 text-primary",
  };

  const accentColors = {
    default: "text-primary",
    success: "text-success",
    warning: "text-warning",
    primary: "text-primary",
  };

  const handleClick = () => {
    if (details) {
      setIsOpen(true);
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        className={cn(
          "rounded-xl border p-5 shadow-card transition-all duration-300 hover:shadow-soft",
          details && "cursor-pointer group",
          variantStyles[variant],
          className
        )}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold font-display tracking-tight text-foreground">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-transform",
                details && "group-hover:scale-110",
                iconStyles[variant]
              )}
            >
              {icon}
            </div>
            {details && (
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1.5">
            <span
              className={cn(
                "text-xs font-medium",
                trend.positive ? "text-success" : "text-destructive"
              )}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </span>
            <span className="text-xs text-muted-foreground">vs last month</span>
          </div>
        )}
      </div>

      {details && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", iconStyles[variant])}>
                  {icon}
                </div>
                <div>
                  <span className="font-display">{details.title}</span>
                  {details.description && (
                    <p className="text-sm font-normal text-muted-foreground mt-0.5">{details.description}</p>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              {/* Main Value */}
              <div className="text-center py-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold font-display text-foreground">{value}</p>
                <p className="text-sm text-muted-foreground mt-1">{title}</p>
              </div>

              {/* Detail Items */}
              <div className="space-y-3">
                {details.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      {item.subtext && (
                        <p className="text-xs text-muted-foreground">{item.subtext}</p>
                      )}
                    </div>
                    <span className={cn(
                      "text-sm font-semibold",
                      item.highlight ? accentColors[variant] : "text-foreground"
                    )}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              {details.breakdown && details.breakdown.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Breakdown</p>
                    {details.breakdown.map((item, index) => (
                      <div key={index} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-medium text-foreground">{item.value}</span>
                        </div>
                        {item.percentage !== undefined && (
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div 
                              className={cn("h-full rounded-full transition-all", 
                                variant === "success" ? "bg-success" :
                                variant === "warning" ? "bg-warning" :
                                "bg-primary"
                              )}
                              style={{ width: `${Math.min(item.percentage, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {trend && (
                <>
                  <Separator />
                  <div className="flex items-center justify-center gap-2 py-2">
                    <span className={cn(
                      "text-sm font-medium",
                      trend.positive ? "text-success" : "text-destructive"
                    )}>
                      {trend.positive ? "↑" : "↓"} {trend.value}
                    </span>
                    <span className="text-sm text-muted-foreground">compared to last month</span>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default SummaryCard;
