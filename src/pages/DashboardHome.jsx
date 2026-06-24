import React from 'react';
import { useSelector } from 'react-redux';
import { FiUsers, FiClock, FiCalendar } from 'react-icons/fi';

export default function DashboardHome() {
  const { user } = useSelector((state) => state.auth);

  // Stats Card data
  const stats = [
    { label: 'Total Employees', value: '18', change: '+2 new this week', icon: FiUsers, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Active Shifts Today', value: '12', change: '8 finished shifts', icon: FiCalendar, color: 'text-green-600 bg-green-50' },
    { label: 'Unapproved Timesheets', value: '4', change: 'Requires manual review', icon: FiClock, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Heading */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Overview Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-50 mt-1">Hello, {user?.name}. Here is a summary of today's scheduling operations.</p>
      </div>

      {/* Grid Stats Block */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-zinc-200 dark:border-zinc-600 dark:text-zinc-50 bg-white dark:bg-zinc-900 p-6 shadow-sm flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-50">{item.label}</p>
              <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{item.value}</h2>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-50">{item.change}</p>
            </div>
            <div className={`rounded-lg p-2.5 ${item.color}`}>
              <item.icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Large Placeholder Activity Feed */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-600 dark:text-zinc-50  bg-white dark:bg-zinc-900 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Recent Scheduling Activity</h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-50 mt-0.5">A live feed of actions taken inside your organization.</p>
        <div className="mt-6 border-t border-zinc-100 dark:border-zinc-600 pt-4 text-center text-sm text-zinc-500 dark:text-zinc-50 py-12">
          No recent activity logs available.
        </div>
      </div>
    </div>
  );
}