import api from './axios';

export const getAuditLogs = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.module) params.append('module', filters.module);
  if (filters.action) params.append('action', filters.action);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  return api.get(`/audit-logs?${params.toString()}`);
};
