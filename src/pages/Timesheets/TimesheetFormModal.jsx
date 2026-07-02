import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { timesheetFormSchema } from './timesheetValidation';

const getFormattedTime = (dateObj) => {
  if (!dateObj) return '';
  return new Date(dateObj).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

export default function TimesheetFormModal({ isOpen, onClose, timesheet }) {
  const queryClient = useQueryClient();
  const isEditMode = !!timesheet;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(timesheetFormSchema),
    defaultValues: { 
      employeeId: '', date: '', shiftType: 'midi', 
      checkInTime: '', checkOutTime: '', breakMinutes: 20,
      checkInTime2: '17:00', checkOutTime2: '22:50', breakMinutes2: 20
    }
  });

  const selectedShiftType = watch('shiftType');
  const showTimeInputs = !['repos', 'conge'].includes(selectedShiftType);
  const isDoubleShift = selectedShiftType === 'double';

  // Fetch employees list
  const { data: employees = [] } = useQuery({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const res = await api.get('/employees');
      return res.data?.docs || res.data;
    },
    enabled: !isEditMode
  });

  const employeesList = Array.isArray(employees) ? employees : (employees.docs || []);

  useEffect(() => {
    if (isEditMode && timesheet) {
      setValue('date', timesheet.date);
      setValue('shiftType', timesheet.shiftType || 'midi');
      setValue('breakMinutes', timesheet.breakMinutes || 0);
      setValue('checkInTime', getFormattedTime(timesheet.checkIn));
      setValue('checkOutTime', getFormattedTime(timesheet.checkOut));
    } else {
      reset();
    }
  }, [timesheet, isEditMode, setValue, reset]);

  const saveTimesheetMutation = useMutation({
    mutationFn: async (formData) => {
      if (isEditMode) {
        await api.put(`/timeclock/admin/${timesheet._id}`, formData);
      } else {
        await api.post('/timeclock/admin/create', formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
      toast.success(isEditMode ? 'Timesheet corrected.' : 'Timesheets successfully added.');
      reset();
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Operation failed.');
    }
  });

  const onSubmit = (data) => saveTimesheetMutation.mutate(data);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? `Correct Timesheet: ${timesheet?.employee?.name}` : 'Add Manual Timesheet Entry'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        {/* Employee Dropdown (Only in Create Mode) */}
        {!isEditMode && (
          <div>
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Select Employee</label>
            <select {...register('employeeId')} className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none bg-white dark:bg-zinc-900">
              <option value="">Choose an employee...</option>
              {employeesList.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.name}</option>
              ))}
            </select>
            {errors.employeeId && <p className="mt-1 text-xs text-red-500">{errors.employeeId.message}</p>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Date */}
          <div>
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Date</label>
            <input {...register('date')} type="date" className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-zinc-900 focus:outline-none" />
            {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>}
          </div>

          {/* Shift Type Selector (Disallow 'double' in edit mode, as split shifts are edited individually) */}
          <div>
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Shift Type</label>
            <select {...register('shiftType')} className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none bg-white dark:bg-zinc-900">
              <option value="midi">Midi (Lunch)</option>
              <option value="soir">Soir (Dinner)</option>
              {!isEditMode && <option value="double">Double Shift (Midi + Soir)</option>}
              <option value="repos">Repos (Day Off)</option>
              <option value="conge">Congé (Paid Leave)</option>
            </select>
          </div>
        </div>

        {/* 🛑 SHIFT 1 CONTAINER (Used for Midi, Soir, or the first half of a Double shift) */}
        {showTimeInputs && (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-4 bg-zinc-50/30 dark:bg-zinc-900/10">
            {isDoubleShift && <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Shift 1 (Midi / Lunch)</h4>}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Check-In Time</label>
                <input {...register('checkInTime')} type="time" className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none" />
                {errors.checkInTime && <p className="mt-1 text-xs text-red-500">{errors.checkInTime.message}</p>}
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Check-Out Time</label>
                <input {...register('checkOutTime')} type="time" className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none" />
                {errors.checkOutTime && <p className="mt-1 text-xs text-red-500">{errors.checkOutTime.message}</p>}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 font-semibold uppercase">Break Minutes</label>
              <input {...register('breakMinutes')} type="number" placeholder="e.g. 20" className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none" />
              {errors.breakMinutes && <p className="mt-1 text-xs text-red-500">{errors.breakMinutes.message}</p>}
            </div>
          </div>
        )}

        {/* 🛑 SHIFT 2 CONTAINER: Visible only when 'double' is selected [2] */}
        {isDoubleShift && (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-4 bg-zinc-50/30 dark:bg-zinc-900/10 animate-in slide-in-from-top-2 duration-150">
            <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Shift 2 (Soir / Dinner)</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Check-In Time</label>
                <input {...register('checkInTime2')} type="time" className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none" />
                {errors.checkInTime2 && <p className="mt-1 text-xs text-red-500">{errors.checkInTime2.message}</p>}
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Check-Out Time</label>
                <input {...register('checkOutTime2')} type="time" className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none" />
                {errors.checkOutTime2 && <p className="mt-1 text-xs text-red-500">{errors.checkOutTime2.message}</p>}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 font-semibold uppercase">Break Minutes</label>
              <input {...register('breakMinutes2')} type="number" placeholder="e.g. 20" className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none" />
              {errors.breakMinutes2 && <p className="mt-1 text-xs text-red-500">{errors.breakMinutes2.message}</p>}
            </div>
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-50 p-2.5 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:bg-zinc-400 transition">
          {isSubmitting ? 'Saving...' : isEditMode ? 'Apply Corrections' : 'Create Timesheet'}
        </button>
      </form>
    </Modal>
  );
}