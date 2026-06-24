import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { roleValidationSchema, PERMISSION_GROUPS, ALL_SYSTEM_PERMISSIONS } from './roleValidation';

export default function RoleEditModal({ isOpen, onClose, role }) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(roleValidationSchema),
  });

  const selectedPermissions = watch('permissions') || [];

  // Pre-populate input fields whenever the selected 'role' prop changes [2]
  useEffect(() => {
    if (role) {
      setValue('name', role.name);
      setValue('permissions', role.permissions || []);
    }
  }, [role, setValue]);

  // ==========================================
  // DYNAMIC BULK TOGGLE HELPERS
  // ==========================================
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

  const editRoleMutation = useMutation({
    mutationFn: async (updatedData) => {
      await api.put(`/roles/${role._id}`, updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role privileges updated successfully.');
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update role.');
    }
  });

  const onSubmit = (data) => editRoleMutation.mutate(data);

  const isAdmin = role?.name === 'admin';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Modify Role Privileges: ${role?.name}`}>
  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
    
    {/* Role Name */}
    <div>
      <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
        Role Name
      </label>
      {/* 🛑 Input: Upgraded with dark:border-zinc-800, dark:bg-zinc-900, dark:text-zinc-50, and custom disabled colors */}
      <input 
        {...register('name')} 
        type="text" 
        disabled={isAdmin} 
        className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors disabled:bg-zinc-50 dark:disabled:bg-zinc-900/50 disabled:text-zinc-500 dark:disabled:text-zinc-600" 
      />
      {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
    </div>

    {/* Dynamic Toolbar Selector */}
    {!isAdmin && (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
          Bulk Selection Shortcuts
        </label>
        {/* 🛑 Divider border: Upgraded with dark:border-zinc-800 */}
        <div className="flex flex-wrap gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 transition-colors">
          
          {/* Master Select All Toggle Button */}
          <button
            type="button"
            onClick={toggleAll}
            className={`rounded-full border px-3 py-1 text-xs font-semibold shadow-sm transition-all ${
              selectedPermissions.length === ALL_SYSTEM_PERMISSIONS.length
                ? 'bg-zinc-900 text-zinc-50 border-zinc-900 dark:bg-zinc-50 dark:text-zinc-950 dark:border-zinc-50'
                : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            {selectedPermissions.length === ALL_SYSTEM_PERMISSIONS.length ? 'Deselect All' : 'Select All'}
          </button>

          {/* Category Toggle Buttons */}
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
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {groupKey}
              </button>
            );
          })}
        </div>
      </div>
    )}

    {/* Checkbox Grid */}
    <div>
      <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">
        Configure Individual Privileges
      </label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-56 overflow-y-auto pr-1">
        {ALL_SYSTEM_PERMISSIONS.map((perm) => (
          /* 🛑 Checkbox Card: Upgraded with dark:border-zinc-800, dark:hover:bg-zinc-900/40 */
          <label 
            key={perm} 
            className="flex items-center space-x-3 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition cursor-pointer"
          >
            {/* 🛑 Input: Upgraded with dark:border-zinc-700, dark:bg-zinc-900, and dark:focus:ring-zinc-100 */}
            <input
              type="checkbox"
              value={perm}
              disabled={isAdmin}
              {...register('permissions')}
              className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:ring-zinc-900 dark:focus:ring-zinc-100 disabled:opacity-50 cursor-pointer"
            />
            {/* 🛑 Label Text: Upgraded with dark:text-zinc-300 */}
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 capitalize">
              {perm.replace(':', ' ')}
            </span>
          </label>
        ))}
      </div>
      {errors.permissions && (
        <p className="mt-2 text-xs text-red-500">{errors.permissions.message}</p>
      )}
    </div>

    {/* 🛑 Submit Button: Upgraded with dark:bg-zinc-50, dark:text-zinc-950, and custom disabled colors */}
    <button 
      type="submit" 
      disabled={isSubmitting || isAdmin} 
      className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-50 p-2.5 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:bg-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 transition-all"
    >
      {isSubmitting ? 'Updating...' : 'Update Role Privileges'}
    </button>
  </form>
</Modal>
  );
}