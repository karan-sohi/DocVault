import axios from 'axios';

// const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const BASE = 'http://localhost:3000'

export const api = axios.create({ baseURL: BASE });

// ── Users ──────────────────────────────────────────────────
export const getUsers = () => api.get('/users').then(r => r.data);
export const createUser = (data: { name: string; email: string }) =>
  api.post('/users', data).then(r => r.data);
export const updateUser = (id: string, data: { name?: string; email?: string }) =>
  api.put(`/users/${id}`, data).then(r => r.data);
export const deleteUser = (id: string) => api.delete(`/users/${id}`);

// ── Documents ──────────────────────────────────────────────
export const getDocuments = () => api.get('/documents').then(r => r.data);
export const getDocument = (id: string) => api.get(`/documents/${id}`).then(r => r.data);
export const deleteDocument = (id: string) => api.delete(`/documents/${id}`);

export const uploadDocument = (formData: FormData) =>
  api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then(r => r.data);

export const uploadVersion = (documentId: string, formData: FormData) =>
  api.post(`/documents/${documentId}/versions`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);

export const downloadVersion = (documentId: string, versionId: string) => {
  window.open(`${BASE}/documents/${documentId}/versions/${versionId}/download`, '_blank');
};

// ── Notifications ──────────────────────────────────────────
export const createNotificationRule = (data: any) =>
  api.post('/notifications/rules', data).then(r => r.data);
export const deleteNotificationRule = (id: string) =>
  api.delete(`/notifications/rules/${id}`);
export const triggerNotificationCheck = () =>
  api.post('/notifications/trigger-check');
