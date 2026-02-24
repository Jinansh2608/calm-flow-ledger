import { useState, useRef, useEffect } from "react";
import { Plus, Upload, X, FileText, CheckCircle, Loader2, Check } from "lucide-react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useDashboard } from "@/contexts/DashboardContext";
import { poService, uploadService, projectService } from "@/services";
import { cn } from "@/lib/utils";

type FileCategory = "po" | "pi" | "quotation" | "invoice" | "contract" | "other";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File; // Keep reference to real file for upload
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

const NewOrderDialog = () => {
  const { projects: contextProjects, refreshData, clients: contextClients } = useDashboard();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("upload"); // 'upload' | 'manual' | 'session'
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Client state
  const [clients, setClients] = useState<any[]>([]);
  
  // Project state
  const [projects, setProjects] = useState<any[]>([]);

  // Manual Entry State
  const [isPOLate, setIsPOLate] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [createdOrder, setCreatedOrder] = useState<OrderDetails | null>(null);
  const manualFileInputRef = useRef<HTMLInputElement>(null);
  const [isNewProject, setIsNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  
  // Upload Tab State
  const uploadFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProjectName, setUploadProjectName] = useState("");

  // Upload Session State
  const sessionFileInputRef = useRef<HTMLInputElement>(null);
  const [sessionProjectName, setSessionProjectName] = useState("");
  const [sessionDescription, setSessionDescription] = useState("");
  const [sessionSelectedFiles, setSessionSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isSessionUploading, setIsSessionUploading] = useState(false);

  const [formData, setFormData] = useState({
    poNumber: "",
    piNumber: "",
    clientId: "",
    projectId: "",
    notes: "",
  });
  
  // Initialize data from context
  useEffect(() => {
    if (contextClients) {
      setClients(contextClients);
    }
    if (contextProjects) {
      setProjects(contextProjects);
    }
  }, [contextClients, contextProjects]);

  const resetForm = () => {
    setFormData({
      poNumber: "",
      piNumber: "",
      clientId: "",
      projectId: "",
      notes: "",
    });
    setFiles([]);
    setUploadFile(null);
    setUploadProjectName("");
    setSessionProjectName("");
    setSessionDescription("");
    setIsPOLate(false);
    setShowConfirmation(false);
    setCreatedOrder(null);
    setIsSubmitting(false);
    setIsNewProject(false);
    setNewProjectName("");
  };

  const handleManualFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (uploadedFiles) {
      const newFiles: UploadedFile[] = Array.from(uploadedFiles).map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
        category: "other",
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
    if (manualFileInputRef.current) {
      manualFileInputRef.current.value = "";
    }
  };

  const handleUploadTabFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleSessionFileSelect = (filesInput: File[] | React.ChangeEvent<HTMLInputElement>) => {
    let files: File[] = [];
    
    if (Array.isArray(filesInput)) {
      files = filesInput;
    } else {
      files = Array.from(filesInput.target.files || []);
    }
    
    setSessionSelectedFiles(files);
    const newProgress: Record<string, number> = {};
    files.forEach(file => {
      newProgress[file.name] = 0;
    });
    setUploadProgress(newProgress);
  };

  const handleSessionUpload = async () => {
    if (!sessionProjectName.trim()) {
      toast({ title: "Project Name Required", description: "Please enter a project name.", variant: "destructive" });
      return;
    }
    if (!formData.clientId) {
      toast({ title: "Client Required", description: "Please select a client.", variant: "destructive" });
      return;
    }
    if (sessionSelectedFiles.length === 0) {
      toast({ title: "Files Required", description: "Please select files to upload.", variant: "destructive" });
      return;
    }

    setIsSessionUploading(true);
    try {
      // Create session
      const session = await uploadService.createSession(
        {
          project: sessionProjectName,
          description: sessionDescription,
        },
        24,
        parseInt(formData.clientId)
      );

      // Upload files
      for (const file of sessionSelectedFiles) {
        try {
          await uploadService.uploadFile(session.session_id, file, {
            uploaded_by: "admin",
            auto_parse: true,
          });
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
        }
      }

      toast({
        title: "Upload Complete",
        description: `Successfully created session with ${sessionSelectedFiles.length} file(s).`,
      });

      // Reset form
      setSessionProjectName("");
      setSessionDescription("");
      setSessionSelectedFiles([]);
      setUploadProgress({});
      setFormData({ ...formData, clientId: "" });
      setOpen(false);
      refreshData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create upload session",
        variant: "destructive",
      });
    } finally {
      setIsSessionUploading(false);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleManualSubmit = async () => {
    if (!isPOLate && !formData.poNumber) {
      toast({ title: "PO Number Required", description: "Please enter a PO number.", variant: "destructive" });
      return;
    }
    if (!formData.clientId) {
      toast({ title: "Client Required", description: "Please select a client.", variant: "destructive" });
      return;
    }
    if (isNewProject && !newProjectName) {
      toast({ title: "Project Name Required", description: "Please enter the new project name.", variant: "destructive" });
      return;
    }
    if (!isNewProject && !formData.projectId) {
      toast({ title: "Project Required", description: "Please select a project.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const clientName = clients.find(c => c.id.toString() === formData.clientId)?.name || "Unknown Client";
      
      let finalProjectId = parseInt(formData.projectId);
      let finalProjectName = "";

      // Create new project if selected
      if (isNewProject) {
        const projectResponse = await projectService.createProject({
          name: newProjectName
        });
        const projId = projectResponse?.id || projectResponse?.project_id;
        if (!projId) throw new Error("Failed to create project");
        finalProjectId = projId;
        finalProjectName = newProjectName;
      } else {
        const proj = projects.find(p => p.id === finalProjectId);
        finalProjectName = proj?.name || "Unknown Project";
      }

      const poResponse = await poService.createPO(finalProjectId, {
        po_number: formData.poNumber || `PENDING-${Date.now()}`,
        po_date: new Date().toISOString().split('T')[0],
        po_value: 0, 
        vendor_name: clientName, 
        notes: formData.notes,
        client_id: parseInt(formData.clientId)
      });
      
      setCreatedOrder({
        poNumber: poResponse?.po_number || poResponse?.po?.po_number || formData.poNumber || `PENDING-${Date.now()}`,
        piNumber: formData.piNumber,
        client: clientName,
        project: finalProjectName,
        notes: formData.notes,
        files: files,
        isPOLate: isPOLate
      });
      setShowConfirmation(true);
      refreshData();
      
    } catch (error: any) {
      toast({ 
        title: "Error creating order", 
        description: error.message || "Something went wrong", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadSubmit = async () => {
    if (!formData.clientId) {
      toast({ title: "Client Required", description: "Please select a client.", variant: "destructive" });
      return;
    }
    if (!uploadFile) {
      toast({ title: "File Required", description: "Please select a file to upload.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // Use the dedicated PO upload endpoint which now supports project_name
      // If project name is provided, backend handles creation/resolution
      const response = await poService.uploadAndParsePO(
        uploadFile,
        parseInt(formData.clientId),
        uploadProjectName || undefined
      );

      // Check for both legacy 'success' string and structural integrity
      if (response.status === 'success' || (response.status as any) === 'SUCCESS' || response.po_details) {
         // Success
         const clientName = clients.find(c => c.id.toString() === formData.clientId)?.name || "Unknown Client";

         setCreatedOrder({
            poNumber: response.po_details?.po_number || "PARSED-AUTO",
            piNumber: "",
            client: clientName,
            project: response.project_name || uploadProjectName || "Default",
            notes: "Auto-generated from upload",
            files: [{
              id: response.file_id || '1',
              name: uploadFile.name,
              size: uploadFile.size,
              type: uploadFile.type,
              category: 'po',
              file: uploadFile
            }],
            isPOLate: false
         });
         setShowConfirmation(true);
         refreshData();
      } else {
         throw new Error(response.error || "Parsing failed or completed with errors");
      }
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast({ 
        title: "Upload Failed", 
        description: error.message || "Failed to process file", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
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
              <DialogDescription className="sr-only">Form to create a new order or upload files.</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="upload" className="gap-2">
                   <Upload className="h-4 w-4" />
                   <span className="hidden sm:inline">Upload PO</span>
                </TabsTrigger>
                <TabsTrigger value="session" className="gap-2">
                   <Upload className="h-4 w-4" />
                   <span className="hidden sm:inline">Bulk Upload</span>
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-2">
                   <FileText className="h-4 w-4" />
                   <span className="hidden sm:inline">Manual Entry</span>
                </TabsTrigger>
              </TabsList>

              {/* Shared Client Selection */}
              <div className="space-y-2 mb-4">
                <Label htmlFor="client" className="text-sm font-medium">
                  Client <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue 
                      placeholder={clients.length > 0 ? "Select Client" : "Loading clients..."}
                    />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    {clients.length > 0 ? (
                      clients.map((client) => (
                        <SelectItem key={`client-${client.id}`} value={String(client.id)}>
                          {client.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        No clients available
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <TabsContent value="upload" className="space-y-4">
                {/* Project Name */}
                <div className="space-y-2">
                  <Label htmlFor="upload-project-name" className="text-sm font-medium">
                    Project Name (Optional)
                  </Label>
                  <Input
                    id="upload-project-name"
                    placeholder="e.g., Q4 2024 Procurement"
                    value={uploadProjectName}
                    onChange={(e) => setUploadProjectName(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">If left blank, a default name will be assigned based on client.</p>
                </div>

                 <div className="border-2 border-dashed border-primary/20 bg-primary/5 rounded-xl p-8 text-center transition-all hover:border-primary/50 hover:bg-primary/10">
                    <input 
                      type="file" 
                      id="po-upload" 
                      className="hidden" 
                      accept=".pdf,.xlsx,.xls,.csv"
                      ref={uploadFileInputRef}
                      onChange={handleUploadTabFileSelect}
                    />
                    
                    {uploadFile ? (
                      <div className="flex flex-col items-center">
                        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mb-3 text-primary">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                        <p className="font-medium text-foreground">{uploadFile.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatFileSize(uploadFile.size)}</p>
                        <Button variant="ghost" size="sm" className="mt-2 text-destructive hover:text-destructive" onClick={(e) => {
                          e.stopPropagation();
                          setUploadFile(null);
                        }}>
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center cursor-pointer" onClick={() => uploadFileInputRef.current?.click()}>
                        <div className="h-12 w-12 rounded-full bg-background border border-border flex items-center justify-center mb-3 shadow-sm">
                          <Upload className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-medium text-foreground">Click to upload PO</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                          Supports PDF, Excel, CSV. We'll automatically extract the details.
                        </p>
                      </div>
                    )}
                 </div>

                 <div className="pt-2">
                   <Button className="w-full" onClick={handleUploadSubmit} disabled={isSubmitting || !uploadFile}>
                     {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                     {isSubmitting ? "Processing..." : "Upload & Create Order"}
                   </Button>
                 </div>
              </TabsContent>

              <TabsContent value="session" className="space-y-4 animate-in fade-in-0 duration-300">
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {/* Project Name */}
                  <div className="space-y-2">
                    <Label htmlFor="project-name" className="text-sm font-medium">
                      Project Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="project-name"
                      placeholder="e.g., Q4 2024 Procurement"
                      value={sessionProjectName}
                      onChange={(e) => setSessionProjectName(e.target.value)}
                      disabled={isSessionUploading}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="session-description" className="text-sm font-medium">
                      Description (Optional)
                    </Label>
                    <Textarea
                      id="session-description"
                      placeholder="Add any notes about this upload session..."
                      value={sessionDescription}
                      onChange={(e) => setSessionDescription(e.target.value)}
                      className="resize-none"
                      rows={3}
                      disabled={isSessionUploading}
                    />
                  </div>

                  {/* File Upload Area */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Upload Files (Multiple)</Label>
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                        "hover:bg-accent/50 hover:border-primary",
                        isSessionUploading && "pointer-events-none opacity-50",
                        "bg-muted/20"
                      )}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add("border-primary", "bg-accent/50");
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove("border-primary", "bg-accent/50");
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove("border-primary", "bg-accent/50");
                        if (e.dataTransfer.files) {
                          handleSessionFileSelect(Array.from(e.dataTransfer.files));
                        }
                      }}
                      onClick={() => sessionFileInputRef.current?.click()}
                    >
                      <input
                        ref={sessionFileInputRef}
                        type="file"
                        multiple
                        accept=".xlsx,.xls,.csv,.pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          if (e.target.files) {
                            handleSessionFileSelect(Array.from(e.target.files));
                          }
                        }}
                        className="hidden"
                        disabled={isSessionUploading}
                      />
                      <div className="space-y-2">
                        <div className="text-lg font-semibold">Drop files here or click to select</div>
                        <p className="text-sm text-muted-foreground">
                          Supported formats: XLSX, XLS, CSV, PDF, JPG, PNG (Max 50 MB per file)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Selected Files List */}
                  {sessionSelectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Selected Files ({sessionSelectedFiles.length})
                      </Label>
                      <div className="space-y-2">
                        {sessionSelectedFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{file.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </div>
                              {uploadProgress[idx] !== undefined && uploadProgress[idx] < 100 && (
                                <div className="mt-2 w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-primary h-full transition-all"
                                    style={{ width: `${uploadProgress[idx]}%` }}
                                  />
                                </div>
                              )}
                              {uploadProgress[idx] === 100 && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                                  <Check className="h-3 w-3" />
                                  Uploaded
                                </div>
                              )}
                            </div>
                            {!isSessionUploading && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setSessionSelectedFiles(sessionSelectedFiles.filter((_, i) => i !== idx))
                                }
                                className="ml-2"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      className="w-full"
                      onClick={handleSessionUpload}
                      disabled={isSessionUploading || !sessionProjectName.trim() || sessionSelectedFiles.length === 0}
                    >
                      {isSessionUploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      {isSessionUploading ? "Creating Session & Uploading..." : "Create Session & Upload Files"}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="manual" className="space-y-4 animate-in fade-in-0 duration-300">
                <div className="space-y-4">
                    {/* Project Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="project" className="text-sm font-medium">
                        Project <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex gap-2">
                         <Select
                            value={isNewProject ? "new" : formData.projectId}
                            onValueChange={(value) => {
                              if (value === "new") {
                                setIsNewProject(true);
                                setFormData({ ...formData, projectId: "" });
                              } else {
                                setIsNewProject(false);
                                setFormData({ ...formData, projectId: value });
                              }
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Project" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">
                                <span className="font-medium text-primary flex items-center gap-2">
                                  <Plus className="h-4 w-4" /> Create New Project
                                </span>
                              </SelectItem>
                              {projects.map((project) => (
                                <SelectItem key={`proj-${project.id}`} value={String(project.id)}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                      </div>
                      
                      {isNewProject && (
                        <div className="mt-2 animate-in fade-in-0 slide-in-from-top-1">
                          <Input
                            placeholder="Enter New Project Name"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            className="bg-muted/30"
                          />
                        </div>
                      )}
                    </div>
                
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

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add any notes..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
                  <Button className="flex-1" onClick={handleManualSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                     Create Order
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          /* Confirmation View */
          <>
            <DialogHeader>
              <DialogTitle>Order Created Successfully</DialogTitle>
              <DialogDescription className="sr-only">Order creation success confirmation</DialogDescription>
            </DialogHeader>
            <div className="py-6 animate-in zoom-in-95 duration-300">
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Order Created Successfully</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTab === 'upload' ? "File processed and order created." : "Your manual order has been logged."}
              </p>
            </div>

            {createdOrder && (
              <div className="bg-muted/30 rounded-lg p-4 space-y-3 border border-border">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">PO Number</span>
                  <span className="text-sm font-medium">{createdOrder.poNumber}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Client</span>
                  <span className="text-sm font-medium">{createdOrder.client}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Project</span>
                  <span className="text-sm font-medium">{createdOrder.project}</span>
                </div>
                {createdOrder.files.length > 0 && (
                   <div className="py-2">
                      <span className="text-sm text-muted-foreground block mb-1">Attached File</span>
                      <div className="flex items-center gap-2 text-sm p-2 rounded bg-background border">
                         <FileText className="h-3 w-3 text-primary" />
                         <span className="truncate">{createdOrder.files[0].name}</span>
                      </div>
                   </div>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={resetForm}>
                Create Another
              </Button>
              <Button className="flex-1" onClick={handleClose}>
                Done
              </Button>
            </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewOrderDialog;
