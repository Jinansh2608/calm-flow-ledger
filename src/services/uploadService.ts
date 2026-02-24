import { apiRequest } from './api';
import { 
  SessionResponse, 
  StandardResponse, 
  UploadSession,
  UploadFile,
  UploadFileResponse,
  UploadSessionStats,
  UploadSessionMetadata
} from '@/types';

export const uploadService = {
  // 1. Create Upload Session
  createSession: async (metadata: UploadSessionMetadata, ttl_hours: number = 24, client_id?: number) => {
    try {
      const payload = {
        metadata: {
          project: metadata.project || '',
          project_name: metadata.project_name || metadata.project || '',
          description: metadata.description || '',
          department: metadata.department || '',
        },
        ttl_hours,
        ...(client_id && { client_id })
      };

      const response = await apiRequest<UploadSession>('/uploads/session', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return response.data || (response as unknown as UploadSession);
    } catch (error: unknown) {
      console.error('Failed to create upload session:', error);
      throw new Error(`Upload session creation failed: ${(error as Error).message}`);
    }
  },

  // 2. Upload File to Session
  uploadFile: async (
    sessionId: string,
    file: File,
    options?: {
      uploaded_by?: string;
      po_number?: string;
      auto_parse?: boolean;
    }
  ) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const params = new URLSearchParams();
      if (options?.uploaded_by) {
        params.append('uploaded_by', options.uploaded_by);
        formData.append('uploaded_by', options.uploaded_by);
      }
      if (options?.po_number) {
        params.append('po_number', options.po_number);
        formData.append('po_number', options.po_number);
      }
      if (options?.auto_parse !== undefined) {
        params.append('auto_parse', options.auto_parse ? 'true' : 'false');
        formData.append('auto_parse', options.auto_parse ? 'true' : 'false');
      }

      const response = await apiRequest<UploadFileResponse>(
        `/uploads/session/${sessionId}/files?${params}`,
        {
          method: 'POST',
          body: formData
        }
      );
      return response.data || (response as unknown as UploadFileResponse);
    } catch (error: unknown) {
      console.error(`Failed to upload file ${file.name}:`, error);
      throw new Error(`File upload failed: ${(error as Error).message}`);
    }
  },

  // 3. Get Session Details
  getSessionDetails: async (sessionId: string) => {
    try {
      const response = await apiRequest<UploadSession>(
        `/uploads/session/${sessionId}`
      );
      return response.data || (response as unknown as UploadSession);
    } catch (error: unknown) {
      console.error(`Failed to get session details for ${sessionId}:`, error);
      throw new Error(`Get session details failed: ${(error as Error).message}`);
    }
  },

  // 4. List Files in Session
  listSessionFiles: async (sessionId: string, skip: number = 0, limit: number = 50) => {
    try {
      const params = new URLSearchParams({
        skip: String(skip),
        limit: String(limit)
      });
      const response = await apiRequest<any>(
        `/uploads/session/${sessionId}/files?${params}`
      );
      // Handle wrapped response or direct response
      // Backends returns ListFilesResponse which has 'files' array property
      const data = response.data;
      
      if (Array.isArray(data)) return data;
      if (Array.isArray(response)) return response;
      if (Array.isArray((response as any).files)) return (response as any).files;
      
      return data?.data || data?.files || [];
    } catch (error: unknown) {
      console.error(`Failed to list session files for ${sessionId}:`, error);
      return []; // Return empty array as fallback
    }
  },

  // 5. Get Session Statistics
  getSessionStats: async (sessionId: string) => {
    try {
      const response = await apiRequest<UploadSessionStats>(
        `/uploads/session/${sessionId}/stats`
      );
      return response.data || (response as unknown as UploadSessionStats);
    } catch (error: unknown) {
      console.error(`Failed to get session stats for ${sessionId}:`, error);
      throw new Error(`Get session stats failed: ${(error as Error).message}`);
    }
  },

  // 6. Download File
  downloadFile: async (sessionId: string, fileId: string) => {
    try {
      const { AuthService } = await import('./api');
      const { API_CONFIG } = await import('@/config/api');

      const token = AuthService.getToken();
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/uploads/session/${sessionId}/files/${fileId}/download`,
        { headers }
      );

      if (!response.ok) throw new Error('Download failed');

      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ?.split('filename=')[1]
        ?.replace(/"/g, '')
        || `file-${fileId}`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  },

  // 7. Delete File
  deleteFile: async (sessionId: string, fileId: string) => {
    try {
      const response = await apiRequest<{ deleted: boolean }>(
        `/uploads/session/${sessionId}/files/${fileId}`,
        {
          method: 'DELETE'
        }
      );
      return response.data || (response as unknown as { deleted: boolean });
    } catch (error: unknown) {
      console.error(`Failed to delete file ${fileId}:`, error);
      throw new Error(`Delete file failed: ${(error as Error).message}`);
    }
  },

  // 8. Download All Files as ZIP
  // NOTE: Backend endpoint /uploads/session/{sessionId}/download-all is NOT IMPLEMENTED
  // This function provides graceful error handling and instructs user to download files individually
  downloadAllAsZip: async (sessionId: string) => {
    try {
      console.warn(
        'Bulk ZIP download endpoint not available on backend. ' +
        'Please download files individually using downloadFile(sessionId, fileId).'
      );
      
      throw new Error(
        'Bulk download feature is not available. ' +
        'Please use the individual file download option for each file, or contact support for batch download assistance.'
      );
    } catch (error) {
      console.error('Download all files failed:', error);
      throw error;
    }
  },

  // 9. Delete Session
  deleteSession: async (sessionId: string) => {
    try {
      const response = await apiRequest<{ session_id: string }>(
        `/uploads/session/${sessionId}`,
        {
          method: 'DELETE'
        }
      );
      // For deleteSession, backend returns { status, message, data: { session_id } }
      return response.data || (response as unknown as { session_id: string });
    } catch (error: unknown) {
      console.error(`Failed to delete session ${sessionId}:`, error);
      throw new Error(`Delete session failed: ${(error as Error).message}`);
    }
  }
};

