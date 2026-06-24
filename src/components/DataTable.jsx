import React from 'react';
import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';

export default function DataTable({ 
  columns, 
  data = [], 
  onView, 
  onEdit, 
  onDelete,
  isLoading 
}) {
  
  // 1. Loading State (Supports Dark Mode)
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm transition-colors">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 dark:border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  // 2. Empty State (Supports Dark Mode)
  if (data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 text-center shadow-sm transition-colors">
        <p className="text-gray-500 dark:text-zinc-400 font-medium">No records found</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm transition-colors">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800 text-left text-sm">
          {/* Table Header */}
          <thead className="bg-gray-50 dark:bg-zinc-900 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 border-b border-gray-200 dark:border-zinc-800 transition-colors">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-4">{col.header}</th>
              ))}
              {(onView || onEdit || onDelete) && (
                <th className="px-6 py-4 text-right">Actions</th>
              )}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
            {data.map((row, rowIdx) => (
              <tr key={row._id || rowIdx} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/40 transition">
                {columns.map((col, colIdx) => (
                  // 🛑 Added dark:text-zinc-300 to ensure row text is readable on dark backgrounds
                  <td key={colIdx} className="whitespace-nowrap px-6 py-4 font-medium text-gray-700 dark:text-zinc-300">
                    {col.render ? col.render(row) : row[col.accessorKey]}
                  </td>
                ))}
                
                {/* Actions Column with polished dark hover states */}
                {(onView || onEdit || onDelete) && (
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      {onView && (
                        <button 
                          onClick={() => onView(row)} 
                          className="rounded p-1.5 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-700 dark:hover:text-zinc-200 transition"
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                      )}
                      {onEdit && (
                        <button 
                          onClick={() => onEdit(row)} 
                          className="rounded p-1.5 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300 transition"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          onClick={() => onDelete(row._id)} 
                          className="rounded p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-300 transition"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}