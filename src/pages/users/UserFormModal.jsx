import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { userFormSchema } from './userValidation';

export default function UserFormModal({ isOpen, onClose, user, isEmployeeModule = false }) {
  const queryClient = useQueryClient();
  const isEditMode = !!user; // Auto-detects if we are in Edit Mode [2]

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(userFormSchema),
    defaultValues: { name: '', email: '', password: '', contractHours: '35', pinCode: '' }
  });

  // 1. Fetch available roles to populate the dropdown (Only runs if NOT in the Employee module)
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/roles');
      return res.data;
    },
    enabled: !isEmployeeModule // Avoids unnecessary API requests in the Employee module
  });

  const rolesList = Array.isArray(roles) ? roles : (roles.docs || []);

  // 2. Pre-populate input fields dynamically [2]
  useEffect(() => {
    if (isEditMode && user) {
      setValue('name', user.name);
      setValue('email', user.email);
      setValue('contractHours', String(user.contractHours || 35));
      
      const isOldHash = user.pinCode && user.pinCode.startsWith('$');
      setValue('pinCode', isOldHash ? '' : (user.pinCode || ''));
      setValue('role', user.role?._id || '');
    } else {
      reset(); // Reset to clean defaults in Create Mode
    }
  }, [user, isEditMode, setValue, reset]);

  // 3. Mutation: Handles both CREATE and EDIT operations dynamically!
  const saveUserMutation = useMutation({
    mutationFn: async (formData) => {
      if (isEditMode) {
        // Edit Endpoint (Uses general user update route) [2]
        await api.put(`/users/${user._id}`, formData);
      } else {
        // Create Endpoint (Switches path depending on the active module) [2]
        const createUrl = isEmployeeModule ? '/employees/create' : '/users/create';
        await api.post(createUrl, formData);
      }
    },
    onSuccess: () => {
      // Invalidate both caches to keep all grids synchronized [3]
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      
      toast.success(isEditMode ? 'Profile details updated.' : 'Account created successfully.');
      reset();
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  });

  const handleGeneratePin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setValue('pinCode', randomPin, { shouldValidate: true });
  };

  const onSubmit = (data) => saveUserMutation.mutate(data);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditMode ? `Edit Profile: ${user?.name}` : isEmployeeModule ? 'Add New Employee' : 'Create New User'} 
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Full Name</label>
          <input {...register('name')} type="text" className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 focus:outline-none transition-colors" />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Email Address</label>
          <input {...register('email')} type="email" className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 focus:outline-none transition-colors" />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        {/* Password (Hidden in Edit Mode) */}
        {!isEditMode && (
          <div className="animate-in fade-in duration-100">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Password</label>
            <input {...register('password')} type="password" className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 focus:outline-none transition-colors" />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>
        )}

        {/* Role Selector (Hidden in Employee Module) */}
        {!isEmployeeModule && (
          <div className="animate-in fade-in duration-100">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Assign Role</label>
            <select {...register('role')} className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors">
              <option value="">Select a role...</option>
              {rolesList.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
            {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>}
          </div>
        )}

        {/* Contract Hours */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Weekly Contract Hours</label>
          <input {...register('contractHours')} type="text" placeholder="e.g. 35" className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors" />
          {errors.contractHours && <p className="mt-1 text-xs text-red-500">{errors.contractHours.message}</p>}
        </div>

        {/* PIN Code */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Pin Code (Optional)</label>
          <div className="mt-1 flex space-x-2">
            <input {...register('pinCode')} type="text" placeholder={isEditMode ? "Leave empty to keep current" : "e.g. 1234"} className="block flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors" />
            {!isEditMode && (
              <button type="button" onClick={handleGeneratePin} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shadow-sm">
                Generate
              </button>
            )}
          </div>
          {errors.pinCode && <p className="mt-1 text-xs text-red-500">{errors.pinCode.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-50 p-2.5 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:bg-zinc-400 dark:disabled:bg-zinc-800 transition-all">
          {isSubmitting ? 'Saving...' : isEditMode ? 'Update Details' : 'Create Account'}
        </button>
      </form>
    </Modal>
  );
}