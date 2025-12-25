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
import { cn } from "@/lib/utils";

interface ClientPO {
  id: string;
  client: string;
  project: string;
  piNo: string;
  poNo: string;
  poValue: number;
  receivable: number;
  paymentStatus: "paid" | "partial" | "pending" | "overdue";
  status: "draft" | "active" | "completed";
}

const mockData: ClientPO[] = [
  {
    id: "1",
    client: "Acme Corporation",
    project: "Retail Expansion Q1",
    piNo: "PI-2024-001",
    poNo: "CPO-2024-0012",
    poValue: 1250000,
    receivable: 450000,
    paymentStatus: "partial",
    status: "active",
  },
  {
    id: "2",
    client: "Globex Industries",
    project: "Warehouse Setup",
    piNo: "PI-2024-002",
    poNo: "CPO-2024-0013",
    poValue: 890000,
    receivable: 890000,
    paymentStatus: "pending",
    status: "active",
  },
  {
    id: "3",
    client: "Initech Solutions",
    project: "Office Renovation",
    piNo: "PI-2024-003",
    poNo: "CPO-2024-0014",
    poValue: 675000,
    receivable: 0,
    paymentStatus: "paid",
    status: "completed",
  },
  {
    id: "4",
    client: "Massive Dynamic",
    project: "Store Fit-out",
    piNo: "PI-2024-004",
    poNo: "CPO-2024-0015",
    poValue: 2100000,
    receivable: 2100000,
    paymentStatus: "overdue",
    status: "active",
  },
  {
    id: "5",
    client: "Stark Industries",
    project: "Lab Equipment",
    piNo: "PI-2024-005",
    poNo: "CPO-2024-0016",
    poValue: 450000,
    receivable: 225000,
    paymentStatus: "partial",
    status: "active",
  },
];

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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleRowClick = (po: ClientPO) => {
    setSelectedId(po.id);
    onSelectPO?.(po);
  };

  return (
    <div className="rounded-xl border bg-card shadow-card opacity-0 animate-fade-in" style={{ animationDelay: "400ms" }}>
      <div className="flex items-center justify-between p-5 border-b">
        <div>
          <h3 className="font-display font-semibold text-foreground">Client Purchase Orders</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Track receivables and payment status</p>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          View All
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <div className="overflow-x-auto">
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
            {mockData.map((po) => (
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
      </div>
    </div>
  );
};

export default ClientPOTable;
