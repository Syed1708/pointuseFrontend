import React from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  FiUsers, FiClock, FiCalendar, FiBriefcase, 
  FiArrowRight, FiSmile, FiActivity, FiUserCheck, FiAlertCircle 
} from 'react-icons/fi';
import api from '../services/api';

// 🛑 NEW: Helper to convert decimal hours (e.g. 0.35) into readable hours & minutes (0h 21m)
const formatHoursAndMinutes = (totalHoursDecimal) => {
  if (!totalHoursDecimal) return '0h 00m';
  const totalMinutes = Math.round(totalHoursDecimal * 60);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours}h ${String(mins).padStart(2, '0')}m`;
};

export default function DashboardHome() {
  const { user } = useSelector((state) => state.auth);
  const isManagerOrAdmin = ['admin', 'manager'].includes(user?.role?.name);

  // Fetch live metrics from our statistics endpoint
  const { data: liveStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['live-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data;
    }
  });

  const managerStats = [
    { 
      label: 'Total Employees', 
      value: isStatsLoading ? '...' : String(liveStats?.totalEmployees || 0), 
      change: 'Active staff directory', 
      icon: FiUsers, 
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400' 
    },
    { 
      label: 'Active Shifts Today', 
      value: isStatsLoading ? '...' : String(liveStats?.activeShiftsToday || 0), 
      change: 'Shifts currently active', 
      icon: FiCalendar, 
      color: 'text-green-600 bg-green-50 dark:bg-green-950/20 dark:text-green-400' 
    },
    { 
      label: 'Active Clock-ins', 
      value: isStatsLoading ? '...' : String(liveStats?.unapprovedTimesheets || 0), 
      change: 'Employees clocked-in', 
      icon: FiClock, 
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400' 
    },
  ];

  const employeeStats = [
    { 
      label: 'My Scheduled Hours', 
      // 🛑 Upgraded with readable formatting (e.g., "35h 00m")
      value: isStatsLoading ? '...' : formatHoursAndMinutes(liveStats?.myScheduledHours), 
      change: 'Current Week planning', 
      icon: FiBriefcase, 
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400' 
    },
    { 
      label: 'My Worked Hours', 
      // 🛑 Upgraded with readable formatting (e.g., "0h 21m")
      value: isStatsLoading ? '...' : `${formatTimeclockValue(liveStats?.myWorkedHours)}`, 
      change: 'Real-time clocked hours', 
      icon: FiClock, 
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400' 
    },
    { 
      label: 'Upcoming Rest Days', 
      value: isStatsLoading ? '...' : `${liveStats?.restDays || 0} Days`, 
      change: 'Repos / Days Off', 
      icon: FiCalendar, 
      color: 'text-zinc-600 bg-zinc-100 dark:bg-zinc-900/50 dark:text-zinc-400' 
    },
  ];

  // Micro-helper for worked hours card representation
  function formatTimeclockValue(val) {
    if (isStatsLoading) return '...';
    if (!val || val === 0) return '0 min';
    if (val < 1) return `${Math.round(val * 60)} min`; // If less than 1 hour, show e.g. "21 min"
    return formatHoursAndMinutes(val); // Otherwise show e.g. "4h 15m"
  }

  const activeStats = isManagerOrAdmin ? managerStats : employeeStats;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-150">
      {/* Welcome Heading */}
      <div className="flex items-center space-x-3">
        <div className="rounded-lg p-2.5 bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 shadow-sm">
          <FiSmile className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {isManagerOrAdmin 
              ? "Here is a summary of your organization's scheduling and clock-in operations today."
              : "Here is your weekly summary. Stay updated with your active shifts and worked hours."}
          </p>
        </div>
      </div>

      {/* Grid Stats Block */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {activeStats.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm flex items-start justify-between transition-colors">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{item.label}</p>
              <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{item.value}</h2>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{item.change}</p>
            </div>
            <div className={`rounded-lg p-2.5 ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Body Section */}
      {isManagerOrAdmin ? (
        // =========================================================================
        // 🛡️ VIEW A: MANAGER / ADMIN WORKFORCE WEEKLY REPORT (With Overtime) [2]
        // =========================================================================
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <FiActivity className="text-indigo-600 dark:text-indigo-400 h-5 w-5 animate-pulse" />
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Workforce Weekly & Overtime Report</h3>
                </div>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Live payroll hours tracking and overtime computations [2].</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-800 text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Weekly Contract</th>
                    <th className="px-4 py-3">Hours Worked</th>
                    <th className="px-4 py-3">Extra/Overtime</th>
                    <th className="px-4 py-3 text-right">Today's Punch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {isStatsLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-400">Loading weekly report...</td>
                    </tr>
                  ) : !liveStats?.weeklyReportList || liveStats.weeklyReportList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-400">No employees registered yet.</td>
                    </tr>
                  ) : (
                    liveStats.weeklyReportList.map((empItem) => (
                      <tr key={empItem.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition">
                        <td className="px-4 py-3 flex items-center space-x-2">
                          {empItem.avatar ? (
                            <img src={empItem.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 text-zinc-700 dark:text-zinc-300 font-semibold flex items-center justify-center uppercase text-[10px]">
                              {empItem.name.charAt(0)}
                            </div>
                          )}
                          <span className="font-bold text-zinc-900 dark:text-zinc-50">{empItem.name}</span>
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{empItem.contractHours} Hours</td>
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">{formatHoursAndMinutes(empItem.actualHours)}</td>
                        <td className="px-4 py-3">
                          {empItem.extraHours > 0 ? (
                            <span className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-950/20 px-2 py-0.5 font-bold text-red-600 dark:text-red-400 border border-red-100 dark:border-red-950/30 animate-pulse">
                              +{formatHoursAndMinutes(empItem.extraHours)} Extra
                            </span>
                          ) : (
                            <span className="text-zinc-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {empItem.todayPunch ? (
                            <div className="space-y-0.5">
                              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {empItem.todayPunch.checkIn} - {empItem.todayPunch.checkOut || 'Active'}
                              </p>
                              {empItem.isCurrentlyClockedIn && (
                                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              )}
                            </div>
                          ) : (
                            <span className="text-zinc-400">Absent</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // =========================================================================
        // 👤 VIEW B: EMPLOYEE LIVE WORKTIME & SHIFTS MATRIX [2]
        // =========================================================================
        <div className="grid gap-6 md:grid-cols-3">
          {/* Column 1: Shortcuts */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm transition-colors flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">My Shortcuts</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Access your active planning and secure configurations directly.</p>
            </div>
            <div className="mt-6 space-y-2">
              <Link to="/dashboard/planning" className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition">
                <span>View My Weekly Planning</span>
                <FiArrowRight className="h-4 w-4 text-indigo-500" />
              </Link>
              <Link to="/dashboard/profile" className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition">
                <span>Edit Profile & Security</span>
                <FiArrowRight className="h-4 w-4 text-indigo-500" />
              </Link>
            </div>
          </div>

          {/* Column 2: Clock-in Status Today */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm transition-colors flex flex-col justify-center">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Today's Clocking Status</h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Your running active session.</p>
            <div className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-6 flex flex-col items-center justify-center text-center">
              {isStatsLoading ? (
                <p className="text-xs text-zinc-400">Loading status...</p>
              ) : liveStats?.activeSession ? (
                <div className="space-y-4 animate-in zoom-in-95 duration-150">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 animate-pulse border border-emerald-200 dark:border-emerald-900/30">
                    <FiClock className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-50">You are Clocked In Today! 🟢</h4>
                    <p className="text-xs text-zinc-400 mt-1">Arrived at <span className="font-semibold text-emerald-500">{liveStats.activeSession.checkInTime}</span></p>
                    <p className="text-xs text-zinc-400 mt-0.5">Running session: <span className="font-semibold text-emerald-500">{formatTimeclockValue(liveStats.activeSession.runningHours)}</span></p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full p-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 mb-2">
                    <FiCalendar className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-500 dark:text-zinc-400">You are not clocked in yet.</h4>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Please head over to the shared terminal to clock in!</p>
                </div>
              )}
            </div>
          </div>

          {/* 🛑 3. UPGRADED: DYNAMIC 7-DAY SCHEDULE VS. ACTUAL WORKTIME MATRIX [2] */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm transition-colors flex flex-col">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">My Weekly Matrix</h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Compare your scheduled planning with actual registered times [2].</p>
            
            <div className="mt-4 border-t border-zinc-100 dark:border-zinc-800 pt-4 max-h-[220px] overflow-y-auto pr-1 divide-y divide-zinc-100 dark:divide-zinc-800">
              {isStatsLoading ? (
                <p className="text-xs text-zinc-400 text-center py-6">Loading calendar...</p>
              ) : !liveStats?.myDetailedWeeklyDays || liveStats.myDetailedWeeklyDays.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-8">No published schedule for this week.</p>
              ) : (
                // Loops through each of the 7 weekdays dynamically! [2]
                liveStats.myDetailedWeeklyDays.map((day) => (
                  <div key={day.dayName} className="flex items-center justify-between py-2.5 text-xs border-zinc-100 dark:border-zinc-800">
                    <div className="flex flex-col">
                      <span className="font-bold text-zinc-900 dark:text-zinc-200 capitalize">
                        {day.dayName.slice(0, 3)} <span className="text-[10px] text-zinc-400 font-normal">({day.date})</span>
                      </span>
                      <span className="text-[10px] text-zinc-400 mt-0.5 truncate max-w-[140px]">
                        Plan: <span className="font-medium text-zinc-500 dark:text-zinc-300">{day.scheduleText}</span>
                      </span>
                    </div>
                    
                    <div className="text-right flex flex-col items-end">
                      <span className="font-bold text-zinc-800 dark:text-zinc-100 text-[10px] sm:text-[11px]">
                        {day.punchText}
                      </span>
                      {day.workedHours > 0 && (
                        <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-extrabold mt-0.5">
                          {formatTimeclockValue(day.workedHours)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}