import { useState } from 'react';

export default function usePlanningDrag(gridData, setGridData) {
  const [draggingShift, setDraggingShift] = useState(null);

  const handleDragStart = (e, employeeId, dayKey, shiftIndex) => {
    setDraggingShift({ employeeId, dayKey, shiftIndex });
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetEmployeeId, targetDayKey) => {
    e.preventDefault();
    if (!draggingShift) return;

    const { employeeId: sourceEmpId, dayKey: sourceDayKey, shiftIndex } = draggingShift;

    // Detect if "Alt" or "Option" (Mac) or "Ctrl" was held down during drop
    const isCopyOperation = e.altKey || e.ctrlKey;

    const updatedGrid = JSON.parse(JSON.stringify(gridData));

    const sourceRecord = updatedGrid.find((item) => item.employee._id === sourceEmpId);
    const targetRecord = updatedGrid.find((item) => item.employee._id === targetEmployeeId);

    if (!sourceRecord || !targetRecord) return;

    // Grab the shift that is moving
    const shiftToMove = sourceRecord.schedule.days[sourceDayKey].shifts[shiftIndex];

    // 🛑 If NOT a copy operation (it's a move), remove the shift from the source cell
    if (!isCopyOperation) {
      sourceRecord.schedule.days[sourceDayKey].shifts.splice(shiftIndex, 1);
      if (sourceRecord.schedule.days[sourceDayKey].shifts.length === 0) {
        sourceRecord.schedule.days[sourceDayKey].isOff = true;
      }
    }

    // Add (duplicate if copy) to target cell
    if (!targetRecord.schedule.days[targetDayKey].shifts) {
      targetRecord.schedule.days[targetDayKey].shifts = [];
    }
    
    // Push a fresh cloned copy of the shift object to target cell
    targetRecord.schedule.days[targetDayKey].shifts.push({ ...shiftToMove });
    targetRecord.schedule.days[targetDayKey].isOff = false;
    targetRecord.schedule.days[targetDayKey].isLeave = false;

    setGridData(updatedGrid);
    setDraggingShift(null);
  };

  return {
    handleDragStart,
    handleDragOver,
    handleDrop
  };
}