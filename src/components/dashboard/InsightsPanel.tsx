import { Lightbulb, TrendingDown, Clock, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Insight {
  id: string;
  type: "info" | "warning" | "success" | "alert";
  title: string;
  description: string;
}

const insights: Insight[] = [
  {
    id: "1",
    type: "warning",
    title: "Vendor costs above plan",
    description: "Vendor costs for Retail Expansion are 12% higher than budgeted.",
  },
  {
    id: "2",
    type: "alert",
    title: "Payment overdue",
    description: "Massive Dynamic payment is overdue by 15 days. Amount: ₹21L",
  },
  {
    id: "3",
    type: "info",
    title: "Below average margin",
    description: "Warehouse Setup project margin is 8% below your average.",
  },
  {
    id: "4",
    type: "success",
    title: "Payment received",
    description: "Initech Solutions cleared ₹6.75L payment today.",
  },
];

const iconMap = {
  info: Info,
  warning: TrendingDown,
  success: CheckCircle2,
  alert: Clock,
};

const styleMap = {
  info: {
    container: "bg-primary-light border-primary/20",
    icon: "bg-primary/10 text-primary",
  },
  warning: {
    container: "bg-warning-light border-warning/20",
    icon: "bg-warning/10 text-warning",
  },
  success: {
    container: "bg-success-light border-success/20",
    icon: "bg-success/10 text-success",
  },
  alert: {
    container: "bg-destructive-light border-destructive/20",
    icon: "bg-destructive/10 text-destructive",
  },
};

const InsightsPanel = () => {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card shadow-card p-5 opacity-0 animate-slide-in-right" style={{ animationDelay: "200ms" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Lightbulb className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Insights</h3>
            <p className="text-xs text-muted-foreground">AI-powered observations</p>
          </div>
        </div>

        <div className="space-y-3">
          {insights.map((insight, index) => {
            const Icon = iconMap[insight.type];
            const styles = styleMap[insight.type];
            
            return (
              <div
                key={insight.id}
                className={cn(
                  "rounded-lg border p-3 transition-all hover:shadow-soft opacity-0 animate-slide-in-right",
                  styles.container
                )}
                style={{ animationDelay: `${300 + index * 100}ms` }}
              >
                <div className="flex gap-3">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0", styles.icon)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{insight.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Issues & Alerts Section */}
      <div className="rounded-xl border bg-card shadow-card p-5 opacity-0 animate-slide-in-right" style={{ animationDelay: "700ms" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Issues & Alerts</h3>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </div>
        </div>

        <div className="space-y-2">
          <IssueItem
            label="Overdue Payments"
            count={3}
            variant="destructive"
          />
          <IssueItem
            label="Missing Invoices"
            count={5}
            variant="warning"
          />
          <IssueItem
            label="Cost Overruns"
            count={2}
            variant="warning"
          />
          <IssueItem
            label="Pending Approvals"
            count={8}
            variant="info"
          />
        </div>
      </div>
    </div>
  );
};

interface IssueItemProps {
  label: string;
  count: number;
  variant: "destructive" | "warning" | "info";
}

const IssueItem = ({ label, count, variant }: IssueItemProps) => {
  const variantStyles = {
    destructive: "bg-destructive text-destructive-foreground",
    warning: "bg-warning text-warning-foreground",
    info: "bg-primary text-primary-foreground",
  };

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn(
        "text-xs font-medium px-2 py-0.5 rounded-full",
        variantStyles[variant]
      )}>
        {count}
      </span>
    </div>
  );
};

export default InsightsPanel;
