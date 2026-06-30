import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { roleValidationSchema, ALL_SYSTEM_PERMISSIONS, PERMISSION_GROUPS } from './roleValidation';

export default function RoleFormModal({ isOpen, onClose, role }) {
  const queryClient = useQueryClient();
  const isEditMode = !!role;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(roleValidationSchema),
    defaultValues: { name: '', permissions: [] }
  });

  const selectedPermissions = watch('permissions') || [];

  useEffect(() => {
    if (isEditMode && role) {
      setValue('name', role.name);
      setValue('permissions', role.permissions || []);
    } else {
      reset();
    }
  }, [role, isEditMode, setValue, reset]);

  // Bulk Selections
  const toggleAll = () => {
    const isAllSelected = selectedPermissions.length === ALL_SYSTEM_PERMISSIONS.length;
    setValue('permissions', isAllSelected ? [] : ALL_SYSTEM_PERMISSIONS, { shouldValidate: true });
  };

  const toggleCategory = (groupKey) => {
    const groupPerms = PERMISSION_GROUPS[groupKey];
    const isAllGroupSelected = groupPerms.every((p) => selectedPermissions.includes(p));

    if (isAllGroupSelected) {
      const remainingPerms = selectedPermissions.filter((p) => !groupPerms.includes(p));
      setValue('permissions', remainingPerms, { shouldValidate: true });
    } else {
      const mergedPerms = Array.from(new Set([...selectedPermissions, ...groupPerms]));
      setValue('permissions', mergedPerms, { shouldValidate: true });
    }
  };

  const saveRoleMutation = useMutation({
    mutationFn: async (formData) => {
      if (isEditMode) {
        await api.put(`/roles/${role._id}`, formData);
      } else {
        await api.post('/roles', formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(isEditMode ? 'Role updated.' : 'Role created.');
      reset();
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  });

  const onSubmit = (data) => saveRoleMutation.mutate(data);

  const isAdminRole = role?.name === 'admin';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? `Modify Role: ${role?.name}` : 'Create New System Role'} size="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Role Name */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Role Name</label>
          <input 
            {...register('name')} 
            type="text" 
            disabled={isAdminRole}
            placeholder="e.g. Supervisor" 
            className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none disabled:bg-zinc-50 dark:disabled:bg-zinc-900/50" 
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>

        {/* Shortcuts (Hidden for Admin Role) */}
        {!isAdminRole && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Bulk Selection Shortcuts</label>
            <div className="flex flex-wrap gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <button
                type="button"
                onClick={toggleAll}
                className={`rounded-full border px-3 py-1 text-xs font-semibold shadow-sm transition ${
                  selectedPermissions.length === ALL_SYSTEM_PERMISSIONS.length
                    ? 'bg-zinc-900 text-zinc-50 border-zinc-900 dark:bg-zinc-50 dark:text-zinc-950 dark:border-zinc-50'
                    : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900'
                }`}
              >
                {selectedPermissions.length === ALL_SYSTEM_PERMISSIONS.length ? 'Deselect All' : 'Select All'}
              </button>
              {Object.keys(PERMISSION_GROUPS).map((groupKey) => {
                const groupPerms = PERMISSION_GROUPS[groupKey];
                const isGroupActive = groupPerms.every((p) => selectedPermissions.includes(p));

                return (
                  <button
                    key={groupKey}
                    type="button"
                    onClick={() => toggleCategory(groupKey)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold shadow-sm transition capitalize ${
                      isGroupActive
                        ? 'bg-zinc-900 text-zinc-50 border-zinc-900 dark:bg-zinc-50 dark:text-zinc-950 dark:border-zinc-50'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {groupKey}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Individual Checkboxes */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">Configure Individual Privileges</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-56 overflow-y-auto pr-1">
            {ALL_SYSTEM_PERMISSIONS.map((perm) => (
              <label key={perm} className="flex items-center space-x-3 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition cursor-pointer">
                <input
                  type="checkbox"
                  value={perm}
                  disabled={isAdminRole}
                  {...register('permissions')}
                  className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:ring-zinc-900 disabled:opacity-50"
                />
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 capitalize">{perm.replace(':', ' ')}</span>
              </label>
            ))}
          </div>
          {errors.permissions && <p className="mt-2 text-xs text-red-500">{errors.permissions.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting || isAdminRole} className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-50 p-2.5 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:bg-zinc-400 transition">
          {isSubmitting ? 'Saving...' : isEditMode ? 'Update Role Privileges' : 'Create Custom Role'}
        </button>
      </form>
    </Modal>
  );
}