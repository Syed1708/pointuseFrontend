import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiPlus, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../services/api';
import DataTable from './DataTable';

export default function GenericModule({
  queryKey,       // e.g., 'users' or 'roles'
  fetchApiUrl,    // e.g., '/users'
  deleteApiUrl,   // e.g., '/users'
  columns,        // Display columns array
  filterOptions = [], // Dynamic Dropdown options [{ value: 'admin', label: 'Admin' }]
  filterPlaceholder = 'Filter',
  addBtnLabel = 'Add Item',
  onAddClick,
  onEditClick,
  onViewClick,
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  // Debounce search typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // 1. TanStack Query: Fetch Data
  const { data, isLoading } = useQuery({
    queryKey: [queryKey, page, debouncedSearch, filter],
    queryFn: async () => {
      const response = await api.get(fetchApiUrl, {
        params: {
          page,
          search: debouncedSearch,
          filter,
          limit: 2
        }
      });
      return response.data; // Expects format: { docs: [], totalPages: 2, totalDocs: 14 }
    },
    keepPreviousData: true // Keep UI smooth during transitions
  });

  // 2. TanStack Query: Deletion Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`${deleteApiUrl}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] }); // Force dynamic list refresh
      toast.success('Successfully deleted.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete record.');
    }
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Table Filters & Toolbar */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex flex-1 items-center space-x-3 max-w-lg">
          {/* Search Box */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Optional filter dropdown */}
          {filterOptions.length > 0 && (
            <select
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All {filterPlaceholder}s</option>
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
        </div>

        {/* Create/Add Action Button */}
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
          >
            <FiPlus className="-ml-1 mr-2 h-4 w-4" /> {addBtnLabel}
          </button>
        )}
      </div>

      {/* Main Table Interface */}
      <DataTable
        columns={columns}
        data={data?.docs || data} // Supports both paginated array (`data.docs`) or raw array (`data`)
        isLoading={isLoading}
        onView={onViewClick}
        onEdit={onEditClick}
        onDelete={handleDelete}
      />

      {/* Pagination Bar */}
      {data?.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-500">
            Page <span className="font-semibold text-gray-700">{page}</span> of{' '}
            <span className="font-semibold text-gray-700">{data.totalPages}</span>
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              <FiChevronLeft className="mr-1 h-3.5 w-3.5" /> Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, data.totalPages))}
              disabled={page === data.totalPages}
              className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              Next <FiChevronRight className="ml-1 h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}