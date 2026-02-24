import { apiRequest } from './api';
import { Document } from '@/types';

export const documentService = {
  // 1. Upload Document
  uploadDocument: async (file: File, options: { project_id?: number; client_po_id?: number; po_number?: string; description?: string }) => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options.project_id) formData.append('project_id', String(options.project_id));
    if (options.client_po_id) formData.append('client_po_id', String(options.client_po_id));
    if (options.po_number) formData.append('po_number', options.po_number);
    if (options.description) formData.append('description', options.description);
    
    const response = await apiRequest<Document>('/documents/upload', {
      method: 'POST',
      body: formData
    });
    return response.data;
  },

  // 2. Get Documents for Project
  getProjectDocuments: async (projectId: number) => {
    const response = await apiRequest<{ documents: Document[] }>(`/documents/project/${projectId}`);
    return response.data;
  },

  // 3. Get Documents for PO
  getPODocuments: async (poId: number) => {
    const response = await apiRequest<{ documents: Document[] }>(`/documents/po/${poId}`);
    return response.data;
  },

  // 4. Get Single Document
  getDocumentDetails: async (docId: number) => {
    const response = await apiRequest<Document>(`/documents/${docId}`);
    return response.data;
  },

  // 5. Download Document
  downloadDocument: async (docId: number) => {
    const { AuthService } = await import('./api');
    const { API_CONFIG } = await import('@/config/api');
    
    const token = AuthService.getToken();
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/documents/download/${docId}`, { headers });
    
    if (!response.ok) throw new Error('Download failed');
    
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || `document-${docId}`;
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
};
