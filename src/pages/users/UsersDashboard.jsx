import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import GenericModule from '../../components/GenericModule';
import UserFormModal from './UserFormModal';


export default function UsersDashboard() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleAddClick = () => {
    setSelectedUser(null); // Triggers Create Mode automatically [2]
    setIsFormOpen(true);
  };

  // 1. Fetch available roles to feed the dynamic filter dropdown
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/roles');
      return res.data;
    }
  });

// 🧠 Smart Check: Extract the array safely whether it's paginated (roles.docs) or raw (roles) [3]
const rolesList = Array.isArray(roles) ? roles : (roles.docs || []);

// Convert roles list into options for GenericModule's select dropdown [3]
const filterOptions = rolesList.map(r => ({
  value: r._id,
  label: r.name
}));

  // 2. Define Table Columns [2]
  const columns = [
    {
      header: 'Name',
      accessorKey: 'name',
      render: (row) => (
      <div className="flex items-center space-x-3">
        {/* 🛑 UPGRADED AVATAR: Added dark:bg-zinc-900, dark:border-zinc-800, and dark:text-zinc-300 */}
        <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold flex items-center justify-center uppercase text-xs transition-colors">
          {row.name.charAt(0)}
        </div>
        
        {/* 🛑 UPGRADED NAME TEXT: Changed text-zinc-900 to include dark:text-zinc-50 */}
        <span className="font-semibold text-zinc-900 dark:text-zinc-50 transition-colors">
          {row.name}
        </span>
      </div>
      )
    },
    { header: 'Email', accessorKey: 'email' },
    {
      header: 'Role',
      render: (row) => (
        <span className="inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700 border border-zinc-200 capitalize">
          {row.role?.name || 'No Role'}
        </span>
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Directory Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">User Directory</h1>
        <p className="text-sm text-zinc-500">Configure system employee profiles, roles, and PIN codes.</p>
      </div>

      {/* Main Core Generic Dashboard with Search, Filter & Pagination hooks */}
      <GenericModule
        queryKey="users"
        fetchApiUrl="/users"
        deleteApiUrl="/users"
        columns={columns}
        filterOptions={filterOptions} // 🛑 Pass dynamically loaded roles for filtering
        filterPlaceholder="Role"
        addBtnLabel="Add New User"
        onAddClick={handleAddClick}
        onEditClick={handleEditClick}
      />

      <UserFormModal
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        user={selectedUser} // 🛑 Pass selected object to switch mode [2]
        isEmployeeModule={false} // 🛑 Shows the assigned roles dropdown
      />


    </div>
  );
}