import React from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  FiUsers, FiClock, FiCalendar, FiBriefcase, 
  FiArrowRight, FiSmile 
} from 'react-icons/fi';
import api from '../services/api';

export default function DashboardHome() {
  const { user } = useSelector((state) => state.auth);
  const isManagerOrAdmin = ['admin', 'manager'].includes(user?.role?.name);

  // 1. TanStack Query: Fetch role-specific stats from backend [3]
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/schedules/grid?weekStartDate=...'); // Falls back to matching /api/dashboard logic if needed, but let's point to our new endpoint:
      const resStats = await api.get('/schedules/download-pdf?weekStartDate=...'); // let's use the clean endpoint below:
    }
  });

  // Fetch from the clean stats endpoint we just created
  const { data: liveStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['live-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data;
    }
  });

  // 2. Map loaded database stats dynamically [2]
  const managerStats = [
    { 
      label: 'Total Employees', 
      value: isStatsLoading ? '...' : String(liveStats?.totalEmployees || 0), 
      change: '+2 new this week', 
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
      value: isStatsLoading ? '...' : `${(liveStats?.myScheduledHours || 0).toFixed(2)} h`, 
      change: 'Current Week planning', 
      icon: FiBriefcase, 
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400' 
    },
    { 
      label: 'My Worked Hours', 
      value: isStatsLoading ? '...' : `${(liveStats?.myWorkedHours || 0).toFixed(2)} h`, 
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

  const activeStats = isManagerOrAdmin ? managerStats : employeeStats;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Heading */}
      <div className="flex items-center space-x-3">
        <div className="rounded-lg p-2.5 bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950">
          <FiSmile className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {isManagerOrAdmin 
              ? "Here is a summary of your organization's scheduling operations today."
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

      {/* Dashboard Body Cards */}
      {isManagerOrAdmin ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm transition-colors">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Recent Scheduling Activity</h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">A live feed of actions taken inside your organization.</p>
          <div className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-4 text-center text-sm text-zinc-500 py-12">
            No recent activity logs available.
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm transition-colors flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">My Shortcuts</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Access your active documents and secure configurations directly.</p>
            </div>
            <div className="mt-6 space-y-2">
              <Link to="/dashboard/planning" className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition">
                <span>View My Weekly Planning</span>
                <FiArrowRight className="h-4 w-4 text-indigo-500" />
              </Link>
              <Link to="/dashboard/profile" className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition">
                <span>Edit Profile & Change Password</span>
                <FiArrowRight className="h-4 w-4 text-indigo-500" />
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm transition-colors">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Shift of the Day</h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Your scheduled shifts for today.</p>
            
            <div className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-6 flex flex-col items-center justify-center text-center py-6">
              <div className="rounded-full p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 mb-2">
                <FiCalendar className="h-6 w-6" />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">You are scheduled for a **Day Off (Repos)** today. Enjoy your rest!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}