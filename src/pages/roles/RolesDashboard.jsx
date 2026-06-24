import React, { useState } from 'react';
import GenericModule from '../../components/GenericModule';
import RoleAddModal from './RoleAddModal';
import RoleEditModal from './RoleEditModal';
import RoleViewModal from './RoleViewModal';

export default function RolesDashboard() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [viewingRole, setViewingRole] = useState(null);

  // 1. Define Columns with Shadcn Badge aesthetics [2]
  const columns = [
    {
      header: 'Role Name',
      accessorKey: 'name',
      render: (row) => (
        <span className="font-semibold text-zinc-900 dark:text-zinc-50 capitalize">
          {row.name}
        </span>
        
      )
    },
    {
      header: 'Active Privileges',
      render: (row) => {
        const perms = row.permissions || [];
        
        if (perms.length === 0) {
          return <span className="text-zinc-400 text-xs">No privileges assigned</span>;
        }

        // Show the first 3 permissions as beautiful pills, and a "+X more" badge for the rest [2]
        return (
          <div className="flex flex-wrap gap-1.5 max-w-lg">
            {perms.slice(0, 3).map((perm) => (
              <span 
                key={perm} 
                className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 border border-zinc-200 capitalize"
              >
                {perm.replace(':', ' ')}
              </span>
            ))}
            {perms.length > 3 && (
              <span className="inline-flex items-center rounded-md bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-500 border border-zinc-200">
                +{perms.length - 3} more
              </span>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Block */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">System Roles</h1>
        <p className="text-sm text-gray-500">Configure and manage specific access levels and privileges across your workforce.</p>
      </div>

      {/* Reusable Data Table Wrapper */}
      <GenericModule
        queryKey="roles"
        fetchApiUrl="/roles"
        deleteApiUrl="/roles"
        columns={columns}
        addBtnLabel="Create New Role"
        onAddClick={() => setIsAddOpen(true)}
        onEditClick={(role) => setEditingRole(role)}
        onViewClick={(role) => setViewingRole(role)}
      />

      {/* Modular Form Modals */}
      <RoleAddModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
      />

      <RoleEditModal 
        isOpen={!!editingRole} 
        onClose={() => setEditingRole(null)} 
        role={editingRole} 
      />

      <RoleViewModal 
        isOpen={!!viewingRole} 
        onClose={() => setViewingRole(null)} 
        role={viewingRole} 
      />
    </div>
  );
}