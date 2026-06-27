import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { 
  FiCalendar, FiClock, FiCoffee, FiChevronLeft, 
  FiChevronRight, FiDownload, FiBriefcase 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

// Helper: Calculate ISO Week Number
const getWeekNumber = (d) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
};

// Helper: Format Single Days (e.g. "22-06")
const getDayDateString = (mondayString, offsetDays) => {
  const date = new Date(mondayString);
  date.setDate(date.getDate() + offsetDays);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}`;
};

// Helper: Format Week Ranges (e.g. "22-06-2026 to 28-06-2026")
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

const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff)).toISOString().split('T')[0];
};

export default function PlanningEmployee() {
  const { user } = useSelector((state) => state.auth);
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));

  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // 1. Fetch only this employee's published weekly schedule for selected week [2]
  const { data: schedule, isLoading } = useQuery({
    queryKey: ['my-schedule', currentWeekStart],
    queryFn: async () => {
      const res = await api.get(`/schedules/my-schedule?weekStartDate=${currentWeekStart}`);
      return res.data; 
    }
  });

  // 2. Download Personal Portrait PDF [2]
  const handleDownloadPersonalPDF = async () => {
    try {
      const response = await api.get(`/schedules/my-schedule-pdf?weekStartDate=${currentWeekStart}`, {
        responseType: 'blob' // Receives binary stream
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `My_Planning_Semaine_${getWeekNumber(new Date(currentWeekStart))}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('No published planning available to download for this week.');
    }
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
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          {/* Dynamic Title Headers [3] */}
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Semaine de {getWeekNumber(new Date(currentWeekStart))} - {getWeekRangeString(currentWeekStart)}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Overview of your active personal shifts and timecards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Week Navigators [3] */}
          <div className="flex space-x-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1 shadow-sm">
            <button onClick={handlePrevWeek} className="rounded p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400"><FiChevronLeft className="h-4 w-4" /></button>
            <button onClick={handleNextWeek} className="rounded p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400"><FiChevronRight className="h-4 w-4" /></button>
          </div>

          {/* 🛑 PDF DOWNLOAD BUTTON (Only triggers if schedule is loaded) */}
          <button 
            onClick={handleDownloadPersonalPDF}
            disabled={!schedule}
            className={`flex items-center rounded-lg px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition ${
              schedule 
                ? 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200' 
                : 'bg-zinc-300 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed opacity-50'
            }`}
          >
            <FiDownload className="mr-1.5 h-4 w-4" /> My PDF
          </button>
        </div>
      </div>

      {/* Contract Warning Badge */}
      {schedule && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300 shadow-sm transition-colors">
          <div className="flex items-center space-x-2">
            <FiBriefcase className="h-4 w-4 text-indigo-500" />
            <span>Weekly Work Contract: <span className="font-bold text-zinc-900 dark:text-zinc-100">{user?.contractHours || 35} Hours</span></span>
          </div>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">Scheduled: {schedule.totalHours.toFixed(2)} hrs</span>
        </div>
      )}

      {/* Main Grid Render */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : !schedule ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 text-center shadow-sm">
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">No published planning is available for you this week yet.</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Please check back later or contact your supervisor.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {weekdays.map((dayKey, idx) => {
            const day = schedule.days[dayKey];
            return (
              <div key={dayKey} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 shadow-sm transition-colors flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 capitalize flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-3">
                    {/* 🛑 Display Day & Dynamic Date Label (e.g. "Monday - 22-06") [3] */}
                    <span>{dayLabels[idx]} <span className="text-xs font-semibold text-zinc-400">({getDayDateString(currentWeekStart, idx)})</span></span>
                    
                    {day.isOff && <span className="text-[10px] bg-zinc-100 dark:bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded font-bold border border-zinc-200 dark:border-zinc-800">Repos</span>}
                    {day.isLeave && <span className="text-[10px] bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded font-bold border border-amber-200 dark:border-amber-900/30">Congé</span>}
                  </h3>

                  <div className="space-y-3">
                    {day.isOff && <p className="text-xs text-zinc-400 italic py-2">Rest day</p>}
                    {day.isLeave && <p className="text-xs text-zinc-400 italic py-2">Paid Leave ({day.leaveHours}h)</p>}
                    
                    {!day.isOff && !day.isLeave && day.shifts?.map((s, sIdx) => (
                      <div key={sIdx} className="rounded-lg bg-zinc-50 dark:bg-zinc-900/50 p-3 border border-zinc-100 dark:border-zinc-850">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center">
                            <FiClock className="mr-1.5 h-3.5 w-3.5 text-indigo-500" /> {s.startTime} - {s.endTime}
                          </span>
                          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-semibold capitalize border border-indigo-100 dark:border-indigo-900/30">{s.task}</span>
                        </div>
                        <div className="mt-2 flex items-center text-[10px] text-zinc-400">
                          <FiCoffee className="mr-1 h-3.5 w-3.5" /> Break: {s.breakMinutes} min
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}