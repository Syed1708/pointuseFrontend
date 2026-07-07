
// Helper: Safely converts a YYYY-MM-DD or YYYY/MM/DD string into a local Date object [3]
const parseLocalString = (dateString) => {
  if (!dateString) return null;
  
  // If it's already a Date object, return a new copy
  if (dateString instanceof Date) return new Date(dateString);

  // Split by dash or slash into numbers: "2026-07-05" -> [2026, 7, 5]
  const parts = String(dateString).split(/[-/]/).map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return null;

  // Month index is 0-based in JavaScript (January is 0, July is 6)
  return new Date(parts[0], parts[1] - 1, parts[2]);
};

// 1. Find Monday from any date string or object [3]
export const getMonday = (d) => {
  const date = parseLocalString(d);
  if (!date) return '';

  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const targetDate = new Date(date.setDate(diff));
  
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dayStr = String(targetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayStr}`; // Returns e.g. "2026-06-29"
};

// 2. Get ISO Week Number [3]
export const getWeekNumber = (dateString) => {
  const parsedDate = parseLocalString(dateString);
  if (!parsedDate) return '';

  const date = new Date(Date.UTC(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
};

// 3. Format single day date (e.g. "22-06") [3]
export const getDayDateString = (mondayString, offsetDays) => {
  const date = parseLocalString(mondayString);
  if (!date) return '';

  date.setDate(date.getDate() + offsetDays);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}`;
};

// 4. Format week range (e.g. "22-06-2026 to 28-06-2026") [3]
export const getWeekRangeString = (mondayString) => {
  const start = parseLocalString(mondayString);
  if (!start) return '';

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  
  const formatDate = (d) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}-${month}-${d.getFullYear()}`;
  };
  return `${formatDate(start)} to ${formatDate(end)}`;
};