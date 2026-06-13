import api from './axios';

export const getBOMs = () => api.get('/boms');

export const getBOM = (id) => api.get(`/boms/${id}`);

export const createBOM = (data) => api.post('/boms', data);

export const updateBOM = (id, data) => api.put(`/boms/${id}`, data);

export const deleteBOM = (id) => api.delete(`/boms/${id}`);
