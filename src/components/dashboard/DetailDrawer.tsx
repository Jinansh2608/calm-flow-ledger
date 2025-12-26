import { useState, useRef } from "react";
import { 
  X, FileText, Building2, Truck, CreditCard, Clock, Paperclip, MessageSquare,
  Edit2, Upload, Save, Trash2, Download, Plus, Check, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
}

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
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(data);
  const [notes, setNotes] = useState("Client requested expedited delivery for first batch. Coordinating with Alpha Supplies for priority processing.");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([
    { id: "1", name: "Client_PO_Document.pdf", size: "2.4 MB", type: "pdf", uploadedAt: "Jan 15, 2024" },
    { id: "2", name: "Vendor_Quotation.pdf", size: "1.8 MB", type: "pdf", uploadedAt: "Jan 18, 2024" },
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSave = () => {
    setIsEditing(false);
    toast.success("Changes saved successfully", {
      description: "PO details have been updated.",
    });
  };

  const handleCancelEdit = () => {
    setEditedData(data);
    setIsEditing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    // Simulate upload
    setTimeout(() => {
      const newAttachments: Attachment[] = Array.from(files).map((file, index) => ({
        id: `new-${Date.now()}-${index}`,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type: file.name.split(".").pop() || "file",
        uploadedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      }));

      setAttachments(prev => [...prev, ...newAttachments]);
      setIsUploading(false);
      toast.success(`${files.length} file(s) uploaded successfully`);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }, 1500);
  };

  const handleDeleteAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
    toast.success("Attachment deleted");
  };

  const handleDownloadAttachment = (attachment: Attachment) => {
    toast.success(`Downloading ${attachment.name}...`);
  };

  const handleSaveNotes = () => {
    setIsEditingNotes(false);
    toast.success("Notes updated");
  };

  const currentData = isEditing ? editedData : data;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="font-display text-lg">{currentData?.client}</SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">{currentData?.project}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={currentData?.status === "active" ? "default" : "secondary"}>
                {currentData?.status}
              </Badge>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit} className="gap-2">
                  <XCircle className="h-4 w-4" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                  <Edit2 className="h-4 w-4" />
                  Edit Details
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {isUploading ? "Uploading..." : "Upload Files"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                />
              </>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Client Details */}
            <section>
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Client Details
              </h4>
              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">PI Number</Label>
                      <Input
                        value={editedData?.piNo || ""}
                        onChange={(e) => setEditedData(prev => prev ? { ...prev, piNo: e.target.value } : prev)}
                        className="h-9 font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">PO Number</Label>
                      <Input
                        value={editedData?.poNo || ""}
                        onChange={(e) => setEditedData(prev => prev ? { ...prev, poNo: e.target.value } : prev)}
                        className="h-9 font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">PO Value (₹)</Label>
                      <Input
                        type="number"
                        value={editedData?.poValue || 0}
                        onChange={(e) => setEditedData(prev => prev ? { ...prev, poValue: Number(e.target.value) } : prev)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Receivable (₹)</Label>
                      <Input
                        type="number"
                        value={editedData?.receivable || 0}
                        onChange={(e) => setEditedData(prev => prev ? { ...prev, receivable: Number(e.target.value) } : prev)}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Payment Status</Label>
                    <Select
                      value={editedData?.paymentStatus || "pending"}
                      onValueChange={(value) => setEditedData(prev => prev ? { ...prev, paymentStatus: value } : prev)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Status</Label>
                    <Select
                      value={editedData?.status || "active"}
                      onValueChange={(value) => setEditedData(prev => prev ? { ...prev, status: value } : prev)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PI Number</span>
                    <span className="font-mono">{currentData?.piNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PO Number</span>
                    <span className="font-mono">{currentData?.poNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PO Value</span>
                    <span className="font-semibold">{formatCurrency(currentData?.poValue || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Receivable</span>
                    <span className={cn("font-semibold", (currentData?.receivable || 0) > 0 ? "text-warning" : "text-success")}>
                      {formatCurrency(currentData?.receivable || 0)}
                    </span>
                  </div>
                </div>
              )}
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
                    <span>{formatCurrency(currentData?.poValue || 0)}</span>
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
                    <span className="text-success">{formatCurrency((currentData?.poValue || 0) - 395000 - 45000)}</span>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Attachments */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  Attachments
                </h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {attachments.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-lg border border-dashed">
                    No attachments yet. Click "Add" or drag files here.
                  </div>
                ) : (
                  attachments.map((attachment) => (
                    <div 
                      key={attachment.id} 
                      className="group flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{attachment.name}</p>
                          <p className="text-xs text-muted-foreground">{attachment.size} • {attachment.uploadedAt}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => handleDownloadAttachment(attachment)}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteAttachment(attachment.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <Separator />

            {/* Notes */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  Notes
                </h4>
                {!isEditingNotes && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => setIsEditingNotes(true)}
                  >
                    <Edit2 className="h-3 w-3" />
                    Edit
                  </Button>
                )}
              </div>
              {isEditingNotes ? (
                <div className="space-y-2">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px] text-sm resize-none"
                    placeholder="Add notes about this PO..."
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveNotes} className="gap-1.5">
                      <Check className="h-3.5 w-3.5" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditingNotes(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  {notes || "No notes added yet."}
                </div>
              )}
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default DetailDrawer;
