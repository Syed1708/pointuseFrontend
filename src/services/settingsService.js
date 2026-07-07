// src/services/settingsService.js
import api from './api';

export const settingsService = {
  get: async () => {
    const res = await api.get('/settings');
    return res.data;
  },
  update: async (data) => {
    const res = await api.put('/settings', data);
    return res.data;
  },
  uploadLogo: async (formData) => {
    const res = await api.post('/settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};