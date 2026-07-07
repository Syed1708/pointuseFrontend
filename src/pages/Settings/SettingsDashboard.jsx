import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiHome, FiMapPin, FiCamera, FiSave, FiSettings } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

// Zod Schema allowing null/blank coordinates to bypass geofencing [3]
const settingsFormSchema = z.object({
  name: z.string().min(2, "Le nom du restaurant doit comporter au moins 2 caractères"),
  address: z.string().min(5, "L'adresse doit comporter au moins 5 caractères"),
  latitude: z.preprocess((val) => val === "" || val === undefined ? null : Number(val), z.number().nullable()),
  longitude: z.preprocess((val) => val === "" || val === undefined ? null : Number(val), z.number().nullable()),
  allowedRadiusMeters: z.preprocess((val) => Number(val || 100), z.number().min(5, "Le rayon minimum est de 5 mètres")),
});

export default function SettingsDashboard() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  // 1. Fetch current settings [3]
  const { data: settings, isLoading } = useQuery({
    queryKey: ['live-settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    }
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(settingsFormSchema)
  });

  // Pre-fill form on mount [2]
  useEffect(() => {
    if (settings) {
      setValue('name', settings.name);
      setValue('address', settings.address);
      setValue('latitude', settings.latitude === null ? '' : settings.latitude);
      setValue('longitude', settings.longitude === null ? '' : settings.longitude);
      setValue('allowedRadiusMeters', settings.allowedRadiusMeters || 100);
    }
  }, [settings, setValue]);

  // 2. Mutation: Save Text Settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (formData) => {
      await api.put('/settings', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-settings'] });
      toast.success('Configuration saved successfully.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save configuration.');
    }
  });

  // 3. Mutation: Upload Logo [3]
  const uploadLogoMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await api.post('/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-settings'] });
      toast.success('Logo uploaded successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Logo upload failed.');
    }
  });

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadLogoMutation.mutate(file);
    }
  };

  const onSubmit = (data) => updateSettingsMutation.mutate(data);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-900 dark:border-zinc-50 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Restaurant Configurations</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Configure global business profiles, branding logo, and geofencing coordinates.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Side: Logo Uploader Card [2] */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Brand Logo</p>
          <div className="relative group h-24 w-24 mb-4">
            {settings?.logo ? (
              <img src={settings.logo} className="h-24 w-24 rounded-xl object-contain border border-zinc-200 dark:border-zinc-800" alt="Logo" />
            ) : (
              <div className="h-24 w-24 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 text-zinc-400">
                <FiSettings className="h-8 w-8" />
              </div>
            )}
            <button
              onClick={() => fileInputRef.current.click()}
              className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
            >
              <FiCamera className="h-6 w-6" />
            </button>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleLogoChange} accept="image/*" className="hidden" />
          <button onClick={() => fileInputRef.current.click()} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Upload new logo
          </button>
        </div>

        {/* Right Side: Text Settings Form */}
        <div className="md:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 pb-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center">
              <FiHome className="mr-2 h-4 w-4 text-indigo-500" /> Restaurant Profile
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Restaurant Name</label>
                <input {...register('name')} type="text" className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900" />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Address</label>
                <input {...register('address')} type="text" className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900" />
                {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
              </div>
            </div>

            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 pt-4 pb-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center">
              <FiMapPin className="mr-2 h-4 w-4 text-emerald-500" /> Geofencing Coordinates
            </h3>
            <p className="text-[10px] text-zinc-400">Leave Latitude and Longitude blank if you want to bypass the geofencing check completely [2].</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Latitude</label>
                <input {...register('latitude')} type="text" placeholder="e.g. 48.8704" className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900" />
                {errors.latitude && <p className="text-xs text-red-500 mt-1">{errors.latitude.message}</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Longitude</label>
                <input {...register('longitude')} type="text" placeholder="e.g. 2.3322" className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900" />
                {errors.longitude && <p className="text-xs text-red-500 mt-1">{errors.longitude.message}</p>}
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Allowed Radius (Meters)</label>
                <input {...register('allowedRadiusMeters')} type="number" className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900" />
                {errors.allowedRadiusMeters && <p className="text-xs text-red-500 mt-1">{errors.allowedRadiusMeters.message}</p>}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-50 px-4 py-2 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:bg-zinc-400 transition shadow-sm"
              >
                <FiSave className="mr-2 h-4 w-4" /> Save Configuration
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}