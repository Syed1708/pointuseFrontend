// src/services/employeeService.js
import api from './api';

export const employeeService = {
  getAll: async (params) => {
    const res = await api.get('/employees', { params });
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/employees/create', data);
    return res.data;
  },
  getColleagues: async () => {
    const res = await api.get('/employees/colleagues');
    return res.data;
  }
};