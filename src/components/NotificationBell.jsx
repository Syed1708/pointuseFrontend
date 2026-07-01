import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiBell, FiCheck, FiMail, FiCalendar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Zero-dependency, lightweight time-ago formatter
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
};

export default function NotificationBell() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. TanStack Query: Fetch last 10 notifications [3]
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data;
    }
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // 2. Mutation: Mark single notification as read [3]
  const markAsReadMutation = useMutation({
    mutationFn: async (id) => {
      await api.put(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] }); // Refreshes bell list
    }
  });

  // 3. Mutation: Mark all as read [3]
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      markAsReadMutation.mutate(notif._id);
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div className="relative" ref={bellRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg border border-zinc-200 dark:border-zinc-800 p-2 text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-950 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
      >
        <FiBell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-extrabold text-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1 shadow-md z-50 animate-in fade-in slide-in-from-top-1 duration-100">
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">Notifications</h4>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllAsReadMutation.mutate()}
                className="flex items-center text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <FiCheck className="mr-1 h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          {/* List Wrapper */}
          <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                You have no notifications.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex items-start space-x-3 p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition ${
                    !notif.isRead ? 'bg-zinc-50/50 dark:bg-zinc-900/20' : ''
                  }`}
                >
                  {/* Left Icon Indicator */}
                  <div className={`mt-0.5 rounded-full p-1.5 ${
                    notif.type === 'schedule' 
                      ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' 
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                  }`}>
                    {notif.type === 'schedule' ? <FiCalendar className="h-3.5 w-3.5" /> : <FiMail className="h-3.5 w-3.5" />}
                  </div>

                  {/* Text Details */}
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs truncate ${!notif.isRead ? 'font-bold text-zinc-900 dark:text-zinc-50' : 'text-zinc-600 dark:text-zinc-300'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[9px] text-zinc-400">{formatTimeAgo(notif.createdAt)}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">{notif.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}