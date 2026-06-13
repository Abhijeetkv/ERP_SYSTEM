import api from './axios';

export const getSalesOrders = () => api.get('/sales-orders');

export const getSalesOrder = (id) => api.get(`/sales-orders/${id}`);

export const createSalesOrder = (data) => api.post('/sales-orders', data);

export const updateSalesOrder = (id, data) => api.put(`/sales-orders/${id}`, data);

export const deleteSalesOrder = (id) => api.delete(`/sales-orders/${id}`);

export const confirmSalesOrder = (id) => api.post(`/sales-orders/${id}/confirm`);

export const deliverSalesOrder = (id, lines) => api.post(`/sales-orders/${id}/deliver`, { lines });

export const cancelSalesOrder = (id) => api.post(`/sales-orders/${id}/cancel`);
