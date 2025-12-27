import { useState, useRef } from "react";
import { 
  X, FileText, Building2, Truck, CreditCard, Clock, Paperclip, MessageSquare,
  Edit2, Upload, Save, Trash2, Download, Plus, Check, XCircle, Package, FileUp
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  category?: string;
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

// Add Line Item Dialog Component
const AddLineItemDialog = ({ onAdd }: { onAdd: (item: { description: string; quantity: number; rate: number; amount: number }) => void }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    quantity: 1,
    rate: 0,
  });

  const handleSubmit = () => {
    if (!formData.description) {
      toast.error("Please enter a description");
      return;
    }
    onAdd({
      ...formData,
      amount: formData.quantity * formData.rate,
    });
    setOpen(false);
    setFormData({ description: "", quantity: 1, rate: 0 });
    toast.success("Line item added successfully");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Line Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Line Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Description *</Label>
            <Input
              placeholder="Enter item description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min={1}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Rate (₹)</Label>
              <Input
                type="number"
                min={0}
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="font-semibold">₹{(formData.quantity * formData.rate).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSubmit}>
            Add Item
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Add/Update PO Dialog Component
const AddPODialog = ({ mode, onAdd }: { mode: "new" | "additional" | "update"; onAdd: (po: { poNumber: string; poValue: number; file?: File }) => void }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    poNumber: "",
    poValue: 0,
  });
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const titles = {
    new: "Add New PO",
    additional: "Add Additional PO",
    update: "Update PO Details",
  };

  const handleSubmit = () => {
    if (!formData.poNumber) {
      toast.error("Please enter a PO number");
      return;
    }
    onAdd({
      ...formData,
      file: file || undefined,
    });
    setOpen(false);
    setFormData({ poNumber: "", poValue: 0 });
    setFile(null);
    toast.success(mode === "update" ? "PO updated successfully" : "PO added successfully");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {mode === "update" ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {mode === "new" ? "Add New PO" : mode === "additional" ? "Add Additional PO" : "Update PO"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titles[mode]}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>PO Number *</Label>
            <Input
              placeholder="Enter PO number"
              value={formData.poNumber}
              onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>PO Value (₹)</Label>
            <Input
              type="number"
              min={0}
              value={formData.poValue}
              onChange={(e) => setFormData({ ...formData, poValue: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Upload PO Document</Label>
            <div
              className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <FileUp className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload PO file</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSubmit}>
            {mode === "update" ? "Update" : "Add PO"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Add Vendor Order Dialog
const AddVendorOrderDialog = ({ onAdd }: { onAdd: (order: { vendor: string; value: number; description: string }) => void }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    vendor: "",
    value: 0,
    description: "",
  });

  const handleSubmit = () => {
    if (!formData.vendor) {
      toast.error("Please select a vendor");
      return;
    }
    onAdd(formData);
    setOpen(false);
    setFormData({ vendor: "", value: 0, description: "" });
    toast.success("Vendor order added successfully");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Vendor Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Vendor Order</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Vendor *</Label>
            <Select
              value={formData.vendor}
              onValueChange={(value) => setFormData({ ...formData, vendor: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Alpha Supplies">Alpha Supplies</SelectItem>
                <SelectItem value="Beta Materials">Beta Materials</SelectItem>
                <SelectItem value="Gamma Services">Gamma Services</SelectItem>
                <SelectItem value="Delta Corp">Delta Corp</SelectItem>
                <SelectItem value="Epsilon Industries">Epsilon Industries</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Order Value (₹)</Label>
            <Input
              type="number"
              min={0}
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Enter order details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSubmit}>
            Add Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Upload File with Category Dialog
const UploadFileDialog = ({ onUpload }: { onUpload: (file: File, category: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }
    if (!category) {
      toast.error("Please select a document type");
      return;
    }
    onUpload(file, category);
    setOpen(false);
    setFile(null);
    setCategory("");
    toast.success("File uploaded successfully");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Files
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select File *</Label>
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to select file</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOC, XLS, Images</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            />
          </div>
          <div className="space-y-2">
            <Label>Document Type *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="po">This is PO</SelectItem>
                <SelectItem value="pi">This is PI</SelectItem>
                <SelectItem value="quotation">This is Quotation</SelectItem>
                <SelectItem value="invoice">This is Invoice</SelectItem>
                <SelectItem value="contract">This is Contract</SelectItem>
                <SelectItem value="delivery_challan">Delivery Challan</SelectItem>
                <SelectItem value="other">Other Document</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSubmit}>
            Upload
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DetailDrawer = ({ open, onClose, data }: DetailDrawerProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(data);
  const [notes, setNotes] = useState("Client requested expedited delivery for first batch. Coordinating with Alpha Supplies for priority processing.");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([
    { id: "1", name: "Client_PO_Document.pdf", size: "2.4 MB", type: "pdf", uploadedAt: "Jan 15, 2024", category: "PO" },
    { id: "2", name: "Vendor_Quotation.pdf", size: "1.8 MB", type: "pdf", uploadedAt: "Jan 18, 2024", category: "Quotation" },
  ]);
  const [lineItems, setLineItems] = useState([
    { id: "1", description: "Steel Plates - Grade A", quantity: 100, rate: 2500, amount: 250000 },
    { id: "2", description: "Fabrication Work", quantity: 1, rate: 150000, amount: 150000 },
  ]);
  const [vendorOrders, setVendorOrders] = useState([
    { id: "1", vendor: "Alpha Supplies", value: 180000, status: "In Progress" },
    { id: "2", vendor: "Beta Materials", value: 120000, status: "Completed" },
    { id: "3", vendor: "Gamma Services", value: 95000, status: "Pending" },
  ]);

  if (!data) return null;

  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)}L`;
    }
    return `₹${value.toLocaleString("en-IN")}`;
  };

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

  const handleAddLineItem = (item: { description: string; quantity: number; rate: number; amount: number }) => {
    setLineItems((prev) => [...prev, { ...item, id: crypto.randomUUID() }]);
  };

  const handleAddPO = (po: { poNumber: string; poValue: number; file?: File }) => {
    // In a real app, this would update the order's PO details
    console.log("Adding PO:", po);
  };

  const handleAddVendorOrder = (order: { vendor: string; value: number; description: string }) => {
    setVendorOrders((prev) => [...prev, { ...order, id: crypto.randomUUID(), status: "Pending" }]);
  };

  const handleUploadFile = (file: File, category: string) => {
    const categoryLabels: Record<string, string> = {
      po: "PO",
      pi: "PI",
      quotation: "Quotation",
      invoice: "Invoice",
      contract: "Contract",
      delivery_challan: "Delivery Challan",
      other: "Other",
    };
    
    setAttachments((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type: file.name.split(".").pop() || "file",
        uploadedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        category: categoryLabels[category] || "Other",
      },
    ]);
  };

  const handleDeleteAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
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
          <div className="flex items-center gap-2 mt-4 pt-4 border-t flex-wrap">
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
                <UploadFileDialog onUpload={handleUploadFile} />
              </>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Quick Actions */}
            <section>
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                Quick Actions
              </h4>
              <div className="flex flex-wrap gap-2">
                <AddLineItemDialog onAdd={handleAddLineItem} />
                <AddPODialog mode="new" onAdd={handleAddPO} />
                <AddPODialog mode="additional" onAdd={handleAddPO} />
                <AddVendorOrderDialog onAdd={handleAddVendorOrder} />
              </div>
            </section>

            <Separator />

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
                        onChange={(e) => setEditedData((prev) => prev ? { ...prev, piNo: e.target.value } : prev)}
                        className="h-9 font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">PO Number</Label>
                      <Input
                        value={editedData?.poNo || ""}
                        onChange={(e) => setEditedData((prev) => prev ? { ...prev, poNo: e.target.value } : prev)}
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
                        onChange={(e) => setEditedData((prev) => prev ? { ...prev, poValue: Number(e.target.value) } : prev)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Receivable (₹)</Label>
                      <Input
                        type="number"
                        value={editedData?.receivable || 0}
                        onChange={(e) => setEditedData((prev) => prev ? { ...prev, receivable: Number(e.target.value) } : prev)}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Payment Status</Label>
                    <Select
                      value={editedData?.paymentStatus || "pending"}
                      onValueChange={(value) => setEditedData((prev) => prev ? { ...prev, paymentStatus: value } : prev)}
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
                      onValueChange={(value) => setEditedData((prev) => prev ? { ...prev, status: value } : prev)}
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
                    <span className={cn("font-semibold", (currentData?.receivable || 0) > 0 ? "text-amber-500" : "text-emerald-500")}>
                      {formatCurrency(currentData?.receivable || 0)}
                    </span>
                  </div>
                </div>
              )}
            </section>

            <Separator />

            {/* Line Items */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Line Items
                </h4>
              </div>
              <div className="space-y-2">
                {lineItems.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">{item.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × ₹{item.rate.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(item.amount)}</span>
                    </div>
                  </div>
                ))}
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
                {vendorOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
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
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
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
                    <span className="text-emerald-600 dark:text-emerald-400">Net Profit</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency((currentData?.poValue || 0) - 395000 - 45000)}</span>
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
              </div>
              <div className="space-y-2">
                {attachments.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-lg border border-dashed">
                    No attachments yet. Click "Upload Files" to add documents.
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
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{attachment.size}</span>
                            <span>•</span>
                            <span>{attachment.uploadedAt}</span>
                            {attachment.category && (
                              <>
                                <span>•</span>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {attachment.category}
                                </Badge>
                              </>
                            )}
                          </div>
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
