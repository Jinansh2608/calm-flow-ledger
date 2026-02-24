import { apiRequest } from './api';
import { HealthResponse } from '@/types';

export const healthService = {
  checkHealth: async () => {
    const response = await apiRequest<HealthResponse>('/health');
    return response.data;
  },

  getDetailedHealth: async () => {
    const response = await apiRequest<HealthResponse>('/health/detailed');
    return response.data;
  }
};
