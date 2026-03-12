export const API_CONFIG = {
  get BASE_URL() {
    return localStorage.getItem('API_BASE_URL_OVERRIDE') || import.meta.env.VITE_API_BASE_URL || '/api';
  },
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '120000'),
  UPLOAD: {
    MAX_SIZE: parseInt(import.meta.env.VITE_FILE_UPLOAD_MAX_SIZE || '52428800'),
    ALLOWED_TYPES: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv']
  }
}

export const ENDPOINTS = {
  HEALTH: '/health',
  PO: '/po',
  PROJECTS: '/projects',
  VENDORS: '/vendors',
  UPLOADS: '/uploads',
  BILLING: '/billing-po',
  DOCUMENTS: '/documents'
}
