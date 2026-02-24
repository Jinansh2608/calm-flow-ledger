import { useState } from "react";
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { uploadService } from "@/services/uploadService";
import { UploadSession, Client } from "@/types";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients?: Client[];
  onSessionCreated?: (session: UploadSession) => void;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export const FileUploadDialog = ({
  open,
  onOpenChange,
  clients = [],
  onSessionCreated,
}: FileUploadDialogProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "upload">("form");
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<UploadSession | null>(null);

  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState<string>("");

  // Upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [autoParse, setAutoParse] = useState(true);
  const [uploadedBy, setUploadedBy] = useState("admin");

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newSession = await uploadService.createSession(
        {
          project: projectName,
          description,
        },
        24, // Default TTL
        clientId ? parseInt(clientId) : undefined
      );

      setSession(newSession);
      setStep("upload");
      toast({
        title: "Session Created",
        description: `Upload session ${newSession.session_id} created successfully.`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create session";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    setUploadProgress(
      files.map((file) => ({
        fileName: file.name,
        progress: 0,
        status: "pending",
      }))
    );
  };

  const handleUploadFiles = async () => {
    if (!session || selectedFiles.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      try {
        setUploadProgress((prev) => {
          const updated = [...prev];
          updated[i] = { ...updated[i], status: "uploading", progress: 25 };
          return updated;
        });

        const result = await uploadService.uploadFile(session.session_id, file, {
          uploaded_by: uploadedBy,
          auto_parse: autoParse,
        });

        setUploadProgress((prev) => {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            progress: 100,
            status: result.parse_status === "SUCCESS" ? "success" : "error",
            error: result.parse_error || undefined,
          };
          return updated;
        });

        toast({
          title: "File Uploaded",
          description: `${file.name} uploaded successfully${
            result.po_id ? ` (PO ID: ${result.po_id})` : ""
          }`,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        setUploadProgress((prev) => {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            progress: 0,
            status: "error",
            error: errorMessage,
          };
          return updated;
        });

        toast({
          title: "Upload Error",
          description: `Failed to upload ${file.name}: ${errorMessage}`,
          variant: "destructive",
        });
      }
    }

    setIsUploading(false);
  };

  const handleClose = () => {
    if (step === "upload" && session) {
      onSessionCreated?.(session);
    }
    setStep("form");
    setSession(null);
    setProjectName("");
    setDescription("");
    setClientId("");
    setSelectedFiles([]);
    setUploadProgress([]);
    onOpenChange(false);
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
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(files);
    setUploadProgress(
      files.map((file) => ({
        fileName: file.name,
        progress: 0,
        status: "pending",
      }))
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" aria-describedby="upload-dialog-description">
        <DialogHeader>
          <DialogTitle>File Upload</DialogTitle>
          <DialogDescription id="upload-dialog-description">
            {step === "form"
              ? "Create an upload session and select files to upload"
              : `Continue uploading files to session ${session?.session_id}`}
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project">Project Name</Label>
                <Input
                  id="project"
                  placeholder="Enter project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter a brief description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !projectName}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Session"
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-4 text-sm">
              <div className="flex-1">
                <p className="font-semibold">Session Details</p>
                <p className="text-gray-600">
                  Session ID: {session?.session_id}
                </p>
                <p className="text-gray-600">
                  Expires: {new Date(session?.expires_at || "").toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  Files uploaded: {uploadProgress.filter((p) => p.status === "success").length}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Upload Options</Label>
                <div className="flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={autoParse}
                      onChange={(e) => setAutoParse(e.target.checked)}
                      className="rounded"
                    />
                    <span>Auto-parse PO files</span>
                  </label>
                  <Input
                    placeholder="Uploaded by"
                    value={uploadedBy}
                    onChange={(e) => setUploadedBy(e.target.value)}
                    className="w-32 text-sm"
                  />
                </div>
              </div>

              {/* File Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer",
                  "transition-colors hover:border-blue-400",
                  selectedFiles.length > 0 ? "border-green-400" : "border-gray-300"
                )}
              >
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                  accept=".xlsx,.xls,.csv,.pdf"
                />
                <label
                  htmlFor="file-input"
                  className="flex flex-col items-center gap-2 cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="font-semibold text-sm">
                      {selectedFiles.length > 0
                        ? `${selectedFiles.length} file(s) selected`
                        : "Drag files here or click to select"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Supports: Excel, CSV, PDF (Max 50MB each)
                    </p>
                  </div>
                </label>
              </div>

              {/* Upload Progress */}
              {uploadProgress.length > 0 && (
                <div className="space-y-2">
                  <Label>Files</Label>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {uploadProgress.map((item, idx) => (
                      <div
                        key={idx}
                        className="border rounded-lg p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">
                            {item.fileName}
                          </span>
                          {item.status === "success" && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                          {item.status === "error" && (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          {item.status === "uploading" && (
                            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                          )}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all",
                              item.status === "success"
                                ? "bg-green-600"
                                : item.status === "error"
                                ? "bg-red-600"
                                : "bg-blue-600"
                            )}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        {item.error && (
                          <p className="text-xs text-red-600">{item.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose()}
              >
                Done
              </Button>
              <Button
                onClick={handleUploadFiles}
                disabled={
                  isUploading ||
                  selectedFiles.length === 0 ||
                  uploadProgress.every((p) => p.status !== "pending")
                }
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  `Upload ${selectedFiles.length} file(s)`
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadDialog;
