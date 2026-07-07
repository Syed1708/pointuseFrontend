// src/services/scheduleService.js
import api from './api';

export const scheduleService = {
  getGrid: async (weekStartDate) => {
    const res = await api.get('/schedules/grid', { params: { weekStartDate } });
    return res.data;
  },
  save: async (payload) => {
    const res = await api.post('/schedules/save', payload);
    return res.data;
  },
  clone: async (payload) => {
    const res = await api.post('/schedules/clone', payload);
    return res.data;
  },
  publish: async (weekStartDate) => {
    const res = await api.post('/schedules/publish', { weekStartDate });
    return res.data;
  },
  downloadPdf: async (weekStartDate) => {
    const res = await api.get('/schedules/download-pdf', {
      params: { weekStartDate },
      responseType: 'blob'
    });
    return res.data;
  },
  getMySchedule: async (weekStartDate) => {
    const res = await api.get('/schedules/my-schedule', { params: { weekStartDate } });
    return res.data;
  },
  downloadMyPdf: async (weekStartDate) => {
    const res = await api.get('/schedules/my-schedule-pdf', {
      params: { weekStartDate },
      responseType: 'blob'
    });
    return res.data;
  }
};