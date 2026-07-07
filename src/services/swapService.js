// src/services/swapService.js
import api from './api';

export const swapService = {
  submit: async (data) => {
    const res = await api.post('/swaps', data);
    return res.data;
  },
  getMySwaps: async () => {
    const res = await api.get('/swaps/my-swaps');
    return res.data;
  },
  getAdminList: async () => {
    const res = await api.get('/swaps/admin/list');
    return res.data;
  },
  updateStatus: async (id, status) => {
    const res = await api.put(`/swaps/admin/${id}/status`, { status });
    return res.data;
  },
  respond: async (id, accept) => {
    const res = await api.put(`/swaps/${id}/respond`, { accept });
    return res.data;
  }
};