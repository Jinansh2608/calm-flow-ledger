import { useState, useEffect } from "react";
import {
  Upload,
  Clock,
  FileText,
  Plus,
  History,
  AlertCircle,
} from "lucide-react";
import { uploadService } from "@/services/uploadService";
import { UploadSession, Client } from "@/types";
import { FileUploadDialog } from "./FileUploadDialog";
import { UploadSessionViewer } from "./UploadSessionViewer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface FileUploadSectionProps {
  clients?: Client[];
  onFilesUploaded?: (session: UploadSession) => void;
}

interface SessionItem {
  session: UploadSession;
  status: "active" | "expired";
}

export const FileUploadSection = ({
  clients = [],
  onFilesUploaded,
}: FileUploadSectionProps) => {
  const { toast } = useToast();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [sessionViewerOpen, setSessionViewerOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<UploadSession | null>(
    null
  );
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load sessions from localStorage (for demo purposes)
    loadSessions();
  }, []);

  const loadSessions = () => {
    try {
      const stored = localStorage.getItem("upload_sessions");
      if (stored) {
        const parsedSessions = JSON.parse(stored) as UploadSession[];
        const sessionItems: SessionItem[] = parsedSessions.map((session) => ({
          session,
          status: new Date(session.expires_at) > new Date() ? "active" : "expired",
        }));
        setSessions(sessionItems);
      }
    } catch (error) {
      console.error("Failed to load sessions from localStorage:", error);
    }
  };

  const handleSessionCreated = (session: UploadSession) => {
    // Save to localStorage
    const stored = localStorage.getItem("upload_sessions") || "[]";
    const sessions = JSON.parse(stored) as UploadSession[];
    sessions.unshift(session);
    localStorage.setItem("upload_sessions", JSON.stringify(sessions.slice(0, 10))); // Keep last 10

    loadSessions();
    onFilesUploaded?.(session);
    setUploadDialogOpen(false);

    toast({
      title: "Session Created",
      description: `Files uploaded to session ${session.session_id}`,
    });
  };

  const handleViewSession = (session: UploadSession) => {
    setSelectedSession(session);
    setSessionViewerOpen(true);
  };

  const handleRefreshSessions = async () => {
    setIsLoading(true);
    try {
      loadSessions();
      toast({
        title: "Refreshed",
        description: "Sessions list updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh sessions.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const activeSessions = sessions.filter((s) => s.status === "active");
  const expiredSessions = sessions.filter((s) => s.status === "expired");

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Upload className="h-6 w-6 text-blue-600" />
              File Upload Manager
            </h2>
            <p className="text-gray-600 mt-1">
              Upload and manage purchase orders with automatic parsing
            </p>
          </div>
          <Button
            onClick={() => setUploadDialogOpen(true)}
            size="lg"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Upload
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <p className="text-sm text-gray-600">Active Sessions</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {activeSessions.length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <p className="text-sm text-gray-600">Expired Sessions</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {expiredSessions.length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-100">
            <p className="text-sm text-gray-600">Total Files</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {sessions.reduce((sum, s) => sum + s.session.file_count, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Start Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 items-start">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900">Upload Guide</p>
          <ul className="text-sm text-amber-800 mt-2 space-y-1 list-disc list-inside">
            <li>Create a new session with project details and optional client selection</li>
            <li>Upload PDF, Excel (.xlsx, .xls) or CSV files (max 50MB each)</li>
            <li>Enable auto-parse to automatically extract PO data</li>
            <li>Sessions expire after the configured TTL (max 72 hours)</li>
            <li>Download files individually or all at once as ZIP</li>
          </ul>
        </div>
      </div>

      {/* Sessions List */}
      {sessions.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Sessions
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshSessions}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </div>

          {activeSessions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Active Sessions</h4>
              <div className="space-y-2">
                {activeSessions.map(({ session }) => (
                  <SessionCard
                    key={session.session_id}
                    session={session}
                    onView={() => handleViewSession(session)}
                  />
                ))}
              </div>
            </div>
          )}

          {expiredSessions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700 opacity-60">Expired Sessions</h4>
              <div className="space-y-2 opacity-60">
                {expiredSessions.map(({ session }) => (
                  <SessionCard
                    key={session.session_id}
                    session={session}
                    onView={() => handleViewSession(session)}
                    isExpired
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No upload sessions yet</p>
          <p className="text-gray-500 text-sm mt-1">
            Click "New Upload" to create your first upload session
          </p>
        </div>
      )}

      {/* Dialogs */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        clients={clients}
        onSessionCreated={handleSessionCreated}
      />

      <UploadSessionViewer
        session={selectedSession}
        open={sessionViewerOpen}
        onOpenChange={setSessionViewerOpen}
        onSessionDeleted={loadSessions}
      />
    </div>
  );
};

// Session Card Component
interface SessionCardProps {
  session: UploadSession;
  onView: () => void;
  isExpired?: boolean;
}

const SessionCard = ({ session, onView, isExpired }: SessionCardProps) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={cn(
        "border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer",
        isExpired
          ? "bg-gray-50 border-gray-200"
          : "bg-white border-blue-200 hover:border-blue-300"
      )}
      onClick={onView}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold truncate text-sm">
              {session.metadata.project || "Untitled Session"}
            </p>
            <Badge variant={isExpired ? "secondary" : "default"}>
              {session.file_count} files
            </Badge>
          </div>
          <p className="text-xs text-gray-600 font-mono truncate">
            {session.session_id}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={(e) => {
          e.stopPropagation();
          onView();
        }}>
          View
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        {session.metadata.client_name && (
          <div className="bg-blue-50 px-2 py-1 rounded">
            <p className="text-gray-600">Client</p>
            <p className="font-medium truncate">
              {session.metadata.client_name}
            </p>
          </div>
        )}
        <div className="bg-purple-50 px-2 py-1 rounded flex items-center gap-1">
          <Clock className="h-3 w-3 text-gray-600" />
          <div>
            <p className="text-gray-600">Expires</p>
            <p className={cn(
              "font-medium",
              isExpired && "text-red-600"
            )}>
              {formatDate(session.expires_at)}
            </p>
          </div>
        </div>
        <div className="bg-green-50 px-2 py-1 rounded">
          <p className="text-gray-600">Created</p>
          <p className="font-medium">{formatDate(session.created_at)}</p>
        </div>
      </div>

      {session.metadata.description && (
        <p className="text-xs text-gray-600 mt-3 line-clamp-2">
          {session.metadata.description}
        </p>
      )}
    </div>
  );
};

export default FileUploadSection;
