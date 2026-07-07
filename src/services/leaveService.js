// src/services/leaveService.js
import api from './api';

export const leaveService = {
  submit: async (data) => {
    const res = await api.post('/leaves', data);
    return res.data;
  },
  getMyRequests: async () => {
    const res = await api.get('/leaves/my-requests');
    return res.data;
  },
  getAdminList: async () => {
    const res = await api.get('/leaves/admin/list');
    return res.data;
  },
  updateStatus: async (id, status) => {
    const res = await api.put(`/leaves/admin/${id}/status`, { status });
    return res.data;
  }
};