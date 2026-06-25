import React, { useState } from 'react';
import GenericModule from '../../components/GenericModule';
import EmployeeAddModal from './EmployeeAddModal';
import EmployeeEditModal from './EmployeeEditModal';

export default function EmployeesDashboard() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Define Columns [2]
  const columns = [
    {
      header: 'Name',
      accessorKey: 'name',
      render: (row) => (
        <div className="flex items-center space-x-3">
          {row.avatar ? (
            <img src={row.avatar} alt={row.name} className="h-8 w-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-800" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold flex items-center justify-center uppercase text-xs transition-colors">
              {row.name.charAt(0)}
            </div>
          )}
          <span className="font-semibold text-zinc-900 dark:text-zinc-50 transition-colors">{row.name}</span>
        </div>
      )
    },
    { header: 'Email', accessorKey: 'email' },
    {
      header: 'PIN Code',
      render: (row) => {
        const isOldHash = row.pinCode && row.pinCode.startsWith('$');
        return (
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
            {isOldHash ? '•••• (Hash)' : (row.pinCode || 'Not Set')}
          </span>
        );
      }
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Directory Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 transition-colors">Employees Directory</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Configure scheduling active profiles, emails, and security codes.</p>
      </div>

      {/* Main Core Generic Dashboard with Search & Pagination hooks */}
      <GenericModule
        queryKey="employees"
        fetchApiUrl="/employees"
        deleteApiUrl="/users" // Deletion still uses the general user delete route
        columns={columns}
        addBtnLabel="Add New Employee"
        onAddClick={() => setIsAddOpen(true)}
        onEditClick={(emp) => setEditingEmployee(emp)}
      />

      {/* Modular Form Modals */}
      <EmployeeAddModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
      />

      <EmployeeEditModal 
        isOpen={!!editingEmployee} 
        onClose={() => setEditingEmployee(null)} 
        employee={editingEmployee} 
      />
    </div>
  );
}