import { X, FileText, Building2, Truck, CreditCard, Clock, Paperclip, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  data?: {
    client: string;
    project: string;
    piNo: string;
    poNo: string;
    poValue: number;
    receivable: number;
    paymentStatus: string;
    status: string;
  };
}

const DetailDrawer = ({ open, onClose, data }: DetailDrawerProps) => {
  if (!data) return null;

  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`;
    }
    return `₹${value.toLocaleString("en-IN")}`;
  };

  const vendorOrders = [
    { vendor: "Alpha Supplies", value: 180000, status: "In Progress" },
    { vendor: "Beta Materials", value: 120000, status: "Completed" },
    { vendor: "Gamma Services", value: 95000, status: "Pending" },
  ];

  const timeline = [
    { date: "Jan 15, 2024", event: "PI Created", type: "create" },
    { date: "Jan 18, 2024", event: "Client PO Received", type: "document" },
    { date: "Jan 22, 2024", event: "Vendor PO Issued", type: "vendor" },
    { date: "Feb 01, 2024", event: "Partial Payment Received", type: "payment" },
    { date: "Feb 10, 2024", event: "Execution Started", type: "progress" },
  ];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="font-display text-lg">{data.client}</SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">{data.project}</p>
            </div>
            <Badge variant={data.status === "active" ? "default" : "secondary"}>
              {data.status}
            </Badge>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)]">
          <div className="p-6 space-y-6">
            {/* Client Details */}
            <section>
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Client Details
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PI Number</span>
                  <span className="font-mono">{data.piNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PO Number</span>
                  <span className="font-mono">{data.poNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PO Value</span>
                  <span className="font-semibold">{formatCurrency(data.poValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receivable</span>
                  <span className={cn("font-semibold", data.receivable > 0 ? "text-warning" : "text-success")}>
                    {formatCurrency(data.receivable)}
                  </span>
                </div>
              </div>
            </section>

            <Separator />

            {/* Vendor Orders */}
            <section>
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                Vendor Orders
              </h4>
              <div className="space-y-2">
                {vendorOrders.map((order, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{order.vendor}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(order.value)}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {order.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            {/* Payment Timeline */}
            <section>
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Timeline
              </h4>
              <div className="relative pl-4 border-l-2 border-muted space-y-4">
                {timeline.map((item, index) => (
                  <div key={index} className="relative">
                    <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-primary border-2 border-background" />
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                    <p className="text-sm font-medium">{item.event}</p>
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            {/* Profit Breakdown */}
            <section>
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Profit Breakdown
              </h4>
              <div className="p-4 rounded-lg bg-success-light border border-success/20">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Client PO Value</span>
                    <span>{formatCurrency(data.poValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Vendor Cost</span>
                    <span>-{formatCurrency(395000)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expenses</span>
                    <span>-{formatCurrency(45000)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span className="text-success-foreground">Net Profit</span>
                    <span className="text-success">{formatCurrency(data.poValue - 395000 - 45000)}</span>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Attachments */}
            <section>
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                Attachments
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm">Client_PO_Document.pdf</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm">Vendor_Quotation.pdf</span>
                </div>
              </div>
            </section>

            {/* Notes */}
            <section>
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Notes
              </h4>
              <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                Client requested expedited delivery for first batch. Coordinating with Alpha Supplies for priority processing.
              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default DetailDrawer;
