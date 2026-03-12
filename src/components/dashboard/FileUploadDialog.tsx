import { useState, useRef } from "react";
import { Upload, X, CheckCircle2, AlertCircle, Loader2, FileText } from "lucide-react";
import { poService } from "@/services/poService";
import { Client, UploadSession } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { uploadService } from "@/services/uploadService";

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients?: Client[];
  onSessionCreated?: (session: UploadSession) => void;
}

export const FileUploadDialog = ({
  open,
  onOpenChange,
  clients = [],
  onSessionCreated,
}: FileUploadDialogProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [projectName, setProjectName] = useState("");
  const [clientId, setClientId] = useState<string>("");
  const [autoSave, setAutoSave] = useState(true);

  const resetForm = () => {
    setSelectedFile(null);
    setProjectName("");
    setClientId("");
    setAutoSave(true);
    setIsLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onOpenChange(false);
    }
  };

  const isValidFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext && ['xlsx', 'xls', 'csv', 'pdf'].includes(ext);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidFile(file)) {
      toast({
        title: "Invalid File",
        description: `${file.name} is not supported. Please upload pdf, xlsx, xls, or csv formats.`,
        variant: "destructive"
      });
      if (e.target) e.target.value = '';
      return;
    }

    setSelectedFile(file);
    if (e.target) e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("border-blue-500", "bg-blue-50");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("border-blue-500", "bg-blue-50");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-blue-500", "bg-blue-50");
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!isValidFile(file)) {
      toast({
        title: "Invalid File",
        description: `${file.name} is not supported. Please upload pdf, xlsx, xls, or csv formats.`,
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !clientId) return;

    setIsLoading(true);

    try {
      // Use uploadAndParsePO which wraps the multipart/form-data logic
      const result = await poService.uploadAndParsePO(
        selectedFile,
        parseInt(clientId),
        projectName || undefined,
        autoSave
      );

      toast({
        title: "Successfully Uploaded",
        description: `File ${selectedFile.name} was successfully uploaded and processed.`,
      });

      // Fetch the full session object utilizing the session_id from the response
      if (result && result.session_id) {
          try {
            const sessionData = await uploadService.getSessionDetails(result.session_id);
            if (onSessionCreated) {
              onSessionCreated(sessionData);
            }
          } catch (sessionErr) {
            console.error("Failed to fetch session details:", sessionErr);
          }
      }

      handleClose();
    } catch (error) {
      console.error("Upload Error:", error);
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" aria-describedby="upload-dialog-description">
        <DialogHeader>
          <DialogTitle>File Upload</DialogTitle>
          <DialogDescription id="upload-dialog-description">
            Upload a purchase order file for processing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Form Fields */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="client">Client <span className="text-red-500">*</span></Label>
              <Select value={clientId} onValueChange={setClientId} disabled={isLoading}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={String(client.id)}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="project">Project Name (Optional)</Label>
              <Input
                id="project"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="autoSave"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
                disabled={isLoading}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="autoSave" className="font-normal cursor-pointer">
                Auto-parse and save PO
              </Label>
            </div>
          </div>

          {/* File Drop Zone */}
          <div
            onDragOver={!isLoading ? handleDragOver : undefined}
            onDragLeave={!isLoading ? handleDragLeave : undefined}
            onDrop={!isLoading ? handleDrop : undefined}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors mt-4",
              isLoading ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200" : "cursor-pointer hover:border-blue-400",
              selectedFile ? "border-green-400 bg-green-50/30" : "border-gray-300"
            )}
            onClick={() => !isLoading && fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.xlsx,.xls,.csv"
              disabled={isLoading}
            />
            
            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="h-8 w-8 text-green-500" />
                <div className="space-y-1">
                  <p className="font-medium text-sm text-green-700">{selectedFile.name}</p>
                  <p className="text-xs text-green-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {!isLoading && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 mt-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="font-medium text-sm">
                    Drag file here or click to browse
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supports: PDF, Excel (.xlsx, .xls), CSV
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isLoading || !selectedFile || !clientId}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadDialog;
