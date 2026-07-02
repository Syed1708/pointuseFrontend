import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  FiCheckCircle, FiUnlock, FiLock, FiPlus, FiCheck, 
  FiCalendar, FiClock, FiChevronLeft, FiChevronRight, FiGrid, FiList 
} from 'react-icons/fi';
import api from '../../services/api';
import GenericModule from '../../components/GenericModule';
import TimesheetFormModal from './TimesheetFormModal';

const formatHoursAndMinutes = (totalHoursDecimal) => {
  if (!totalHoursDecimal || totalHoursDecimal === 0) return '0 min';
  const totalMinutes = Math.round(totalHoursDecimal * 60);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins} min`;
  return `${hours}h ${String(mins).padStart(2, '0')}m`;
};

const formatMinutesToHours = (totalMinutes) => {
  if (!totalMinutes || totalMinutes === 0) return '0 min';
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins} min`;
  return `${hours}h ${String(mins).padStart(2, '0')}m`;
};

const formatLocalDateString = (isoString) => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const formatCalendarDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}-${year}`;
};

// Helper: Find Monday date of current week [3]
const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff)).toISOString().split('T')[0];
};

const getWeekRangeString = (mondayString) => {
  const start = new Date(mondayString);
  const end = new Date(mondayString);
  end.setDate(end.getDate() + 6);
  
  const formatDate = (d) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${d.getFullYear()}`;
  };
  return `${formatDate(start)} to ${formatDate(end)}`;
};


  
export default function TimesheetsDashboard() {
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState('daily'); // 'daily' (General List) or 'weekly' (Summary Report)
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // 1. Fetch Weekly Aggregated Reports (Only active when in 'weekly' view) [3]
  const { data: weeklySummaries = [], isLoading: isWeeklyLoading } = useQuery({
    queryKey: ['weekly-timesheets', currentWeekStart],
    queryFn: async () => {
      const res = await api.get(`/timeclock/admin/weekly-summary?weekStartDate=${currentWeekStart}`);
      return res.data;
    },
    enabled: activeView === 'weekly'
  });

  // 2. Mutations
  const approveMutation = useMutation({
    mutationFn: async (id) => {
      await api.put(`/timeclock/admin/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-timesheets'] });
      toast.success('Timesheet approved and locked.');
    }
  });

  const unlockMutation = useMutation({
    mutationFn: async (id) => {
      await api.put(`/timeclock/admin/${id}/unlock`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-timesheets'] });
      toast.success('Timesheet unlocked.');
    }
  });

  // Bulk Approve Mutation (Targets either a specific week or all pending) [2]
  const approveAllMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.put('/timeclock/admin/approve-all', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-timesheets'] });
      toast.success(data.message || 'Timesheets locked.');
    }
  });

  const handleEditClick = (ts) => {
    if (ts.isApproved) {
      return toast.error('Locked timesheets cannot be modified. Unlock it first.');
    }
    setSelectedTimesheet(ts);
    setIsFormOpen(true);
  };

  const handleAddClick = () => {
    setSelectedTimesheet(null); // Create mode
    setIsFormOpen(true);
  };
  const handleNextWeek = () => {
    const nextMon = new Date(currentWeekStart.replace(/-/g, '/'));
    nextMon.setDate(nextMon.getDate() + 7);
    const year = nextMon.getFullYear();
    const month = String(nextMon.getMonth() + 1).padStart(2, '0');
    const dayStr = String(nextMon.getDate()).padStart(2, '0');
    setCurrentWeekStart(`${year}-${month}-${dayStr}`);
  };

  const handlePrevWeek = () => {
    const prevMon = new Date(currentWeekStart.replace(/-/g, '/'));
    prevMon.setDate(prevMon.getDate() - 7);
    const year = prevMon.getFullYear();
    const month = String(prevMon.getMonth() + 1).padStart(2, '0');
    const dayStr = String(prevMon.getDate()).padStart(2, '0');
    setCurrentWeekStart(`${year}-${month}-${dayStr}`);
  };

  // Dynamic Column Configurations for standard Daily table list [2]
  const columns = [
    {
      header: 'Employee',
      render: (row) => (
        <div className="flex items-center space-x-3">
          {row.employee?.avatar ? (
            <img src={row.employee.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold flex items-center justify-center uppercase text-xs">
              {row.employee?.name?.charAt(0)}
            </div>
          )}
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">{row.employee?.name}</span>
        </div>
      )
    },
    {
      header: 'Date',
      render: (row) => <span className="font-medium text-zinc-600 dark:text-zinc-400">{formatCalendarDate(row.date)}</span>
    },
    {
      header: 'Shift Type',
      render: (row) => {
        const type = row.shiftType || 'midi';
        const badgeStyles = {
          midi: 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30',
          soir: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30',
          double: 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/30',
          repos: 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800',
          conge: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30'
        };
        return (
          <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold capitalize ${badgeStyles[type]}`}>
            {type === 'midi' ? 'Midi (Lunch)' : type === 'soir' ? 'Soir (Dinner)' : type === 'double' ? 'Double Shift' : type === 'repos' ? 'Repos' : 'Congé'}
          </span>
        );
      }
    },
    {
      header: 'Planned Shift',
      render: (row) => <span className="font-semibold text-zinc-500 dark:text-zinc-400 capitalize">{row.plannedShiftText || 'No Plan'}</span>
    },
    {
      header: 'Clock-In / Out',
      render: (row) => {
        if (['repos', 'conge'].includes(row.shiftType)) return <span className="text-zinc-400">-</span>;
        return (
          <span className="font-bold text-zinc-900 dark:text-zinc-100">
            {formatLocalDateString(row.checkIn)} - {row.checkOut ? formatLocalDateString(row.checkOut) : 'Active 🟢'}
          </span>
        );
      }
    },
    {
      header: 'Break Time',
      render: (row) => {
        if (['repos', 'conge'].includes(row.shiftType)) return <span className="text-zinc-400">-</span>;
        return <span className="font-semibold text-zinc-600 dark:text-zinc-400">{row.breakMinutes > 0 ? `${row.breakMinutes} min` : 'No Break'}</span>;
      }
    },
    {
      header: 'Worked Duration',
      render: (row) => <span className="font-semibold text-zinc-700 dark:text-zinc-300">{row.shiftType === 'repos' ? '0h 00m' : row.checkOut || row.shiftType === 'conge' ? formatMinutesToHours(row.totalMinutes) : 'Running...'}</span>
    },
    {
      header: 'Status',
      render: (row) => (
        row.isApproved ? (
          <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <FiLock className="mr-1.5 h-3.5 w-3.5 text-zinc-500" /> Locked
          </span>
        ) : (
          <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 animate-pulse">
            Pending Approval
          </span>
        )
      )
    },
    {
      header: 'Approval Control',
      render: (row) => (
        row.isApproved ? (
          <button onClick={() => unlockMutation.mutate(row._id)} className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 py-1 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"><FiUnlock className="mr-1 h-3.5 w-3.5" /> Unlock</button>
        ) : row.checkOut || row.shiftType === 'conge' ? (
          <button onClick={() => approveMutation.mutate(row._id)} className="flex items-center rounded-lg bg-zinc-900 dark:bg-zinc-50 px-2.5 py-1 text-[10px] font-bold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"><FiCheckCircle className="mr-1 h-3.5 w-3.5" /> Lock</button>
        ) : (
          <span className="text-zinc-400 text-xs">-</span>
        )
      )
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Timesheet Approvals</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Audit, modify, and lock employee work sessions for payroll.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* 🛑 A. VIEW TOGGLER SYSTEM (Daily vs Weekly) [2] */}
          <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1 shadow-sm">
            <button
              onClick={() => setActiveView('daily')}
              className={`flex items-center px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeView === 'daily'
                  ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50'
              }`}
            >
              <FiList className="mr-1.5 h-4 w-4" /> Daily Punches
            </button>
            <button
              onClick={() => setActiveView('weekly')}
              className={`flex items-center px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeView === 'weekly'
                  ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50'
              }`}
            >
              <FiCalendar className="mr-1.5 h-4 w-4" /> Weekly Summaries
            </button>
          </div>

          {/* 🛑 B. WEEKLY PAGINATION (Only visible in Weekly View) [3] */}
          {activeView === 'weekly' && (
            <div className="flex items-center space-x-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1 shadow-sm">
              <button onClick={handlePrevWeek} className="rounded p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400"><FiChevronLeft className="h-4 w-4" /></button>
              <span className="text-[10px] font-semibold px-2 text-zinc-600 dark:text-zinc-300">{getWeekRangeString(currentWeekStart)}</span>
              <button onClick={handleNextWeek} className="rounded p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400"><FiChevronRight className="h-4 w-4" /></button>
            </div>
          )}

          {/* 🛑 C. BULK WEEKLY APPROVE BUTTON (Only visible in Weekly View) [2] */}
          {activeView === 'weekly' && (
            <button
              onClick={() => {
                if (window.confirm(`Approve and lock all completed timesheets for the week: ${getWeekRangeString(currentWeekStart)}?`)) {
                  approveAllMutation.mutate({ weekStartDate: currentWeekStart });
                }
              }}
              className="flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 shadow-sm transition"
            >
              <FiCheck className="-ml-1 mr-1.5 h-4 w-4" /> Approve & Lock Week
            </button>
          )}

          {/* Manual addition trigger */}
          <button
            onClick={handleAddClick}
            className="flex items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-50 px-4 py-2 text-xs font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-sm"
          >
            <FiPlus className="-ml-1 mr-1.5 h-4 w-4" /> Add Timesheet
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* 🛑 CONDITIONAL RENDER PANELS               */}
      {/* ========================================== */}
      
      {activeView === 'daily' ? (
        // VIEW 1: STANDARD PAGINATED DAILY DIRECTORY [2]
        <GenericModule
          queryKey="timesheets"
          fetchApiUrl="/timeclock/admin/list"
          deleteApiUrl="/timeclock/admin" 
          columns={columns}
          filterPlaceholder="Status"
          filterOptions={[
            { value: 'true', label: 'Approved & Locked' },
            { value: 'false', label: 'Pending Approval' }
          ]}
          onEditClick={handleEditClick}
        />
      ) : isWeeklyLoading ? (
        // VIEW 2: LOADING SPINNER FOR WEEKLY SUMMARY FETCH [2]
        <div className="flex h-96 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 dark:border-indigo-500 border-t-transparent"></div>
        </div>
      ) : (
        // VIEW 3: COLLATED WEEKLY TIMESHEETS BY EMPLOYEE [2]
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm transition-colors animate-in fade-in duration-150">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900 font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Contract Target</th>
                  <th className="px-6 py-4">Actual Worked Hours</th>
                  <th className="px-6 py-4">Calculated Overtime</th>
                  <th className="px-6 py-4 text-right">Approval Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {weeklySummaries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-400">No work records registered for this week yet.</td>
                  </tr>
                ) : (
                  weeklySummaries.map((summary) => (
                    <tr key={summary.employee._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition">
                      {/* Name & Avatar */}
                      <td className="px-6 py-4 flex items-center space-x-3">
                        {summary.employee.avatar ? (
                          <img src={summary.employee.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold flex items-center justify-center uppercase text-xs">
                            {summary.employee.name.charAt(0)}
                          </div>
                        )}
                        <span className="font-bold text-zinc-900 dark:text-zinc-50">{summary.employee.name}</span>
                      </td>

                      {/* Contract Target */}
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 font-medium">
                        {summary.contractHours} Hours
                      </td>

                      {/* Actual Worked */}
                      <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-50">
                        {formatHoursAndMinutes(summary.actualHours)}
                      </td>

                      {/* Calculated Overtime */}
                      <td className="px-6 py-4">
                        {summary.extraHours > 0 ? (
                          <span className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 px-2.5 py-0.5 text-xs font-bold text-red-600 dark:text-red-400 animate-pulse">
                            +{formatHoursAndMinutes(summary.extraHours)} Overtime
                          </span>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-right">
                        {summary.isFullyApproved ? (
                          <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <FiLock className="mr-1.5 h-3.5 w-3.5" /> Fully Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                            {summary.pendingCount} Pending Sessions
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TimesheetFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        timesheet={selectedTimesheet}
      />
    </div>
  );
}