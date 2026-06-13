import api from './axios';

export const getStockLedger = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.productId) params.append('productId', filters.productId);
  if (filters.movementType) params.append('movementType', filters.movementType);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  return api.get(`/stock-ledger?${params.toString()}`);
};

export const adjustStock = (data) => api.post('/stock-ledger/adjust', data);
