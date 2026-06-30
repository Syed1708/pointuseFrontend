import React, { useState } from 'react';
import GenericModule from '../../components/GenericModule';
import RoleFormModal from './RoleFormModal'; // 🛑 FIXED: Import the unified form modal instead of separate add/edit modals [2]
import RoleViewModal from './RoleViewModal'; // 🛑 FIXED: Used for viewing single role privileges

export default function RolesDashboard() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  
  // 🛑 FIXED: State to control the read-only View Modal [2]
  const [viewingRole, setViewingRole] = useState(null); 

  const handleEditClick = (role) => {
    setSelectedRole(role);
    setIsFormOpen(true);
  };

  const handleAddClick = () => {
    setSelectedRole(null); // Triggers Create Mode inside the unified form modal [2]
    setIsFormOpen(true);
  };

  // 🛑 FIXED: Handler to open the View Modal when clicking the eye icon [2]
  const handleViewClick = (role) => {
    setViewingRole(role);
  };

  // Define Columns with Shadcn Badge aesthetics [2]
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
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 transition-colors">System Roles</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Configure and manage specific access levels and privileges across your workforce.</p>
      </div>

      {/* Reusable Data Table Wrapper */}
      <GenericModule
        queryKey="roles"
        fetchApiUrl="/roles"
        deleteApiUrl="/roles"
        columns={columns}
        addBtnLabel="Create New Role"
        onAddClick={handleAddClick}
        onEditClick={handleEditClick}
        onViewClick={handleViewClick} // 🛑 Triggers handleViewClick
      />

      {/* Unified creation & modification form [2] */}
      <RoleFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        role={selectedRole} 
      />

      {/* 🛑 FIXED: Mount the read-only Role View Modal [2] */}
      <RoleViewModal 
        isOpen={!!viewingRole} 
        onClose={() => setViewingRole(null)} 
        role={viewingRole} 
      />
    </div>
  );
}