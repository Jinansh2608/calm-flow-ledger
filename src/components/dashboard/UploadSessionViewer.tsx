import { useState, useEffect } from "react";
import {
  Download,
  Trash2,
  FileText,
  Package,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Archive,
} from "lucide-react";
import { uploadService } from "@/services/uploadService";
import { UploadSession, UploadFile, UploadSessionStats } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface UploadSessionViewerProps {
  session: UploadSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionDeleted?: () => void;
}

export const UploadSessionViewer = ({
  session,
  open,
  onOpenChange,
  onSessionDeleted,
}: UploadSessionViewerProps) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [stats, setStats] = useState<UploadSessionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);
  const [deleteSessionDialog, setDeleteSessionDialog] = useState(false);

  useEffect(() => {
    if (open && session) {
      loadSessionData();
    }
  }, [open, session]);

  const loadSessionData = async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const [filesData, statsData] = await Promise.all([
        uploadService.listSessionFiles(session.session_id),
        uploadService.getSessionStats(session.session_id),
      ]);
      setFiles(filesData);
      setStats(statsData);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load session data";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    if (!session) return;
    try {
      await uploadService.downloadFile(session.session_id, fileId);
      toast({
        title: "Download Started",
        description: `${fileName} is being downloaded.`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Download failed";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDownloadAllAsZip = async () => {
    if (!session) return;
    try {
      await uploadService.downloadAllAsZip(session.session_id);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Bulk download not available";
      toast({
        title: "Bulk Download Unavailable",
        description: errorMessage + " Download files individually using the download button next to each file.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFile = async () => {
    if (!session || !deleteFileId) return;
    try {
      await uploadService.deleteFile(session.session_id, deleteFileId);
      setFiles(files.filter((f) => f.id !== deleteFileId));
      toast({
        title: "File Deleted",
        description: "File has been deleted successfully.",
      });
      setDeleteFileId(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Delete failed";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDeleteSession = async () => {
    if (!session) return;
    try {
      await uploadService.deleteSession(session.session_id);
      toast({
        title: "Session Deleted",
        description: "Upload session has been deleted.",
      });
      setDeleteSessionDialog(false);
      onSessionDeleted?.();
      onOpenChange(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Delete failed";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getParseStatusBadge = (status?: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <Badge className="bg-green-100 text-green-800 flex gap-1 w-fit">
            <CheckCircle2 className="h-3 w-3" />
            Parsed
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-red-100 text-red-800 flex gap-1 w-fit">
            <AlertCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex gap-1 w-fit">
            <Loader2 className="h-3 w-3 animate-spin" />
            Pending
          </Badge>
        );
      default:
        return null;
    }
  };

  if (!session) return null;

  const isSessionExpired = new Date(session.expires_at) < new Date();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby="session-dialog-description">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <DialogTitle>Upload Session Details</DialogTitle>
                <DialogDescription id="session-dialog-description">
                  Session ID: {session.session_id}
                </DialogDescription>
              </div>
              <Badge
                variant={isSessionExpired ? "secondary" : "default"}
                className="whitespace-nowrap"
              >
                {session.status}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Session Metadata */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Project</p>
                <p className="font-semibold">{session.metadata.project || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Client</p>
                <p className="font-semibold">
                  {session.metadata.client_name || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="text-sm">{formatDate(session.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Expires</p>
                <p className={cn("text-sm", isSessionExpired && "text-red-600")}>
                  {formatDate(session.expires_at)}
                  {isSessionExpired && " (Expired)"}
                </p>
              </div>
            </div>

            {/* Session Description */}
            {session.metadata.description && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Description</p>
                <p className="text-sm bg-gray-50 p-3 rounded">
                  {session.metadata.description}
                </p>
              </div>
            )}

            {/* Session Statistics */}
            {stats && (
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-sm text-gray-600">Total Files</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.total_files}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <p className="text-sm text-gray-600">Total Size</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatFileSize(stats.total_size_bytes)}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <p className="text-sm text-gray-600">Downloads</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.total_downloads}
                  </p>
                </div>
              </div>
            )}

            {/* Files List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Files ({files.length})</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={loadSessionData}
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  {files.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDownloadAllAsZip}
                      disabled={isLoading}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Download All
                    </Button>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No files uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <p className="font-medium truncate">
                              {file.original_filename}
                            </p>
                            {file.po_number && (
                              <Badge variant="outline" className="text-xs">
                                {file.po_number}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span>{formatFileSize(file.file_size)}</span>
                            {file.is_compressed && (
                              <span className="text-green-600">
                                Compressed: {formatFileSize(file.compressed_size)}
                              </span>
                            )}
                            <span>{formatDate(file.upload_timestamp)}</span>
                            {file.parse_status &&
                              getParseStatusBadge(file.parse_status)}
                          </div>
                          {file.parse_error && (
                            <p className="text-xs text-red-600 mt-1">
                              Parse error: {file.parse_error}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleDownloadFile(file.id, file.original_filename)
                            }
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteFileId(file.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                variant="destructive"
                onClick={() => setDeleteSessionDialog(true)}
                disabled={isLoading}
              >
                Delete Session
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete File Confirmation */}
      <AlertDialog open={!!deleteFileId} onOpenChange={() => setDeleteFileId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete File?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The file will be permanently deleted
            from the upload session.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFile}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Session Confirmation */}
      <AlertDialog
        open={deleteSessionDialog}
        onOpenChange={setDeleteSessionDialog}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Delete Upload Session?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The entire upload session and all its
            files will be permanently deleted.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Session
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UploadSessionViewer;
