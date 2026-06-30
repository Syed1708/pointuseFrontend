import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { employeeCreateSchema, employeeEditSchema } from './employeeValidation';

export default function EmployeeFormModal({ isOpen, onClose, employee }) {
  const queryClient = useQueryClient();
  const isEditMode = !!employee; // Auto-detect mode [2]

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(isEditMode ? employeeEditSchema : employeeCreateSchema),
    defaultValues: { name: '', email: '', password: '', contractHours: '35', pinCode: '' }
  });

  useEffect(() => {
    if (isEditMode && employee) {
      setValue('name', employee.name);
      setValue('email', employee.email);
      setValue('contractHours', String(employee.contractHours || 35));
      const isOldHash = employee.pinCode && employee.pinCode.startsWith('$');
      setValue('pinCode', isOldHash ? '' : (employee.pinCode || ''));
    } else {
      reset();
    }
  }, [employee, isEditMode, setValue, reset]);

  const saveEmployeeMutation = useMutation({
    mutationFn: async (formData) => {
      if (isEditMode) {
        await api.put(`/users/${employee._id}`, formData);
      } else {
        await api.post('/employees/create', formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(isEditMode ? 'Employee updated.' : 'Employee created.');
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

  const onSubmit = (data) => saveEmployeeMutation.mutate(data);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? `Edit Employee: ${employee?.name}` : 'Add New Employee'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Full Name</label>
          <input {...register('name')} type="text" className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors" />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Email Address</label>
          <input {...register('email')} type="email" className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors" />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        {!isEditMode && (
          <div>
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Password</label>
            <input {...register('password')} type="password" className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors" />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Weekly Contract Hours</label>
          <input {...register('contractHours')} type="text" placeholder="e.g. 35" className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors" />
          {errors.contractHours && <p className="mt-1 text-xs text-red-500">{errors.contractHours.message}</p>}
        </div>

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
          {isSubmitting ? 'Saving...' : isEditMode ? 'Update Details' : 'Create Employee'}
        </button>
      </form>
    </Modal>
  );
}