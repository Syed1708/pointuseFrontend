import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { userCreateSchema } from './userValidation';

export default function UserAddModal({ isOpen, onClose, roles }) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(userCreateSchema),
  });

  // Handle Random PIN Generator
  const handleGeneratePin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setValue('pinCode', randomPin, { shouldValidate: true });
  };

  // Mutation: Create User
  const createUserMutation = useMutation({
    mutationFn: async (newUser) => {
      await api.post('/users/create', newUser); // Matches your backend route
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] }); // Refreshes table instantly [3]
      toast.success('Employee created successfully.');
      reset();
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create employee.');
    }
  });

  const onSubmit = (data) => createUserMutation.mutate(data);

  // 🧠 Extract the array safely [3]
const rolesList = Array.isArray(roles) ? roles : (roles.docs || []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Employee">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Full Name</label>
          <input {...register('name')} type="text" className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors" />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Email Address</label>
          <input {...register('email')} type="email" className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors" />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Password</label>
          <input {...register('password')} type="password" className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors" />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Assign Role</label>
          <select {...register('role')} className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800  dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none bg-wh
          ite  transition-colors">
            <option value="">Select a role...</option>
            {rolesList.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
          {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>}
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Pin Code (4-6 digits, Optional)</label>
          <div className="mt-1 flex space-x-2">
            <input {...register('pinCode')} type="text" placeholder="e.g. 1234" className="block flex-1 rounded-lg border border-zinc-200 p-2 text-sm focus:border-zinc-900 focus:outline-none" />
            <button type="button" onClick={handleGeneratePin} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition shadow-sm">
              Generate
            </button>
          </div>
          {errors.pinCode && <p className="mt-1 text-xs text-red-500">{errors.pinCode.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-zinc-900 p-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:bg-zinc-400 transition">
          {isSubmitting ? 'Saving...' : 'Create Employee'}
        </button>
      </form>
    </Modal>
  );
}