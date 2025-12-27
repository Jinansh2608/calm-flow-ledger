import { useState, useRef } from "react";
import { Plus, Upload, X, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

type FileCategory = "po" | "pi" | "quotation" | "invoice" | "contract" | "other";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  category: FileCategory;
}

interface OrderDetails {
  poNumber: string;
  piNumber: string;
  client: string;
  project: string;
  notes: string;
  files: UploadedFile[];
  isPOLate: boolean;
}

const fileCategoryLabels: Record<FileCategory, string> = {
  po: "Purchase Order (PO)",
  pi: "Proforma Invoice (PI)",
  quotation: "Quotation",
  invoice: "Invoice",
  contract: "Contract",
  other: "Other Document",
};

const NewOrderDialog = () => {
  const [open, setOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isPOLate, setIsPOLate] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [createdOrder, setCreatedOrder] = useState<OrderDetails | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    poNumber: "",
    piNumber: "",
    client: "",
    project: "",
    notes: "",
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (uploadedFiles) {
      const newFiles: UploadedFile[] = Array.from(uploadedFiles).map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        category: "other",
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFileCategory = (id: string, category: FileCategory) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, category } : f))
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleSubmit = () => {
    if (!isPOLate && !formData.poNumber) {
      toast({
        title: "PO Number Required",
        description: "Please enter a PO number or mark the order as PO pending.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.client) {
      toast({
        title: "Client Required",
        description: "Please select a client.",
        variant: "destructive",
      });
      return;
    }

    const order: OrderDetails = {
      ...formData,
      files,
      isPOLate,
    };

    setCreatedOrder(order);
    setShowConfirmation(true);
  };

  const handleClose = () => {
    setOpen(false);
    setShowConfirmation(false);
    setCreatedOrder(null);
    setFormData({
      poNumber: "",
      piNumber: "",
      client: "",
      project: "",
      notes: "",
    });
    setFiles([]);
    setIsPOLate(false);
  };

  const handleCreateAnother = () => {
    setShowConfirmation(false);
    setCreatedOrder(null);
    setFormData({
      poNumber: "",
      piNumber: "",
      client: "",
      project: "",
      notes: "",
    });
    setFiles([]);
    setIsPOLate(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else setOpen(true);
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {!showConfirmation ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Create New Order</DialogTitle>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* PO Late Checkbox */}
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 border border-border">
                <Checkbox
                  id="poLate"
                  checked={isPOLate}
                  onCheckedChange={(checked) => setIsPOLate(checked as boolean)}
                />
                <Label htmlFor="poLate" className="text-sm font-medium cursor-pointer">
                  PO is pending / will be provided later
                </Label>
              </div>

              {/* PO Number */}
              <div className="space-y-2">
                <Label htmlFor="poNumber" className="text-sm font-medium">
                  PO Number {!isPOLate && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="poNumber"
                  placeholder="Enter PO number"
                  value={formData.poNumber}
                  onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                  disabled={isPOLate}
                  className={isPOLate ? "opacity-50" : ""}
                />
              </div>

              {/* PI Number */}
              <div className="space-y-2">
                <Label htmlFor="piNumber" className="text-sm font-medium">
                  PI Number
                </Label>
                <Input
                  id="piNumber"
                  placeholder="Enter PI number"
                  value={formData.piNumber}
                  onChange={(e) => setFormData({ ...formData, piNumber: e.target.value })}
                />
              </div>

              {/* Client */}
              <div className="space-y-2">
                <Label htmlFor="client" className="text-sm font-medium">
                  Client <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.client}
                  onValueChange={(value) => setFormData({ ...formData, client: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Acme Corp">Acme Corp</SelectItem>
                    <SelectItem value="TechStart Inc">TechStart Inc</SelectItem>
                    <SelectItem value="Global Traders">Global Traders</SelectItem>
                    <SelectItem value="Prime Industries">Prime Industries</SelectItem>
                    <SelectItem value="Metro Solutions">Metro Solutions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Project */}
              <div className="space-y-2">
                <Label htmlFor="project" className="text-sm font-medium">
                  Project
                </Label>
                <Select
                  value={formData.project}
                  onValueChange={(value) => setFormData({ ...formData, project: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Project Alpha">Project Alpha</SelectItem>
                    <SelectItem value="Project Beta">Project Beta</SelectItem>
                    <SelectItem value="Project Gamma">Project Gamma</SelectItem>
                    <SelectItem value="Project Delta">Project Delta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes or special instructions..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              {/* File Upload */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Attachments</Label>
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOC, XLS, Images up to 10MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                />

                {/* Uploaded Files List with Category Selection */}
                {files.length > 0 && (
                  <div className="space-y-3">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="p-3 rounded-lg bg-muted/50 border border-border space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => removeFile(file.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Select
                          value={file.category}
                          onValueChange={(value: FileCategory) => updateFileCategory(file.id, value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="po">This is PO</SelectItem>
                            <SelectItem value="pi">This is PI</SelectItem>
                            <SelectItem value="quotation">This is Quotation</SelectItem>
                            <SelectItem value="invoice">This is Invoice</SelectItem>
                            <SelectItem value="contract">This is Contract</SelectItem>
                            <SelectItem value="other">Other Document</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSubmit}>
                Create Order
              </Button>
            </div>
          </>
        ) : (
          /* Confirmation View */
          <div className="py-6">
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Order Created Successfully</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your order has been created and is ready for processing.
              </p>
            </div>

            {createdOrder && (
              <div className="bg-muted/30 rounded-lg p-4 space-y-3 border border-border">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                  Order Details
                </h3>
                
                <div className="space-y-2">
                  {createdOrder.isPOLate ? (
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">PO Status</span>
                      <span className="text-sm font-medium text-amber-500">Pending</span>
                    </div>
                  ) : (
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">PO Number</span>
                      <span className="text-sm font-medium">{createdOrder.poNumber}</span>
                    </div>
                  )}
                  
                  {createdOrder.piNumber && (
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">PI Number</span>
                      <span className="text-sm font-medium">{createdOrder.piNumber}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Client</span>
                    <span className="text-sm font-medium">{createdOrder.client}</span>
                  </div>
                  
                  {createdOrder.project && (
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Project</span>
                      <span className="text-sm font-medium">{createdOrder.project}</span>
                    </div>
                  )}
                  
                  {createdOrder.notes && (
                    <div className="py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground block mb-1">Notes</span>
                      <span className="text-sm">{createdOrder.notes}</span>
                    </div>
                  )}
                  
                  {createdOrder.files.length > 0 && (
                    <div className="py-2">
                      <span className="text-sm text-muted-foreground block mb-2">
                        Attachments ({createdOrder.files.length})
                      </span>
                      <div className="space-y-2">
                        {createdOrder.files.map((file) => (
                          <div key={file.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="h-3 w-3 text-primary shrink-0" />
                              <span className="truncate">{file.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0 ml-2">
                              {fileCategoryLabels[file.category]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={handleCreateAnother}>
                Create Another
              </Button>
              <Button className="flex-1" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewOrderDialog;
