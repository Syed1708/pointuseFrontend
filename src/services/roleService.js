// src/services/roleService.js
import api from './api';

export const roleService = {
  getAll: async (params) => {
    const res = await api.get('/roles', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/roles/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/roles', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/roles/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/roles/${id}`);
    return res.data;
  }
};