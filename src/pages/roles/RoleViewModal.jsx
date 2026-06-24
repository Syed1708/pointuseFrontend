import React from 'react';
import Modal from '../../components/Modal';

export default function RoleViewModal({ isOpen, onClose, role }) {
  const perms = role?.permissions || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Role Privileges: ${role?.name}`}>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-50 uppercase tracking-wider">Role Name</p>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 capitalize mt-0.5">{role?.name}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Active System Permissions ({perms.length})
          </p>
          
          {perms.length === 0 ? (
            <p className="text-sm text-zinc-500 italic">No privileges assigned to this role.</p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-1">
              {perms.map((perm) => (
                <span 
                  key={perm} 
                  className="inline-flex items-center rounded-md bg-zinc-50  px-2.5 py-1 text-xs font-semibold text-zinc-700 border border-zinc-200 capitalize"
                >
                  {perm.replace(':', ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}