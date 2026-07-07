import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiRefreshCw, FiCalendar, FiChevronRight } from 'react-icons/fi';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { getMonday } from '../../utils/dateHelper'; // 🛑 FIXED: Import helper [3]

const formatCalendarDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}-${year}`;
};

export default function SwapRequestModal({ isOpen, onClose, senderDate, senderShiftIndex, senderShiftTime }) {
  const [receiverId, setReceiverId] = useState('');
  const [selectedColleagueShift, setSelectedColleagueShift] = useState(null); // { date, shiftIndex, time }

  // 1. Fetch available colleagues list (Excluding ourselves)
  const { data: colleagues = [] } = useQuery({
    queryKey: ['employees-colleagues-list'],
    queryFn: async () => {
      const res = await api.get('/employees/colleagues'); // Uses secure colleagues list [2]
      return res.data;
    },
    enabled: isOpen
  });

  const colleaguesList = Array.isArray(colleagues) ? colleagues : [];

  // 2. Fetch the selected colleague's weekly schedule [3]
  const { data: colleagueSchedule, isLoading: isScheduleLoading } = useQuery({
    queryKey: ['colleague-schedule', receiverId, senderDate],
    queryFn: async () => {
      const mondayString = getMonday(senderDate); // Always resolve to Monday first [3]
      const res = await api.get(`/schedules/my-schedule?weekStartDate=${mondayString}&employeeId=${receiverId}`);
      return res.data;
    },
    enabled: !!receiverId && isOpen
  });

  // 3. Extract active shifts from the colleague's schedule
  const getColleagueShiftsList = () => {
    if (!colleagueSchedule) return [];
    const list = [];
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const weekdaysLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const mondayString = getMonday(senderDate); // 🛑 FIXED: Base calculation strictly on Monday [3]

    weekdays.forEach((dayKey, idx) => {
      const day = colleagueSchedule.days[dayKey];
      if (day && !day.isOff && !day.isLeave && day.shifts) {
        day.shifts.forEach((s, sIdx) => {
          // Calculate the YYYY-MM-DD date safely for each weekday [3]
          const date = new Date(mondayString.replace(/-/g, '/')); // Force slash parsing [1.1.4]
          date.setDate(date.getDate() + idx);
          
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const dayStr = String(date.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${dayStr}`;

          list.push({
            date: dateStr,
            dayLabel: weekdaysLabels[idx],
            shiftIndex: sIdx,
            time: `${s.startTime} - ${s.endTime}`,
            task: s.task
          });
        });
      }
    });
    return list;
  };

  const colleagueShifts = getColleagueShiftsList();

  // 4. Mutation: Submit Swap Request [2, 3]
  const submitSwapMutation = useMutation({
    mutationFn: async () => {
      await api.post('/swaps', {
        receiverId,
        senderDate,
        senderShiftIndex,
        receiverDate: selectedColleagueShift.date,
        receiverShiftIndex: selectedColleagueShift.shiftIndex
      });
    },
    onSuccess: () => {
      toast.success('Swap request successfully sent to your colleague!');
      setReceiverId('');
      setSelectedColleagueShift(null);
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit swap request.');
    }
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request a Shift Swap" size="lg">
      <div className="space-y-4">
        {/* Step 1: My Shift info */}
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/50 p-3 border border-zinc-100 dark:border-zinc-800 text-xs">
          <p className="text-zinc-400 font-semibold uppercase">My Selected Shift</p>
          <p className="font-bold text-zinc-900 dark:text-zinc-50 mt-1 flex items-center">
            <FiCalendar className="mr-1.5 h-3.5 w-3.5 text-indigo-500" /> {formatCalendarDate(senderDate)} • {senderShiftTime}
          </p>
        </div>

        {/* Step 2: Choose Colleague */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">1. Choose Colleague</label>
          <select 
            value={receiverId}
            onChange={(e) => { setReceiverId(e.target.value); setSelectedColleagueShift(null); }}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none"
          >
            <option value="">Select a colleague...</option>
            {colleaguesList.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        {/* Step 3: Choose Colleague Shift to Swap with */}
        {receiverId && (
          <div className="animate-in fade-in duration-100 space-y-2">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">2. Select their Shift to Swap With</label>
            
            {isScheduleLoading ? (
              <p className="text-xs text-zinc-400 italic">Loading their weekly planning...</p>
            ) : colleagueShifts.length === 0 ? (
              <p className="text-xs text-red-500 italic">This colleague has no active shifts scheduled for this week to swap with.</p>
            ) : (
              <div className="grid gap-2 max-h-40 overflow-y-auto pr-1">
                {colleagueShifts.map((s, idx) => {
                  const isSelected = selectedColleagueShift && selectedColleagueShift.date === s.date && selectedColleagueShift.shiftIndex === s.shiftIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedColleagueShift(s)}
                      className={`flex items-center justify-between rounded-lg border p-2.5 text-left text-xs transition ${
                        isSelected 
                          ? 'bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 dark:border-zinc-50 font-semibold'
                          : 'bg-white border-zinc-200 text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                      }`}
                    >
                      <div>
                        <p className="capitalize font-bold">{s.dayLabel} ({formatCalendarDate(s.date)})</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{s.task}</p>
                      </div>
                      <span className="font-mono font-semibold">{s.time}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900">Cancel</button>
          <button 
            type="button" 
            onClick={() => submitSwapMutation.mutate()}
            disabled={!receiverId || !selectedColleagueShift || submitSwapMutation.isLoading}
            className="flex-1 rounded-lg bg-zinc-900 dark:bg-zinc-50 py-2 text-xs font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:bg-zinc-400"
          >
            Submit Swap Request
          </button>
        </div>
      </div>
    </Modal>
  );
}