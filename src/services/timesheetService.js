// src/services/timesheetService.js
import api from './api';

export const timesheetService = {
  getAdminList: async (params) => {
    const res = await api.get('/timeclock/admin/list', { params });
    return res.data;
  },
  createManual: async (data) => {
    const res = await api.post('/timeclock/admin/create', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/timeclock/admin/${id}`, data);
    return res.data;
  },
  approve: async (id) => {
    const res = await api.put(`/timeclock/admin/${id}/approve`);
    return res.data;
  },
  unlock: async (id) => {
    const res = await api.put(`/timeclock/admin/${id}/unlock`);
    return res.data;
  },
  approveAll: async (payload) => {
    const res = await api.put('/timeclock/admin/approve-all', payload);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/timeclock/admin/${id}`);
    return res.data;
  }
};