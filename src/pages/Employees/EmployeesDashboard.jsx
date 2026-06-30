import React, { useState } from 'react';
import GenericModule from '../../components/GenericModule';
import EmployeeFormModal from './EmployeeFormModal';

export default function EmployeesDashboard() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

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
      header: 'Weekly Contract',
      render: (row) => (
        <span className="font-medium text-zinc-600 dark:text-zinc-400">
          {row.contractHours || 35} hrs
        </span>
      )
    },
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

  const handleEditClick = (emp) => {
    setSelectedEmployee(emp);
    setIsFormOpen(true);
  };

  const handleAddClick = () => {
    setSelectedEmployee(null); // Create mode
    setIsFormOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 transition-colors">Employees Directory</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Configure scheduling active profiles, emails, and security codes.</p>
      </div>

      <GenericModule
        queryKey="employees"
        fetchApiUrl="/employees"
        deleteApiUrl="/users"
        columns={columns}
        addBtnLabel="Add New Employee"
        onAddClick={handleAddClick}
        onEditClick={handleEditClick}
      />

      <EmployeeFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        employee={selectedEmployee} 
      />
    </div>
  );
}