import { apiRequest } from './api';
import { Project, StandardResponse, FinancialSummary, BillingPO, BillingPODetails, PLAnalysis, BillingLineItem } from '@/types';

export const projectService = {
  // 1. Get All Projects
  getAllProjects: async (bypassCache: boolean = false) => {
    try {
      const response: any = await apiRequest<any>(`/projects?limit=1000`, { bypassCache } as any);
      // Handle multiple possible response structures
      let projects = [];
      if (response?.data?.projects) {
        projects = response.data.projects;
      } else if (response?.projects) {
        projects = response.projects;
      } else if (Array.isArray(response?.data)) {
        projects = response.data;
      } else if (Array.isArray(response)) {
        projects = response;
      }
      return { projects: projects };
    } catch (error: any) {
      console.warn("Failed to fetch projects:", error.message);
      return { projects: [] };
    }
  },

  // 2. Get Single Project
  getProjectDetails: async (projectId: number) => {
    const response: any = await apiRequest<any>(`/projects/${projectId}`);
    return response.data || response;
  },

  // 3. Create Project
  createProject: async (request: Partial<Project>) => {
    const response: any = await apiRequest<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return response.project || response.data || response;
  },

  // 4. Update Project
  updateProject: async (projectId: number, request: Partial<Project>) => {
    const response: any = await apiRequest<any>(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(request)
    });
    return response.data || response;
  },

  // 5. Delete Project
  deleteProject: async (projectId: number) => {
    const response = await apiRequest<{ success: boolean; message: string }>(`/projects/${projectId}`, {
      method: 'DELETE'
    });
    return response.data;
  },

  // 6. Project Financial Summary
  getProjectFinancialSummary: async (projectId: number) => {
    const response = await apiRequest<FinancialSummary>(`/projects/${projectId}/financial-summary`);
    return response.data;
  },

  // 7. Search Projects
  searchProjects: async (query: string) => {
    const params = new URLSearchParams({ q: query });
    const response: any = await apiRequest<any>(`/projects/search?${params}`);
    return response.data || response;
  },
  
  // Billing POs
  createBillingPO: async (projectId: number, request: { po_number: string; amount: number; status?: string; description?: string }) => {
    const response = await apiRequest<BillingPO>(`/projects/${projectId}/billing-po`, {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return response.data;
  },

  getBillingPODetails: async (billingPoId: string) => {
    const response = await apiRequest<BillingPODetails>(`/billing-po/${billingPoId}`);
    return response.data;
  },

  getProjectBillingSummary: async (projectId: number) => {
    const response = await apiRequest<any>(`/projects/${projectId}/billing-summary`);
    return response.data;
  },
  
  getProjectPLAnalysis: async (projectId: number) => {
    const response = await apiRequest<PLAnalysis>(`/projects/${projectId}/pl-analysis`);
    return response.data;
  },

  addBillingLineItem: async (billingPoId: string, item: { item_description: string; quantity: number; unit_price: number; amount: number }) => {
    const response = await apiRequest<BillingLineItem>(`/billing-po/${billingPoId}/line-items`, {
      method: 'POST',
      body: JSON.stringify(item)
    });
    return response.data;
  },

  getBillingLineItems: async (billingPoId: string) => {
    const response = await apiRequest<any>(`/billing-po/${billingPoId}/line-items`);
    const data = response.data;
    if (Array.isArray(data)) return data;
    return data?.data || data?.line_items || [];
  },

  updateBillingPO: async (billingPoId: string, request: { po_number?: string; amount?: number }) => {
    const response = await apiRequest<BillingPO>(`/billing-po/${billingPoId}`, {
      method: 'PUT',
      body: JSON.stringify(request)
    });
    return response.data;
  },

  approveBillingPO: async (billingPoId: string, approvedBy: string) => {
    const response = await apiRequest<BillingPO>(`/billing-po/${billingPoId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approved_by: approvedBy })
    });
    return response.data;
  },
  
  // Project Specifications
  getProjectLineItems: async (projectId: number) => {
    try {
      const response: any = await apiRequest<any>(`/projects/${projectId}/line-items`);
      const data = response.data || response;
      return data.line_items || [];
    } catch (error: any) {
      console.error("Failed to fetch project specifications:", error);
      return [];
    }
  }
};
