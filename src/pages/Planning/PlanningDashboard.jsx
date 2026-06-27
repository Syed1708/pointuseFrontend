import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  FiChevronLeft, FiChevronRight, FiCopy, FiCheckCircle, 
  FiBriefcase, FiX, FiCalendar, FiDownload, FiEdit2, FiClipboard 
} from 'react-icons/fi';
import api from '../../services/api';
import usePlanningDrag from '../../hooks/usePlanningDrag';
import Modal from '../../components/Modal';
import { useSelector } from 'react-redux';

// Helper: Calculate ISO Week Number
const getWeekNumber = (d) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
};

const getDayDateString = (mondayString, offsetDays) => {
  const date = new Date(mondayString);
  date.setDate(date.getDate() + offsetDays);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
};

const getWeekRangeString = (mondayString) => {
  const start = new Date(mondayString);
  const end = new Date(mondayString);
  end.setDate(end.getDate() + 6);
  
  const formatDate = (d) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  };
  return `${formatDate(start)} to ${formatDate(end)}`;
};

const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff)).toISOString().split('T')[0];
};

export default function PlanningDashboard() {

  const queryClient = useQueryClient();
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  const [gridData, setGridData] = useState([]);
  const [cloneTargetWeek, setCloneTargetWeek] = useState('');
  const [selectedCell, setSelectedCell] = useState(null);
  
  const { user } = useSelector((state) => state.auth);

    // 🛑 Check if user has publish permission [2]
  const canPublish = user?.role?.permissions?.includes('schedules:publish') || user?.role?.name === 'admin';
  // 🛑 GLOBAL PASTE CLIPBOARD STATE
  const [copiedShift, setCopiedShift] = useState(null); // stores { startTime, endTime, breakMinutes, task }

  // Modal Form States
  const [dayType, setDayType] = useState('off');
  const [leaveHours, setLeaveHours] = useState(7);
  const [shift1Start, setShift1Start] = useState('10:00');
  const [shift1End, setShift1End] = useState('14:50');
  const [shift1Break, setShift1Break] = useState(20);
  const [shift1Task, setShift1Task] = useState('Decoupe Poisson');
  const [hasShift2, setHasShift2] = useState(false);
  const [shift2Start, setShift2Start] = useState('17:00');
  const [shift2End, setShift2End] = useState('22:50');
  const [shift2Break, setShift2Break] = useState(20);
  const [shift2Task, setShift2Task] = useState('Maki');

  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // ESC Key Listener to clear clipboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setCopiedShift(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { data } = useQuery({
    queryKey: ['schedules', currentWeekStart],
    queryFn: async () => {
      const res = await api.get(`/schedules/grid?weekStartDate=${currentWeekStart}`);
      return res.data;
    }
  });

  useEffect(() => {
    if (data) setGridData(data);
    console.log('Fetched grid data for week starting:', currentWeekStart, data);
  }, [data]);

  const { handleDragStart, handleDragOver, handleDrop } = usePlanningDrag(gridData, setGridData);

  // Save Weekly Schedule Mutation
  const saveScheduleMutation = useMutation({
    mutationFn: async ({ employeeId, days }) => {
      await api.post('/schedules/save', { employeeId, weekStartDate: currentWeekStart, days });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setSelectedCell(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save schedule.');
    }
  });

  const publishWeekMutation = useMutation({
    mutationFn: async () => {
      await api.post('/schedules/publish', { weekStartDate: currentWeekStart });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Week published and PDF emailed successfully!');
    }
  });

  const cloneWeekMutation = useMutation({
    mutationFn: async (targetWeek) => {
      await api.post('/schedules/clone', {
        sourceWeekStart: currentWeekStart,
        targetWeekStart: getMonday(targetWeek)
      });
    },
    onSuccess: () => {
      toast.success('Week successfully cloned!');
    }
  });

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/schedules/download-pdf?weekStartDate=${currentWeekStart}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Planning_Semaine_${getWeekNumber(new Date(currentWeekStart))}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Failed to generate PDF download.');
    }
  };

  // 🛑 INSTANT SHIFT DELETION FROM THE GRID
  const handleDeleteShift = (e, employeeId, dayKey, shiftIndex) => {
    e.stopPropagation(); // Prevents cell click event from triggering when deleting
    
    if (window.confirm('Delete this shift?')) {
      const updatedGrid = JSON.parse(JSON.stringify(gridData));
      const record = updatedGrid.find(item => item.employee._id === employeeId);
      if (!record) return;

      record.schedule.days[dayKey].shifts.splice(shiftIndex, 1);
      if (record.schedule.days[dayKey].shifts.length === 0) {
        record.schedule.days[dayKey].isOff = true;
      }

      saveScheduleMutation.mutate({
        employeeId,
        days: record.schedule.days
      });
      toast.success('Shift deleted.');
    }
  };

  // 🛑 CELL CLICK: Handles both "Paste" and "Open Modal"
  const handleCellClick = (employee, dayKey) => {
    if (copiedShift) {
      // 📋 CLIPBOARD PASTE ACTION!
      const record = gridData.find(item => item.employee._id === employee._id);
      if (!record) return;

      const updatedDays = JSON.parse(JSON.stringify(record.schedule.days));
      if (!updatedDays[dayKey].shifts) {
        updatedDays[dayKey].shifts = [];
      }

      // Append a duplicate of the copied shift to this day [3]
      updatedDays[dayKey].shifts.push({ ...copiedShift });
      updatedDays[dayKey].isOff = false;
      updatedDays[dayKey].isLeave = false;

      saveScheduleMutation.mutate({
        employeeId: employee._id,
        days: updatedDays
      });

      toast.success(`Copied shift pasted to ${employee.name} on ${dayKey}`);
    } else {
      // Standard: Open Edit Modal [2]
      openCellModal(employee, dayKey);
    }
  };

  const openCellModal = (employee, dayKey) => {
    const record = gridData.find(item => item.employee._id === employee._id);
    const dayData = record?.schedule?.days[dayKey] || { isOff: true, shifts: [] };

    setSelectedCell({ employeeId: employee._id, employeeName: employee.name, dayKey, dayData });

    if (dayData.isLeave) {
      setDayType('leave');
      setLeaveHours(dayData.leaveHours || 7);
    } else if (dayData.isOff || !dayData.shifts || dayData.shifts.length === 0) {
      setDayType('off');
    } else {
      setDayType('work');
      const s1 = dayData.shifts[0];
      setShift1Start(s1.startTime || '10:00');
      setShift1End(s1.endTime || '14:50');
      setShift1Break(s1.breakMinutes || 20);
      setShift1Task(s1.task || 'Decoupe Poisson');

      if (dayData.shifts[1]) {
        setHasShift2(true);
        const s2 = dayData.shifts[1];
        setShift2Start(s2.startTime || '17:00');
        setShift2End(s2.endTime || '22:50');
        setShift2Break(s2.breakMinutes || 20);
        setShift2Task(s2.task || 'Maki');
      } else {
        setHasShift2(false);
      }
    }
  };

  const handleSaveCellForm = () => {
    const record = gridData.find(item => item.employee._id === selectedCell.employeeId);
    if (!record) return;

    const updatedDays = JSON.parse(JSON.stringify(record.schedule.days));

    if (dayType === 'off') {
      updatedDays[selectedCell.dayKey] = { isOff: true, isLeave: false, shifts: [] };
    } else if (dayType === 'leave') {
      updatedDays[selectedCell.dayKey] = { isOff: false, isLeave: true, leaveHours: parseInt(leaveHours), shifts: [] };
    } else {
      const activeShifts = [
        { startTime: shift1Start, endTime: shift1End, breakMinutes: parseInt(shift1Break), task: shift1Task }
      ];

      if (hasShift2) {
        activeShifts.push({ startTime: shift2Start, endTime: shift2End, breakMinutes: parseInt(shift2Break), task: shift2Task });
      }

      updatedDays[selectedCell.dayKey] = { isOff: false, isLeave: false, shifts: activeShifts };
    }

    saveScheduleMutation.mutate({
      employeeId: selectedCell.employeeId,
      days: updatedDays
    });
  };

  const getEmployeeRowTotal = (days) => {
    return weekdays.reduce((sum, dayKey) => {
      const day = days[dayKey];
      if (day.isOff) return sum;
      if (day.isLeave) return sum + (day.leaveHours || 0);
      
      let daySum = 0;
      day.shifts?.forEach(s => {
        const [sh, sm] = s.startTime.split(':').map(Number);
        const [eh, em] = s.endTime.split(':').map(Number);
        let diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff < 0) diff += 24 * 60;
        daySum += (diff - (s.breakMinutes || 0));
      });
      return sum + (daySum / 60);
    }, 0);
  };

  const getDayColumnTotal = (dayKey) => {
    return gridData.reduce((sum, item) => {
      const day = item.schedule.days[dayKey];
      if (day.isOff) return sum;
      if (day.isLeave) return sum + (day.leaveHours || 0);
      
      let daySum = 0;
      day.shifts?.forEach(s => {
        const [sh, sm] = s.startTime.split(':').map(Number);
        const [eh, em] = s.endTime.split(':').map(Number);
        let diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff < 0) diff += 24 * 60;
        daySum += (diff - (s.breakMinutes || 0));
      });
      return sum + (daySum / 60);
    }, 0);
  };

  const handleNextWeek = () => {
    const nextMon = new Date(currentWeekStart);
    nextMon.setDate(nextMon.getDate() + 7);
    setCurrentWeekStart(nextMon.toISOString().split('T')[0]);
  };

  const handlePrevWeek = () => {
    const prevMon = new Date(currentWeekStart);
    prevMon.setDate(prevMon.getDate() - 7);
    setCurrentWeekStart(prevMon.toISOString().split('T')[0]);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* 🛑 UPGRADED CLIPBOARD BANNER (Shadcn style) */}
      {copiedShift && (
        <div className="flex items-center justify-between rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 px-4 py-3 text-xs text-indigo-700 dark:text-indigo-400 animate-in slide-in-from-top-2 duration-150 shadow-sm">
          <div className="flex items-center space-x-2">
            <FiClipboard className="h-4 w-4 animate-bounce" />
            <span>
              <strong>Clipboard Active:</strong> Shift <span className="font-bold">[{copiedShift.startTime} - {copiedShift.endTime}]</span> copied. Click any cell to paste!
            </span>
          </div>
          <button 
            onClick={() => setCopiedShift(null)} 
            className="rounded bg-indigo-100 dark:bg-indigo-950 px-2 py-1 font-bold hover:bg-indigo-200 transition"
          >
            Cancel (ESC)
          </button>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Semaine de {getWeekNumber(new Date(currentWeekStart))} - {getWeekRangeString(currentWeekStart)}
          </h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            *Drag shifts to move, or hover over cards to **Copy**, **Edit**, or **Delete** instantly [2]!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex space-x-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1">
            <button onClick={handlePrevWeek} className="rounded p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400"><FiChevronLeft className="h-4 w-4" /></button>
            <button onClick={handleNextWeek} className="rounded p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400"><FiChevronRight className="h-4 w-4" /></button>
          </div>

          <div className="flex items-center space-x-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 py-1 shadow-sm">
            <FiCopy className="text-zinc-400 h-4 w-4" />
            <input type="date" value={cloneTargetWeek} onChange={(e) => setCloneTargetWeek(e.target.value)} className="text-xs bg-transparent text-zinc-600 dark:text-zinc-300 focus:outline-none" />
            <button onClick={() => { if (cloneTargetWeek) cloneWeekMutation.mutate(cloneTargetWeek); }} className="rounded bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">Clone</button>
          </div>

          <button onClick={handleDownloadPDF} className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 shadow-sm transition"><FiDownload className="mr-1.5 h-4 w-4" /> PDF</button>

                {/* 🛑 UPGRADED VERIFY & PUBLISH BUTTON */}
      <button 
        onClick={() => {
          if (!canPublish) {
            return toast.error('Access Denied: You do not have permission to publish schedules.');
          }
          publishWeekMutation.mutate();
        }}
        disabled={!canPublish} // 🛑 Dims and disables the button visually
        className={`flex items-center rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition ${
          canPublish 
            ? 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer' 
            : 'bg-zinc-400 dark:bg-zinc-800 text-zinc-200 cursor-not-allowed opacity-50'
        }`}
      >
        <FiCheckCircle className="mr-1.5 h-4 w-4" /> Verify & Publish
      </button>

        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm transition-colors">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-900 font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3 min-w-[180px]">Employee / Contract</th>
                {weekdays.map((day, idx) => (
                  <th key={day} className="px-4 py-3 min-w-[155px] capitalize">
                    {day} - {getDayDateString(currentWeekStart, idx)}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Total Hours</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {gridData.map((item) => (
                <tr key={item.employee._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition">
                  <td className="px-4 py-4 border-r border-zinc-200 dark:border-zinc-800">
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">{item.employee.name}</p>
                    <span className="mt-1 inline-flex items-center text-[10px] text-zinc-400 font-semibold">
                      <FiBriefcase className="mr-1 h-3 w-3" /> {item.employee.contractHours || 35} Hours Contract
                    </span>
                  </td>

                  {weekdays.map(dayKey => {
                    const day = item.schedule.days[dayKey] || { isOff: true, shifts: [] };
                    return (
                      <td 
                        key={dayKey} 
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, item.employee._id, dayKey)}
                        onClick={() => handleCellClick(item.employee, dayKey)} // 🛑 Combined handler
                        className={`px-4 py-4 border-r border-zinc-200 dark:border-zinc-800 align-top min-h-[100px] hover:bg-zinc-50/70 dark:hover:bg-zinc-900/20 transition cursor-pointer ${
                          copiedShift ? 'bg-indigo-50/10 dark:bg-indigo-950/5 border-dashed border-indigo-200' : ''
                        }`}
                      >
                        {day.isOff && <span className="inline-flex rounded bg-zinc-100 dark:bg-zinc-900 px-2 py-1 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">Repos</span>}
                        {day.isLeave && <span className="inline-flex rounded bg-amber-50 dark:bg-amber-950/20 px-2 py-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400">Congé ({day.leaveHours}h)</span>}
                        {!day.isOff && !day.isLeave && day.shifts?.map((shift, idx) => (
                          <div 
                            key={idx}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.employee._id, dayKey, idx)}
                            className="relative group mb-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-500 dark:hover:border-indigo-500"
                            onClick={(e) => e.stopPropagation()}
                          >
                            
                            {/* 🛑 3-BUTTON HOVER ACTIONS (Copy, Edit, Delete) */}
                            <div className="absolute top-1.5 right-1.5 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* 1. Copy button */}
                              <button
                                onClick={(e) => { e.stopPropagation(); setCopiedShift(shift); toast.success('Shift copied! Click any cell to paste.'); }}
                                className="rounded p-1 text-zinc-400 hover:text-indigo-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                                title="Copy Shift"
                              >
                                <FiCopy className="h-3 w-3" />
                              </button>
                              {/* 2. Edit button */}
                              <button
                                onClick={(e) => { e.stopPropagation(); openCellModal(item.employee, dayKey); }}
                                className="rounded p-1 text-zinc-400 hover:text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                                title="Edit Shift"
                              >
                                <FiEdit2 className="h-3 w-3" />
                              </button>
                              {/* 3. Delete button */}
                              <button
                                onClick={(e) => handleDeleteShift(e, item.employee._id, dayKey, idx)}
                                className="rounded p-1 text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                                title="Delete Shift"
                              >
                                <FiX className="h-3 w-3" />
                              </button>
                            </div>

                            <p className="font-bold text-zinc-900 dark:text-zinc-50">{shift.startTime} - {shift.endTime}</p>
                            <p className="text-[10px] text-zinc-400 truncate mt-0.5">{shift.task}</p>
                            <p className="text-[9px] text-zinc-500 italic mt-0.5">Break: {shift.breakMinutes}m</p>
                          </div>
                        ))}
                      </td>
                    );
                  })}

                  <td className="px-4 py-4 text-right font-bold text-zinc-900 dark:text-zinc-50">
                    {getEmployeeRowTotal(item.schedule.days).toFixed(2)} hrs
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-zinc-50 dark:bg-zinc-900 font-semibold border-t border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
              <tr>
                <td className="px-4 py-3 font-bold uppercase">Vertical Totals</td>
                {weekdays.map(dayKey => <td key={dayKey} className="px-4 py-3 font-semibold">{getDayColumnTotal(dayKey).toFixed(2)} h</td>)}
                <td className="px-4 py-3 text-right font-bold text-indigo-600 dark:text-indigo-400">{gridData.reduce((sum, item) => sum + getEmployeeRowTotal(item.schedule.days), 0).toFixed(2)} hrs</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal Block */}
      <Modal 
        isOpen={!!selectedCell} 
        onClose={() => setSelectedCell(null)} 
        title={`Assign Shift: ${selectedCell?.employeeName} on ${selectedCell?.dayKey}`}
        size="lg" // Wide size for side-by-side inputs
      >
        <div className="space-y-5">
          {/* Day Type Selector */}
          <div>
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">Day Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['work', 'off', 'leave'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDayType(type)}
                  className={`rounded-lg border py-2 text-xs font-bold transition capitalize ${
                    dayType === type
                      ? 'bg-zinc-900 text-zinc-50 border-zinc-900 dark:bg-zinc-50 dark:text-zinc-950'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800'
                  }`}
                >
                  {type === 'work' ? 'Work Day' : type === 'off' ? 'Repos (Day Off)' : 'Congé (Leave)'}
                </button>
              ))}
            </div>
          </div>

          {/* Paid Leave Sub-Form */}
          {dayType === 'leave' && (
            <div className="animate-in fade-in duration-100">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Leave Hours</label>
              <input 
                type="number" 
                value={leaveHours} 
                onChange={(e) => setLeaveHours(e.target.value)} 
                className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>
          )}

          {/* Work Day Sub-Form (Supports Split Shifts) */}
          {dayType === 'work' && (
            <div className="space-y-5 animate-in fade-in duration-100">
              
              {/* SHIFT 1 CONFIGURATION */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-850 p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/20">
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Shift 1 (Midi / Lunch)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-400 font-semibold uppercase">Start</label>
                    <input type="time" value={shift1Start} onChange={(e) => setShift1Start(e.target.value)} className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-xs text-zinc-900 dark:text-zinc-100" />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 font-semibold uppercase">End</label>
                    <input type="time" value={shift1End} onChange={(e) => setShift1End(e.target.value)} className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-xs text-zinc-900 dark:text-zinc-100" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-400 font-semibold uppercase">Break (minutes)</label>
                    <input type="number" value={shift1Break} onChange={(e) => setShift1Break(e.target.value)} className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-xs text-zinc-900 dark:text-zinc-100" />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 font-semibold uppercase">Task</label>
                    <input type="text" value={shift1Task} onChange={(e) => setShift1Task(e.target.value)} className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-xs text-zinc-900 dark:text-zinc-100" />
                  </div>
                </div>
              </div>

              {/* TOGGLE FOR SECOND SHIFT (SPLIT SHIFT TRIGGER) */}
              <div className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  id="hasShift2" 
                  checked={hasShift2} 
                  onChange={(e) => setHasShift2(e.target.checked)} 
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                />
                <label htmlFor="hasShift2" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  Activate Split Shift (Add Shift 2 for Soir / Dinner)
                </label>
              </div>

              {/* SHIFT 2 CONFIGURATION (Visible only if checkbox is ticked) */}
              {hasShift2 && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-850 p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/20 animate-in slide-in-from-top-2 duration-150">
                  <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Shift 2 (Soir / Dinner)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-zinc-400 font-semibold uppercase">Start</label>
                      <input type="time" value={shift2Start} onChange={(e) => setShift2Start(e.target.value)} className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-xs text-zinc-900 dark:text-zinc-100" />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 font-semibold uppercase">End</label>
                      <input type="time" value={shift2End} onChange={(e) => setShift2End(e.target.value)} className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-xs text-zinc-900 dark:text-zinc-100" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-zinc-400 font-semibold uppercase">Break (minutes)</label>
                      <input type="number" value={shift2Break} onChange={(e) => setShift2Break(e.target.value)} className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-xs text-zinc-900 dark:text-zinc-100" />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 font-semibold uppercase">Task</label>
                      <input type="text" value={shift2Task} onChange={(e) => setShift2Task(e.target.value)} className="mt-1 block w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-xs text-zinc-900 dark:text-zinc-100" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button 
              type="button" 
              onClick={() => setSelectedCell(null)} 
              className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleSaveCellForm} 
              disabled={saveScheduleMutation.isLoading}
              className="flex-1 rounded-lg bg-zinc-900 dark:bg-zinc-50 py-2 text-xs font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:bg-zinc-400"
            >
              {saveScheduleMutation.isLoading ? 'Saving...' : 'Save Shift'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}