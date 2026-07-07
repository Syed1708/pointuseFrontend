// src/services/userService.js
import api from './api';

export const userService = {
  getAll: async (params) => {
    const res = await api.get('/users', { params });
    return res.data;
  },
  getProfile: async (token) => {
    const config = {};
    if (token) {
      config.headers = { Authorization: `Bearer ${token}` };
    }
    const res = await api.get('/users/profile', config);
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/users/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/users/create', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/users/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  },
  changePassword: async (currentPassword, newPassword) => {
    const res = await api.post('/users/change-password', { currentPassword, newPassword });
    return res.data;
  },
  uploadAvatar: async (formData) => {
    const res = await api.post('/users/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};