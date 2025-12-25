import { useState } from "react";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboard, ClientPO } from "@/contexts/DashboardContext";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
};

const paymentStatusConfig = {
  paid: { label: "Paid", variant: "success" as const },
  partial: { label: "Partial", variant: "warning" as const },
  pending: { label: "Pending", variant: "secondary" as const },
  overdue: { label: "Overdue", variant: "destructive" as const },
};

const statusConfig = {
  draft: { label: "Draft", variant: "secondary" as const },
  active: { label: "Active", variant: "primary" as const },
  completed: { label: "Completed", variant: "success" as const },
};

interface ClientPOTableProps {
  onSelectPO?: (po: ClientPO) => void;
}

const ClientPOTable = ({ onSelectPO }: ClientPOTableProps) => {
  const { filteredClientPOs, isFiltered } = useDashboard();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleRowClick = (po: ClientPO) => {
    setSelectedId(po.id);
    onSelectPO?.(po);
  };

  return (
    <div className="rounded-xl border bg-card shadow-card">
      <div className="flex items-center justify-between p-5 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-foreground">Client Purchase Orders</h3>
            {isFiltered && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                Filtered
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filteredClientPOs.length} order{filteredClientPOs.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          View All
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        {filteredClientPOs.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium text-muted-foreground">Client</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Project</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">PI No</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">PO No</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground text-right">PO Value</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground text-right">Receivable</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Payment</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientPOs.map((po) => (
                <TableRow
                  key={po.id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedId === po.id && "bg-primary-light"
                  )}
                  onClick={() => handleRowClick(po)}
                >
                  <TableCell className="font-medium text-foreground">{po.client}</TableCell>
                  <TableCell className="text-muted-foreground">{po.project}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{po.piNo}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{po.poNo}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(po.poValue)}</TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      "font-medium",
                      po.receivable > 0 ? "text-warning" : "text-success"
                    )}>
                      {formatCurrency(po.receivable)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={paymentStatusConfig[po.paymentStatus].variant}>
                      {paymentStatusConfig[po.paymentStatus].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[po.status].variant}>
                      {statusConfig[po.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No orders found</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientPOTable;
